/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { cleanName, getActualPrice } from '../../utils/helpers';

export const ProductTable = ({ products, role, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct }: any) => {
  return (
    <div style={{ background: 'var(--card-bg, rgba(255, 255, 255, 0.05))', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: '#1e293b', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Mã SP</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Tên Sản Phẩm</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Danh mục</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Tồn kho</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Giá bán</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  📦 Không có sản phẩm nào trong kho.
                </td>
              </tr>
            ) : (
              products.map((product: any, index: number) => {
                if (!product) return null;

                return (
                  <tr key={product?.id || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#3b82f6' }}>
                      {product?.product_code || '---'}
                    </td>
                    
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                      {product?.name ? cleanName(product.name) : 'Sản phẩm lỗi tên'}
                      {product?.gift_info && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#ec4899', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>🎁 Quà</span>}
                    </td>
                    
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      {product?.category || '---'}
                    </td>
                    
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: (product?.stock || 0) <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: (product?.stock || 0) <= 5 ? '#ef4444' : '#10b981' }}>
                        {product?.stock || 0}
                      </span>
                    </td>
                    
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {getActualPrice(product).toLocaleString()}đ
                    </td>
                    
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleSelectSuggest(product)} 
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', transition: 'all 0.2s' }} 
                          onMouseOver={e => e.currentTarget.style.background = '#059669'} 
                          onMouseOut={e => e.currentTarget.style.background = '#10b981'}
                          title="Thêm vào giỏ"
                        >
                          🛒 <span className="hide-on-mobile">Thêm</span>
                        </button>
                        
                        <button onClick={() => setPrintBarcodeProduct(product)} style={{ background: '#3b82f6', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="In mã vạch">🖨️</button>
                        {role === 'admin' && (
                          <>
                            <button onClick={() => handleEdit(product?.id, 'name', product?.name, true)} style={{ background: '#f59e0b', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sửa tên">✏️</button>
                            <button onClick={() => handleDelete(product?.id, product?.name)} style={{ background: '#ef4444', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa">🗑️</button>
                          </>
                        )}
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
