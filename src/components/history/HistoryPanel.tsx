import React from 'react';
import { cleanName } from '../../utils/helpers';

interface HistoryPanelProps {
  logSearchTerm: string;
  setLogSearchTerm: (val: string) => void;
  logTypeFilter: string;
  setLogTypeFilter: (val: string) => void;
  exportToCSV: () => void;
  groupedHistory: Record<string, any[]>;
  expandedDates: Record<string, boolean>;
  toggleDateGroup: (dateStr: string) => void;
  handleRefund: (id: any) => void;
  handleReprint: (timeStr: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  logSearchTerm, setLogSearchTerm,
  logTypeFilter, setLogTypeFilter,
  exportToCSV, groupedHistory,
  expandedDates, toggleDateGroup,
  handleRefund, handleReprint
}) => {
  return (
    <div className="glass" style={{ padding: "15px", height: "35vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px", flex: 1 }}>
          <input placeholder="🔍 Tìm giao dịch..." value={logSearchTerm} onChange={e => setLogSearchTerm(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", outline: "none", fontSize: "12px", flex: 1 }} />
          <select value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)} style={{ padding: "6px", borderRadius: "6px", outline: "none", fontSize: "12px", fontWeight: "bold" }}>
            <option value="Tất cả">Tất cả</option>
            <option value="BÁN">Bán hàng</option>
            <option value="NHẬP">Nhập hàng</option>
            <option value="TRẢ HÀNG">Trả hàng</option>
            <option value="GHI NỢ">Ghi nợ</option>
            <option value="THU NỢ">Thu nợ</option>
          </select>
          <button onClick={exportToCSV} style={{ padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }} title="Xuất toàn bộ lịch sử">
            📥 EXCEL
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
        {Object.keys(groupedHistory).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px", marginTop: "15px" }}>Không tìm thấy dữ liệu phù hợp</div>}
        {Object.keys(groupedHistory).map((date) => (
          <div key={date}>
            <div onClick={() => toggleDateGroup(date)} style={{ background: "var(--bg-input)", padding: "6px 10px", fontSize: "11px", fontWeight: "bold", border: "1px solid var(--border-glass)", borderRadius: "4px", marginTop: "6px", display: "flex", justifyContent: "space-between", cursor: "pointer", color: "#f59e0b" }}>
              <span>📅 {date}</span><span>{expandedDates[date] ?? true ? "▼" : "▶"}</span>
            </div>
            {(expandedDates[date] ?? true) && (
              <div style={{ padding: "0 4px" }}>
                {groupedHistory[date].map((log: any) => (
                  <div key={log.id} style={{ fontSize: "11px", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span>
                        <b style={{ color: log.type === 'TRẢ HÀNG' ? '#ef4444' : 'var(--text-main)' }}>[{log.type}]</b> {cleanName(log.name)} {log.qty > 0 && `x${log.qty}`} 
                        {log.refunded_qty > 0 && <span style={{ color: "#ef4444", fontSize: "9px" }}>(Đã hoàn {log.refunded_qty})</span>}
                      </span>
                      {log.type === "BÁN" && <span style={{ color: "#10b981", fontWeight: "bold" }}>+{Math.round(log.total).toLocaleString()} <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "normal" }}>({log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : (log.paymentMethod === 'KẾT HỢP' ? 'KH' : (log.paymentMethod === 'QUẸT THẺ' ? 'THẺ' : 'TM'))})</span></span>}
                      {log.type === "TRẢ HÀNG" && <span style={{ color: "#ef4444", fontWeight: "bold" }}>{Math.round(log.total).toLocaleString()} <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "normal" }}>({log.paymentMethod === 'VÍ ĐIỂM' ? 'VÍ' : (log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : 'TM')})</span></span>}
                      {log.type === "GHI NỢ" && <span style={{ color: "#ea580c", fontWeight: "bold" }}>Nợ: {Math.round(log.total).toLocaleString()}</span>}
                      {log.type === "THU NỢ" && <span style={{ color: "#10b981", fontWeight: "bold" }}>+{Math.round(log.total).toLocaleString()} <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "normal" }}>({log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : 'TM'})</span></span>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginTop: "4px", width: "100%" }}>
                      <span>{log.customer}</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span>{log.t}</span>
                        {log.type === 'BÁN' && log.product_id !== 'DISCOUNT' && (
                          <>
                            <button onClick={() => handleRefund(log.id)} disabled={(log.refunded_qty || 0) >= log.qty} style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid var(--border-glass)", background: (log.refunded_qty || 0) >= log.qty ? "var(--bg-main)" : "var(--bg-input)", color: (log.refunded_qty || 0) >= log.qty ? "var(--text-muted)" : "var(--text-main)", cursor: (log.refunded_qty || 0) >= log.qty ? "not-allowed" : "pointer", borderRadius: "4px" }}>
                              {(log.refunded_qty || 0) >= log.qty ? "Đã hoàn" : `↩️ Hoàn ${log.qty - (log.refunded_qty || 0)}`}
                            </button>
                            <button onClick={() => handleReprint(log.time)} style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid var(--border-glass)", background: "var(--bg-input)", color: "var(--text-main)", cursor: "pointer", borderRadius: "4px" }} title="In lại Hóa đơn thời điểm này">🖨️ In lại</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
