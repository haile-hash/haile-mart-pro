/* eslint-disable */
// @ts-nocheck
import React, { useRef, useState } from "react";

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
  role, shift, totalValue, currentShiftStats, setCashFlowModalInfo,
  darkMode, setDarkMode, handleLogoutClick, showMainMenu, setShowMainMenu,
  setShowStatsModal, setShowCustomerModal, setShowInventoryModal, setShowDebtModal,
  setShowAuditModal, setShowExpenseModal, setShowSupplierModal, setShowMarketingModal,
  bankBin, bankAcc, bankNameStr, setShowSettings, lowStockCount,
  isOnline, syncStatus, syncAllOfflineData, setShowScannerLinkModal, setShowPOModal
}) => {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Hàm lấy tên cửa hàng động từ local storage
  const getStoreName = () => {
    try {
      const savedStore = window.localStorage.getItem("mart_current_store");
      if (savedStore) {
        const storeObj = JSON.parse(savedStore);
        if (storeObj && storeObj.store_name) {
          return storeObj.store_name.toUpperCase();
        }
      }
    } catch (e) {
      console.error(e);
    }
    return "HỆ THỐNG POS PRO";
  };

  // Hàm kích hoạt nhạc Windy Hill từ thư mục public
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", gap: "10px" }} className="no-print">
      
      {/* 1. HIỆU ỨNG CSS ANIMATION */}
      <style>{`
        @keyframes flagWave {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes neonBorder {
          0%, 100% { border-color: #ffeb3b; box-shadow: 0 0 15px rgba(255,235,59,0.8); }
          50% { border-color: #ff5722; box-shadow: 0 0 25px rgba(255,87,34,1); }
        }
        .vietnam-saas-banner {
          background: linear-gradient(-45deg, #da251d, #b71c1c, #da251d, #ff1744) !important;
          background-size: 300% 300% !important;
          animation: flagWave 4s ease infinite, neonBorder 3s linear infinite !important;
          border: 3px solid #ffeb3b !important;
        }
        .dropdown-menu-saas button {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: none;
          border: none;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dropdown-menu-saas button:hover {
          background: #f1f5f9;
          color: #da251d;
          padding-left: 18px;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* 2. BANNER CỜ ĐỎ SAO VÀNG VÀ NÚT QUẨY NHẠC */}
      <div 
        className="vietnam-saas-banner" 
        onClick={toggleWindyMusic}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px', 
          padding: '10px 20px', 
          borderRadius: '16px', 
          minWidth: '320px', 
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          boxShadow: '0 10px 25px -5px rgba(218,37,29,0.4)'
        }}
        title="Bấm vào để BẬT/TẮT nhạc Windy Hill"
      >
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: '#ffeb3b', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '26px', 
          boxShadow: '0 0 15px #ffeb3b',
          transform: isPlaying ? 'scale(1.1)' : 'none',
          transition: 'all 0.5s ease'
        }}>
          {isPlaying ? <span style={{ animation: 'spin 2s linear infinite' }}>📀</span> : "⭐"}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>
            {getStoreName()}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffeb3b', letterSpacing: '1px', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
            {isPlaying ? "🎶 WINDY HILL ĐANG PHÁT..." : "🔥 CLICK LOGO QUẨY NHẠC"}
          </span>
        </div>
      </div>

      {/* 3. KHỐI CHỈ SỐ KINH DOANH TRONG CA */}
      <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>
        {role === "admin" && (
          <div className="stat-card" style={{ padding: "8px 14px", textAlign: "center", minWidth: "110px", background: 'rgba(255,235,59,0.15)', border: '1px solid #ffeb3b', borderRadius: "12px" }}>
            <span style={{ fontSize: "11px", color: "#856404", display: "block", fontWeight: "bold" }}>VỐN HÀNG HOÁ</span>
            <strong style={{ fontSize: "16px", color: "#856404" }}>{Math.round(totalValue).toLocaleString()}đ</strong>
          </div>
        )}
        <div className="stat-card pointer-click" onClick={() => setCashFlowModalInfo('TIỀN MẶT')} style={{ padding: "8px 14px", textAlign: "center", minWidth: "110px", background: 'rgba(20,184,166,0.1)', border: '1px solid #14b8a6', borderRadius: "12px" }}>
          <span style={{ fontSize: "11px", color: "#0f766e", display: "block", fontWeight: "bold" }}>TIỀN MẶT 👆</span>
          <strong style={{ fontSize: "16px", color: "#0f766e" }}>{Math.round(currentShiftStats.cash).toLocaleString()}đ</strong>
        </div>
        <div className="stat-card pointer-click" onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ padding: "8px 14px", textAlign: "center", minWidth: "110px", background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', borderRadius: "12px" }}>
          <span style={{ fontSize: "11px", color: "#1d4ed8", display: "block", fontWeight: "bold" }}>CHUYỂN KHOẢN 👆</span>
          <strong style={{ fontSize: "16px", color: "#1d4ed8" }}>{Math.round(currentShiftStats.transfer).toLocaleString()}đ</strong>
        </div>
        {role === "admin" && (
          <div className="stat-card" style={{ padding: "8px 14px", textAlign: "center", minWidth: "110px", background: 'rgba(249,115,22,0.1)', border: '1px solid #f97316', borderRadius: "12px" }}>
            <span style={{ fontSize: "11px", color: "#c2410c", display: "block", fontWeight: "bold" }}>LÃI TẠM TÍNH</span>
            <strong style={{ fontSize: "16px", color: "#c2410c" }}>{Math.round(currentShiftStats.profit).toLocaleString()}đ</strong>
          </div>
        )}
      </div>

      {/* 4. KHỐI ĐIỀU KHIỂN & MENU ẨN GÓC PHẢI */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: isOnline ? '1px solid #10b981' : '1px solid #ef4444' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: isOnline ? '0 0 10px #10b981' : '0 0 10px #ef4444' }}></span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isOnline ? '#10b981' : '#ef4444' }}>
            {isOnline ? 'Cloud Connected' : 'Offline Local'}
          </span>
        </div>

        <button onClick={() => setDarkMode(!darkMode)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' }} title="Thay đổi giao diện">
          {darkMode ? "☀️" : "🌙"}
        </button>

        <div style={{ position: "relative" }}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu); }} 
            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', cursor: 'pointer', padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", borderRadius: '8px' }}
          >
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#da251d", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px" }}>
              {role === "admin" ? "👑" : "🧑"}
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#334155" }}>{role === "admin" ? "Quản lý" : "Thu ngân"}</span>
              <span style={{ display: "block", fontSize: "10px", color: "#64748b" }}>{shift}</span>
            </div>
            <span style={{ fontSize: "10px", color: '#64748b' }}>▼</span>
          </button>

          {showMainMenu && (
            <div className="dropdown-menu-saas" style={{ position: "absolute", right: 0, top: "100%", marginTop: "8px", width: "240px", zIndex: 99999, padding: "6px", borderRadius: "12px", background: '#ffffff', border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", marginBottom: "4px" }}>Hệ thống lõi SaaS</div>
              <button onClick={() => { setShowMainMenu(false); setShowStatsModal(true); }}>📊 Báo cáo doanh thu</button>
              <button onClick={() => { setShowMainMenu(false); setShowPOModal(true); }}>📦 Nhập kho NCC (PO)</button>
              <button onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>🔍 Kiểm kho định kỳ</button>
              <button style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => { setShowMainMenu(false); setShowInventoryModal(true); }}>
                ⚠️ Hàng sắp hết <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{lowStockCount}</span>
              </button>
              <button onClick={() => { setShowMainMenu(false); setShowDebtModal(true); }}>💸 Quản lý Sổ nợ Khách</button>
              <button onClick={() => { setShowMainMenu(false); setShowExpenseModal(true); }}>📉 Lập Phiếu Chi ca</button>
              <button onClick={() => { setShowMainMenu(false); setShowCustomerModal(true); }}>💳 Danh sách Thành viên (VIP)</button>
              <button onClick={() => { setShowMainMenu(false); setShowSupplierModal(true); }}>🏢 Danh mục Nhà cung cấp</button>
              <button onClick={() => { setShowMainMenu(false); setShowMarketingModal(true); }}>💌 Chiến dịch Email Marketing</button>
              <button onClick={() => { setShowMainMenu(false); setShowScannerLinkModal(true); }}>🔗 Kết nối Máy quét Mobile</button>
              {role === "admin" && (
                <>
                  <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", borderTop: "1px solid #f1f5f9", marginTop: "4px", marginBottom: "4px" }}>Cấu hình doanh nghiệp</div>
                  <button onClick={() => { setShowMainMenu(false); setShowSettings(true); }}>⚙️ Thiết lập QR & Giờ Vàng</button>
                  <button onClick={() => { setShowMainMenu(false); setShowAuditModal(true); }}>📜 Nhật ký kiểm toán hệ thống</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 5. NÚT ĐĂNG XUẤT */}
        <button onClick={handleLogoutClick} style={{ background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', padding: "8px 14px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", boxShadow: '0 4px 10px rgba(220,38,38,0.3)' }}>
          🚪 <span className="hide-on-mobile">ĐĂNG XUẤT</span>
        </button>

      </div>
    </div>
  );
};
