{ui.showMainMenu && (
          <div className="dropdown-menu-saas" style={{ 
            position: "absolute", left: 0, top: "100%", marginTop: "8px", 
            width: "480px", /* Mở rộng chiều ngang để chứa 2 cột */
            zIndex: 99999, padding: "12px", borderRadius: "16px", 
            background: ui.darkMode ? '#1e293b' : '#ffffff', 
            border: `1px solid ${ui.darkMode ? '#334155' : '#e2e8f0'}`, 
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" /* CSS Grid 2 cột */
          }} onClick={e => e.stopPropagation()}>
            
            {/* Cột 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ padding: "4px 12px", fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>NGHIỆP VỤ</div>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowStatsModal?.(true); }}>📊 Báo cáo doanh thu</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowPOModal?.(true); }}>📦 Nhập hàng (PO)</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowInventoryModal?.(true); }}>🔍 Kiểm kho định kỳ</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowDebtModal?.(true); }}>💸 Sổ nợ Khách</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowExpenseModal?.(true); }}>📉 Lập Phiếu Chi</button>
            </div>

            {/* Cột 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ padding: "4px 12px", fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>ĐỐI TÁC & HỆ THỐNG</div>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowCustomerModal?.(true); }}>💳 Danh sách VIP</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowSupplierModal?.(true); }}>🏭 Nhà Cung Cấp</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowMarketingModal?.(true); }}>💌 Chiến dịch Marketing</button>
              <div style={{ margin: "4px 0", borderBottom: `1px solid ${ui.darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}></div>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowSettings?.(true); }}>⚙️ Cài đặt & Giờ vàng</button>
              <button onClick={() => { ui.setShowMainMenu?.(false); ui.setShowStoreSettings?.(true); }}>🏪 Thiết lập Logo</button>
            </div>

          </div>
        )}
