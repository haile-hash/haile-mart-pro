import React from 'react';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  newBankBin: string;
  setNewBankBin: (val: string) => void;
  newBankAcc: string;
  setNewBankAcc: (val: string) => void;
  newBankNameStr: string;
  setNewBankNameStr: (val: string) => void;
  newZaloPayId: string;
  setNewZaloPayId: (val: string) => void;
  newHappyStart: string;
  setNewHappyStart: (val: string) => void;
  newHappyEnd: string;
  setNewHappyEnd: (val: string) => void;
  newAdminPinInput: string;
  setNewAdminPinInput: (val: string) => void;
  newTierConfig: { bronze: number, silver: number, gold: number, diamond: number };
  setNewTierConfig: (val: any) => void;
  saveSettings: () => void;
  loading: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings, setShowSettings, newBankBin, setNewBankBin, newBankAcc, setNewBankAcc,
  newBankNameStr, setNewBankNameStr, newZaloPayId, setNewZaloPayId,
  newHappyStart, setNewHappyStart, newHappyEnd, setNewHappyEnd,
  newAdminPinInput, setNewAdminPinInput, newTierConfig, setNewTierConfig,
  saveSettings, loading
}) => {
  if (!showSettings) return null;

  return (
    <div className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999 }} onClick={() => setShowSettings(false)}>
      <div style={{ background: "#ffffff", width: "550px", maxWidth: "95vw", maxHeight: "90vh", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <h2 style={{ margin: 0, color: "#3b82f6", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚙️</span> TÙY CHỈNH HỆ THỐNG
          </h2>
          <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}>&times;</button>
        </div>

        {/* BODY */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase" }}>1. Thông tin Nhận tiền (VietQR / Ví)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px", display: "block" }}>NGÂN HÀNG / VÍ</label>
                <select value={newBankBin || ""} onChange={e => setNewBankBin(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }}>
                  <option value="">-- Chọn Ngân Hàng / Ví --</option>
                  <optgroup label="Ngân Hàng Phổ Biến">
                    <option value="970436">Vietcombank</option>
                    <option value="970415">VietinBank</option>
                    <option value="970418">BIDV</option>
                    <option value="970405">Agribank</option>
                    <option value="970407">Techcombank</option>
                    <option value="970422">MBBank</option>
                    <option value="970416">ACB</option>
                  </optgroup>
                  <optgroup label="Ví Điện Tử">
                    <option value="970490">Viettel Money</option>
                    <option value="MOMO">Ví MoMo</option>
                    <option value="ZALOPAY">Ví ZaloPay</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px", display: "block" }}>SỐ TÀI KHOẢN</label>
                <input placeholder="VD: 1048...001" value={newBankAcc || ""} onChange={e => setNewBankAcc(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px", display: "block" }}>TÊN CHỦ TÀI KHOẢN</label>
              <input placeholder="VD: NGUYEN VAN A" value={newBankNameStr || ""} onChange={e => setNewBankNameStr(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase" }}>2. Thiết lập Giờ Vàng (Giảm 20%)</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px", display: "block" }}>BẮT ĐẦU</label>
                <input type="time" value={newHappyStart || ""} onChange={e => setNewHappyStart(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px", display: "block" }}>KẾT THÚC</label>
                <input type="time" value={newHappyEnd || ""} onChange={e => setNewHappyEnd(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "10px", border: "1px solid #fecaca" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#be123c", textTransform: "uppercase" }}>3. Bảo Mật</h3>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#e11d48", marginBottom: "4px", display: "block" }}>MÃ PIN QUẢN LÝ (Giao ca, Trả hàng)</label>
              <input type="text" placeholder="4 chữ số (Mặc định: 1234)" value={newAdminPinInput || ""} onChange={e => setNewAdminPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "2px solid #fda4af", outline: "none", letterSpacing: "2px", fontWeight: "bold", textAlign: "center", boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ background: "#f5f3ff", padding: "16px", borderRadius: "10px", border: "1px solid #ddd6fe" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6d28d9", textTransform: "uppercase" }}>4. Khung Tích Lũy Xếp Hạng (VND)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#6d28d9", marginBottom: "4px", display: "block" }}>HẠNG ĐỒNG</label>
                <input type="text" value={newTierConfig.bronze.toLocaleString()} onChange={e => setNewTierConfig({...newTierConfig, bronze: Number(e.target.value.replace(/[^0-9]/g, '')) || 0})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd6fe", outline: "none", boxSizing: "border-box", fontWeight: "bold" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#6d28d9", marginBottom: "4px", display: "block" }}>HẠNG BẠC</label>
                <input type="text" value={newTierConfig.silver.toLocaleString()} onChange={e => setNewTierConfig({...newTierConfig, silver: Number(e.target.value.replace(/[^0-9]/g, '')) || 0})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd6fe", outline: "none", boxSizing: "border-box", fontWeight: "bold" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#6d28d9", marginBottom: "4px", display: "block" }}>HẠNG VÀNG</label>
                <input type="text" value={newTierConfig.gold.toLocaleString()} onChange={e => setNewTierConfig({...newTierConfig, gold: Number(e.target.value.replace(/[^0-9]/g, '')) || 0})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd6fe", outline: "none", boxSizing: "border-box", fontWeight: "bold", color: "#d97706" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#6d28d9", marginBottom: "4px", display: "block" }}>HẠNG KIM CƯƠNG</label>
                <input type="text" value={newTierConfig.diamond.toLocaleString()} onChange={e => setNewTierConfig({...newTierConfig, diamond: Number(e.target.value.replace(/[^0-9]/g, '')) || 0})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd6fe", outline: "none", boxSizing: "border-box", fontWeight: "bold", color: "#db2777" }} />
              </div>
            </div>
          </div>

        </div>

        {/* NÚT LƯU */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", background: "#f1f5f9" }}>
          <button onClick={() => setShowSettings(false)} style={{ flex: 1, padding: "12px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>HỦY</button>
          <button onClick={saveSettings} disabled={loading} style={{ flex: 2, padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "ĐANG LƯU..." : "💾 LƯU THAY ĐỔI"}</button>
        </div>
      </div>
    </div>
  );
};
