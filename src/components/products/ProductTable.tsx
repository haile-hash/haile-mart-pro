/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { cleanName, getActualPrice } from '../../utils/helpers';

export const ProductTable = ({ products, role, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct }: any) => {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
              <th style={{ padding: '14px 16px' }}>Mã SP</th>
              <th style={{ padding: '14px 16px' }}>Tên Sản Phẩm</th>
              <th style={{ padding: '14px 16px' }}>Danh mục</th>
              <th style={{ padding: '14px 16px' }}>Tồn kho</th>
              <th style={{ padding: '14px 16px' }}>Giá bán</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Thao tác</th>
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
                
                // 🛡️ CHỐT CHẶN 1: Bỏ qua hoàn toàn nếu dòng dữ liệu bị rỗng/lỗi
                if (!product) return null;

                return (
                  <tr key={product?.id || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* 🛡️ CHỐT CHẶN 2: Dùng dấu chấm hỏi (product?.property) để nếu thiếu trường nào nó sẽ in ra '---' chứ không sập web */}
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#3b82f6' }}>
                      {product?.product_code || '---'}
                    </td>
                    
                    <td style={{ padding: '12px 16px', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleSelectSuggest(product)} title="Click để thêm vào giỏ hàng">
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => setPrintBarcodeProduct(product)} style={{ background: '#3b82f6', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="In mã vạch">🖨️</button>
                        {role === 'admin' && (
                          <>
                            <button onClick={() => handleEdit(product?.id, 'name', product?.name, true)} style={{ background: '#f59e0b', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sửa tên">✏️</button>
                            <button onClick={() => handleDelete(product?.id, product?.name)} style={{ background: '#ef4444', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa">🗑️</button>
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
