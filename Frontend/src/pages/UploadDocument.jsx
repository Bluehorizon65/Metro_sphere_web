
import React, { useRef, useState } from "react";

import axios from "axios";

function UploadDocument() {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [infoMsg, setInfoMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setInfoMsg("Document uploaded successfully!");
      setPdfUrl(URL.createObjectURL(file));
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSummarize = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    setErrorMsg("");
    setAiResult(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      const res = await axios.post("http://localhost:3000/user/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAiResult(res.data.analysis);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to analyze PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        background: "rgba(30, 30, 40, 0.82)",
        borderRadius: 24,
        boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.18)",
        padding: "2.5rem 2rem 2rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 340,
        maxWidth: 420,
        width: "100%"
      }}>
        <h2 style={{
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: 24,
          color: "#fff",
          letterSpacing: 1.5
        }}>Upload & Analyze</h2>
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          onClick={handleButtonClick}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "1rem 2.2rem",
            fontWeight: 700,
            fontSize: "1.13rem",
            cursor: "pointer",
            marginBottom: uploadedFile ? 18 : 0,
            marginTop: 6,
            boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)"
          }}
        >
          Upload Docs
        </button>
        {infoMsg && (
          <div style={{
            color: "#22d3ee",
            background: "rgba(34,211,238,0.08)",
            borderRadius: 8,
            padding: "0.7rem 1.1rem",
            marginTop: 18,
            fontWeight: 500,
            fontSize: "1.05rem",
            textAlign: "center"
          }}>{infoMsg}</div>
        )}
        {uploadedFile && (
          <div style={{ marginTop: 18, color: "#fff", fontWeight: 500, fontSize: "1.08rem" }}>
            <span>PDF: </span>
            <a
              href="#"
              onClick={handlePreview}
              style={{
                color: "#60a5fa",
                textDecoration: "underline",
                cursor: "pointer"
              }}
            >
              {uploadedFile.name}
            </a>
            <div style={{ marginTop: 18 }}>
              <button
                onClick={handleSummarize}
                style={{
                  background: loading ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "0.8rem 2rem",
                  fontWeight: 700,
                  fontSize: "1.08rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 8,
                  boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)"
                }}
                disabled={loading}
              >
                {loading ? "Summarizing..." : "Summarize"}
              </button>
            </div>
          </div>
        )}
        {/* Modal for PDF preview */}
        {showModal && (
          <div
            onClick={handleCloseModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#18181b',
                borderRadius: 12,
                padding: 0,
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <button
                onClick={handleCloseModal}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 16,
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: 28,
                  cursor: 'pointer',
                  zIndex: 2
                }}
                aria-label="Close preview"
              >
                &times;
              </button>
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                width="600px"
                height="700px"
                style={{ border: 'none', borderRadius: 8, background: '#222', maxWidth: '80vw', maxHeight: '80vh' }}
                allow="autoplay"
              />
            </div>
          </div>
        )}
        {/* Error Message */}
        {errorMsg && (
          <div style={{ color: "#f87171", background: "rgba(239,68,68,0.08)", borderRadius: 8, padding: "0.7rem 1.1rem", marginTop: 18, fontWeight: 500, fontSize: "1.05rem", textAlign: "center" }}>{errorMsg}</div>
        )}
        {/* AI Output */}
        {aiResult && (
          <div style={{ marginTop: 28, width: "100%" }}>
            <div style={{ background: "#2563eb", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 20 }}>
              <strong>Filename:</strong> {aiResult.document_name}
            </div>
            <div style={{ background: "#1e40af", color: "#fff", padding: 20, borderRadius: 8, marginBottom: 20 }}>
              <strong>Summary:</strong>
              <p>{aiResult.summary}</p>
            </div>
            {aiResult.roles && (
              <div style={{ background: "#1e3a8a", color: "#fff", padding: 15, borderRadius: 8 }}>
                <strong>Roles:</strong>
                <ul>
                  {aiResult.roles.map((role, idx) => (
                    <li key={idx}>{role}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadDocument;