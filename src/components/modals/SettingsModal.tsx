import React from "react";

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

const BANK_AND_WALLET_LIST = [
  { group: "Ví Điện Tử Phổ Biến", items: [
    { name: "Ví MoMo", bin: "MOMO" },
    { name: "Ví ZaloPay", bin: "ZALOPAY" },
    { name: "Ví Viettel Money", bin: "VIETTELMONEY" },
    { name: "Ví ShopeePay", bin: "SHOPEEPAY" },
    { name: "Ví VNPay", bin: "VNPAY" }
  ]},
  { group: "Ngân Hàng Lớn (Big 4)", items: [
    { name: "Vietcombank (VCB)", bin: "970436" },
    { name: "VietinBank (CTG)", bin: "970415" },
    { name: "BIDV", bin: "970418" },
    { name: "Agribank", bin: "970405" }
  ]},
  { group: "Ngân Hàng Thương Mại Cổ Phần", items: [
    { name: "MBBank (Quân Đội)", bin: "970422" },
    { name: "Techcombank (TCB)", bin: "970403" },
    { name: "ACB (Á Châu)", bin: "970416" },
    { name: "VPBank", bin: "970432" },
    { name: "Sacombank", bin: "970403" },
    { name: "HDBank", bin: "970437" },
    { name: "SHB", bin: "970443" },
    { name: "VIB (Quốc Tế)", bin: "970441" },
    { name: "TPBank (Tiên Phong)", bin: "970423" },
    { name: "MSB (Hàng Hải)", bin: "970426" },
    { name: "SeABank", bin: "970440" },
    { name: "LienVietPostBank (LPBank)", bin: "970449" },
    { name: "Eximbank", bin: "970431" },
    { name: "OCB (Phương Đông)", bin: "970448" },
    { name: "BAC A BANK", bin: "970409" },
    { name: "PVcomBank", bin: "970412" },
    { name: "Đông Á Bank (DAB)", bin: "970406" },
    { name: "Nam A Bank", bin: "970428" },
    { name: "NCB (Quốc Dân)", bin: "970419" },
    { name: "BVBank (Bản Việt)", bin: "970454" },
    { name: "VietBank", bin: "970442" },
    { name: "VietCapitalBank", bin: "970454" },
    { name: "Saigonbank", bin: "970400" },
    { name: "Kiên Long Bank", bin: "970452" },
    { name: "PG Bank", bin: "970430" },
    { name: "OceanBank", bin: "970408" },
    { name: "GPBank", bin: "970408" },
    { name: "SCB (Sài Gòn)", bin: "970429" }
  ]},
  { group: "Ngân Hàng Số & Ngoại Lai", items: [
    { name: "Cake by VPBank", bin: "546034" },
    { name: "Timo Digital Bank", bin: "963388" },
    { name: "HSBC Việt Nam", bin: "970447" },
    { name: "Standard Chartered", bin: "970410" },
    { name: "Shinhan Bank Việt Nam", bin: "970424" },
    { name: "Woori Bank Việt Nam", bin: "970457" },
    { name: "UOB Việt Nam", bin: "970458" },
    { name: "CIMB Việt Nam", bin: "422589" }
  ]}
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings, setShowSettings, newBankBin, setNewBankBin,
  newBankAcc, setNewBankAcc, newBankNameStr, setNewBankNameStr,
  newHappyStart, setNewHappyStart, newHappyEnd, setNewHappyEnd,
  newAdminPinInput, setNewAdminPinInput, saveSettings
}) => {
  if (!showSettings) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', 
        alignItems: 'center', justifyContent: 'center', 
        background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' 
      }}
      onClick={() => setShowSettings(false)}
    >
      <div 
        style={{ 
          background: '#f8fafc', borderRadius: '12px', width: '550px', 
          maxWidth: '95vw', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
          overflow: 'hidden', border: '1px solid #e2e8f0' 
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            ⚙ CÀI ĐẶT HỆ THỐNG
          </h2>
          <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
        </div>

        <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Thông tin thanh toán */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              🏦 Thông tin thanh toán (QR Code)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontSize: '14px', fontWeight: '500', flexShrink: 0 }}>Ngân Hàng / Ví:</span>
                <select 
                  value={newBankBin || ""} 
                  onChange={e => setNewBankBin(e.target.value)} 
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#fff' }}
                >
                  <option value="">-- Chọn ngân hàng hoặc ví --</option>
                  {(BANK_AND_WALLET_LIST || []).map((group, idx) => (
                    <optgroup key={idx} label={group?.group}>
                      {(group?.items || []).map((b, bIdx) => (
                        <option key={bIdx} value={b?.bin}>{b?.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontSize: '14px', fontWeight: '500', flexShrink: 0 }}>Số Tài Khoản:</span>
                <input type="text" value={newBankAcc || ""} onChange={e => setNewBankAcc(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="VD: 0680124181004" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontSize: '14px', fontWeight: '500', flexShrink: 0 }}>Tên Chủ TK:</span>
                <input type="text" value={newBankNameStr || ""} onChange={e => setNewBankNameStr(e.target.value.toUpperCase())} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} placeholder="VD: LE HONG HAI" />
              </div>
            </div>
          </div>

          {/* Giờ vàng */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              ⏱ Giờ Vàng (Happy Hour)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Bắt đầu:</span>
                <input type="time" value={newHappyStart || "11:00"} onChange={e => setNewHappyStart(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Kết thúc:</span>
                <input type="time" value={newHappyEnd || "13:00"} onChange={e => setNewHappyEnd(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
              </div>
            </div>
          </div>

          {/* Đổi mã PIN */}
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', padding: '15px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c' }}>
              🔒 Đổi mã PIN Quản lý
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 'bold' }}>Mã PIN xác thực & Mở khóa màn hình:</span>
              <input type="text" value={newAdminPinInput || ""} onChange={e => setNewAdminPinInput(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #fca5a5', width: '200px', fontSize: '18px', letterSpacing: '4px', fontWeight: 'bold', textAlign: 'center' }} placeholder="****" />
              <span style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic' }}>* Lưu ý: Khi mất mạng, mã sơ cua (Backdoor) luôn là <b>0000</b>.</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '15px 20px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => setShowSettings(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '500' }}>Hủy</button>
          <button onClick={saveSettings} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>LƯU CÀI ĐẶT</button>
        </div>
      </div>
    </div>
  );
};
