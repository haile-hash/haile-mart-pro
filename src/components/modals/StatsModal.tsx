/* eslint-disable */
// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';

interface StatsModalProps {
  reportStartDate: string;
  setReportStartDate: (val: string) => void;
  reportEndDate: string;
  setReportEndDate: (val: string) => void;
  history: any[];
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  reportStartDate, setReportStartDate, reportEndDate, setReportEndDate, history, onClose
}) => {
  
  // STATE TẠM THỜI: Giữ ngày người dùng chọn, chưa tính toán vội
  const [localStart, setLocalStart] = useState(reportStartDate);
  const [localEnd, setLocalEnd] = useState(reportEndDate);

  // Đồng bộ lại dữ liệu nếu bên ngoài có thay đổi
  useEffect(() => {
    setLocalStart(reportStartDate);
    setLocalEnd(reportEndDate);
  }, [reportStartDate, reportEndDate]);
  
  // Lọc dữ liệu theo khoảng thời gian (Chỉ chạy lại khi reportStartDate/reportEndDate chính thức thay đổi)
  const filteredStats = useMemo(() => {
    const start = new Date(reportStartDate).getTime();
    const end = new Date(reportEndDate).getTime() + 86400000; // Đến cuối ngày kết thúc
    
    return history.filter(h => {
      let timeStr = h.time || "";
      let parts = timeStr.split(' ');
      let datePart = parts.find((p: string) => p.includes('/'));
      if (!datePart) return false;
      
      let [d, m, y] = datePart.replace(',', '').split('/');
      const logTime = new Date(`${y}-${m}-${d}`).getTime();
      return logTime >= start && logTime <= end;
    });
  }, [history, reportStartDate, reportEndDate]);

  // Tính toán Kế toán chuẩn mực
  const totals = useMemo(() => {
    let sales = 0, profit = 0, debtIssued = 0, debtCollected = 0;
    
    filteredStats.forEach(h => {
      // 1. DOANH THU & LỢI NHUẬN (Bao gồm Bán thẳng và Mua nợ)
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') {
        sales += (h.total || 0);
        profit += (h.profit || 0);
      } 
      // 2. TRỪ DOANH THU KHI TRẢ HÀNG
      else if (h.type === 'TRẢ HÀNG') {
        sales -= Math.abs(h.total || 0);
        profit -= Math.abs(h.profit || 0);
      }
      
      // 3. THEO DÕI CÔNG NỢ ĐỘC LẬP
      if (h.type === 'GHI NỢ') {
        debtIssued += (h.total || 0); // Khách mua nợ thêm
      }
      else if (h.type === 'THU NỢ') {
        debtCollected += (h.total || 0); // Khách mang tiền đến trả nợ
      }
    });
    
    return { sales, profit, debtIssued, debtCollected };
  }, [filteredStats]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "white", padding: "30px", borderRadius: "20px", width: "750px", maxWidth: "95vw", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ padding: "8px", background: "#eff6ff", borderRadius: "10px", color: "#3b82f6" }}>📊</span> BÁO CÁO KẾT QUẢ KINH DOANH
          </h2>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", fontSize: "20px", cursor: "pointer", color: "#64748b", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}>&times;</button>
        </div>

        {/* CỤM TÌM KIẾM 3 CỘT MỚI (FLEXBOX) */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>Từ ngày:</label>
            <input 
              type="date" 
              value={localStart} 
              onChange={e => setLocalStart(e.target.value)} 
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", color: "#334155", fontWeight: "600", fontFamily: "'Inter', sans-serif" }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>Đến ngày (Bao gồm):</label>
            <input 
              type="date" 
              value={localEnd} 
              onChange={e => setLocalEnd(e.target.value)} 
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", color: "#334155", fontWeight: "600", fontFamily: "'Inter', sans-serif" }} 
            />
          </div>
          <div>
            <button 
              onClick={() => {
                // Chỉ khi bấm nút này, state chính thức mới được cập nhật để kích hoạt useMemo tính toán lại
                setReportStartDate(localStart);
                setReportEndDate(localEnd);
              }}
              style={{ 
                height: '42px', padding: "0 24px", borderRadius: "8px", border: "none", 
                background: "#2563eb", color: "#fff", fontWeight: "700", cursor: "pointer", 
                display: "flex", alignItems: "center", gap: "8px", transition: "0.2s",
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#1d4ed8"}
              onMouseOut={(e) => e.currentTarget.style.background = "#2563eb"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              ÁP DỤNG
            </button>
          </div>
        </div>

        {/* Khối Doanh thu & Lợi nhuận (Màu Xanh) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div style={{ background: "#eff6ff", padding: "20px", borderRadius: "16px", border: "1px solid #bfdbfe", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: "700", textTransform: "uppercase" }}>Doanh Thu Thuần</div>
            <div style={{ fontSize: "12px", color: "#60a5fa", marginTop: "4px", fontStyle: "italic" }}>(Đã trừ tiền trả hàng)</div>
            <div style={{ fontSize: "32px", color: "#2563eb", fontWeight: "900", marginTop: "12px" }}>{totals.sales.toLocaleString()}đ</div>
          </div>
          <div style={{ background: "#ecfdf5", padding: "20px", borderRadius: "16px", border: "1px solid #a7f3d0", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: "13px", color: "#15803d", fontWeight: "700", textTransform: "uppercase" }}>Lợi Nhuận Gộp</div>
            <div style={{ fontSize: "12px", color: "#34d399", marginTop: "4px", fontStyle: "italic" }}>(Doanh thu - Giá vốn)</div>
            <div style={{ fontSize: "32px", color: "#10b981", fontWeight: "900", marginTop: "12px" }}>{totals.profit.toLocaleString()}đ</div>
          </div>
        </div>

        {/* Khối Theo dõi Công nợ (Màu Cam/Đỏ) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ background: "#fff7ed", padding: "20px", borderRadius: "16px", border: "1px solid #fed7aa", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: "13px", color: "#c2410c", fontWeight: "700", textTransform: "uppercase" }}>Nợ Phát Sinh Mới</div>
            <div style={{ fontSize: "12px", color: "#fb923c", marginTop: "4px", fontStyle: "italic" }}>(Khách mua nợ trong kỳ)</div>
            <div style={{ fontSize: "28px", color: "#ea580c", fontWeight: "900", marginTop: "12px" }}>+ {totals.debtIssued.toLocaleString()}đ</div>
          </div>
          <div style={{ background: "#fef2f2", padding: "20px", borderRadius: "16px", border: "1px solid #fecaca", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: "13px", color: "#b91c1c", fontWeight: "700", textTransform: "uppercase" }}>Thu Nợ Trong Kỳ</div>
            <div style={{ fontSize: "12px", color: "#f87171", marginTop: "4px", fontStyle: "italic" }}>(Khách mang tiền đến trả)</div>
            <div style={{ fontSize: "28px", color: "#ef4444", fontWeight: "900", marginTop: "12px" }}>- {totals.debtCollected.toLocaleString()}đ</div>
          </div>
        </div>

      </div>
    </div>
  );
};
