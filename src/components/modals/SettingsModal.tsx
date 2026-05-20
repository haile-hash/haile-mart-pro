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
  <option value="970422">MBBank (MB)</option>
  <option value="970436">Vietcombank (VCB)</option>
  <option value="970415">VietinBank (CTG)</option>
  <option value="970418">BIDV</option>
  <option value="970405">Agribank (VBA)</option>
  <option value="970407">Techcombank (TCB)</option>
  <option value="970416">ACB</option>
  <option value="970432">VPBank (VPB)</option>
  <option value="970423">TPBank (TPB)</option>
  <option value="970403">Sacombank (STB)</option>
  <option value="970441">VIB</option>
  <option value="970443">SHB</option>
  <option value="970431">Eximbank (EIB)</option>
  <option value="970426">MSB</option>
  <option value="970437">HDBank (HDB)</option>
  <option value="970449">LienVietPostBank (LPB)</option>
  <option value="970448">OCB</option>
  <option value="970440">SeABank (SSB)</option>
  <option value="970406">DongA Bank (DAB)</option>
  <option value="970409">Bac A Bank (BAB)</option>
  <option value="970429">SCB</option>
  <option value="970452">Kienlongbank (KLB)</option>
  <option value="970428">Nam A Bank (NAB)</option>
  <option value="970427">VietABank (VAB)</option>
  <option value="970419">NCB</option>
  <option value="970438">BaoViet Bank (BVB)</option>
  <option value="970412">PVcomBank (PVCB)</option>
  <option value="970414">OceanBank (OJB)</option>
  <option value="970433">Vietbank (VBB)</option>
  <option value="970446">COOPBANK</option>
  <option value="970400">Saigonbank (SGB)</option>
  <option value="970430">PG Bank (PGB)</option>
  <option value="970454">Bản Việt (BVBank)</option>
  <option value="970458">United Overseas Bank (UOB)</option>
  <option value="970410">Standard Chartered (SCVN)</option>
  <option value="970455">IBK (Hàn Quốc)</option>
  <option value="970456">VRB (Việt Nga)</option>
  <option value="546034">CAKE by VPBank</option>
  <option value="546035">Ubank by VPBank</option>
  <option value="963388">Timo by Bản Việt</option>
  <option value="970490">Viettel Money</option>
  <option value="970495">VNPT Money</option>
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
