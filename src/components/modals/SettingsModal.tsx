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

// Danh sách đầy đủ 50+ Ngân hàng chuẩn NAPAS/VietQR
const BANK_LIST = [
  { bin: "970436", name: "Vietcombank (VCB)" },
  { bin: "970415", name: "VietinBank (CTG)" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank (VBA)" },
  { bin: "970422", name: "MBBank (MB)" },
  { bin: "970407", name: "Techcombank (TCB)" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank (VPB)" },
  { bin: "970423", name: "TPBank (TPB)" },
  { bin: "970403", name: "Sacombank (STB)" },
  { bin: "970437", name: "HDBank (HDB)" },
  { bin: "970441", name: "VIB" },
  { bin: "970443", name: "SHB" },
  { bin: "970431", name: "Eximbank (EIB)" },
  { bin: "970426", name: "MSB" },
  { bin: "970448", name: "OCB" },
  { bin: "970449", name: "LPBank (LienVietPostBank)" },
  { bin: "970425", name: "ABBANK" },
  { bin: "970428", name: "Nam A Bank (NAB)" },
  { bin: "970454", name: "BVBank (Bản Việt / VCCB)" },
  { bin: "970429", name: "SCB" },
  { bin: "970412", name: "PVcomBank (PVCB)" },
  { bin: "970438", name: "BaoVietBank (BVB)" },
  { bin: "970452", name: "KienLongBank (KLB)" },
  { bin: "970409", name: "BacABank (BAB)" },
  { bin: "970433", name: "VietBank (VBB)" },
  { bin: "970427", name: "VietABank (VAB)" },
  { bin: "970419", name: "NCB" },
  { bin: "970406", name: "DongA Bank (DAB)" },
  { bin: "970400", name: "SaigonBank (SGB)" },
  { bin: "970414", name: "Oceanbank" },
  { bin: "970444", name: "CBBank" },
  { bin: "970408", name: "GPBank" },
  { bin: "970446", name: "Co-opBank" },
  { bin: "970424", name: "Shinhan Bank (SVB)" },
  { bin: "970457", name: "Woori Bank" },
  { bin: "970442", name: "Hong Leong Bank" },
  { bin: "970439", name: "Public Bank" },
  { bin: "970434", name: "Indovina Bank (IVB)" },
  { bin: "422589", name: "CIMB Bank" },
  { bin: "970455", name: "IBK Bank" },
  { bin: "970462", name: "Kookmin Bank" },
  { bin: "668888", name: "KBank (Kasikornbank)" },
  { bin: "546034", name: "CAKE by VPBank" },
  { bin: "546035", name: "Ubank by VPBank" },
  { bin: "963388", name: "Timo by Bản Việt" },
  { bin: "971005", name: "Viettel Money" },
  { bin: "971011", name: "VNPT Money" },
  { bin: "971025", name: "Ví MoMo" },
  { bin: "971133", name: "PVcomBank Pay" }
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
        
        <div style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", marginBottom: "15px", border: "1px dashed var(--border-glass)" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#e11d48" }}>🏦 TÀI KHOẢN NHẬN TIỀN (VIETQR)</h3>
          
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ngân hàng / Ví điện tử:</label>
            <select 
              value={newBankBin} 
              onChange={e => setNewBankBin(e.target.value)} 
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none", background: "var(--bg-main)", color: "var(--text-main)", cursor: "pointer" }}
            >
              <option value="">-- Kéo xuống để chọn ngân hàng --</option>
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
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Tên Chủ Tài Khoản:</label>
            <input type="text" value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none", textTransform: "uppercase" }} />
          </div>
        </div>

        <div style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px dashed var(--border-glass)" }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#f59e0b" }}>⏰ TỰ ĐỘNG GIỜ VÀNG (HAPPY HOUR)</h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>Trong khung giờ này, các SP có Giá KM sẽ tự động được áp dụng mà không cần bấm thủ công.</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Giờ bắt đầu:</label>
              <input type="time" value={newHappyStart} onChange={e => setNewHappyStart(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none", cursor: "pointer" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Giờ kết thúc:</label>
              <input type="time" value={newHappyEnd} onChange={e => setNewHappyEnd(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-glass)", outline: "none", cursor: "pointer" }} />
            </div>
          </div>
        </div>

        <button onClick={saveSettings} style={{ width: "100%", padding: "12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", transition: "transform 0.1s" }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>💾 LƯU CÀI ĐẶT LÊN MÂY</button>
      </div>
    </div>
  );
};
