import React, { useRef, useState } from "react";

import axios from "axios";

function UploadDocument() {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [infoMsg, setInfoMsg] = useState("");
  const [fileUrl, setFileUrl] = useState("");
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
      setFileUrl(URL.createObjectURL(file));
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (uploadedFile.type === 'application/pdf') {
      setShowModal(true);
    } else {
      // For non-PDF files, download or open in new tab
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = uploadedFile.name;
      link.click();
    }
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
      setErrorMsg(err.response?.data?.error || "Failed to analyze document.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📁';
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
            <span>{getFileIcon(uploadedFile.type)} File: </span>
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
            <div style={{ fontSize: "0.9rem", color: "#9ca3af", marginTop: 4 }}>
              Type: {uploadedFile.type || 'Unknown'} | Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
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
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
        )}
        {/* Modal for PDF preview */}
        {showModal && uploadedFile?.type === 'application/pdf' && (
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
                src={fileUrl}
                title="PDF Preview"
                width="600px"
                height="700px"
                style={{ border: 'none', borderRadius: 8, background: '#222', maxWidth: '80vw', maxHeight: '80vh' }}
                allow="autoplay"
              />
            </div>
          </div>
        )}
        {/* ...existing code... */}
        {/* Error Message */}
        {errorMsg && (
          <div style={{ color: "#f87171", background: "rgba(239,68,68,0.08)", borderRadius: 8, padding: "0.7rem 1.1rem", marginTop: 18, fontWeight: 500, fontSize: "1.05rem", textAlign: "center" }}>{errorMsg}</div>
        )}
        {/* AI Output */}
        {aiResult && (
          <div style={{ marginTop: 28, width: "100%", maxHeight: "60vh", overflowY: "auto" }}>
            {/* Document Name */}
            <div style={{ background: "#2563eb", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 }}>
              <strong>Document:</strong> {aiResult.document_name}
            </div>

            {/* Priority and Status */}
            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              {aiResult.priority && (
                <div style={{ 
                  background: getPriorityColor(aiResult.priority), 
                  color: "#fff", 
                  padding: "8px 12px", 
                  borderRadius: 6, 
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  flex: 1,
                  textAlign: "center"
                }}>
                  Priority: {aiResult.priority}
                </div>
              )}
              {aiResult.status && (
                <div style={{ 
                  background: aiResult.status === 'success' ? "#10b981" : "#6b7280", 
                  color: "#fff", 
                  padding: "8px 12px", 
                  borderRadius: 6, 
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  flex: 1,
                  textAlign: "center"
                }}>
                  Status: {aiResult.status}
                </div>
              )}
            </div>

            {/* Deadline */}
            {aiResult.deadline && (
              <div style={{ background: "#dc2626", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 }}>
                <strong>⏰ Deadline:</strong> {new Date(aiResult.deadline).toLocaleDateString()}
              </div>
            )}

            {/* Summary */}
            <div style={{ background: "#1e40af", color: "#fff", padding: 20, borderRadius: 8, marginBottom: 15 }}>
              <strong>Summary:</strong>
              <p style={{ margin: "8px 0 0 0", lineHeight: 1.5 }}>{aiResult.summary}</p>
            </div>

            {/* Task */}
            {aiResult.task && (
              <div style={{ background: "#7c3aed", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 }}>
                <strong>Task:</strong> {aiResult.task}
              </div>
            )}

            {/* Departments */}
            {aiResult.department && aiResult.department.length > 0 && (
              <div style={{ background: "#059669", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 }}>
                <strong>Departments:</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
                  {aiResult.department.map((dept, idx) => (
                    <li key={idx} style={{ margin: "4px 0" }}>{dept}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Roles */}
            {aiResult.roles && aiResult.roles.length > 0 && (
              <div style={{ background: "#1e3a8a", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 }}>
                <strong>Roles:</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
                  {aiResult.roles.map((role, idx) => (
                    <li key={idx} style={{ margin: "4px 0" }}>{role}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conflict */}
            {aiResult.conflict && aiResult.conflict !== "No conflict described" && (
              <div style={{ background: "#dc2626", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 }}>
                <strong>⚠️ Conflict:</strong> {aiResult.conflict}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadDocument;