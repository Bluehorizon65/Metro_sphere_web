const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });



// ------------------ Translate & Analyze (auto-pick file) ------------------
router.post("/email", async (req, res) => {
  try {
    const uploadDir = "C:\\Users\\Enemb\\OneDrive\\Documents\\SIH_Bravo-6-Web-\\twilio\\twilio_gmail\\attachments";

    // Get all files in uploads folder
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith(".pdf"));
    if (files.length === 0) {
      return res.status(404).json({ error: "No PDF files found in uploads folder" });
    }

    // Pick the first file (modify logic if needed)
    const filename = files[0];
    const filePath = `${uploadDir}/${filename}`;

    console.log("Picked file:", filePath);

    // --- Step 1: Send file to /translate/ API ---
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), filename);

    const translateResponse = await axios.post(
      "http://127.0.0.1:8002/translate/",
      formData,
      { headers: formData.getHeaders() }
    );

    console.log("Full /translate/ response:", translateResponse.data);

    const translation =
      translateResponse.data.translation ||
      translateResponse.data.translation_text;

    if (!translation) {
      return res.status(500).json({ error: "Translation failed" });
    }

    // --- Step 2: Send translation to /analyze/text API ---
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

module.exports = { emailRoute: router };
