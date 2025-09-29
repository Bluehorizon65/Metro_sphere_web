const { Router } = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// const { pool } = require("../db");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

const JWT_TOKEN = "s3cr37";
const userRoute = Router();

// ----------------------
// Multer setup to preserve original filename & extension
// ----------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // preserve extension
  }
});
const upload = multer({ storage });

// ----------------------
// User Signin
// ----------------------
userRoute.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id,password FROM users WHERE username=$1",
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

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), originalName);

    const response = await axios.post("http://localhost:8000/analyze/pdf", form, {
      headers: form.getHeaders()
    });

    const result = response.data;

    // Optional: save result in DB
    // ...

    let actions = [];
    if (result.priority === "High") actions.push("Added to notifications automatically");
    else actions.push("Ask user if task should be added to notifications");
    if (result.department) actions.push(`Popup: Send to ${result.department}?`);
    if (result.deadline) actions.push(`Deadline tracked: ${result.deadline}`);

    res.json({ analysis: result, actions });

  } catch (err) {
    console.error("Error analyzing PDF:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze PDF" });
  }
});

// ----------------------
// Translate & Analyze
// ----------------------
userRoute.post("/translate-and-analyze", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "File is required" });

    console.log("Uploaded file:", file);

    // --- Step 1: Translate ---
    const formData = new FormData();
    formData.append("file", fs.createReadStream(file.path));

    const translateResponse = await axios.post(
      "http://127.0.0.1:8002/translate/",
      formData,
      { headers: formData.getHeaders() }
    );

    console.log("Full /translate/ response:", translateResponse.data);

    const translation =
      translateResponse.data.translation ||
      translateResponse.data.translation_text;
    const filename = translateResponse.data.filename || file.originalname;

    if (!translation) {
      return res.status(500).json({ error: "Translation failed" });
    }

    console.log("Translation output:", translation);

    // --- Step 2: Analyze text ---
    const analyzeResponse = await axios.post(
      "http://localhost:8000/analyze/text",
      {
        text: translation,
        document_name: filename
      }
    );

    console.log("Analysis output:", analyzeResponse.data);

    // --- Return combined result ---
    res.json({
      filename,
      translation,
      analysis: analyzeResponse.data
    });

  } catch (err) {
    console.error("Error in translate-and-analyze:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to process file" });
  }
});


module.exports = { userRoute };
