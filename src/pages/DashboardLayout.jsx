
import { motion } from "framer-motion";
import { Menu, Bell, User, LayoutDashboard, FileText, CheckSquare, Building2, Users, BarChart2, Settings, Clock, FileCheck2, Sparkles, FolderKanban, Zap, AlertCircle, CalendarCheck2, Search, Upload, ClipboardList, FileBarChart2 } from "lucide-react";

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
    color: "#2563eb",
    icon: <FileCheck2 size={28} style={{marginBottom: 8}} />,
    content: (
      <ul className="dashboard-card-list">
        <li>Invoice_234.pdf processed → sent to Finance Dept.</li>
        <li>Safety Circular 09/2025 summarized for HR.</li>
        <li>Engineering job card flagged: ‘Brake inspection overdue.’</li>
        <li>Vendor contract uploaded by Procurement.</li>
      </ul>
    )
  },
  {
    label: "Upcoming Deadlines",
    color: "#2563eb",
    icon: <Clock size={28} style={{marginBottom: 8}} />,
    content: (
      <ul className="dashboard-card-list">
        <li>Safety Audit Report – Due: Sep 25, 2025</li>
        <li>Tender Submission – Due: Sep 28, 2025</li>
        <li>Employee Training – Due: Oct 05, 2025</li>
        <li>Maintenance Checklist – Due: Oct 10, 2025</li>
      </ul>
    )
  },
  {
    label: "AI Summaries",
    color: "#2563eb",
    icon: <Sparkles size={28} style={{marginBottom: 8}} />,
    content: (
      <ul className="dashboard-card-list">
        <li>⚙️ Engineering: 3 maintenance jobs due this week.</li>
        <li>👥 HR: New training directive released yesterday.</li>
        <li>💰 Finance: 2 vendor invoices pending approval.</li>
        <li>📑 Compliance: Circular flagged for legal review.</li>
      </ul>
    )
  },
  {
    label: "Department Overview",
    color: "#2563eb",
    icon: <FolderKanban size={28} style={{marginBottom: 8}} />,
    content: (
      <ul className="dashboard-card-list">
        <li>Engineering – 12 docs processed, 3 flagged urgent</li>
        <li>HR – 8 docs, 1 compliance risk</li>
        <li>Finance – 5 pending invoices</li>
        <li>Procurement – 4 new contracts</li>
      </ul>
    )
  },
  {
    label: "Notifications",
    color: "#2563eb",
    icon: <AlertCircle size={28} style={{marginBottom: 8}} />,
    content: (
      <ul className="dashboard-card-list">
        <li>⚠️ Compliance deadline in 3 days.</li>
        <li>📌 New vendor policy uploaded.</li>
        <li>🔔 Engineering flagged a design change.</li>
        <li>✅ HR training module completed.</li>
      </ul>
    )
  },
];

function DashboardLayout() {
  // For demo, hardcode user info
  const user = {
    name: "Zachary Lee",
    dept: "Engineering dept.",
  };

  return (
    <div className="dashboard-root">
      {/* Sidebar - always visible on desktop */}
      <aside className="dashboard-sidebar sidebar-persistent">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            <User size={38} />
          </div>
          <div className="sidebar-profile-name">{user.name}</div>
          <div className="sidebar-profile-dept">{user.dept}</div>
        </div>
        <nav className="sidebar-nav sidebar-nav-persistent">
          {navItems.map(({ label, icon: Icon }) => (
            <motion.button
              key={label}
              className="sidebar-nav-item"
              whileHover={{ scale: 1.06, backgroundColor: "#232323" }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={20} style={{ marginRight: 14 }} />
              {label}
            </motion.button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div />
          <div className="topbar-actions">
            <motion.button whileTap={{ scale: 0.9 }} className="topbar-icon-btn">
              <Bell size={22} />
            </motion.button>
            <motion.div whileHover={{ scale: 1.08 }} className="topbar-avatar">
              <User size={22} />
            </motion.div>
          </div>
        </header>

        {/* Quick Actions Container */}
        <section className="quick-actions-container">
          <div className="quick-actions-title">
            <Zap size={28} style={{marginBottom: 4, marginRight: 8}} /> Quick Actions
          </div>
          <div className="quick-actions-btns">
            <button className="quick-action-btn"><Upload size={18} /> Upload Document</button>
            <button className="quick-action-btn"><Search size={18} /> Search Past Summaries</button>
            <button className="quick-action-btn"><CalendarCheck2 size={18} /> View Compliance Calendar</button>
            <button className="quick-action-btn"><FileBarChart2 size={18} /> Generate Report</button>
          </div>
        </section>
        {/* Dashboard Cards */}
        <main className="dashboard-cards">
          {cards.map((card) => (
            <motion.div
              key={card.label}
              className="dashboard-card"
              style={{ background: card.color }}
              whileHover={{ y: -6, boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)" }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="dashboard-card-icon">{card.icon}</div>
              <span className="dashboard-card-title">{card.label}</span>
              <div className="dashboard-card-content">{card.content}</div>
            </motion.div>
          ))}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
