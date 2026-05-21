import React from 'react';
import { cleanName } from '../../utils/helpers';

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
  const totalThu = currentShiftCashFlow.thu.reduce((acc, i) => acc + i.amount, 0);
  const totalChi = currentShiftCashFlow.chi.reduce((acc, i) => acc + i.amount, 0);
  const totalTonQuy = isCash ? currentShiftStats.cash : currentShiftStats.transfer;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setCashFlowModalInfo(null)}>
      <div className="glass" style={{ padding: "20px", width: "700px", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${isCash ? '#10b981' : '#3b82f6'}`, paddingBottom: "10px", marginBottom: "15px" }}>
          <div>
            <h2 style={{ margin: 0, color: isCash ? "#10b981" : "#3b82f6" }}>💸 DÒNG TIỀN {cashFlowModalInfo}</h2>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Ca: <b>{shift}</b> ({todayStrStr})</div>
          </div>
          <button onClick={() => setCashFlowModalInfo(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>

        <div style={{ display: "flex", gap: "15px", flex: 1, overflow: "hidden" }}>
          {/* CỘT THU VÀO */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f0fdf4", padding: "12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #86efac", paddingBottom: "8px", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#16a34a" }}>⬇️ THU VÀO (+)</h3>
              <span style={{ fontWeight: "900", color: "#15803d" }}>{totalThu.toLocaleString()}đ</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
              {currentShiftCashFlow.thu.length === 0 && <div style={{ fontSize: "11px", color: "#16a34a", textAlign: "center", marginTop: "20px" }}>Chưa có phát sinh thu.</div>}
              {currentShiftCashFlow.thu.map((item, idx) => (
                <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #bbf7d0", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%" }}>
                    <b style={{ color: "#14532d", wordBreak: "break-word" }}>{item.note}</b>
                    <span style={{ fontSize: "10px", color: "#15803d", marginTop: "2px" }}>{item.time}</span>
                  </div>
                  <b style={{ color: "#16a34a", whiteSpace: "nowrap" }}>+{item.amount.toLocaleString()}đ</b>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT CHI RA */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #fca5a5", paddingBottom: "8px", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#dc2626" }}>⬆️ CHI RA (-)</h3>
              <span style={{ fontWeight: "900", color: "#b91c1c" }}>{totalChi.toLocaleString()}đ</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
              {currentShiftCashFlow.chi.length === 0 && <div style={{ fontSize: "11px", color: "#dc2626", textAlign: "center", marginTop: "20px" }}>Chưa có phát sinh chi.</div>}
              {currentShiftCashFlow.chi.map((item, idx) => (
                <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #fecaca", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%" }}>
                    <b style={{ color: "#7f1d1d", wordBreak: "break-word" }}>{item.note}</b>
                    <span style={{ fontSize: "10px", color: "#b91c1c", marginTop: "2px" }}>{item.time}</span>
                  </div>
                  <b style={{ color: "#dc2626", whiteSpace: "nowrap" }}>-{item.amount.toLocaleString()}đ</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "15px", background: "var(--bg-input)", padding: "15px", borderRadius: "8px", border: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ color: "var(--text-main)", fontSize: "14px" }}>💰 TỔNG TỒN QUỸ {cashFlowModalInfo}:</b>
          <span style={{ fontSize: "20px", fontWeight: "900", color: isCash ? "#059669" : "#3b82f6" }}>{totalTonQuy.toLocaleString()}đ</span>
        </div>
      </div>
    </div>
  );
};
