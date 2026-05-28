import React from 'react';

interface CashFlowModalProps {
  cashFlowModalInfo: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null;
  setCashFlowModalInfo: (val: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null) => void;
  shift: string;
  todayStrStr: string;
  currentShiftCashFlow: { thu: any[]; chi: any[] };
  currentShiftStats: { cash: number; transfer: number };
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({
  cashFlowModalInfo, setCashFlowModalInfo, shift, todayStrStr,
  currentShiftCashFlow, currentShiftStats
}) => {
  if (!cashFlowModalInfo) return null;

  const isCash = cashFlowModalInfo === 'TIỀN MẶT';
  
  // BỌC GIÁP: Đảm bảo không bao giờ sập do gọi .reduce() hoặc .map() trên dữ liệu rỗng
  const safeThu = currentShiftCashFlow?.thu || [];
  const safeChi = currentShiftCashFlow?.chi || [];

  // BỌC GIÁP: Ép kiểu Number() để tránh lỗi NaN (Not a Number) khi cộng dồn
  const totalThu = safeThu.reduce((acc, i) => acc + (Number(i?.amount) || 0), 0);
  const totalChi = safeChi.reduce((acc, i) => acc + (Number(i?.amount) || 0), 0);
  
  // BỌC GIÁP: Đảm bảo tồn quỹ luôn có giá trị số
  const totalTonQuy = isCash ? (currentShiftStats?.cash || 0) : (currentShiftStats?.transfer || 0);

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setCashFlowModalInfo(null)}>
      <div className="glass" style={{ padding: "20px", width: "700px", maxWidth: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "12px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${isCash ? '#10b981' : '#3b82f6'}`, paddingBottom: "10px", marginBottom: "15px" }}>
          <div>
            <h2 style={{ margin: 0, color: isCash ? "#10b981" : "#3b82f6", fontSize: "20px" }}>💸 DÒNG TIỀN {cashFlowModalInfo}</h2>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Ca: <b>{shift || '---'}</b> ({todayStrStr || '---'})</div>
          </div>
          <button onClick={() => setCashFlowModalInfo(null)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>

        {/* Thêm flexWrap để giao diện không bị bóp méo trên màn hình nhỏ */}
        <div style={{ display: "flex", gap: "15px", flex: 1, overflow: "hidden", flexWrap: "wrap" }}>
          {/* CỘT THU VÀO */}
          <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", background: "#f0fdf4", padding: "12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #86efac", paddingBottom: "8px", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#16a34a" }}>⬇️ THU VÀO (+)</h3>
              <span style={{ fontWeight: "900", color: "#15803d", fontSize: "16px" }}>{totalThu.toLocaleString('vi-VN')}đ</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
              {safeThu.length === 0 && <div style={{ fontSize: "12px", color: "#16a34a", textAlign: "center", marginTop: "20px", fontStyle: "italic" }}>Chưa có phát sinh thu.</div>}
              {safeThu.map((item, idx) => (
                <div key={idx} style={{ padding: "10px 0", borderBottom: "1px dashed #bbf7d0", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "65%" }}>
                    <b style={{ color: "#14532d", wordBreak: "break-word" }}>{item?.note || 'Không có ghi chú'}</b>
                    <span style={{ fontSize: "10px", color: "#15803d", marginTop: "4px" }}>{item?.time || '---'}</span>
                  </div>
                  <b style={{ color: "#16a34a", whiteSpace: "nowrap" }}>+{(Number(item?.amount) || 0).toLocaleString('vi-VN')}đ</b>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT CHI RA */}
          <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", background: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #fca5a5", paddingBottom: "8px", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#dc2626" }}>⬆️ CHI RA (-)</h3>
              <span style={{ fontWeight: "900", color: "#b91c1c", fontSize: "16px" }}>{totalChi.toLocaleString('vi-VN')}đ</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
              {safeChi.length === 0 && <div style={{ fontSize: "12px", color: "#dc2626", textAlign: "center", marginTop: "20px", fontStyle: "italic" }}>Chưa có phát sinh chi.</div>}
              {safeChi.map((item, idx) => (
                <div key={idx} style={{ padding: "10px 0", borderBottom: "1px dashed #fecaca", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "65%" }}>
                    <b style={{ color: "#7f1d1d", wordBreak: "break-word" }}>{item?.note || 'Không có ghi chú'}</b>
                    <span style={{ fontSize: "10px", color: "#b91c1c", marginTop: "4px" }}>{item?.time || '---'}</span>
                  </div>
                  <b style={{ color: "#dc2626", whiteSpace: "nowrap" }}>-{(Number(item?.amount) || 0).toLocaleString('vi-VN')}đ</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "15px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ color: "#334155", fontSize: "15px" }}>💰 TỔNG TỒN QUỸ {cashFlowModalInfo}:</b>
          <span style={{ fontSize: "22px", fontWeight: "900", color: isCash ? "#059669" : "#3b82f6" }}>{totalTonQuy.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
    </div>
  );
};
