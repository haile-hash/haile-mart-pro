import React from 'react';

export default function ReportTab({ reports }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-black text-slate-800 mb-6">📈 Báo cáo & Thống kê</h2>
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 font-medium">
        Biểu đồ doanh thu và lợi nhuận sẽ được vẽ tại đây.
      </div>
    </div>
  );
}
