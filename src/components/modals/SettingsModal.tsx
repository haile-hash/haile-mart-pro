import React from 'react';
import { toast } from 'react-hot-toast';

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
  saveSettings: () => void;
  loading: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings,
  setShowSettings,
  newBankBin,
  setNewBankBin,
  newBankAcc,
  setNewBankAcc,
  newBankNameStr,
  setNewBankNameStr,
  newZaloPayId,
  setNewZaloPayId,
  newHappyStart,
  setNewHappyStart,
  newHappyEnd,
  setNewHappyEnd,
  newAdminPinInput,
  setNewAdminPinInput,
  saveSettings,
  loading
}) => {
  if (!showSettings) return null;

  return (
    <div 
      className="no-print custom-modal-overlay" 
      onClick={() => setShowSettings(false)}
    >
      <div 
        className="custom-modal-box" 
        style={{ width: "500px", maxWidth: "95vw" }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="custom-modal-header">
          <h2 className="custom-modal-title" style={{ color: "#3b82f6", display: "flex", alignItems: "center", gap: "8px" }}>
            <span role="img" aria-label="settings">⚙️</span> TÙY CHỈNH HỆ THỐNG
          </h2>
          <button className="custom-modal-close" onClick={() => setShowSettings(false)}>&times;</button>
        </div>

        <div className="custom-modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase" }}>1. Thông tin Nhận tiền (VietQR)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label className="custom-label">MÃ NGÂN HÀNG (BIN)</label>
                <input className="custom-input" placeholder="VD: 970415 (Vietinbank)" value={newBankBin || ""} onChange={e => setNewBankBin(e.target.value)} />
              </div>
              <div>
                <label className="custom-label">SỐ TÀI KHOẢN</label>
                <input className="custom-input" placeholder="VD: 1048...001" value={newBankAcc || ""} onChange={e => setNewBankAcc(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="custom-label">TÊN CHỦ TÀI KHOẢN</label>
              <input className="custom-input" placeholder="VD: NGUYEN VAN A" value={newBankNameStr || ""} onChange={e => setNewBankNameStr(e.target.value)} />
            </div>
            <div style={{ marginTop: "10px" }}>
              <label className="custom-label">SỐ ĐIỆN THOẠI ZALOPAY (Tùy chọn)</label>
              <input className="custom-input" placeholder="SĐT đăng ký ZaloPay" value={newZaloPayId || ""} onChange={e => setNewZaloPayId(e.target.value)} />
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase" }}>2. Thiết lập Giờ Vàng (Giảm 20%)</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label className="custom-label">BẮT ĐẦU</label>
                <input type="time" className="custom-input" value={newHappyStart || ""} onChange={e => setNewHappyStart(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="custom-label">KẾT THÚC</label>
                <input type="time" className="custom-input" value={newHappyEnd || ""} onChange={e => setNewHappyEnd(e.target.value)} />
              </div>
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>* Chỉ áp dụng tự động cho danh mục "Đồ ăn liền" và "Bánh Kẹo".</p>
          </div>

          <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "10px", border: "1px solid #fecaca" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#be123c", textTransform: "uppercase" }}>3. Bảo Mật</h3>
            <div>
              <label className="custom-label" style={{ color: "#e11d48" }}>MÃ PIN QUẢN LÝ (Giao ca, Trả hàng)</label>
              <input 
                type="text" 
                className="custom-input" 
                placeholder="4 chữ số (Mặc định: 1234)" 
                value={newAdminPinInput || ""} 
                onChange={e => setNewAdminPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                style={{ borderColor: "#fda4af", letterSpacing: "2px", fontWeight: "bold", textAlign: "center" }}
              />
            </div>
          </div>

        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", background: "#f8fafc" }}>
          <button 
            onClick={() => setShowSettings(false)} 
            style={{ flex: 1, padding: "12px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}
            onMouseOver={e => e.currentTarget.style.background = "#cbd5e1"}
            onMouseOut={e => e.currentTarget.style.background = "#e2e8f0"}
          >
            HỦY
          </button>
          <button 
            onClick={saveSettings} 
            disabled={loading} 
            style={{ flex: 2, padding: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 6px rgba(59,130,246,0.3)", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "ĐANG LƯU..." : "LƯU THIẾT LẬP"}
          </button>
        </div>
      </div>
    </div>
  );
};
