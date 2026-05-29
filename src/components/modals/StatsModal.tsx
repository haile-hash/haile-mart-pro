import React, { useMemo } from 'react';

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
  
  // Lọc dữ liệu theo khoảng thời gian
  const filteredStats = useMemo(() => {
    const start = new Date(reportStartDate).getTime();
    const end = new Date(reportEndDate).getTime() + 86400000; // Thêm 1 ngày để lấy hết đến 23:59:59 của ngày kết thúc
    
    return history.filter(h => {
      // BỌC GIÁP: Xử lý thời gian an toàn
      let timeStr = h.time || "";
      let parts = timeStr.split(' ');
      let datePart = parts.find(p => p.includes('/'));
      if (!datePart) return false;
      
      let [d, m, y] = datePart.replace(',', '').split('/');
      const logTime = new Date(`${y}-${m}-${d}`).getTime();
      return logTime >= start && logTime <= end;
    });
  }, [history, reportStartDate, reportEndDate]);

  // Tính tổng
  const totals = useMemo(() => {
    let sales = 0, profit = 0, debt = 0;
    filteredStats.forEach(h => {
      if (h.type === 'BÁN') {
        sales += (h.total || 0);
        profit += (h.profit || 0);
      } else if (h.type === 'GHI NỢ') {
        sales += (h.total || 0);
        profit += (h.profit || 0);
        debt += (h.total || 0);
      } else if (h.type === 'TRẢ HÀNG') {
        sales -= Math.abs(h.total || 0);
        profit -= Math.abs(h.profit || 0);
      }
    });
    return { sales, profit, debt };
  }, [filteredStats]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={onClose}>
      <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "600px", maxWidth: "90%" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#10b981" }}>📊 BÁO CÁO DOANH THU</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Từ ngày:</label>
            <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Đến ngày:</label>
            <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div style={{ background: "#eff6ff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: "bold" }}>DOANH THU BÁN RA</div>
            <div style={{ fontSize: "22px", color: "#2563eb", fontWeight: "900", marginTop: "4px" }}>{totals.sales.toLocaleString()}đ</div>
          </div>
          <div style={{ background: "#ecfdf5", padding: "16px", borderRadius: "8px", border: "1px solid #a7f3d0", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#15803d", fontWeight: "bold" }}>LỢI NHUẬN GỘP</div>
            <div style={{ fontSize: "22px", color: "#16a34a", fontWeight: "900", marginTop: "4px" }}>{totals.profit.toLocaleString()}đ</div>
          </div>
          <div style={{ background: "#fff7ed", padding: "16px", borderRadius: "8px", border: "1px solid #fed7aa", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#c2410c", fontWeight: "bold" }}>KHÁCH MUA NỢ</div>
            <div style={{ fontSize: "22px", color: "#ea580c", fontWeight: "900", marginTop: "4px" }}>{totals.debt.toLocaleString()}đ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
