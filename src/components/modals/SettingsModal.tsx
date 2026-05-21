import React from 'react';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  newBankBin: string; setNewBankBin: (val: string) => void;
  newBankAcc: string; setNewBankAcc: (val: string) => void;
  newBankNameStr: string; setNewBankNameStr: (val: string) => void;
  newHappyStart: string; setNewHappyStart: (val: string) => void;
  newHappyEnd: string; setNewHappyEnd: (val: string) => void;
  saveSettings: () => void;
}

// Danh sách các ngân hàng phổ biến (Mã BIN NAPAS)
const BANK_LIST = [
  { bin: "970422", name: "MBBank (MB)" },
  { bin: "970436", name: "Vietcombank (VCB)" },
  { bin: "970415", name: "VietinBank (CTG)" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank (VBA)" },
  { bin: "970432", name: "VPBank (VPB)" },
  { bin: "970423", name: "TPBank (TPB)" },
  { bin: "970403", name: "Sacombank (STB)" },
  { bin: "970416", name: "ACB" },
  { bin: "970441", name: "VIB" },
  { bin: "970428", name: "SHB" },
  { bin: "970431", name: "Eximbank (EIB)" },
  { bin: "970426", name: "MSB" },
  { bin: "970409", name: "BacABank (BVB)" },
  { bin: "970443", name: "SHBVN" }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings, setShowSettings,
  newBankBin, setNewBankBin, newBankAcc, setNewBankAcc, newBankNameStr, setNewBankNameStr,
  newHappyStart, setNewHappyStart, newHappyEnd, setNewHappyEnd,
  saveSettings
}) => {
  if (!showSettings) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowSettings(false)}>
      <div className="glass" style={{ padding: "25px", width: "450px", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#4f46e5" }}>⚙️ CÀI ĐẶT HỆ THỐNG</h2>
          <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>
        
        {/* KHU VỰC NGÂN HÀNG ĐÃ ĐƯỢC KHÔI PHỤC DROPDOWN */}
        <div style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", marginBottom: "15px", border: "1px dashed var(--border-glass)" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#e11d48" }}>🏦 TÀI KHOẢN NHẬN TIỀN (VIETQR)</h3>
          
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ngân hàng:</label>
            <select 
              value={newBankBin} 
              onChange={e => setNewBankBin(e.target.value)} 
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none", background: "var(--bg-main)", color: "var(--text-main)" }}
            >
              <option value="">-- Chọn ngân hàng --</option>
              {BANK_LIST.map(bank => (
                <option key={bank.bin} value={bank.bin}>{bank.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Số Tài Khoản:</label>
            <input type="text" value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none" }} />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Tên Chủ Thẻ:</label>
            <input type="text" value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none", textTransform: "uppercase" }} />
          </div>
        </div>

        {/* KHU VỰC CÀI ĐẶT GIỜ VÀNG */}
        <div style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px dashed var(--border-glass)" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#f59e0b" }}>⏰ TỰ ĐỘNG GIỜ VÀNG (HAPPY HOUR)</h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>Trong khung giờ này, các SP có Giá KM sẽ tự động được áp dụng mà không cần bấm thủ công.</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Giờ bắt đầu:</label>
              <input type="time" value={newHappyStart} onChange={e => setNewHappyStart(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Giờ kết thúc:</label>
              <input type="time" value={newHappyEnd} onChange={e => setNewHappyEnd(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none" }} />
            </div>
          </div>
        </div>

        <button onClick={saveSettings} style={{ width: "100%", padding: "12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>💾 LƯU CÀI ĐẶT LÊN MÂY</button>
      </div>
    </div>
  );
};
