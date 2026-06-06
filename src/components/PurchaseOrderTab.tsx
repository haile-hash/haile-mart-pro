import React from 'react';

export default function PurchaseOrderTab({ purchaseOrders }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800">🚚 Nhập hàng (PO)</h2>
        <button className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">
          + Lập phiếu PO mới
        </button>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 font-medium">
        Bạn có <strong className="text-orange-500">{purchaseOrders.length}</strong> đơn đặt hàng nhà cung cấp.
      </div>
    </div>
  );
}
