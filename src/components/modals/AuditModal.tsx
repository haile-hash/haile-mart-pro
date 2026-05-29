import React from 'react';

interface AuditModalProps {
  showAuditModal: boolean;
  setShowAuditModal: (val: boolean) => void;
  auditLogs: any[];
  exportAuditToCSV: () => void;
  setSelectedAuditLog: (log: any) => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  showAuditModal, setShowAuditModal, auditLogs, exportAuditToCSV, setSelectedAuditLog
}) => {
  if (!showAuditModal) return null;

  return (
    <div 
      className="no-print" 
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
      onClick={() => setShowAuditModal(false)}
    >
      <div 
        className="glass" 
        style={{ padding: "25px", width: "650px", maxWidth: "95vw", maxHeight: "80vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px" }} 
        onClick={e => e.stopPropagation()} 
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <h2 style={{ margin: 0, color: "#334155", fontSize: "18px" }}>🕵️ NHẬT KÝ HỆ THỐNG</h2>
            <button onClick={exportAuditToCSV} style={{ fontSize: "10px", padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(16,185,129,0.3)" }}>
              📥 XUẤT FILE
            </button>
          </div>
          <button onClick={() => setShowAuditModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>
        
        <div style={{ overflowY: "auto", flex: 1, fontSize: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "5px", background: "#f8fafc" }}>
          {(!auditLogs || auditLogs.length === 0) && (
            <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "20px", fontStyle: "italic" }}>
              Chưa có bản ghi nào.
            </div>
          )}
          
          {/* SỬA ĐỔI: Cắt 100 bản ghi mới nhất để bảo vệ hiệu năng máy trạm */}
          {(auditLogs || []).slice(0, 100).map((log, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedAuditLog(log)} 
              style={{ padding: "10px", borderBottom: "1px dashed #cbd5e1", cursor: "pointer", transition: "all 0.2s", borderRadius: "6px" }} 
              onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'} 
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontWeight: "bold", color: "#b91c1c" }}>[{log?.action || "Không rõ"}]</span>
                <span style={{ color: "#64748b", fontSize: "11px", fontFamily: "monospace" }}>{log?.time || "---"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "10px", color: "#334155" }}>
                  {log?.detail || "Không có chi tiết"}
                </span>
                <span style={{ fontWeight: "bold", color: "#3b82f6" }}>
                  {log?.user_name || "Hệ thống"} {log?.shift ? `(${log.shift})` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
