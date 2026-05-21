import React from 'react';

interface AuditDetailModalProps {
  selectedAuditLog: any;
  setSelectedAuditLog: (val: any) => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ selectedAuditLog, setSelectedAuditLog }) => {
  if (!selectedAuditLog) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }} onClick={() => setSelectedAuditLog(null)}>
      <div className="glass" style={{ padding: "20px", width: "450px", maxWidth: "90%", background: "var(--bg-glass)" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", color: "#ef4444", borderBottom: "1px dashed var(--border-glass)", paddingBottom: "5px" }}>Chi tiết thao tác</h3>
        <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ margin: "5px 0" }}><b>Hành động:</b> {selectedAuditLog.action}</p>
          <p style={{ margin: "5px 0" }}><b>Người thực hiện:</b> {selectedAuditLog.user_name} - {selectedAuditLog.shift}</p>
          <p style={{ margin: "5px 0" }}><b>Thời gian:</b> {selectedAuditLog.time}</p>
          <p style={{ margin: "5px 0" }}><b>Tóm tắt:</b> <span style={{ color: "#3b82f6" }}>{selectedAuditLog.detail}</span></p>
          
          {selectedAuditLog.extra_data && (
            <div style={{ marginTop: "10px" }}>
              <b style={{ color: "#059669", fontSize: "12px", display: "block", marginBottom: "5px" }}>Dữ liệu chi tiết:</b>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", maxHeight: "250px", overflowY: "auto", padding: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <tbody>
                    {Object.entries(JSON.parse(selectedAuditLog.extra_data)).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: "1px dashed var(--border-glass)" }}>
                        <td style={{ padding: "6px 4px", fontWeight: "bold", color: "var(--text-muted)", width: "35%", verticalAlign: "top" }}>{k}</td>
                        <td style={{ padding: "6px 4px", color: "var(--text-main)", wordBreak: "break-word" }}>
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setSelectedAuditLog(null)} style={{ marginTop: "15px", width: "100%", padding: "10px", background: "#e2e8f0", color: "#1e293b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Đóng</button>
      </div>
    </div>
  );
};
