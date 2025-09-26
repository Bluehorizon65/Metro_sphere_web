const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// ------------------ Upload Route ------------------
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ status: "error", message: "No file uploaded" });

  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(req.file.path);
    formData.append("file", fileStream, req.file.originalname);

    const response = await axios.post("http://127.0.0.1:8001/upload", formData, {
      headers: formData.getHeaders(),
    });

    fs.unlinkSync(req.file.path); // clean up

    res.json(response.data);
  } catch (error) {
    fs.unlinkSync(req.file.path);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
});

// ------------------ Search Route ------------------
router.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ status: "error", message: "Query is required" });

  try {
    const response = await axios.get("http://127.0.0.1:8001/search", { params: { query } });
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
});

module.exports = { semanticRoute: router };
