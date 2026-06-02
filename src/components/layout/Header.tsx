import React, { useRef, useState, useEffect } from "react";

interface HeaderProps {
  role: string;
  shift: string;
  totalValue: number;
  currentShiftStats: {
    total: number;
    profit: number;
    orders: number;
    cash: number;
    transfer: number;
  };
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
  bankBin: string;
  bankAcc: string;
  bankNameStr: string;
  setShowSettings: (val: boolean) => void;
  lowStockCount: number;
  isOnline: boolean;
  syncStatus: string;
  syncAllOfflineData: () => void;
  setShowScannerLinkModal: (val: boolean) => void;
  setShowPOModal: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  shift, totalValue, currentShiftStats, setCashFlowModalInfo, // Bỏ 'role' khỏi biến sử dụng vì đã Full quyền
  darkMode, setDarkMode, handleLogoutClick, showMainMenu, setShowMainMenu,
  setShowStatsModal, setShowCustomerModal, setShowInventoryModal, setShowDebtModal,
  setShowAuditModal, setShowExpenseModal, setShowSupplierModal, setShowMarketingModal,
  setShowSettings, lowStockCount,
  isOnline, setShowScannerLinkModal, setShowPOModal
}) => {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [storeInfo, setStoreInfo] = useState({ name: "HỆ THỐNG POS PRO", logo: "" });

  // Load thông tin cửa hàng 1 lần khi Header render
  useEffect(() => {
    try {
      const savedStore = window.localStorage.getItem("mart_current_store");
      if (savedStore) {
        const storeObj = JSON.parse(savedStore);
        setStoreInfo({ 
          name: storeObj.store_name ? storeObj.store_name.toUpperCase() : "HỆ THỐNG POS PRO",
          logo: storeObj.logo_url || "" 
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  const toggleWindyMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/Windy Hill.mp3");
      audioRef.current.loop = true;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log("Cần tương tác để phát nhạc:", err));
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }} className="no-print">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        
        .premium-banner {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          box-shadow: 0 4px 15px -3px rgba(220, 38, 38, 0.4);
          transition: all 0.3s ease;
        }
        .premium-banner:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(220, 38, 38, 0.5);
        }
        
        .modern-stat-card {
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'};
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'};
          border-radius: 12px;
          padding: 8px 16px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          min-width: 120px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }
        
        .main-menu-btn {
          background: ${darkMode ? '#334155' : '#1e293b'};
          color: white;
          padding: 8px 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 13px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          transition: all 0.2s;
        }
        .main-menu-btn:hover { background: #0f172a; transform: translateY(-2px); }

        .power-btn {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
        }
        .power-btn:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          transform: scale(1.05);
        }

        .dropdown-menu-saas button {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: none;
          border: none;
          color: ${darkMode ? '#cbd5e1' : '#334155'};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dropdown-menu-saas button:hover {
          background: ${darkMode ? '#334155' : '#f1f5f9'};
          color: ${darkMode ? '#ffffff' : '#da251d'};
          padding-left: 18px;
        }

        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* ==========================================
          DÒNG 1: TRÁI (LOGO) - GIỮA (THỐNG KÊ) - PHẢI (USER CONTROLS)
          ========================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        
        {/* KHU VỰC TRÁI: BANNER LOGO */}
        <div 
          className="premium-banner"
          onClick={toggleWindyMusic}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px 20px', borderRadius: '16px', cursor: 'pointer', border: '1px solid #f87171', minWidth: '300px' }}
          title="Bật/Tắt nhạc"
        >
          {/* LOGO ĐỘNG (Ưu tiên ảnh khách hàng nhập, nếu không có thì dùng ảnh mặc định) */}
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: storeInfo.logo ? 'transparent' : 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', 
            boxShadow: '0 2px 10px rgba(234, 179, 8, 0.5)', 
            transform: isPlaying ? 'scale(1.05)' : 'none', transition: 'all 0.3s ease',
            overflow: 'hidden' // Đảm bảo ảnh bo góc đều
          }}>
            {storeInfo.logo ? (
               <img src={storeInfo.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
               isPlaying ? <span style={{ animation: 'spinSlow 3s linear infinite' }}>📀</span> : "🎵"
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {storeInfo.name}
            </span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#fef08a', letterSpacing: '1px' }}>
              CLOUD ENTERPRISE ERP
            </span>
          </div>
        </div>

        {/* KHU VỰC GIỮA: CHỈ SỐ DOANH THU (Đã gỡ bỏ check Role) */}
        <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>
          <div className="modern-stat-card">
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Vốn hàng hoá</span>
            <span style={{ fontSize: "17px", fontWeight: "800", color: darkMode ? "#cbd5e1" : "#334155" }}>{Math.round(totalValue).toLocaleString()}đ</span>
          </div>
          
          <div className="modern-stat-card pointer-click" onClick={() => setCashFlowModalInfo('TIỀN MẶT')} style={{ cursor: 'pointer', borderBottom: '3px solid #10b981' }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", textTransform: "uppercase" }}>Tiền mặt 👆</span>
            <span style={{ fontSize: "17px", fontWeight: "800", color: "#059669" }}>{Math.round(currentShiftStats.cash).toLocaleString()}đ</span>
          </div>
          
          <div className="modern-stat-card pointer-click" onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ cursor: 'pointer', borderBottom: '3px solid #3b82f6' }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase" }}>Chuyển khoản 👆</span>
            <span style={{ fontSize: "17px", fontWeight: "800", color: "#2563eb" }}>{Math.round(currentShiftStats.transfer).toLocaleString()}đ</span>
          </div>
          
          <div className="modern-stat-card" style={{ borderBottom: '3px solid #f59e0b' }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase" }}>Lãi tạm tính</span>
            <span style={{ fontSize: "17px", fontWeight: "800", color: "#d97706" }}>{Math.round(currentShiftStats.profit).toLocaleString()}đ</span>
          </div>
        </div>

        {/* KHU VỰC PHẢI: CẤU HÌNH & TÀI KHOẢN */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: isOnline ? (darkMode ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2'), border: `1px solid ${isOnline ? '#a7f3d0' : '#fecaca'}` }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444' }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: isOnline ? '#059669' : '#dc2626' }}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <button onClick={() => setDarkMode(!darkMode)} style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }} title="Đổi giao diện">
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* Thay "Quản lý" thành cố định là "Nhân sự" vì đã gộp quyền */}
          <div style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, padding: "6px 14px 6px 6px", display: "flex", alignItems: "center", gap: "10px", borderRadius: '14px' }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              👑
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: "700", color: darkMode ? '#ffffff' : "#334155" }}>Người dùng</span>
              <span style={{ display: "block", fontSize: "11px", fontWeight: "500", color: "#64748b" }}>{shift}</span>
            </div>
          </div>

          <button onClick={handleLogoutClick} className="power-btn" title="ĐĂNG XUẤT (KẾT THÚC CA)">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
          </button>

        </div>
      </div>

      {/* ==========================================
          DÒNG 2: NÚT MENU TÍNH NĂNG (Gỡ bỏ check Role cho Admin settings)
          ========================================== */}
      <div style={{ display: "flex", justifyContent: "flex-start", width: "100%", position: "relative" }}>
        
        <button className="main-menu-btn" onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          MENU TÍNH NĂNG
        </button>

        {showMainMenu && (
          <div className="dropdown-menu-saas" style={{ position: "absolute", left: 0, top: "100%", marginTop: "8px", width: "260px", zIndex: 99999, padding: "8px", borderRadius: "16px", background: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`, marginBottom: "4px" }}>Hệ thống SaaS</div>
            <button onClick={() => { setShowMainMenu(false); setShowStatsModal(true); }}>📊 Báo cáo doanh thu</button>
            <button onClick={() => { setShowMainMenu(false); setShowPOModal(true); }}>📦 Nhập kho NCC</button>
            <button onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>🔍 Kiểm kho định kỳ</button>
            <button style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>
              ⚠️ Hàng sắp hết <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>{lowStockCount}</span>
            </button>
            <button onClick={() => { setShowMainMenu(false); setShowDebtModal(true); }}>💸 Sổ nợ Khách</button>
            <button onClick={() => { setShowMainMenu(false); setShowExpenseModal(true); }}>📉 Lập Phiếu Chi</button>
            <button onClick={() => { setShowMainMenu(false); setShowCustomerModal(true); }}>💳 Danh sách VIP</button>
            <button onClick={() => { setShowMainMenu(false); setShowSupplierModal(true); }}>🏢 Nhà cung cấp</button>
            <button onClick={() => { setShowMainMenu(false); setShowMarketingModal(true); }}>💌 Email Marketing</button>
            <button onClick={() => { setShowMainMenu(false); setShowScannerLinkModal(true); }}>🔗 Kết nối Máy quét</button>
            
            {/* ĐÃ GỠ BỎ CHECK ROLE - AI CŨNG CÓ QUYỀN VÀO CẤU HÌNH */}
            <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", borderTop: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`, marginTop: "4px", marginBottom: "4px" }}>Cấu hình</div>
            <button onClick={() => { setShowMainMenu(false); setShowSettings(true); }}>⚙️ Thiết lập hệ thống</button>
            <button onClick={() => { setShowMainMenu(false); setShowAuditModal(true); }}>📜 Nhật ký kiểm toán</button>
          </div>
        )}
      </div>

    </div>
  );
};
