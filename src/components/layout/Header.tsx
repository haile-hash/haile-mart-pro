import React, { useState, useEffect, useRef } from 'react';
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
  setNewBankBin?: (val: string) => void;
  setNewBankAcc?: (val: string) => void;
  setNewBankNameStr?: (val: string) => void;
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
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 🎵 Quản lý 3 trạng thái nhạc: 0 (Tắt), 1 (Đang phát), 2 (Tạm ngừng)
  const [musicState, setMusicState] = useState<0 | 1 | 2>(0);

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

  // 🎵 Logic Điều khiển Nhạc 3 BƯỚC 
  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (musicState === 0) {
      audioRef.current.play().then(() => {
        setMusicState(1);
        toast.success("Đang phát nhạc Windy Hill 🎵");
      }).catch(e => {
        console.error("Lỗi nhạc:", e);
        toast.error("Không tìm thấy file nhạc Windy Hill.mp3!");
      });
    } else if (musicState === 1) {
      audioRef.current.pause();
      setMusicState(2);
      toast("Đã tạm ngừng nhạc!", { icon: "⏸️" });
    } else if (musicState === 2) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; 
      setMusicState(0);
      toast("Đã tắt hẳn nhạc!", { icon: "⏹️" });
    }
  };

  const getMusicTooltip = () => {
    if (musicState === 0) return "Bấm để Phát nhạc";
    if (musicState === 1) return "Bấm để Tạm ngừng";
    return "Bấm để Tắt nhạc";
  };

  const WavyText = ({ text, color, startDelay }: { text: string, color: string, startDelay: number }) => (
    <span style={{ color, display: "flex" }}>
      {text.split('').map((char, i) => (
        <span key={i} className="flag-wave-text" style={{ animationDelay: `${startDelay + i * 0.08}s` }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );

  return (
    <div className="glass" style={{ padding: "12px 20px", marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
      
      <style>{`
        @keyframes flagFlutter {
          0%, 100% { transform: perspective(600px) rotateX(2deg) rotateY(1deg) skewY(-1deg); }
          50% { transform: perspective(600px) rotateX(-2deg) rotateY(-2deg) skewY(1deg); }
        }
        @keyframes satinWave {
          0% { background-position: -300px 0, 0 0; }
          100% { background-position: 600px 0, 0 0; }
        }
        .national-flag-container {
          position: relative;
          background-color: #da251d;
          background-image: linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 25%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.15) 75%, rgba(255,255,255,0) 100%);
          background-size: 400px 100%;
          animation: flagFlutter 3s ease-in-out infinite, satinWave 3s linear infinite;
          幕will-change: transform, background-position;
          box-shadow: 0 6px 15px rgba(218, 37, 29, 0.35);
          border: 1px solid rgba(255,255,255,0.15);
        }
        @keyframes waveTextComponent {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -4px, 0); }
        }
        .flag-wave-text {
          display: inline-block;
          animation: waveTextComponent 1.2s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes floatNotes {
          0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(0deg) scale(0.6); }
          50% { opacity: 1; transform: translate3d(var(--tx), -25px, 0) rotate(180deg) scale(1.1); }
          100% { opacity: 0; transform: translate3d(calc(var(--tx) * 1.5), -50px, 0) rotate(360deg) scale(1.4); }
        }
        .spin-note-item {
          position: absolute;
          top: 8px;
          left: 15px;
          font-size: 16px;
          pointer-events: none;
          animation: floatNotes 1.8s linear infinite;
          z-index: 100;
        }
      `}</style>

      <audio ref={audioRef} src="/Windy%20Hill.mp3" preload="auto" loop />

      {/* --- KHU VỰC THÔNG TIN CHÍNH --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        <div className="national-flag-container" onClick={toggleMusic} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "10px 20px", borderRadius: "12px", minWidth: "300px", overflow: "hidden" }} title={getMusicTooltip()}>
          
          <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "60px", color: "#ffff00", opacity: 0.4, pointerEvents: "none", userSelect: "none" }}>★</div>
          
          <div style={{ position: "relative" }}>
            <div style={{ background: "#ffff00", color: "#da251d", padding: "8px", borderRadius: "10px", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "all 0.2s", opacity: musicState === 2 ? 0.7 : 1 }}>
              {musicState === 2 ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              )}
            </div>
            {musicState === 1 && (
              <>
                <div className="spin-note-item" style={{ '--tx': '-25px', animationDelay: '0s' } as React.CSSProperties}>🎵</div>
                <div className="spin-note-item" style={{ '--tx': '25px', animationDelay: '0.5s' } as React.CSSProperties}>🎶</div>
                <div className="spin-note-item" style={{ '--tx': '-10px', animationDelay: '1s' } as React.CSSProperties}>🎵</div>
              </>
            )}
          </div>

          <div style={{ zIndex: 2 }}>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "900", letterSpacing: "0.5px", display: "flex", textShadow: "1px 2px 3px rgba(0,0,0,0.3)" }}>
              <WavyText text="HẢI LÊ " color="#ffffff" startDelay={0} />
              <WavyText text="MART" color="#ffff00" startDelay={0.4} />
            </h1>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.9)", fontWeight: "800", letterSpacing: "2.5px", marginTop: "1px", textShadow: "1px 1px 2px rgba(0,0,0,0.4)", display: "flex" }}>
              <WavyText text="ERP SYSTEM" color="#ffffff" startDelay={0.8} />
            </div>
          </div>
        </div>

        {/* --- KHU VỰC THÀNH PHẦN THỐNG KÊ TÀI CHÍNH (ĐÃ FIX LỖI CRASH CHUẨN) --- */}
        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
           <div style={{ background: "#fef08a", color: "#b45309", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>🌙 HAPPY HOUR</div>
           <div style={{ borderLeft: "1px solid #cbd5e1", height: "30px" }}></div>
           
           <div style={{ textAlign: "center" }}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>VỐN</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#475569" }}>{(totalValue || 0).toLocaleString()}đ</div>
           </div>
           
           <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setCashFlowModalInfo('TIỀN MẶT')}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>TIỀN MẶT 👆</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#10b981" }}>{(currentShiftStats?.revenue || 0).toLocaleString()}đ</div>
           </div>
           
           <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>CHUYỂN KHOẢN 👆</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#3b82f6" }}>{(currentShiftStats?.transfer || 0).toLocaleString()}đ</div>
           </div>
           
           <div style={{ borderLeft: "1px solid #cbd5e1", height: "30px" }}></div>
           
           <div style={{ textAlign: "center" }}>
             <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>LÃI</div>
             <div style={{ fontSize: "15px", fontWeight: "900", color: "#ea580c" }}>{(currentShiftStats?.profit || 0).toLocaleString()}đ</div>
           </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
           <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>{darkMode ? "☀️" : "🌙"}</button>
           <div style={{ textAlign: "right" }}><div style={{ fontSize: "13px", fontWeight: "bold", color: "#1e293b" }}>{role === 'admin' ? 'Quản lý' : 'Thu ngân'}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{shift}</div></div>
           <button onClick={handleLogoutClick} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></button>
        </div>
      </div>

      <div style={{ borderBottom: "1px dashed #cbd5e1" }}></div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu); }} style={{ background: "#1e3a8a", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 16px", fontWeight: "900", cursor: "pointer", letterSpacing: "1px" }}>MENU</button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>⏱ {timeStr}</div>
          <button onClick={syncAllOfflineData} style={{ fontSize: "11px", color: getSyncColor(), background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "bold" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: getSyncColor() }}></div>{isOnline ? syncStatus : "Mất mạng"}</button>
        </div>
      </div>

      {showMainMenu && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: "20px", background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", width: "480px", zIndex: 1000, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {setShowScannerLinkModal && (
            <button onClick={() => { setShowScannerLinkModal(true); setShowMainMenu(false); }} style={{ gridColumn: role === 'admin' ? "auto" : "1 / -1", padding: "12px 10px", textAlign: "left", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>📱 Kết nối Máy Quét Cầm Tay</button>
          )}
          {role === 'admin' && setShowPOModal && (
            <button onClick={() => { setShowPOModal(true); setShowMainMenu(false); }} style={{ padding: "12px 10px", textAlign: "left", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>📦 Nhập Hàng & Công Nợ</button>
          )}
          {setShowScannerLinkModal && <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #e2e8f0", margin: "4px 0" }}></div>}
          <button onClick={() => { setShowStatsModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>📊 Báo Cáo Doanh Thu</button>
          <button onClick={() => { setShowCustomerModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>👥 Khách Hàng VIP</button>
          <button onClick={() => { setShowDebtModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>📒 Sổ Nợ Khách Hàng</button>
          {role === 'admin' && (
            <>
              <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid #e2e8f0", margin: "4px 0" }}></div>
              <button onClick={() => { setShowInventoryModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>📦 Kiểm Kho Thực Tế</button>
              <button onClick={() => { setShowSupplierModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>🏢 Nhà Cung Cấp</button>
              <button onClick={() => { setShowExpenseModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>💸 Sổ Ghi Chi Phí</button>
              <button onClick={() => { setShowMarketingModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>💌 Chăm Sóc KH (Zalo)</button>
              <button onClick={() => { setShowAuditModal(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>👁 Nhật Ký Thao Tác</button>
              <button onClick={() => { setShowSettings(true); setShowMainMenu(false) }} style={{ padding: "10px", textAlign: "left", background: "transparent", color: "#1e293b", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }} onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>⚙ Cài Đặt Hệ Thống</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
