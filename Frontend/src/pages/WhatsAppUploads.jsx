import React, { useState } from 'react';
import { ArrowLeft, FileBarChart2, FileText, Eye, Loader2, Clock, Building2, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WhatsappUploads = () => {
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Sample whatsapp data - these are already processed whatsapp messages
  const [whatsappData] = useState([
    {
      id: 1,
      name: "Project_Team_Chat.txt",
      size: "125.3 KB",
      type: "WhatsApp file",
      uploadDate: "Sep 28, 2025",
      from: "Project Team Group",
      subject: "Daily Project Updates"
    },
    {
      id: 2,
      name: "Safety_Alert_Group.txt",
      size: "89.7 KB", 
      type: "WhatsApp file",
      uploadDate: "Sep 27, 2025",
      from: "Safety Compliance Group",
      subject: "Safety Alerts and Updates"
    },
    {
      id: 3,
      name: "Vendor_Communication.txt",
      size: "156.8 KB",
      type: "WhatsApp file", 
      uploadDate: "Sep 26, 2025",
      from: "Vendor Relations Group",
      subject: "Supplier Coordination"
    },
    {
      id: 4,
      name: "Finance_Approvals.txt",
      size: "203.1 KB",
      type: "WhatsApp file",
      uploadDate: "Sep 25, 2025", 
      from: "Finance Team Group",
      subject: "Budget and Approval Discussions"
    }
  ]);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setAiResult(null);
    
    try {
      const response = await axios.get('http://127.0.0.1:3000/whatsapp/whatsapp-analyze');
      setAiResult(response.data.analysis);
      setShowReport(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report. Please try again.');
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

  if (showReport && aiResult) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          backgroundImage: "url('src/assets/metro-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          padding: '2rem'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <button
              onClick={() => setShowReport(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1.25rem',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(37, 99, 235, 0.8)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <ArrowLeft size={20} />
              Back to WhatsApp List
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(41, 55, 75, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1.25rem',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(37, 99, 235, 0.8)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(41, 55, 75, 0.8)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Dashboard
            </button>
          </div>

          {/* Report Display */}
          <div 
            style={{
              background: 'rgba(20, 30, 48, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div 
                style={{
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.2)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px'
                }}
              >
                <FileBarChart2 style={{ width: '2rem', height: '2rem', color: '#4ade80' }} />
              </div>
              <div>
                <h1 
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: '#ffffff',
                    margin: '0 0 0.5rem 0',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  AI Analysis Report
                </h1>
                <p 
                  style={{
                    color: '#e2e8f0',
                    fontSize: '1.1rem',
                    margin: '0',
                    fontWeight: '500'
                  }}
                >
                  Generated on {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            {/* AI Analysis Results */}
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Document Name */}
              <div style={{
                background: "rgba(37, 99, 235, 0.8)",
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: "#fff",
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <FileText size={28} />
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>Document</h3>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>{aiResult.document_name}</p>
                </div>
              </div>

              {/* Priority and Status Row */}
              <div style={{ display: "flex", gap: '1.5rem', marginBottom: '1.5rem' }}>
                {aiResult.priority && (
                  <div style={{ 
                    background: getPriorityColor(aiResult.priority), 
                    color: "#fff", 
                    padding: "1.25rem", 
                    borderRadius: '16px', 
                    fontSize: "1rem",
                    fontWeight: 700,
                    flex: 1,
                    textAlign: "center",
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={20} />
                    Priority: {aiResult.priority}
                  </div>
                )}
                {aiResult.status && (
                  <div style={{ 
                    background: aiResult.status === 'success' ? "rgba(16, 185, 129, 0.8)" : "rgba(107, 114, 128, 0.8)", 
                    color: "#fff", 
                    padding: "1.25rem", 
                    borderRadius: '16px', 
                    fontSize: "1rem",
                    fontWeight: 700,
                    flex: 1,
                    textAlign: "center",
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <CheckCircle2 size={20} />
                    Status: {aiResult.status}
                  </div>
                )}
              </div>

              {/* Deadline */}
              {aiResult.deadline && (
                <div style={{
                  background: "rgba(220, 38, 38, 0.8)",
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: "#fff",
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <Clock size={28} />
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>Deadline</h3>
                    <p style={{ margin: 0, fontSize: '1.1rem' }}>{new Date(aiResult.deadline).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{
                background: "rgba(30, 64, 175, 0.8)",
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: "#fff",
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileBarChart2 size={24} />
                  Summary
                </h3>
                <p style={{ margin: "0", lineHeight: 1.6, fontSize: '1.05rem' }}>{aiResult.summary}</p>
              </div>

              {/* Task */}
              {aiResult.task && (
                <div style={{
                  background: "rgba(124, 58, 237, 0.8)",
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: "#fff",
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={24} />
                    Task
                  </h3>
                  <p style={{ margin: 0, fontSize: '1.05rem' }}>{aiResult.task}</p>
                </div>
              )}

              {/* Departments */}
              {aiResult.department && aiResult.department.length > 0 && (
                <div style={{
                  background: "rgba(5, 150, 105, 0.8)",
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: "#fff",
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={24} />
                    Departments
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {aiResult.department.map((dept, idx) => (
                      <span key={idx} style={{ 
                        background: 'rgba(255, 255, 255, 0.2)', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px', 
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}>
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Roles */}
              {aiResult.roles && aiResult.roles.length > 0 && (
                <div style={{
                  background: "rgba(30, 58, 138, 0.8)",
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: "#fff",
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={24} />
                    Roles
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {aiResult.roles.map((role, idx) => (
                      <span key={idx} style={{ 
                        background: 'rgba(255, 255, 255, 0.2)', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px', 
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflict */}
              {aiResult.conflict && aiResult.conflict !== null && (
                <div style={{
                  background: "rgba(220, 38, 38, 0.8)",
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: "#fff",
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={24} />
                    Conflict Detected
                  </h3>
                  <p style={{ margin: 0, fontSize: '1.05rem' }}>{aiResult.conflict}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundImage: "url('src/assets/metro-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        padding: '2rem'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem 1.25rem',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(37, 99, 235, 0.8)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(15, 23, 42, 0.8)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>

        <div 
          style={{
            background: 'rgba(20, 30, 48, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <div 
              style={{
                padding: '1rem',
                background: 'rgba(37, 99, 235, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px'
              }}
            >
              <FileBarChart2 style={{ width: '2rem', height: '2rem', color: '#60a5fa' }} />
            </div>
            <div>
              <h1 
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  margin: '0 0 0.5rem 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                WhatsApp Analysis Reports
              </h1>
              <p 
                style={{
                  color: '#e2e8f0',
                  fontSize: '1.1rem',
                  margin: '0',
                  fontWeight: '500'
                }}
              >
                Generate AI-powered analysis reports for processed WhatsApp files
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: '#f87171',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <AlertTriangle size={24} />
              {error}
            </div>
          )}

          {/* Processed WhatsApp Files Display */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Processed WhatsApp Files ({whatsappData.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {whatsappData.map((data) => (
                <div
                  key={data.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <FileText style={{ width: '1.5rem', height: '1.5rem', color: '#60a5fa' }} />
                    <div style={{ flex: 1 }}>
                      <p 
                        style={{
                          fontWeight: '600',
                          color: '#ffffff',
                          margin: '0 0 0.25rem 0',
                          fontSize: '1.1rem'
                        }}
                      >
                        {data.name}
                      </p>
                      <p 
                        style={{
                          fontSize: '0.9rem',
                          color: '#cbd5e1',
                          margin: '0 0 0.25rem 0',
                          fontWeight: '500'
                        }}
                      >
                        Subject: {data.subject}
                      </p>
                      <p 
                        style={{
                          fontSize: '0.85rem',
                          color: '#94a3b8',
                          margin: '0',
                          fontWeight: '500'
                        }}
                      >
                        From: {data.from} • {data.size} • Processed: {data.uploadDate}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#4ade80',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}
                    >
                      ✓ Analyzed
                    </span>
                    <button
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(37, 99, 235, 0.2)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(37, 99, 235, 0.3)',
                        color: '#60a5fa',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(37, 99, 235, 0.3)';
                        e.target.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(37, 99, 235, 0.2)';
                        e.target.style.color = '#60a5fa';
                      }}
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Generate Report Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={generateReport}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                background: loading ? 'rgba(107, 114, 128, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem 3rem',
                color: '#ffffff',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '1.25rem',
                boxShadow: loading ? 'none' : '0 8px 24px 0 rgba(34, 197, 94, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'rgba(21, 128, 61, 0.9)';
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = '0 12px 32px 0 rgba(34, 197, 94, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = 'rgba(34, 197, 94, 0.8)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 24px 0 rgba(34, 197, 94, 0.3)';
                }
              }}
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <FileBarChart2 size={24} />}
              {loading ? 'AI is Generating Report...' : 'Generate AI Analysis Report'}
            </button>
            <p 
              style={{
                color: '#94a3b8',
                fontSize: '0.95rem',
                marginTop: '1rem',
                fontWeight: '500'
              }}
            >
              {loading ? 'Please wait while AI analyzes the WhatsApp data. This may take a few moments...' : `Generate comprehensive AI analysis report for processed WhatsApp files`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappUploads;