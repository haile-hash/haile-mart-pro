import React, { useState } from 'react';

export default function Header({
  notifications, onMarkAllRead, onClearNotifications, onRemoveNotification,
  currentPortal, onSwitchPortal, isOffline, onLockScreen, adminSession, onLogout
}: any) {
  const [showNotif, setShowNotif] = useState(false);
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
       {/* Trái: Logo & Công tắc chuyển đổi Cổng */}
       <div className="flex items-center gap-6">
         <div className="font-black text-2xl text-slate-800 tracking-tight cursor-default">
           POS<span className="text-orange-500">PRO</span>
         </div>
         
         <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
           <button 
             onClick={() => onSwitchPortal('admin')}
             className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${currentPortal === 'admin' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
           >
             🏪 Quản lý (Cửa hàng)
           </button>
           <button 
             onClick={() => onSwitchPortal('client')}
             className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${currentPortal === 'client' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
           >
             🛍️ Mua sắm (Khách hàng)
           </button>
         </div>
       </div>

       {/* Phải: Trạng thái, Thông báo & Tài khoản */}
       <div className="flex items-center gap-5">
         {/* Badge Offline */}
         {isOffline && (
           <span className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 shadow-sm">
             <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
             OFFLINE
           </span>
         )}

         {/* Chuông Thông Báo */}
         <div className="relative">
           <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-full hover:bg-slate-50">
             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
             {unreadCount > 0 && <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white border-2 border-white shadow-sm">{unreadCount}</span>}
           </button>
           
           {showNotif && (
             <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="font-extrabold text-sm text-slate-800">Thông báo hệ thống</span>
                  <div className="flex gap-3">
                    <button onClick={() => { onMarkAllRead(); setShowNotif(false); }} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">Đã đọc hết</button>
                    <button onClick={() => { onClearNotifications(); setShowNotif(false); }} className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">Xóa hết</button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!notifications || notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium text-slate-400">Không có thông báo nào.</div>
                  ) : (
                    notifications.map((n: any) => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 flex flex-col gap-1.5 transition-colors ${n.read ? 'opacity-50' : 'bg-blue-50/30 hover:bg-blue-50/60'}`}>
                        <div className="flex justify-between items-start">
                           <span className="text-sm font-bold text-slate-800">{n.title}</span>
                           <button onClick={() => onRemoveNotification(n.id)} className="text-slate-300 hover:text-red-500 transition-colors font-bold text-lg leading-none">&times;</button>
                        </div>
                        <span className="text-xs font-medium text-slate-600 leading-relaxed">{n.message}</span>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1">{n.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
             </div>
           )}
         </div>

         <div className="h-8 w-px bg-slate-200 mx-2"></div>

         {/* Thông tin nhân viên (Chỉ hiện ở Portal Admin) */}
         {adminSession && currentPortal === 'admin' && (
           <div className="flex flex-col text-right mr-3">
             <span className="text-sm font-extrabold text-slate-800">{adminSession.cashierName}</span>
             <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5">{adminSession.shift}</span>
           </div>
         )}

         {/* Nút Khóa / Đăng xuất */}
         <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-1">
            <button onClick={onLockScreen} className="p-2 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="Khóa màn hình (Rời khỏi quầy)">
               <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
            </button>
            <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Chốt ca & Đăng xuất">
               <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
         </div>

       </div>
    </header>
  );
}
