import { useState, useEffect } from "react";
import { Upload, Search as SearchIcon, X } from "lucide-react";
import axios from "axios";

function SemanticSearch() {
  const [files, setFiles] = useState([]); // Changed from single file to array
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Set metro background image (same as login page)
  useEffect(() => {
    document.body.style.background = "url('./src/assets/metro-bg.jpg') no-repeat center center fixed";
    document.body.style.backgroundSize = "cover";
    return () => {
      document.body.style.background = null;
      document.body.style.backgroundSize = null;
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select at least one file first.");
      return;
    }
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file); // Use 'files' for multiple files
    });

    try {
      const res = await axios.post("http://127.0.0.1:3000/semantic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message || "Upload successful");
      setFiles([]); // Clear files after successful upload
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setMessage("Enter a query to search.");
      return;
    }
    setLoading(true);
    setMessage("");
    setResults([]);

    try {
      const res = await axios.get("http://127.0.0.1:3000/semantic/search", {
        params: { query },
      });

      // Deduplicate results by file
      const uniqueResults = Array.from(
        new Map((res.data.results || []).map(item => [item.file, item])).values()
      );

      setResults(uniqueResults);

      if (uniqueResults.length === 0) {
        setMessage("No results found.");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  // ...existing styles...
  const cardStyle = {
    background: "rgba(30,41,59,0.65)",
    borderRadius: "1.5rem",
    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    padding: "2.2rem",
    marginBottom: "2.2rem",
    width: "100%",
    maxWidth: 600,
    color: "#f3f4f6",
    position: "relative",
  };
  const inputStyle = {
    background: "rgba(17,24,39,0.92)",
    color: "#fff",
    border: "none",
    borderRadius: "0.9rem",
    padding: "0.9rem 1.2rem",
    fontSize: "1.08rem",
    outline: "none",
    width: "100%",
    marginRight: 8,
    boxShadow: "0 1px 6px 0 rgba(0,0,0,0.10)",
  };
  const buttonStyle = {
    background: "linear-gradient(90deg, #2563eb 60%, #4f8cff 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "0.9rem",
    padding: "0.9rem 2.1rem",
    fontWeight: 700,
    fontSize: "1.08rem",
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: "0 2px 8px 0 rgba(37,99,235,0.10)",
    letterSpacing: "0.5px",
    transition: "background 0.2s, box-shadow 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 120,
    justifyContent: "center",
  };
  const uploadInputStyle = {
    ...inputStyle,
    padding: "0.7rem 1.2rem",
    borderRadius: "0.7rem",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    width: 220,
    marginRight: 16,
    fontSize: "1.01rem",
  };
  const resultCardStyle = {
    background: "rgba(17,24,39,0.92)",
    color: "#e0e7ef",
    borderRadius: "1.1rem",
    padding: "1.1rem 1.3rem",
    marginBottom: 12,
    boxShadow: "0 2px 8px 0 rgba(31,38,135,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "1.08rem",
    fontWeight: 500,
    border: "1px solid rgba(255,255,255,0.10)",
    cursor: "pointer",
    transition: "background 0.18s, color 0.18s",
  };
  const highlightStyle = {
    color: "#60a5fa",
    fontWeight: 700,
    fontSize: "1.13rem",
  };
  const fileItemStyle = {
    background: "rgba(17,24,39,0.70)",
    borderRadius: "0.8rem",
    padding: "0.8rem 1rem",
    marginBottom: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    color: "#e0e7ef",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const removeButtonStyle = {
    background: "rgba(239,68,68,0.8)",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    fontSize: "12px",
    transition: "background 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 10,
      }}
    >
      <div style={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        {/* Header */}
        <div style={{ ...cardStyle, marginBottom: 0, marginTop: 0, textAlign: "center", width: "100%" }}>
          <h1 style={{ fontSize: "2.3rem", fontWeight: 900, color: "#fff", letterSpacing: 1.5, marginBottom: 8, textShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
            <span style={{ filter: "drop-shadow(0 0 8px #2563eb88)" }}>📑</span> Document Semantic Search
          </h1>
          <p style={{ color: "#b3b3b3", fontWeight: 500, fontSize: "1.08rem", marginBottom: 0 }}>
            Upload multiple documents and search semantically with AI-powered precision.
          </p>
        </div>

        {/* Upload Section */}
        <div style={{ ...cardStyle, width: "100%" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 18, color: "#fff" }}>Upload Documents</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: files.length > 0 ? 20 : 0 }}>
            <input
              type="file"
              onChange={handleFileChange}
              style={uploadInputStyle}
              multiple
              disabled={loading}
            />
            <button
              style={buttonStyle}
              onClick={handleUpload}
              disabled={loading || files.length === 0}
            >
              <Upload size={20} />
              {loading ? "Uploading..." : `Upload ${files.length > 0 ? `(${files.length})` : ""}`}
            </button>
          </div>
          
          {/* Selected Files List */}
          {files.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 12, color: "#d1d5db" }}>
                Selected Files ({files.length})
              </h3>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {files.map((file, index) => (
                  <div key={index} style={fileItemStyle}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>📄</span>
                      <span>{file.name}</span>
                      <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </span>
                    <button
                      style={removeButtonStyle}
                      onClick={() => removeFile(index)}
                      disabled={loading}
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div style={{ ...cardStyle, width: "100%" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 18, color: "#fff" }}>Search in Uploaded Documents</h2>
          <div style={{ display: "flex", width: "100%", gap: 12 }}>
            <input
              type="text"
              placeholder="🔍 Enter your query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              style={{ ...buttonStyle, minWidth: 56, padding: "0.9rem 1.2rem" }}
              disabled={loading}
              title="Search"
            >
              <SearchIcon size={18} />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div style={{ ...cardStyle, color: "#f87171", fontWeight: 600, textAlign: "center", background: "rgba(30,41,59,0.85)", marginBottom: 0, marginTop: 0, padding: "1.1rem 1.2rem", width: "100%" }}>
            {message}
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div
            style={{
              ...cardStyle,
              maxHeight: 420,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 0,
              width: "100%",
            }}
          >
            <h2 style={{ fontSize: "1.18rem", fontWeight: 700, marginBottom: 10, color: "#fff" }}>Results</h2>
            {results.map((res, idx) => (
              <div
                key={idx}
                style={resultCardStyle}
                onClick={() => window.open(`http://127.0.0.1:3000/semantic/files/${res.file}`, "_blank")}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.25rem", marginRight: 6 }}>📄</span>
                  <span style={{ fontWeight: 600 }}>{res.file}</span>
                </span>
                <span style={highlightStyle}>{res.match.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default SemanticSearch;