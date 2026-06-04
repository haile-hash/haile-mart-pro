import React from 'react';
import { Product } from '../../types';
import { cleanName, parseGift } from '../../utils/helpers';

interface ProductTableProps {
  products: Product[];
  handleSelectSuggest: (p: Product) => void;
  handleEdit: (id: any, field: string, old: any, isText?: boolean) => void;
  handleDelete: (id: any, name: string) => void;
  setPrintBarcodeProduct: (p: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct
}) => {

  // ĐÃ FIX LỖI TYPESCRIPT: Thêm dấu ? vào dateStr để cho phép giá trị undefined
  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return "---";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split('T')[0];
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Mã & Tên SP</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold', textAlign: 'center' }}>Tồn kho</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold', textAlign: 'right' }}>Giá vốn</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold', textAlign: 'right' }}>Giá Bán & Khuyến Mãi</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>Lịch sử & HSD</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Không có sản phẩm nào</td></tr>
            ) : (
              products.map((p, idx) => {
                const gift = parseGift(p.gift_info);
                
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* CỘT 1: MÃ, TÊN SP & TAG QUÀ TẶNG */}
                    <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                      <div 
                        style={{ color: '#3b82f6', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer', marginBottom: '2px' }}
                        title="Click để copy mã"
                        onClick={() => navigator.clipboard.writeText(p.product_code || '')}
                      >
                        {p.product_code}
                      </div>
                      <div 
                        style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', cursor: 'pointer', lineHeight: '1.4' }}
                        onClick={() => handleEdit(p.id, 'name', p.name, true)}
                        title="Click để sửa tên"
                      >
                        {cleanName(p.name)}
                      </div>
                      
                      {/* TAG QUÀ TẶNG GỘP VÀO ĐÂY */}
                      {gift.text && (
                        <div 
                          onClick={() => handleEdit(p.id, 'gift_info', p.gift_info, true)}
                          style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: '6px', cursor: 'pointer' }}
                          title="Click để sửa quà tặng"
                        >
                          <span style={{ fontSize: '12px' }}>🎁</span>
                          <span style={{ color: '#7e22ce', fontSize: '11px', fontWeight: 'bold' }}>
                            {gift.cond > 1 ? `Mua ${gift.cond} tặng:` : 'Tặng:'} {gift.text}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* CỘT 2: TỒN KHO */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span 
                        style={{ display: 'inline-block', padding: '4px 10px', background: p.stock <= 5 ? '#fef2f2' : '#ecfdf5', color: p.stock <= 5 ? '#ef4444' : '#10b981', borderRadius: '20px', fontWeight: '900', fontSize: '14px', border: `1px solid ${p.stock <= 5 ? '#fca5a5' : '#6ee7b7'}` }}
                      >
                        {p.stock}
                      </span>
                    </td>

                    {/* CỘT 3: GIÁ VỐN */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b', fontWeight: '600' }} onClick={() => handleEdit(p.id, 'import_price', p.import_price)}>
                      {(p.import_price || 0).toLocaleString()}đ
                    </td>

                    {/* CỘT 4: GIÁ BÁN & KHUYẾN MÃI */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div 
                        style={{ fontWeight: '900', color: p.promo_price ? '#ef4444' : '#f59e0b', fontSize: '15px', cursor: 'pointer' }}
                        onClick={() => handleEdit(p.id, p.promo_price ? 'promo_price' : 'sale_price', p.promo_price || p.sale_price)}
                      >
                        {(p.promo_price || p.sale_price || 0).toLocaleString()}đ
                      </div>
                      {p.promo_price > 0 && (
                        <div 
                          style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', cursor: 'pointer', marginTop: '2px' }}
                          onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)}
                        >
                          Gốc: {(p.sale_price || 0).toLocaleString()}đ
                        </div>
                      )}
                    </td>

                    {/* CỘT 5: NGÀY NHẬP & HSD (DESIGN MỚI) */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Dòng 1: Ngày nhập */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                          <span style={{ padding: '2px 4px', background: '#f1f5f9', borderRadius: '4px', fontSize: '10px' }}>📥</span>
                          <span title="Ngày tạo/nhập kho">{formatDateStr(p.created_at)}</span>
                        </div>
                        
                        {/* Dòng 2: Hạn sử dụng */}
                        <div 
                          onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}
                          title="Click để sửa HSD"
                        >
                          {p.expiry_date ? (
                            <>
                              <span style={{ padding: '2px 4px', background: '#ecfdf5', borderRadius: '4px', fontSize: '10px' }}>⏳</span>
                              <span style={{ color: '#059669', fontWeight: 'bold' }}>{p.expiry_date}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ padding: '2px 4px', background: '#f8fafc', borderRadius: '4px', fontSize: '10px', opacity: 0.5 }}>➖</span>
                              <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Không có HSD</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* CỘT 6: THAO TÁC */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}>
                          🛒 Thêm
                        </button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }} title="In tem mã vạch">
                          🖨️
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }} title="Xóa sản phẩm">
                          🗑️
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
