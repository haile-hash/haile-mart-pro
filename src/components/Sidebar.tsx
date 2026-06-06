import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, lowStockCount, nearExpiryCount }: any) {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Tổng quan' },
    { id: 'inventory', icon: '📦', label: 'Kho hàng', badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'po', icon: '🚚', label: 'Nhập hàng (PO)' },
    { id: 'stocktake', icon: '⚖️', label: 'Kiểm kho' },
    { id: 'returns', icon: '🔙', label: 'Đổi trả / Hoàn tiền' },
    { id: 'customers', icon: '👥', label: 'Khách hàng VIP' },
    { id: 'reports', icon: '📈', label: 'Báo cáo' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-10">
      <div className="p-4 flex-1 overflow-y-auto space-y-2">
        <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 mt-2 px-2">Menu Nghiệp Vụ</div>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 font-bold' 
                : 'hover:bg-slate-800 hover:text-slate-100 font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        POS PRO ENTERPRISE <br/> © 2026
      </div>
    </aside>
  );
}
