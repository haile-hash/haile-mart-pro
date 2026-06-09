/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";

export const Header = (props: any) => {
  const [storeInfo, setStoreInfo] = useState({ name: "HỆ THỐNG POS PRO", logo: "" });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRenewPopup, setShowRenewPopup] = useState(false);
  
  // BIẾN KIỂM TRA DỮ LIỆU
  const [debugText, setDebugText] = useState("Đang khởi động quét...");
  const [alertCount, setAlertCount] = useState(0);

  const ui = props.ui || {};
  const daysLeft = props.daysLeft || 0;
  const storeData = props.storeData;

  useEffect(() => {
    const checkLowStockFromStorage = () => {
      try {
        // Kiểm tra LocalStorage
        const cachedProds = window.localStorage.getItem("mart_products_cache");
        if (!cachedProds) {
          setDebugText("Lỗi: Không tìm thấy 'mart_products_cache' trong LocalStorage");
          
          // Thử quét IndexedDB nếu LocalStorage trống
          const dbRequest = indexedDB.open("HaileMartIndexedDB", 1);
          dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            if (!db.objectStoreNames.contains("kv_store")) {
              setDebugText("Lỗi: Không tìm thấy bảng 'kv_store' trong IndexedDB");
              return;
            }
            const tx = db.transaction("kv_store", "readonly");
            const req = tx.objectStore("kv_store").get("mart_products_cache");
            req.onsuccess = () => {
              if (req.result && Array.isArray(req.result)) {
                const count = req.result.filter(p => p.stock !== undefined && p.stock >= 0 && p.stock < 10).length;
                setAlertCount(count);
                setDebugText(`Tìm thấy kho trong IndexedDB. Số lượng < 10 là: ${count} mã`);
              } else {
                setDebugText("Lỗi: Dữ liệu IndexedDB trống hoặc không phải mảng");
              }
            };
          };
          return;
        }

        const arr = JSON.parse(cachedProds);
        if (Array.isArray(arr)) {
          const count = arr.filter(p => p.stock !== undefined && p.stock >= 0 && p.stock < 10).length;
          setAlertCount(count);
          setDebugText(`Tìm thấy kho trong LocalStorage. Tổng số hàng: ${arr.length} SP. Số lượng < 10 là: ${count} mã`);
        } else {
          setDebugText("Lỗi: Dữ liệu 'mart_products_cache' không đúng định dạng mảng JSON");
        }
      } catch (e) {
        setDebugText(`Lỗi Crash hệ thống: ${e.message}`);
      }
    };

    checkLowStockFromStorage();
    const interval = setInterval(checkLowStockFromStorage, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const savedStore = window.localStorage.getItem("mart_current_store");
      if (savedStore) {
        const storeObj = JSON.parse(savedStore);
        setStoreInfo({ name: storeObj.store_name ? storeObj.store_name.toUpperCase() : "HỆ THỐNG POS PRO", logo: storeObj.logo_url || "" });
      }
    } catch (e) {}
  }, []);

  const toggleWindyMusic = () => {
    if (!audioRef.current) { audioRef.current = new Audio("/Windy Hill.mp3"); audioRef.current.loop = true; }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
    else { audioRef.current.play().catch(err => console.log(err)); setIsPlaying(true); }
  };

  const shouldShowBanner = storeData?.plan_type === 'PRO' && daysLeft > 0 && daysLeft <= 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }} className="no-print">
      
      {/* DÒNG CHỮ ĐO ĐẠC LỖI THỰC TẾ TRÊN MÀN HÌNH */}
      <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#334155', fontFamily: 'monospace', border: '1px solid #cbd5e1' }}>
        ⚙️ [DEBUG KHO]: {debugText}
      </div>

      <style>{`
        .premium-banner { background: linear-gradient(135deg, #DA251D 0%, #A61611 100%); box-shadow: 0 10px 20px -5px rgba(218, 37, 29, 0.4); transition: all 0.3s ease; }
        .premium-banner:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -4px rgba(218, 37, 29, 0.5); }
        .modern-stat-card { background: ${ui.darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'}; border: 1px solid ${ui.darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}; border-radius: 12px; padding: 8px 16px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; min-width: 120px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
        .main-menu-btn { background: ${ui.darkMode ? '#334155' : '#1e293b'}; color: white; padding: 8px 20px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; border: none; cursor: pointer; transition: 0.2s; }
        .main-menu-btn:hover { background: #0f172a; }
        .dropdown-menu-saas button { width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; color: ${ui.darkMode ? '#cbd5e1' : '#334155'}; font-size: 13px; font-weight: 600; cursor: pointer; display: block; border-bottom: 1px solid ${ui.darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}; }
        .dropdown-menu-saas button:hover { background: ${ui.darkMode ? '#334155' : '#f1f5f9'}; color: ${ui.darkMode ? '#ffffff' : '#da251d'}; padding-left: 18px; transition: 0.2s; }
        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
        @keyframes wave-slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* BANNER THÔNG BÁO SẮP HẾT HẠN */}
      {shouldShowBanner && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '12px 24px',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid #ffeeba',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <span>⚠️ Gói cước POS PRO của cửa hàng sẽ hết hạn sau <strong>{daysLeft} ngày</strong> nữa (vào ngày {new Date(storeData.expire_at).toLocaleDateString('vi-VN')}). Vui lòng chuẩn bị gia hạn để tránh gián đoạn.</span>
          <button 
            onClick={() => setShowRenewPopup(true)}
            style={{
              backgroundColor: '#856404',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            🚀 Gia hạn ngay
          </button>
        </div>
      )}

      {/* POPUP HIỂN THỊ MÃ QR GIA HẠN CHỦ ĐỘNG TRƯỚC HẠN */}
      {showRenewPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
           <div style={{ background: 'white', padding: '30px', borderRadius: '24px', textAlign: 'center', maxWidth: '460px', width: '90%', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>Quét mã QR để Gia hạn chủ động</div>
              <img 
                src={`https://img.vietqr.io/image/${props.MY_BANK_ID}-${props.MY_ACCOUNT_NO}-compact2.png?amount=${props.SUBSCRIPTION_FEE}&addInfo=${encodeURIComponent("GIAHAN POS " + storeData?.id)}&accountName=${encodeURIComponent(props.ACCOUNT_NAME)}`}
                alt="VietQR Payment" 
                style={{ width: '220px', height: '220px', objectFit: 'contain', borderRadius: '10px' }}
              />
              <div style={{ marginTop: '15px', textAlign: 'left', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Ngân hàng: <strong>{props.MY_BANK_ID}</strong></div>
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Số tài khoản: <strong style={{ color: '#2563eb' }}>{props.MY_ACCOUNT_NO}</strong></div>
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Chủ tài khoản: <strong>{props.ACCOUNT_NAME}</strong></div>
                  <div style={{ marginBottom: '6px', fontSize: '13px', color: '#1e293b' }}>Số tiền gia hạn: <strong style={{ color: '#ef4444' }}>{props.SUBSCRIPTION_FEE?.toLocaleString()}đ</strong> / tháng</div>
                  <div style={{ fontSize: '13px', color: '#1e293b' }}>Nội dung CK: <strong style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>GIAHAN POS {storeData?.id}</strong></div>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '12px 0 20px 0' }}>
                 *Hệ thống tự động cộng dồn thêm 1 tháng vào sau ngày hết hạn cũ của bạn ngay khi nhận được tiền.
              </p>
              <button 
                onClick={() => setShowRenewPopup(false)}
                style={{ width: '100%', padding: '12px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ĐÓNG CỬA SỔ
              </button>
           </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <div className="premium-banner" onClick={toggleWindyMusic} style={{ display: 'flex', alignItems: 'center', padding: '10px 24px', borderRadius: '16px', cursor: 'pointer', minWidth: '320px', position: 'relative', overflow: 'hidden' }} title="Bật/Tắt nhạc">
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '55%', animation: 'wave-slide 4s linear infinite', pointerEvents: 'none' }}>
            <svg viewBox="0 0 800 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0,50 Q100,0 200,50 T400,50 T600,50 T800,50 L800,120 L0,120 Z" fill="rgba(255, 206, 0, 0.15)" />
            </svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200%', height: '70%', animation: 'wave-slide 6s linear infinite reverse', pointerEvents: 'none' }}>
            <svg viewBox="0 0 800 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0,50 Q100,100 200,50 T400,50 T600,50 T800,50 L800,120 L0,120 Z" fill="rgba(255, 255, 255, 0.08)" />
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginRight: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: storeInfo.logo ? '8px' : '0', overflow: 'hidden', transform: isPlaying ? 'scale(1.1)' : 'none', transition: 'all 0.3s ease' }}>
            {storeInfo.logo ? ( <img src={storeInfo.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> ) : isPlaying ? ( <span style={{ animation: 'spinSlow 3s linear infinite', fontSize: '26px' }}>📀</span> ) : ( <svg width="34" height="34" viewBox="0 0 50 50" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}><polygon points="25,2 32.35,17.15 48.77,19.54 36.88,31.13 39.69,47.5 25,39.77 10.31,47.5 13.12,31.13 1.23,19.54 17.65,17.15" fill="#FFCE00" /></svg> )}
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px' }}>{storeInfo.name}</span>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFCE00', letterSpacing: '0.5px' }}>CLOUD ENTERPRISE ERP</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flex: 1, justifyContent: "center" }}>
          <div className="modern-stat-card"><span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Vốn hàng hoá</span><span style={{ fontSize: "17px", fontWeight: "800", color: ui.darkMode ? "#cbd5e1" : "#334155" }}>{Math.round(props.totalValue).toLocaleString()}đ</span></div>
          <div className="modern-stat-card" onClick={() => ui.setCashFlowModalInfo?.('cash')} style={{ cursor: 'pointer', borderBottom: '3px solid #10b981' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981", textTransform: "uppercase" }}>Tiền mặt 👆</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#059669" }}>{Math.round(props.currentShiftStats.cash).toLocaleString()}đ</span></div>
          <div className="modern-stat-card" onClick={() => ui.setCashFlowModalInfo?.('transfer')} style={{ cursor: 'pointer', borderBottom: '3px solid #3b82f6' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase" }}>Chuyển khoản 👆</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#2563eb" }}>{Math.round(props.currentShiftStats.transfer).toLocaleString()}đ</span></div>
          <div className="modern-stat-card" style={{ borderBottom: '3px solid #f59e0b' }}><span style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase" }}>Lãi tạm tính</span><span style={{ fontSize: "17px", fontWeight: "800", color: "#d97706" }}>{Math.round(props.currentShiftStats.profit).toLocaleString()}đ</span></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          {alertCount > 0 && (
            <div 
              title={`Có ${alertCount} sản phẩm dưới 10 pc cần kiểm tra kho!`}
              style={{ 
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '44px', height: '44px', borderRadius: '12px', 
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#ef4444', cursor: 'pointer', fontSize: '20px'
              }}
            >
              🔔
              <span style={{ 
                position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', 
                borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', fontWeight: 'bold', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' 
              }}>
                {alertCount}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: props.isOnline ? (ui.darkMode ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (ui.darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2'), border: `1px solid ${props.isOnline ? '#a7f3d0' : '#fecaca'}` }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: props.isOnline ? '#10b981' : '#ef4444', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: props.isOnline ? '#059669' : '#dc2626' }}>{props.isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button onClick={() => ui.setDarkMode?.(!ui.darkMode)} style={{ background: ui.darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${ui.darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px', fontSize: '18px' }}>{ui.darkMode ? "☀️" : "🌙"}</button>
          
          {/* NÚT KHÓA MÀN HÌNH */}
          <button onClick={props.handleLockScreen} style={{ background: ui.darkMode ? 'rgba(245,158,11,0.1)' : '#fffbeb', color: '#d97706', border: `1px solid ${ui.darkMode ? 'rgba(245,158,11,0.2)' : '#fcd34d'}`, cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px', fontSize: '18px' }} title="Khóa màn hình">🔒</button>

          <button onClick={props.handleLogoutClick} style={{ background: ui.darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#dc2626', border: `1px solid ${ui.darkMode ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px' }} title="Đăng xuất">⏻</button>
        </div>
      </div>

      <div style={{ display: "flex", justifycontent: "flex-start", width: "100%", position: "relative" }}>
        <button className="main-menu-btn" onClick={(e) => { e.stopPropagation(); ui.setShowMainMenu?.(!ui.showMainMenu); }}>☰ MENU TÍNH NĂNG</button>
        
        {ui.showMainMenu && (
          <div className="dropdown-menu-saas" style={{ position: "absolute", left: 0, top: "100%", marginTop: "8px", width: "480px", zIndex: 99999, padding: "12px", borderRadius: "16px", background: ui.darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${ui.darkMode ? '#334155' : '#e2e8f0'}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ padding: "4px 12px", fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>NGHIỆP VỤ</div>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowStatsModal?.(true); }}>📊 Báo cáo doanh thu</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowPOModal?.(true); }}>📦 Nhập hàng (PO)</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowInventoryModal?.(true); }}>🔍 Kiểm kho định kỳ</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowDebtModal?.(true); }}>💸 Sổ nợ Khách</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowExpenseModal?.(true); }}>📉 Lập Phiếu Chi</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ padding: "4px 12px", fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>ĐỐI TÁC & HỆ THỐNG</div>
              
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowScannerLinkModal?.(true); }}>📲 Kết nối Điện Thoại (QR)</button>
              
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowCustomerModal?.(true); }}>💳 Danh sách VIP</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowSupplierModal?.(true); }}>🏭 Nhà Cung Cấp</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowMarketingModal?.(true); }}>💌 Chiến dịch Marketing</button>
              <div style={{ margin: "4px 0", borderBottom: `1px solid ${ui.darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}></div>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowAuditModal?.(true); }}>📝 Nhật ký hệ thống</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowSettings?.(true); }}>⚙️ Cài đặt & Giờ vàng</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowStoreSettings?.(true); }}>🏪 Thiết lập Logo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
