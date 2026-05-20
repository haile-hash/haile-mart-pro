// @ts-nocheck
import React from "react";

export const SettingsModal = ({
  showSettings, setShowSettings,
  newBankBin, setNewBankBin,
  newBankAcc, setNewBankAcc,
  newBankNameStr, setNewBankNameStr,
  saveSettings
}) => {
  if (!showSettings) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div className="glass" style={{ padding: "25px", width: "450px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "#334155" }}>⚙️ CÀI ĐẶT</h2>
          <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          <div style={{ fontSize: "13px", padding: "10px", background: "#fef2f2", color: "#b91c1c", border: "1px dashed #fca5a5", borderRadius: "6px", marginBottom: "15px" }}>
            🔒 <b>Bảo mật:</b> Mật khẩu người dùng hiện được quản lý trực tiếp qua hệ thống xác thực Supabase Auth. Vui lòng truy cập trang quản trị Supabase để thêm/đổi mật khẩu.
          </div>

          <h3 style={{ fontSize: "14px", color: "#10b981", borderBottom: "1px dashed #10b981", paddingBottom: "4px" }}>2. QR THANH TOÁN</h3>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Ngân hàng:</label>
            <select value={newBankBin} onChange={e => setNewBankBin(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }}>
              <option value="970422">MBBank</option><option value="970436">Vietcombank</option><option value="970407">Techcombank</option><option value="970415">VietinBank</option><option value="970418">BIDV</option><option value="970405">Agribank</option><option value="970416">ACB</option><option value="970432">VPBank</option><option value="970423">TPBank</option><option value="970403">Sacombank</option><option value="970441">VIB</option><option value="970443">SHB</option><option value="970431">Eximbank</option><option value="970426">MSB</option><option value="970437">HDBank</option><option value="970428">Nam A Bank</option><option value="970412">PVcomBank</option><option value="970414">OceanBank</option><option value="970433">Vietbank</option>
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Số tài khoản:</label>
            <input value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Tên chủ thẻ:</label>
            <input value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value.toUpperCase())} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }} />
          </div>
          <button onClick={saveSettings} style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>💾 LƯU CÀI ĐẶT</button>
        </div>
      </div>
    </div>
  );
};
