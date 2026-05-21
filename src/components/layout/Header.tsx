import React, { useState, useRef, useEffect } from 'react';

// 1. COMPONENT ĐỒNG HỒ
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-input)", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-glass)", fontFamily: "monospace" }}>
      <span style={{ fontSize: "14px" }}>⏱️</span> {time.toLocaleTimeString('vi-VN')} - {time.toLocaleDateString('vi-VN')}
    </div>
  );
};

// 2. INTERFACE ĐỊNH NGHĨA
interface HeaderProps {
  role: string;
  shift: string;
  totalValue: number;
  currentShiftStats: { cash: number; transfer: number; prof: number };
  setCashFlowModalInfo: (info: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  handleLogoutClick: () => void;
  
  showMainMenu: boolean;
  setShowMainMenu: (val: boolean) => void;
  
  setShowStatsModal: (val: boolean) => void;
  setShowCustomerModal: (val: boolean) => void;
  setShowInventoryModal: (val: boolean) => void;
  setShowDebtModal: (val: boolean) => void;
  setShowAuditModal: (val: boolean) => void;
  setShowExpenseModal: (val: boolean) => void;
  setShowSupplierModal: (val: boolean) => void;
  setShowMarketingModal: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
  
  setNewBankBin: (val: string) => void;
  setNewBankAcc: (val: string) => void;
  setNewBankNameStr: (val: string) => void;
  bankBin: string;
  bankAcc: string;
  bankNameStr: string;
  
  lowStockCount: number;
  isOnline: boolean;
  syncStatus: string;
  syncAllOfflineData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role, shift, totalValue, currentShiftStats, setCashFlowModalInfo,
  darkMode, setDarkMode, handleLogoutClick,
  showMainMenu, setShowMainMenu,
  setShowStatsModal, setShowCustomerModal, setShowInventoryModal,
  setShowDebtModal, setShowAuditModal, setShowExpenseModal,
  setShowSupplierModal, setShowMarketingModal, setShowSettings,
  setNewBankBin, setNewBankAcc, setNewBankNameStr,
  bankBin, bankAcc, bankNameStr,
  lowStockCount, isOnline, syncStatus, syncAllOfflineData
}) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement>(null);

  // 3. COMPONENT TRẠNG THÁI CLOUD
  const CloudStatusBadge = () => {
    if (!isOnline) return (<div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fef2f2", padding: "6px 12px", borderRadius: "6px", border: "1px solid #fca5a5", color: "#ef4444" }}><span style={{ height: "8px", width: "8px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span> Mất mạng (Lưu Offline)</div>);
    if (syncStatus === 'syncing') return (<div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#eff6ff", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bfdbfe", color: "#3b82f6" }}><span style={{ height: "8px", width: "8px", background: "#3b82f6", borderRadius: "50%", display: "inline-block", animation: "pulse-fast 1s infinite" }}></span> Đang đồng bộ mây...</div>);
    if (syncStatus === 'error') return (<div onClick={syncAllOfflineData} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff7ed", padding: "6px 12px", borderRadius: "6px", border: "1px solid #fed7aa", color: "#ea580c", cursor: "pointer" }} title="Bấm để thử lại"><span style={{ height: "8px", width: "8px", background: "#ea580c", borderRadius: "50%", display: "inline-block" }}></span> Lỗi Đám mây 🔄</div>);
    return (<div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ecfdf5", padding: "6px 12px", borderRadius: "6px", border: "1px solid #a7f3d0", color: "#059669" }}><span style={{ height: "8px", width: "8px", background: "#10b981", borderRadius: "50%", display: "inline-block" }}></span> Đã lưu Đám Mây</div>);
  };

  return (
    <div className="glass" style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px", borderBottom: "4px solid #ef4444" }}>
      
      {/* Thẻ audio ẩn chứa nhạc nền */}
      <audio ref={bgMusicRef} loop src="/Windy Hill.mp3" preload="auto" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* LOGO & NÚT PHÁT NHẠC */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div 
            className="logo-icon" 
            onClick={() => {
              if (isMusicPlaying) { bgMusicRef.current?.pause(); } 
              else { bgMusicRef.current?.play().catch(e => console.log("Lỗi:", e)); }
              setIsMusicPlaying(!isMusicPlaying);
            }}
            style={{ cursor: "pointer", position: "relative", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title={isMusicPlaying ? "Tắt nhạc" : "Bật nhạc Chill"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            {isMusicPlaying && <span style={{ position: "absolute", top: "-10px", right: "-10px", fontSize: "14px", animation: "spin 3s linear infinite" }}>🎵</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", letterSpacing: "0.5px", color: "var(--text-main)", lineHeight: "1", whiteSpace: "nowrap" }}>
              {/* ĐÃ FIX TS2569 BẰNG .split("") */}
              {"HẢI LÊ ".split("").map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${i * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}
              <span style={{ color: "#dc2626" }}>{"MART".split("").map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${(i + 7) * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}</span>
            </h1>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", marginTop: "4px", whiteSpace: "nowrap" }}>
              {/* ĐÃ FIX TS2569 BẰNG .split("") */}
              {"ERP System".split("").map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${(i + 11) * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}
            </div>
          </div>
        </div>

        {/* CÁC THÔNG SỐ VÀ NÚT ĐIỀU KHIỂN BÊN PHẢI */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {(new Date().getHours() >= 20 || new Date().getHours() < 6) && <span style={{ fontSize: "11px", background: "#fef08a", color: "#b45309", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>🌙 HAPPY HOUR</span>}
          <div style={{ width: "2px", height: "30px", background: "var(--border-glass)" }}></div>
          
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>VỐN</div><div style={{ fontSize: "15px", fontWeight: "900", color: "var(--text-main)" }}>{totalValue.toLocaleString()}đ</div></div>}
            <div className="cash-box" onClick={(e) => { e.stopPropagation(); setCashFlowModalInfo('TIỀN MẶT'); }} style={{ textAlign: "center", whiteSpace: "nowrap", cursor: "pointer" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>TIỀN MẶT 👆</div><div style={{ fontSize: "15px", fontWeight: "900", color: currentShiftStats.cash < 0 ? "#ef4444" : "#059669" }}>{currentShiftStats.cash.toLocaleString()}đ</div></div>
            <div className="cash-box" onClick={(e) => { e.stopPropagation(); setCashFlowModalInfo('CHUYỂN KHOẢN'); }} style={{ textAlign: "center", whiteSpace: "nowrap", cursor: "pointer" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>CHUYỂN KHOẢN 👆</div><div style={{ fontSize: "15px", fontWeight: "900", color: "#3b82f6" }}>{currentShiftStats.transfer.toLocaleString()}đ</div></div>
            {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>LÃI</div><div style={{ fontSize: "15px", fontWeight: "900", color: currentShiftStats.prof < 0 ? "#ef4444" : "#ea580c" }}>{currentShiftStats.prof.toLocaleString()}đ</div></div>}
          </div>
          
          <div style={{ width: "2px", height: "30px", background: "var(--border-glass)" }}></div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }} title="Bật/tắt Giao diện tối">{darkMode ? "☀️" : "🌙"}</button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right", lineHeight: "1.2", whiteSpace: "nowrap" }}><div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-main)" }}>{role === 'admin' ? "Quản lý" : "Thu ngân"}</div><div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{shift}</div></div>
            <button onClick={handleLogoutClick} style={{ padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Đăng xuất"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg></button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderTop: "1px dashed var(--border-glass)", paddingTop: "12px", alignItems: "center", justifyContent: "space-between" }}>
        {/* NÚT VÀ DROPDOWN MENU */}
        <div style={{ position: "relative" }}>
          <button onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu) }} style={{ padding: "8px 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "900", letterSpacing: "1px", cursor: "pointer", boxShadow: "0 4px 10px rgba(30,58,138,0.3)" }}>MENU</button>
          {showMainMenu && (
            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "110%", left: 0, background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "10px", minWidth: "250px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column", padding: "8px" }}>
              {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowStatsModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>📊</span> Báo Cáo Doanh Thu</div>}
              {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowCustomerModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>🤝</span> Quản Lý Khách Hàng VIP</div>}
              {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowInventoryModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px", color: "#10b981" }}><span style={{ fontSize: "16px" }}>📦</span> Kiểm Kho Định Kỳ</div>}
              <div onClick={() => { setShowMainMenu(false); setShowDebtModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444" }}><span style={{ fontSize: "16px" }}>📓</span> Sổ Nợ Khách Hàng</div>
              {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowAuditModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px dashed var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>🕵️</span> Lịch Sử Thao Tác</div>}
              {role === 'admin' && (
                <>
                  <div onClick={() => { setShowMainMenu(false); setShowExpenseModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>💸</span> Nhập Chi Phí (Điện/Nước)</div>
                  <div onClick={() => { setShowMainMenu(false); setShowSupplierModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>🏭</span> Danh Sách Nhà Cung Cấp</div>
                  <div onClick={() => { setShowMainMenu(false); setShowMarketingModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px dashed var(--border-glass)", color: "#8b5cf6", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>📢</span> Gửi Email Marketing</div>
                  <div onClick={() => { setShowMainMenu(false); setNewBankBin(bankBin); setNewBankAcc(bankAcc); setNewBankNameStr(bankNameStr); setShowSettings(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>⚙️</span> Cài Đặt Hệ Thống</div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* ĐỒNG HỒ & CLOUD STATUS */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center", fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>
          {role === 'admin' && lowStockCount > 0 && <div className="noti-bell" onClick={() => setShowStatsModal(true)} title="Có mặt hàng sắp hết!" style={{cursor:"pointer"}}><span style={{ fontSize: "20px" }}>🔔</span><span className="noti-badge">{lowStockCount}</span></div>}
          <LiveClock />
          <CloudStatusBadge />
        </div>
      </div>
    </div>
  );
};
