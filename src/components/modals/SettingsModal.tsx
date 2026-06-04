/* eslint-disable */
// @ts-nocheck
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
  newHappyDiscount: number;
  setNewHappyDiscount: (val: number) => void;
  newAdminPinInput: string;
  setNewAdminPinInput: (val: string) => void;
  newTierConfig: any;
  setNewTierConfig: (val: any) => void;
  saveSettings: () => void;
  loading: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings, setShowSettings,
  newBankBin, setNewBankBin, newBankAcc, setNewBankAcc,
  newBankNameStr, setNewBankNameStr, newZaloPayId, setNewZaloPayId,
  newHappyStart, setNewHappyStart, newHappyEnd, setNewHappyEnd,
  newHappyDiscount, setNewHappyDiscount,
  newAdminPinInput, setNewAdminPinInput,
  newTierConfig, setNewTierConfig,
  saveSettings, loading
}) => {
  if (!showSettings) return null;

  // DANH SÁCH MÃ BIN CHUẨN NAPAS / VIETQR
  const TRADITIONAL_BANKS = [
    { bin: "970436", name: "Vietcombank (VCB)" },
    { bin: "970415", name: "VietinBank (CTG)" },
    { bin: "970418", name: "BIDV" },
    { bin: "970405", name: "Agribank" },
    { bin: "970407", name: "Techcombank (TCB)" },
    { bin: "970422", name: "MBBank (MB)" },
    { bin: "970416", name: "ACB" },
    { bin: "970432", name: "VPBank (VPB)" },
    { bin: "970423", name: "TPBank (TPB)" },
    { bin: "970403", name: "Sacombank (STB)" },
    { bin: "970437", name: "HDBank (HDB)" },
    { bin: "970441", name: "VIB" },
    { bin: "970424", name: "SHB" },
    { bin: "970431", name: "SeABank" },
    { bin: "970426", name: "MSB" },
    { bin: "970428", name: "Nam A Bank" },
    { bin: "970414", name: "OceanBank" },
    { bin: "970454", name: "Bản Việt (BVBank)" },
    { bin: "970412", name: "PVcomBank" },
    { bin: "970409", name: "Bac A Bank" },
    { bin: "970448", name: "OCB" },
    { bin: "970419", name: "NCB" },
    { bin: "970439", name: "PublicBank" },
    { bin: "970449", name: "LienVietPostBank" },
    { bin: "970452", name: "KienLongBank" }
  ];

  const E_WALLETS_AND_DIGITAL = [
    { bin: "970490", name: "Ví Viettel Money" },
    { bin: "970495", name: "Ví VNPT Money" },
    { bin: "546034", name: "Cake by VPBank" },
    { bin: "970450", name: "Timo" },
    { bin: "970425", name: "Ubank" },
    { bin: "970462", name: "KBank Vietnam" }
  ];

  const isKnownBin = TRADITIONAL_BANKS.find(b => b.bin === newBankBin) || E_WALLETS_AND_DIGITAL.find(b => b.bin === newBankBin);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999, backdropFilter: "blur(4px)" }} onClick={() => setShowSettings(false)}>
      <div style={{ background: "#fff", width: "700px", maxWidth: "95vw", maxHeight: "90vh", borderRadius: "20px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>⚙️</span> CÀI ĐẶT HỆ THỐNG
          </h2>
          <button onClick={() => setShowSettings(false)} style={{ background: "transparent", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }}>&times;</button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {/* 1. THIẾT LẬP THANH TOÁN */}
          <div style={{ marginBottom: "24px", background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase", fontWeight: "800" }}>1. TÀI KHOẢN NGÂN HÀNG (VIETQR)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>CHỌN NGÂN HÀNG / VÍ</label>
                <select 
                  value={newBankBin} 
                  onChange={e => setNewBankBin(e.target.value)} 
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", background: "#fff", cursor: "pointer" }}
                >
                  <option value="">-- Chọn ngân hàng hoặc ví --</option>
                  
                  <optgroup label="Ví Điện Tử & Ngân Hàng Số (Napas)">
                    {E_WALLETS_AND_DIGITAL.map(bank => (
                      <option key={bank.bin} value={bank.bin}>{bank.name}</option>
                    ))}
                  </optgroup>

                  <optgroup label="Ngân Hàng Truyền Thống">
                    {TRADITIONAL_BANKS.map(bank => (
                      <option key={bank.bin} value={bank.bin}>{bank.name}</option>
                    ))}
                  </optgroup>

                  {newBankBin && !isKnownBin && (
                    <option value={newBankBin}>Khác (BIN: {newBankBin})</option>
                  )}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>SỐ TÀI KHOẢN</label>
                <input type="text" value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} placeholder="VD: 1048...99" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>TÊN CHỦ TÀI KHOẢN</label>
                <input type="text" value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value)} placeholder="VD: NGUYEN VAN A" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", textTransform: "uppercase" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>SĐT VÍ MOMO / ZALOPAY (NẾU CÓ)</label>
                <input type="text" value={newZaloPayId} onChange={e => setNewZaloPayId(e.target.value)} placeholder="VD: 090..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          {/* 2. THIẾT LẬP GIỜ VÀNG */}
          <div style={{ marginBottom: "24px", background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase", fontWeight: "800" }}>2. THIẾT LẬP GIỜ VÀNG (HAPPY HOUR)</h3>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>BẮT ĐẦU</label>
                <input type="time" value={newHappyStart} onChange={e => setNewHappyStart(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>KẾT THÚC</label>
                <input type="time" value={newHappyEnd} onChange={e => setNewHappyEnd(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div style={{ width: "120px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>GIẢM (%)</label>
                <input 
                  type="number" 
                  value={newHappyDiscount === undefined ? "" : newHappyDiscount} 
                  onChange={e => setNewHappyDiscount(Number(e.target.value))} 
                  min="0" max="100" 
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "2px solid #fca5a5", textAlign: "right", color: "#ef4444", fontWeight: "900", background: "#fef2f2", boxSizing: "border-box" }} 
                />
              </div>
            </div>
          </div>

          {/* 3. THIẾT LẬP HẠNG MỨC VIP */}
          <div style={{ marginBottom: "24px", background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase", fontWeight: "800" }}>3. HẠNG MỨC VIP & CHIẾT KHẤU</h3>
            
            {/* KIM CƯƠNG */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px", alignItems: "center" }}>
              <div style={{ width: "110px", fontWeight: "bold", color: "#8b5cf6", fontSize: "14px" }}>💎 Kim Cương</div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>Chi tiêu tối thiểu (đ)</label>
                <input type="number" value={newTierConfig?.diamond || 0} onChange={e => setNewTierConfig({...newTierConfig, diamond: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div style={{ width: "100px" }}>
                <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>Giảm giá (%)</label>
                <input type="number" value={newTierConfig?.diamond_discount || 0} onChange={e => setNewTierConfig({...newTierConfig, diamond_discount: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", textAlign: "center" }} />
              </div>
            </div>

            {/* VÀNG */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px", alignItems: "center" }}>
              <div style={{ width: "110px", fontWeight: "bold", color: "#eab308", fontSize: "14px" }}>👑 Vàng</div>
              <div style={{ flex: 1 }}>
                <input type="number" value={newTierConfig?.gold || 0} onChange={e => setNewTierConfig({...newTierConfig, gold: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div style={{ width: "100px" }}>
                <input type="number" value={newTierConfig?.gold_discount || 0} onChange={e => setNewTierConfig({...newTierConfig, gold_discount: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", textAlign: "center" }} />
              </div>
            </div>

            {/* BẠC */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px", alignItems: "center" }}>
              <div style={{ width: "110px", fontWeight: "bold", color: "#94a3b8", fontSize: "14px" }}>🥈 Bạc</div>
              <div style={{ flex: 1 }}>
                <input type="number" value={newTierConfig?.silver || 0} onChange={e => setNewTierConfig({...newTierConfig, silver: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div style={{ width: "100px" }}>
                <input type="number" value={newTierConfig?.silver_discount || 0} onChange={e => setNewTierConfig({...newTierConfig, silver_discount: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", textAlign: "center" }} />
              </div>
            </div>

            {/* ĐỒNG */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ width: "110px", fontWeight: "bold", color: "#d97706", fontSize: "14px" }}>🥉 Đồng</div>
              <div style={{ flex: 1 }}>
                <input type="number" value={newTierConfig?.bronze || 0} onChange={e => setNewTierConfig({...newTierConfig, bronze: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
              </div>
              <div style={{ width: "100px" }}>
                <input type="number" value={newTierConfig?.bronze_discount || 0} onChange={e => setNewTierConfig({...newTierConfig, bronze_discount: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", textAlign: "center" }} />
              </div>
            </div>
          </div>

          {/* 4. THIẾT LẬP MÃ PIN QUẢN LÝ */}
          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#0f172a", textTransform: "uppercase", fontWeight: "800" }}>4. BẢO MẬT</h3>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "8px" }}>MÃ PIN QUẢN LÝ (MỞ KHÓA MÀN HÌNH / XÓA SỬA)</label>
              <input type="password" value={newAdminPinInput} onChange={e => setNewAdminPinInput(e.target.value)} placeholder="Nhập mã PIN số..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box", letterSpacing: "4px", fontWeight: "bold" }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px", borderTop: "1px solid #e2e8f0", background: "#ffffff", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={() => setShowSettings(false)} style={{ padding: "12px 20px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: "700", cursor: "pointer" }}>HỦY</button>
          <button onClick={saveSettings} disabled={loading} style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            {loading ? "ĐANG LƯU..." : "💾 LƯU CÀI ĐẶT"}
          </button>
        </div>

      </div>
    </div>
  );
};
