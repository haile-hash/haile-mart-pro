import React from 'react';

export const StatsModal = ({
  showStatsModal, setShowStatsModal,
  reportStartDate, setReportStartDate, reportEndDate, setReportEndDate,
  handleExportCSV, onSendAlert, onSendReport,
  filteredStats, chartData, topSelling
}: any) => {
  if (!showStatsModal) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "25px", width: "900px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#3b82f6" }}>📊 BÁO CÁO KINH DOANH</h2>
          <button onClick={() => setShowStatsModal(false)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#64748b", lineHeight: "1" }}>&times;</button>
        </div>
        
        {/* BỘ LỌC THỜI GIAN */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "4px" }}>Từ ngày</label>
            <input type="date" value={reportStartDate || ""} onChange={(e) => setReportStartDate(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "4px" }}>Đến ngày</label>
            <input type="date" value={reportEndDate || ""} onChange={(e) => setReportEndDate(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={handleExportCSV} style={{ padding: "10px 15px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(16,185,129,0.3)" }}>⬇️ Excel</button>
            <button onClick={onSendReport} style={{ padding: "10px 15px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(59,130,246,0.3)" }}>📧 Báo cáo Email</button>
            <button onClick={onSendAlert} style={{ padding: "10px 15px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(239,68,68,0.3)" }}>🚨 Cảnh báo Tồn/HSD</button>
          </div>
        </div>

        {/* CÁC THẺ CHỈ SỐ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "25px" }}>
          <div style={{ padding: "15px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "bold", marginBottom: "5px" }}>TỔNG DOANH THU</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#1e3a8a", wordBreak: "break-all" }}>{Number(filteredStats?.rev || 0).toLocaleString()}đ</div>
          </div>
          <div style={{ padding: "15px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "bold", marginBottom: "5px" }}>LỢI NHUẬN GỘP</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#065f46", wordBreak: "break-all" }}>{Number(filteredStats?.prof || 0).toLocaleString()}đ</div>
          </div>
          <div style={{ padding: "15px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
            <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "bold", marginBottom: "5px" }}>TỔNG CHI PHÍ</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#991b1b", wordBreak: "break-all" }}>{Number(filteredStats?.expenses || 0).toLocaleString()}đ</div>
          </div>
          <div style={{ padding: "15px", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: "12px", color: "#d97706", fontWeight: "bold", marginBottom: "5px" }}>LỢI NHUẬN RÒNG</div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#92400e", wordBreak: "break-all" }}>{Number(filteredStats?.netProfit || 0).toLocaleString()}đ</div>
          </div>
        </div>

        {/* BIỂU ĐỒ & TOP SẢN PHẨM (TỐI ƯU HIỂN THỊ) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px" }}>
          <div>
            <h3 style={{ fontSize: "16px", color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginTop: 0 }}>🏆 Top 5 Bán chạy</h3>
            {(!topSelling || topSelling.length === 0) ? (
              <div style={{ color: "#94a3b8", fontSize: "14px", marginTop: "10px", fontStyle: "italic" }}>Chưa có giao dịch trong kỳ này</div> 
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0 0" }}>
                {topSelling.map((item: any, idx: number) => {
                  // Bóc tách mảng an toàn
                  const name = item?.[0] || 'Sản phẩm không rõ';
                  const qty = item?.[1] || 0;

                  return (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px dashed #e2e8f0" }}>
                      <span style={{ fontWeight: "bold", color: "#475569", fontSize: "14px", paddingRight: "10px" }}>#{idx + 1} {name}</span>
                      <span style={{ color: "#10b981", fontWeight: "900", fontSize: "14px", whiteSpace: "nowrap" }}>{qty} SP</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          
          <div>
            <h3 style={{ fontSize: "16px", color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginTop: 0 }}>📈 Doanh thu 30 ngày qua</h3>
            {(!chartData || chartData.length === 0) ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "160px", color: "#94a3b8", fontSize: "14px", marginTop: "15px", fontStyle: "italic" }}>
                Chưa có dữ liệu biểu đồ
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', marginTop: '15px', paddingBottom: '25px', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                {chartData.map((d: any, idx: number) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div 
                      style={{ width: '100%', background: 'linear-gradient(to top, #60a5fa, #3b82f6)', height: d?.height || '0%', borderRadius: '4px 4px 0 0', minHeight: '2px' }} 
                      title={`${d?.label || 'Unknown'}: ${Number(d?.total || 0).toLocaleString()}đ`}
                    ></div>
                    {d?.showLabel && <div style={{ fontSize: '9px', color: '#64748b', transform: 'rotate(-45deg)', marginTop: '12px', whiteSpace: 'nowrap' }}>{d.label}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
