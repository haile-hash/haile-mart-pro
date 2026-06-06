import React from 'react';

export default function CustomerTab({ customers }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800">👥 Thẻ VIP Khách Hàng</h2>
        <button className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">
          + Thêm Khách Mới
        </button>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 font-medium">
        Hệ thống đang có <strong className="text-orange-500">{customers.length}</strong> khách hàng VIP.
      </div>
    </div>
  );
}
