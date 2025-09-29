// /src/pages/SemanticSearch.jsx
import { useState, useEffect } from "react";
import { Upload, Search as SearchIcon } from "lucide-react";
import axios from "axios";


function SemanticSearch() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Set a premium glassy background for this page only
  useEffect(() => {
    document.body.style.background =
      "linear-gradient(120deg, #232526 0%, #414345 100%) fixed";
    return () => {
      document.body.style.background = null;
    };
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:3000/semantic/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message || "Upload successful");
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

    try {
      const res = await axios.get("http://127.0.0.1:3000/semantic/search", {
        params: { query },
      });
      setResults(res.data.results || []);
      if ((res.data.results || []).length === 0) {
        setMessage("No results found.");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for premium look
  const cardStyle = {
    background: "rgba(30, 41, 59, 0.65)",
    borderRadius: "1.5rem",
    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    padding: "2.2rem 2rem 2rem 2rem",
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
    transition: "background 0.18s, color 0.18s",
  };
  const highlightStyle = {
    color: "#60a5fa",
    fontWeight: 700,
    fontSize: "1.13rem",
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
        <div style={{ ...cardStyle, marginBottom: 0, marginTop: 0, textAlign: "center", width: "100%" }}>
          <h1 style={{ fontSize: "2.3rem", fontWeight: 900, color: "#fff", letterSpacing: 1.5, marginBottom: 8, textShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
            <span style={{ filter: "drop-shadow(0 0 8px #2563eb88)" }}>📑</span> PDF Semantic Search
          </h1>
          <p style={{ color: "#b3b3b3", fontWeight: 500, fontSize: "1.08rem", marginBottom: 0 }}>
            Upload your PDF and search semantically with AI-powered precision.
          </p>
        </div>

        {/* Upload Section */}
        <div style={{ ...cardStyle, width: "100%" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 18, color: "#fff" }}>Upload PDF</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <input
              type="file"
              onChange={handleFileChange}
              style={uploadInputStyle}
              accept="application/pdf"
              disabled={loading}
            />
            <button
              style={buttonStyle}
              onClick={handleUpload}
              disabled={loading}
            >
              <Upload size={20} />
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div style={{ ...cardStyle, width: "100%" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 18, color: "#fff" }}>Search in Uploaded PDFs</h2>
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
                className="semantic-result-card"
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.25rem", marginRight: 6 }}>📄</span>
                  <span style={{ fontWeight: 600 }}>{res.file}</span>
                </span>
                <span style={highlightStyle}>{res.match}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SemanticSearch;
