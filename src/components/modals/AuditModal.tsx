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
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "25px", width: "650px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <h2 style={{ margin: 0, color: "#334155" }}>🕵️ NHẬT KÝ HỆ THỐNG</h2>
            <button onClick={exportAuditToCSV} style={{ fontSize: "10px", padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT FILE</button>
          </div>
          <button onClick={() => setShowAuditModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, fontSize: "12px", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "5px", background: "var(--bg-input)" }}>
          {auditLogs.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có bản ghi nào.</div>}
          {auditLogs.map((log, idx) => (
            <div key={idx} onClick={() => setSelectedAuditLog(log)} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", cursor: "pointer", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontWeight: "bold", color: "#b91c1c" }}>[{log.action}]</span>
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{log.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "10px" }}>{log.detail}</span>
                <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{log.user_name} ({log.shift})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
