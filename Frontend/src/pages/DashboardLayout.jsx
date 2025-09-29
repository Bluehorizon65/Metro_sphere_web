// /src/pages/DashboardLayout.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, LayoutDashboard, FileText, CheckSquare, Building2, Users, Settings, Clock, FileCheck2, Sparkles, FolderKanban, Zap, AlertCircle, CalendarCheck2, Search, Upload, FileBarChart2 } from "lucide-react";
import axios from "axios";


// PDF Uploader component
import { useNavigate } from "react-router-dom";

// Removed PdfUploader. We'll use a single button for navigation.



// Navigation and Cards data
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Documents", icon: FileText },
  { label: "Tasks", icon: CheckSquare },
  { label: "Departments", icon: Building2 },
  { label: "Cross-Team Feed", icon: Users },
  { label: "Settings", icon: Settings },
];

const cards = [
  {
    label: "Recent Activity",
    color: "rgba(37, 99, 235, 0.15)",
    icon: <FileCheck2 size={28} style={{ marginBottom: 8, color: '#60a5fa' }} />,
    content: (
      <ul style={{ 
        listStyle: 'none', 
        margin: '0.5rem 0 0 0', 
        padding: 0, 
        color: '#e2e8f0' 
      }}>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Invoice_234.pdf processed → sent to Finance Dept.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Safety Circular 09/2025 summarized for HR.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Engineering job card flagged: 'Brake inspection overdue.'</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Vendor contract uploaded by Procurement.</li>
      </ul>
    ),
  },
  {
    label: "Upcoming Deadlines",
    color: "rgba(37, 99, 235, 0.15)",
    icon: <Clock size={28} style={{ marginBottom: 8, color: '#60a5fa' }} />,
    content: (
      <ul style={{ 
        listStyle: 'none', 
        margin: '0.5rem 0 0 0', 
        padding: 0, 
        color: '#e2e8f0' 
      }}>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Safety Audit Report – Due: Sep 25, 2025</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Tender Submission – Due: Sep 28, 2025</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Employee Training – Due: Oct 05, 2025</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Maintenance Checklist – Due: Oct 10, 2025</li>
      </ul>
    ),
  },
  {
    label: "AI Summaries",
    color: "rgba(37, 99, 235, 0.15)",
    icon: <Sparkles size={28} style={{ marginBottom: 8, color: '#60a5fa' }} />,
    content: (
      <ul style={{ 
        listStyle: 'none', 
        margin: '0.5rem 0 0 0', 
        padding: 0, 
        color: '#e2e8f0' 
      }}>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>⚙️ Engineering: 3 maintenance jobs due this week.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>👥 HR: New training directive released yesterday.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>💰 Finance: 2 vendor invoices pending approval.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>📑 Compliance: Circular flagged for legal review.</li>
      </ul>
    ),
  },
  {
    label: "Department Overview",
    color: "rgba(37, 99, 235, 0.15)",
    icon: <FolderKanban size={28} style={{ marginBottom: 8, color: '#60a5fa' }} />,
    content: (
      <ul style={{ 
        listStyle: 'none', 
        margin: '0.5rem 0 0 0', 
        padding: 0, 
        color: '#e2e8f0' 
      }}>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Engineering – 12 docs processed, 3 flagged urgent</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• HR – 8 docs, 1 compliance risk</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Finance – 5 pending invoices</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>• Procurement – 4 new contracts</li>
      </ul>
    ),
  },
  {
    label: "Notifications",
    color: "rgba(37, 99, 235, 0.15)",
    icon: <AlertCircle size={28} style={{ marginBottom: 8, color: '#60a5fa' }} />,
    content: (
      <ul style={{ 
        listStyle: 'none', 
        margin: '0.5rem 0 0 0', 
        padding: 0, 
        color: '#e2e8f0' 
      }}>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>⚠️ Compliance deadline in 3 days.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>📌 New vendor policy uploaded.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>🔔 Engineering flagged a design change.</li>
        <li style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>✅ HR training module completed.</li>
      </ul>
    ),
  },
];

function DashboardLayout() {
  
  const navigate = useNavigate();

  const user = {
    name: "Zachary Lee",
    dept: "Engineering dept.",
  };

  return (
    <div 
      className="dashboard-root"
      style={{
        backgroundImage: "url('src/assets/metro-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Sidebar */}
      <aside 
        className="dashboard-sidebar sidebar-persistent"
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)'
        }}
      >
        <div 
          className="sidebar-profile"
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '1.5rem',
            margin: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div 
            className="sidebar-avatar"
            style={{
              background: 'rgba(37, 99, 235, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <User size={38} />
          </div>
          <div 
            className="sidebar-profile-name"
            style={{ color: '#ffffff', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            {user.name}
          </div>
          <div 
            className="sidebar-profile-dept"
            style={{ color: '#e2e8f0', fontWeight: '500' }}
          >
            {user.dept}
          </div>
        </div>
        <nav className="sidebar-nav sidebar-nav-persistent">
          {navItems.map(({ label, icon: Icon }) => (
            <motion.button
              key={label}
              className="sidebar-nav-item"
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                margin: '0.3rem 1rem',
                color: '#f1f5f9',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: 'rgba(37, 99, 235, 0.4)',
                color: '#ffffff'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={20} style={{ marginRight: 14 }} />
              {label}
            </motion.button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div 
        className="dashboard-main"
        style={{
          background: 'transparent'
        }}
      >
        {/* Topbar */}
        <header 
          className="dashboard-topbar"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.4)'
          }}
        >
          <div />
          <div className="topbar-actions">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              className="topbar-icon-btn"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                color: '#ffffff',
                padding: '0.7rem'
              }}
            >
              <Bell size={22} />
            </motion.button>
            <motion.div 
              whileHover={{ scale: 1.08 }} 
              className="topbar-avatar"
              style={{
                background: 'rgba(37, 99, 235, 0.9)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <User size={22} />
            </motion.div>
          </div>
        </header>

        {/* Quick Actions Container */}
        <section 
          className="quick-actions-container"
          style={{
            background: 'rgba(20, 30, 48, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}
        >
          <div 
            className="quick-actions-title"
            style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            <Zap size={28} style={{ marginBottom: 4, marginRight: 8 }} /> Quick Actions
          </div>
          <div className="quick-actions-btns">
            <button
              className="quick-action-btn"
              style={{ 
                background: 'rgba(37, 99, 235, 0.8)', 
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.3)', 
                borderRadius: '12px', 
                padding: '0.8rem 1.3rem', 
                fontWeight: '600', 
                fontSize: '1.08rem', 
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px 0 rgba(37, 99, 235, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => navigate('/upload-document')}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(30, 64, 175, 0.9)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(37, 99, 235, 0.8)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Upload & Analyze
            </button>
            <button
              className="quick-action-btn"
              style={{
                background: 'rgba(41, 55, 75, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: '#f1f5f9',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onClick={() => navigate("/semantic-search")}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(37, 99, 235, 0.8)';
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(41, 55, 75, 0.8)';
                e.target.style.color = '#f1f5f9';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <Search size={18} /> Search Semantics
            </button>
            <button 
              className="quick-action-btn"
              style={{
                background: 'rgba(41, 55, 75, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: '#f1f5f9',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(37, 99, 235, 0.8)';
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(41, 55, 75, 0.8)';
                e.target.style.color = '#f1f5f9';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <CalendarCheck2 size={18} /> View Compliance Calendar
            </button>
            <button 
              className="quick-action-btn"
              style={{
                background: 'rgba(41, 55, 75, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: '#f1f5f9',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(37, 99, 235, 0.8)';
                e.target.style.color = '#ffffff';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(41, 55, 75, 0.8)';
                e.target.style.color = '#f1f5f9';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <FileBarChart2 size={18} /> Generate Report
            </button>
          </div>
        </section>

        {/* Dashboard Cards */}
        <main 
          className="dashboard-cards"
          style={{
            background: 'transparent'
          }}
        >
          {cards.map((card) => (
            <motion.div
              key={card.label}
              className="dashboard-card"
              style={{ 
                background: 'rgba(20, 30, 48, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                borderRadius: '16px'
              }}
              whileHover={{ 
                y: -6, 
                boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.4)",
                scale: 1.02
              }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="dashboard-card-icon">{card.icon}</div>
              <span 
                className="dashboard-card-title"
                style={{ 
                  color: '#ffffff', 
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {card.label}
              </span>
              <div 
                className="dashboard-card-content"
                style={{
                  color: '#e2e8f0'
                }}
              >
                {card.content}
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;