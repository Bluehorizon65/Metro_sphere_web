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

  // Dark background like second image
  useEffect(() => {
    document.body.style.backgroundColor = "#111827"; // Tailwind gray-900
    return () => {
      document.body.style.backgroundColor = null;
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

  return (
    <div className="min-h-screen flex flex-col items-center p-6 text-white">
      <h1 className="text-3xl font-bold mb-8">📑 PDF Semantic Search</h1>

      {/* Upload Section */}
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
        <div className="flex items-center gap-3">
          <input
            type="file"
            onChange={handleFileChange}
            className="file:bg-blue-600 file:text-white file:px-4 file:py-2 
                       file:rounded-lg file:border-none hover:file:bg-blue-500 cursor-pointer text-sm"
          />
          <button
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition"
            onClick={handleUpload}
            disabled={loading}
          >
            <Upload size={20} />
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Search in Uploaded PDFs</h2>
        <div className="flex w-full">
          <input
            type="text"
            placeholder="🔍 Enter your query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow px-4 py-2 rounded-l-lg border-none bg-gray-900 text-white placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 rounded-r-lg hover:bg-blue-500 flex items-center justify-center transition"
            disabled={loading}
          >
            <SearchIcon size={18} />
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <p className="text-red-400 mb-4 text-center font-medium">{message}</p>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-4 overflow-y-auto max-h-96">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          {results.map((res, idx) => (
            <div
              key={idx}
              className="bg-gray-900 text-gray-100 px-4 py-3 rounded-lg shadow hover:bg-gray-700 transition flex justify-between items-center"
            >
              <span>📄 {res.file}</span>
              <span className="font-semibold text-blue-400">{res.match}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SemanticSearch;
