import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface HeaderProps {
  role: string;
  shift: string;
  totalValue: number;
  currentShiftStats: any;
  setCashFlowModalInfo: (val: string | null) => void;
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
  setNewBankBin: (val: string) => void;
  setNewBankAcc: (val: string) => void;
  setNewBankNameStr: (val: string) => void;
  bankBin: string;
  bankAcc: string;
  bankNameStr: string;
  setShowSettings: (val: boolean) => void;
  lowStockCount: number;
  isOnline: boolean;
  syncStatus: string;
  syncAllOfflineData: () => void;
  setShowScannerLinkModal?: (val: boolean) => void;
  setShowPOModal?: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  role, shift, totalValue, currentShiftStats, setCashFlowModalInfo,
  darkMode, setDarkMode, handleLogoutClick, showMainMenu, setShowMainMenu,
  setShowStatsModal, setShowCustomerModal, setShowInventoryModal, setShowDebtModal,
  setShowAuditModal, setShowExpenseModal, setShowSupplierModal, setShowMarketingModal,
  setShowSettings, lowStockCount, isOnline, syncStatus, syncAllOfflineData,
  setShowScannerLinkModal, setShowPOModal
}) => {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('vi-VN') + " - " + now.toLocaleDateString('vi-VN'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getSyncColor = () => {
    if (!isOnline) return "#ef4444";
    if (syncStatus === "Đang đồng bộ...") return "#3b82f6";
    return "#10b981";
  };

  // 🎵 GỌI NHẠC TRỰC TIẾP TỪ JAVASCRIPT (KHÔNG DÙNG THẺ AUDIO NỮA)
  const playLogoMusic = () => {
    const audio = new Audio("/Windy Hill.mp3"); 
    audio.play().catch(e => {
      console.log("Trình duyệt chặn nhạc:", e);
      toast.error("Trình duyệt chặn âm thanh tự động. Hãy click chuột vài lần vào trang rồi thử lại nhé!"); 
    });
  };

  return (
    <div className="glass" style={{ padding: "12px 20px", marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
      
      {/* 🌊 CSS Hiệu ứng lượn sóng cho Logo */}
      <style>{`
        @keyframes waveAnimation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .logo-wavy {
          animation: waveAnimation 2.5s ease-in-out infinite;
        }
        .logo-wavy:hover {
          animation-play-state: paused;
          transform: scale(1.05);
        }
      `}</style>

      {/* --- KHU VỰC THÔNG TIN CHÍNH --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* Lắp class lượn sóng vào Logo */}
        <div className="logo-wavy" onClick={playLogoMusic} style={{ display: "flex", alignItems: "center", gap: "15px", cursor: "pointer", transition: "transform 0.2s" }} title="Bấm vào Logo để thưởng thức nhạc Windy!">
          <div style={{ background: "#ef4444", color: "#fff", padding: "10px", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 4px 10px rgba(239,68,68,0.3)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", color: "#b91c1c", fontWeight: "900", letterSpacing: "1px" }}>HẢI LÊ <span style={{ color: "#ef4444" }}>MART</span></h1>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold", letterSpacing: "3px" }}>ERP SYSTEM</div>
          </div>
        </div>

        {/* Chỉ số tài chính */}
        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
           <div style={{ background: "#fef08a", color: "#b45309", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
             🌙 HAPPY HOUR
           </div>
           <div style={{ borderLeft: "1px solid #cbd5e1", height: "30px" }}></div>
           <div style={{ textAlign: "center" }}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Vốn</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#475569" }}>{totalValue.toLocaleString()}đ</div>
           </div>
           <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setCashFlowModalInfo('TIỀN MẶT')}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Tiền mặt 👆</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#10b981" }}>{currentShiftStats.cash.toLocaleString()}đ</div>
           </div>
           <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Chuyển khoản 👆</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#3b82f6" }}>{currentShiftStats.transfer.toLocaleString()}đ</div>
           </div>
           <div style={{ borderLeft: "1px solid #cbd5e1", height: "30px" }}></div>
           <div style={{ textAlign: "center" }}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" }}>Lãi</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#ea580c" }}>{currentShiftStats.prof.toLocaleString()}đ</div>
           </div>
        </div>

        {/* Nhân viên & Nút Tắt */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
           <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>{darkMode ? "☀️" : "🌙"}</button>
           <div style={{ textAlign: "right" }}>
             <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1e293b" }}>{role === 'admin' ? 'Quản lý' : 'Thu ngân'}</div>
             <div style={{ fontSize: "11px", color: "#64748b" }}>{shift}</div>
           </div>
           <button onClick={handleLogoutClick} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", boxShadow: "0 2px 4px rgba(239,68,68,0.3)" }}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
           </button>
        </div>
      </div>

      <div style={{ borderBottom: "1px dashed #cbd5e1" }}></div>

      {/* --- KHU VỰC MENU & TRẠNG THÁI MÂY --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        <button
          onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu); }}
          style={{ background: "#1e3a8a", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 16px", fontWeight: "900", cursor: "pointer", letterSpacing: "1px", boxShadow: "0 2px 4px rgba(30,58,138,0.3)" }}
        >
          MENU
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
            ⏱ {timeStr}
          </div>
          <button onClick={syncAllOfflineData} style={{ fontSize: "11px", color: getSyncColor(), background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "bold" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: getSyncColor() }}></div>
            {isOnline ? syncStatus : "Mất mạng"}
          </button>
        </div>
      </div>

      {/* --- MENU SỔ XUỐNG --- */}
      {showMainMenu && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: "20px", background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px", width: "270px", zIndex: 1000, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "5px" }}>
          
          {setShowScannerLinkModal && (
            <button onClick={() => { setShowScannerLinkModal(true); setShowMainMenu(false); }} style={{ padding: "12px 10px", textAlign: "left", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 5px rgba(37,99,235,0.2)" }}>
              📱 Kết nối Máy Quét Cầm Tay
            </button>
          )}
          {role === 'admin' && setShowPOModal && (
            <button onClick={() => { setShowPOModal(true); setShowMainMenu(false); }} style={{ padding: "12px 10px", textAlign: "left", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 5px rgba(5,150,105,0.2)" }}>
              📦 Phiếu Nhập Hàng & Công Nợ
            </button>
          )}
          
          {setShowScannerLinkModal && <div style={{ borderBottom: "1px solid #e2e8f0", margin: "5px 0" }}></div>}

          <button onClick={() => { setShowStatsModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>📊 Báo Cáo Doanh Thu</button>
          <button onClick={() => { setShowCustomerModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>👥 Khách Hàng VIP</button>
          <button onClick={() => { setShowDebtModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>📒 Sổ Nợ Khách Hàng</button>
          
          {role === 'admin' && (
            <>
              <div style={{ borderBottom: "1px solid #e2e8f0", margin: "5px 0" }}></div>
              <button onClick={() => { setShowInventoryModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>📦 Kiểm Kho Thực Tế {lowStockCount > 0 && <span style={{ background: "#ef4444", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "10px", marginLeft: "5px" }}>{lowStockCount} sp sắp hết</span>}</button>
              <button onClick={() => { setShowSupplierModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>🏢 Quản Lý Nhà Cung Cấp</button>
              <button onClick={() => { setShowExpenseModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>💸 Sổ Ghi Chi Phí</button>
              <button onClick={() => { setShowMarketingModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>💌 Chăm Sóc KH (Email/Zalo)</button>
              <button onClick={() => { setShowAuditModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>👁 Nhật Ký Thao Tác</button>
              <button onClick={() => { setShowSettings(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>⚙ Cài Đặt Hệ Thống</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
