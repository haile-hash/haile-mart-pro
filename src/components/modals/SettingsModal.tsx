import React, { useState } from "react";

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  newBankBin: string;
  setNewBankBin: (val: string) => void;
  newBankAcc: string;
  setNewBankAcc: (val: string) => void;
  newBankNameStr: string;
  setNewBankNameStr: (val: string) => void;
  newHappyStart: string;
  setNewHappyStart: (val: string) => void;
  newHappyEnd: string;
  setNewHappyEnd: (val: string) => void;
  newAdminPinInput: string;
  setNewAdminPinInput: (val: string) => void;
  saveSettings: () => void;
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
  newHappyStart,
  setNewHappyStart,
  newHappyEnd,
  setNewHappyEnd,
  newAdminPinInput,
  setNewAdminPinInput,
  saveSettings,
}) => {
  // State quản lý việc ẩn/hiện mật khẩu (Con mắt)
  const [showPin, setShowPin] = useState(false);

  if (!showSettings) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, color: '#1e293b' }}>⚙️ CÀI ĐẶT HỆ THỐNG</h3>
          <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>🏦 Thông tin thanh toán (QR Code)</h4>
            <div className="form-group">
              <label>Mã Ngân Hàng (BIN):</label>
              <input type="text" className="modal-input" value={newBankBin} onChange={e => setNewBankBin(e.target.value)} placeholder="Ví dụ: 970422 (MB Bank)" />
            </div>
            <div className="form-group">
              <label>Số Tài Khoản:</label>
              <input type="text" className="modal-input" value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} placeholder="Nhập số tài khoản" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tên Chủ Tài Khoản:</label>
              <input type="text" className="modal-input" value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value)} placeholder="Viết hoa không dấu" />
            </div>
          </div>

          <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>⏱️ Giờ Vàng (Happy Hour)</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Bắt đầu (HH:MM):</label>
                <input type="time" className="modal-input" value={newHappyStart} onChange={e => setNewHappyStart(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Kết thúc (HH:MM):</label>
                <input type="time" className="modal-input" value={newHappyEnd} onChange={e => setNewHappyEnd(e.target.value)} />
              </div>
            </div>
          </div>

          {/* KHU VỰC ĐỔI MÃ PIN ĐƯỢC BẢO MẬT */}
          <div style={{ padding: '15px', border: '1px solid #ef4444', borderRadius: '8px', background: '#fef2f2' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>🔒 Đổi mã PIN Quản lý</h4>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: '#991b1b' }}>Mã PIN xác thực & Mở khóa màn hình:</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPin ? "text" : "password"} 
                  className="modal-input" 
                  value={newAdminPinInput} 
                  onChange={e => setNewAdminPinInput(e.target.value)} 
                  placeholder="Nhập mã PIN mới (VD: 8888)" 
                  maxLength={10}
                  style={{ paddingRight: '40px', letterSpacing: showPin ? 'normal' : '5px', fontWeight: 'bold' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                  title={showPin ? "Ẩn mã PIN" : "Hiện mã PIN"}
                >
                  {showPin ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <small style={{ color: '#ef4444', display: 'block', marginTop: '5px' }}>
              * Lưu ý: Khi mất mạng, mã sơ cua (Backdoor) luôn là <b>0000</b>.
            </small>
          </div>

        </div>

        <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button className="btn-cancel" onClick={() => setShowSettings(false)}>Hủy</button>
          <button className="btn-confirm" onClick={saveSettings} style={{ background: '#10b981' }}>LƯU CÀI ĐẶT</button>
        </div>
      </div>
    </div>
  );
};
