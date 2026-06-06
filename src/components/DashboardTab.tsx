import React from 'react';

export default function DashboardTab({ products, orders, startingCash, cashierName, shiftName }: any) {
  const totalProducts = products.length;
  const lowStock = products.filter((p: any) => p.stock <= (p.minStock || 10)).length;
  const todayOrders = orders.filter((o: any) => new Date(o.timestamp).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + o.finalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Tổng quan ca làm việc</h2>
          <p className="text-slate-500 text-sm mt-1">Thu ngân: <strong className="text-orange-600">{cashierName}</strong> | {shiftName} | Đầu ca: {(startingCash || 0).toLocaleString()}đ</p>
        </div>
      </div>

      {/* Thẻ Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
          <div className="text-slate-500 text-sm font-bold uppercase">Mã sản phẩm</div>
          <div className="text-3xl font-black text-slate-800 mt-2">{totalProducts}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-red-500">
          <div className="text-slate-500 text-sm font-bold uppercase">Sắp hết hàng</div>
          <div className="text-3xl font-black text-red-600 mt-2">{lowStock}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
          <div className="text-slate-500 text-sm font-bold uppercase">Đơn hôm nay</div>
          <div className="text-3xl font-black text-slate-800 mt-2">{todayOrders.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-orange-500">
          <div className="text-slate-500 text-sm font-bold uppercase">Doanh thu (Ngày)</div>
          <div className="text-3xl font-black text-orange-600 mt-2">{todayRevenue.toLocaleString()}đ</div>
        </div>
      </div>

      {/* Khu vực thông báo trống */}
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm mt-6">
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-xl font-bold text-slate-800">Hệ thống đã sẵn sàng!</h3>
        <p className="text-slate-500 mt-2">Hãy sử dụng thanh menu bên trái để bắt đầu quản lý cửa hàng của bạn.</p>
      </div>
    </div>
  );
}
