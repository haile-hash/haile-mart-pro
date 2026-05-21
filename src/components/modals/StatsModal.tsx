import React from 'react';
import { cleanName } from '../../utils/helpers';

interface StatsModalProps {
  showStatsModal: boolean; setShowStatsModal: (val: boolean) => void;
  reportStartDate: string; setReportStartDate: (val: string) => void;
  reportEndDate: string; setReportEndDate: (val: string) => void;
  exportToCSV: () => void; sendInventoryAlertEmail: () => void; handleSendEmailReport: () => void;
  filteredStats: any; chartData: any[]; topSelling: any[]; products: any[];
}

export const StatsModal: React.FC<StatsModalProps> = (props) => {
  if (!props.showStatsModal) return null;
  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "25px", width: "600px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <h2 style={{ margin: 0, color: "#3b82f6" }}>📊 BÁO CÁO</h2>
            <input type="date" value={props.reportStartDate} onChange={e => props.setReportStartDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--border-glass)" }}/> 
            <span style={{fontSize: "12px", fontWeight:"bold", color: "var(--text-muted)"}}>đến</span> 
            <input type="date" value={props.reportEndDate} onChange={e => props.setReportEndDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--border-glass)" }}/>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={props.exportToCSV} style={{ fontSize: "10px", padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT EXCEL</button>
            <button onClick={props.sendInventoryAlertEmail} style={{ fontSize: "10px", padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }} title="Gửi mail cảnh báo">🚨 CẢNH BÁO KHO</button>
            <button onClick={props.handleSendEmailReport} style={{ fontSize: "10px", padding: "6px 10px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📧 GỬI MAIL BC</button>
            <button onClick={() => props.setShowStatsModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)", marginLeft: "5px" }}>✖</button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}>
          <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "8px", border: "1px solid #bfdbfe", textAlign: "center" }}><div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "bold" }}>DOANH THU KỲ</div><div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a", marginTop: "4px" }}>{props.filteredStats.totalSales.toLocaleString()}đ</div></div>
          <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", border: "1px solid #fecaca", textAlign: "center" }}><div style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold" }}>CHI PHÍ KỲ</div><div style={{ fontSize: "14px", fontWeight: "bold", color: "#b91c1c", marginTop: "4px" }}>-{props.filteredStats.expenses.toLocaleString()}đ</div></div>
          <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}><div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "bold" }}>LỢI NHUẬN RÒNG</div><div style={{ fontSize: "14px", fontWeight: "bold", color: "#14532d", marginTop: "4px" }}>{props.filteredStats.netProfit.toLocaleString()}đ</div></div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 5px 0" }}>📈 Doanh thu 30 ngày qua</h3>
          <div className="chart-container-scroll">
            {props.chartData.map((d, i) => (
              <div key={i} className="chart-bar-group">
                <div className="chart-val" style={{ visibility: d.showLabel && d.total > 0 ? 'visible' : 'hidden' }}>{(d.total / 1000).toFixed(0)}k</div>
                <div className="chart-bar" style={{ height: d.height }}></div>
                <div className="chart-label" style={{ visibility: d.showLabel ? 'visible' : 'hidden' }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "12px", margin: "0 0 8px 0", color: "var(--text-main)" }}>🏆 Top Bán Chạy</h3>
            {props.topSelling.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{idx + 1}. {item[0]}</span>
                <span style={{ fontWeight: "bold", color: "#10b981" }}>{item[1]}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "12px", color: "#b91c1c", margin: "0 0 8px 0" }}>📉 Sắp hết hàng</h3>
            {props.products.filter((p: any) => p.stock > 0 && p.stock < 10).slice(0, 5).map((p: any, idx: number) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{cleanName(p.name)}</span>
                <span style={{ fontWeight: "bold", color: "#ef4444" }}>Còn {p.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
