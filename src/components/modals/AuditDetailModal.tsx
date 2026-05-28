import React, { useMemo } from 'react';

interface AuditDetailModalProps {
  selectedAuditLog: any;
  setSelectedAuditLog: (val: any) => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ selectedAuditLog, setSelectedAuditLog }) => {
  
  // BỌC GIÁP: Xử lý parse JSON an toàn tuyệt đối
  const parsedExtraData = useMemo(() => {
    if (!selectedAuditLog || !selectedAuditLog.extra_data) return null;
    
    try {
      // Kiểm tra xem nó đã là Object sẵn chưa (để đề phòng), nếu là chuỗi (string) thì mới parse
      const data = typeof selectedAuditLog.extra_data === 'string' 
        ? JSON.parse(selectedAuditLog.extra_data) 
        : selectedAuditLog.extra_data;
        
      // Đảm bảo kết quả trả về là một Object hợp lệ để Object.entries không bị lỗi
      return typeof data === 'object' && data !== null ? data : { "Dữ liệu": String(data) };
    } catch (e) {
      console.error("Lỗi đọc dữ liệu nhật ký:", e);
      return { "Lỗi hiển thị": "Định dạng dữ liệu không hợp lệ." };
    }
  }, [selectedAuditLog]);

  if (!selectedAuditLog) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }} onClick={() => setSelectedAuditLog(null)}>
      <div className="glass" style={{ padding: "20px", width: "450px", maxWidth: "90%", background: "var(--bg-glass)" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", color: "#ef4444", borderBottom: "1px dashed var(--border-glass)", paddingBottom: "5px" }}>Chi tiết thao tác</h3>
        <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
          <p style={{ margin: "5px 0" }}><b>Hành động:</b> {selectedAuditLog.action || 'Không rõ'}</p>
          <p style={{ margin: "5px 0" }}><b>Người thực hiện:</b> {selectedAuditLog.user_name || 'Hệ thống'} - {selectedAuditLog.shift || ''}</p>
          <p style={{ margin: "5px 0" }}><b>Thời gian:</b> {selectedAuditLog.time || 'Không rõ'}</p>
          <p style={{ margin: "5px 0" }}><b>Tóm tắt:</b> <span style={{ color: "#3b82f6" }}>{selectedAuditLog.detail || 'Không có chi tiết'}</span></p>
          
          {parsedExtraData && (
            <div style={{ marginTop: "10px" }}>
              <b style={{ color: "#059669", fontSize: "12px", display: "block", marginBottom: "5px" }}>Dữ liệu chi tiết:</b>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", maxHeight: "250px", overflowY: "auto", padding: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <tbody>
                    {Object.entries(parsedExtraData).map(([k, v]) => (
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
        <button onClick={() => setSelectedAuditLog(null)} style={{ marginTop: "15px", width: "100%", padding: "10px", background: "#e2e8f0", color: "#1e293b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background="#cbd5e1"} onMouseOut={e=>e.currentTarget.style.background="#e2e8f0"}>Đóng</button>
      </div>
    </div>
  );
};
