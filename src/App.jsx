
import LoginRegister from "./pages/LoginRegister";
import DashboardLayout from "./pages/DashboardLayout";
import BufferLoader from "./components/BufferLoader";
import UploadPDF from "./pages/UploadPDF";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";


function AppRoutes() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Handle login with buffer animation
  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowDashboard(true);
    }, 1200); // 1.2s buffer
  };

  return (
    <AnimatePresence mode="wait">
      {loading && <BufferLoader key="buffer" />}
      <Routes>
        {!showDashboard ? (
          <>
            <Route path="/" element={<LoginRegister onLogin={handleLogin} />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/upload" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/dashboard" element={<DashboardLayout />} />
            <Route path="/upload" element={<DashboardLayout><UploadPDF /></DashboardLayout>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
