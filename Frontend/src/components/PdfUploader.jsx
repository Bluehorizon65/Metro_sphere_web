// /src/components/PdfUploader.jsx
import React, { useState } from "react";
import axios from "axios";

function PdfUploader() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("http://localhost:3000/user/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Check if backend returned analysis
    if (response.data && response.data.analysis) {
      console.log("PDF analysis result:", response.data.analysis);
      setAnalysisResult(response.data.analysis);
      setError(""); // clear previous error
    } else {
      setError("Failed to analyze PDF.");
    }
  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    setError("Failed to analyze PDF.");
  }
};


  return (
    <div>
      <h3>Upload PDF for Analysis</h3>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <div>
          <h4>Analysis Result:</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PdfUploader;
