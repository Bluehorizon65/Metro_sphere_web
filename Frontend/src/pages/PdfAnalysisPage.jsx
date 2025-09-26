// /src/pages/PdfAnalysisPage.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PdfAnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis } = location.state || {};

  if (!analysis) {
    return (
      <div style={{ padding: 40 }}>
        <h2>No PDF analysis data found.</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const { task, priority, deadline, document_name, summary, roles } = analysis;

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ marginRight: 10 }}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2>PDF Analysis Result</h2>
      </header>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {priority === "High" && (
          <>
            <motion.div
              className="analysis-card"
              style={{ background: "#ef4444", color: "#fff", padding: 15, borderRadius: 8, flex: 1 }}
              whileHover={{ scale: 1.03 }}
            >
              <strong>Task:</strong> {task}
            </motion.div>
            <motion.div
              className="analysis-card"
              style={{ background: "#ef4444", color: "#fff", padding: 15, borderRadius: 8, flex: 1 }}
              whileHover={{ scale: 1.03 }}
            >
              <strong>Priority:</strong> {priority}
            </motion.div>
            <motion.div
              className="analysis-card"
              style={{ background: "#ef4444", color: "#fff", padding: 15, borderRadius: 8, flex: 1 }}
              whileHover={{ scale: 1.03 }}
            >
              <strong>Deadline:</strong> {deadline}
            </motion.div>
          </>
        )}
      </div>

      <motion.div
        className="analysis-card"
        style={{ background: "#2563eb", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 20 }}
        whileHover={{ scale: 1.02 }}
      >
        <strong>Filename:</strong> {document_name}
      </motion.div>

      <motion.div
        className="analysis-card"
        style={{ background: "#1e40af", color: "#fff", padding: 20, borderRadius: 8, marginBottom: 20 }}
        whileHover={{ scale: 1.02 }}
      >
        <strong>Summary:</strong>
        <p>{summary}</p>
      </motion.div>

      <motion.div
        className="analysis-card"
        style={{ background: "#1e3a8a", color: "#fff", padding: 15, borderRadius: 8 }}
        whileHover={{ scale: 1.02 }}
      >
        <strong>Roles:</strong>
        <ul>
          {roles.map((role, idx) => (
            <li key={idx}>{role}</li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
