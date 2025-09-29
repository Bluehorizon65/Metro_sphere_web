const { Router } = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
//const { pool } = require('../db');
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const JWT_TOKEN = "s3cr37";
const userRoute = Router();

// ----------------------
// Multer setup for PDF uploads
// ----------------------
const upload = multer({ dest: "uploads/" });

// ----------------------
// User Signin
// ----------------------
userRoute.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id,password FROM users WHERE username=$1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const passMatch = await bcrypt.compare(password, user.password);

    if (!passMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id.toString() }, JWT_TOKEN, { expiresIn: "12h" });
    res.json({ token });

  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------
// Upload PDF -> Analyze via FastAPI
// ----------------------
userRoute.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // --- Send file to FastAPI using FormData ---
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), originalName);

    const response = await axios.post("http://localhost:8000/analyze/pdf", form, {
      headers: form.getHeaders()
    });

    const result = response.data;

    // --- Save result + file path in Postgres ---
    //await pool.query(
    //  `INSERT INTO documents 
    //   (document_name, roles, conflict, department, task, priority, deadline, summary, status, file_path)
    //   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    //  [
    //    result.document_name || null,
    //    result.roles || null,
    //    result.conflict || null,
    //    result.department || null,
    //    result.task || null,
    //    result.priority || null,
    //    result.deadline || null,
    //    result.summary || null,
    //    result.status || null,
    //    filePath
    //  ]
    //);

    // --- Actions based on priority / department ---
    let actions = [];
    if (result.priority === "High") actions.push("Added to notifications automatically");
    else actions.push("Ask user if task should be added to notifications");
    if (result.department) actions.push(`Popup: Send to ${result.department}?`);
    if (result.deadline) actions.push(`Deadline tracked: ${result.deadline}`);

    res.json({
      analysis: result,
      actions
    });

  } catch (err) {
    console.error("Error analyzing PDF:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze PDF" });
  }
});

// ----------------------
// Analyze raw text -> FastAPI
// ----------------------


userRoute.post("/analyze-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log("Uploaded file:", req.file.originalname);

    // Prepare FormData
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    // Call translate API
    const translateResponse = await axios.post(
      "http://127.0.0.1:8000/translate/",
      form,
      { headers: form.getHeaders() }
    );

    const { filename, translation } = translateResponse.data;
    console.log("Translation received:", translation);

    if (!translation) return res.status(400).json({ error: "Translation failed" });

  

    // Call analyze API
    console.log("Calling analyze API with:", {
      url: "http://localhost:8000/analyze/text",
      payload: { text: translation, document_name: filename }
    });
    
    const analyzeResponse = await axios.post("http://localhost:8000/analyze/text", {
      text: translation,
      document_name: filename
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = analyzeResponse.data;
    console.log("Analysis result:", result);

    // Delete temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.warn("Failed to delete temp file:", err);
    });

    // Return result
    res.json(result);

  } catch (err) {
    console.error("Error in /analyze-text:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze text" });
  }
});




module.exports = { userRoute };
