/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { cleanName, getActualPrice } from '../../utils/helpers';

export const ProductTable = ({ products, role, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct }: any) => {
  return (
    <div className="products-zone">
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
        <table className="modern-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th>Mã SP</th>
              <th>Tên Sản Phẩm</th>
              <th>Danh mục</th>
              <th>Tồn kho</th>
              <th>Giá bán</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                  📦 Không có sản phẩm nào trong kho.
                </td>
              </tr>
            ) : (
              products.map((product: any, index: number) => {
                if (!product) return null;

                return (
                  <tr key={product?.id || index}>
                    <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                      {product?.product_code || '---'}
                    </td>
                    
                    <td style={{ fontWeight: '600' }}>
                      {product?.name ? cleanName(product.name) : 'Sản phẩm lỗi tên'}
                      {product?.gift_info && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#ec4899', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>🎁 Quà</span>}
                    </td>
                    
                    <td style={{ color: '#64748b' }}>
                      {product?.category || '---'}
                    </td>
                    
                    <td>
                      <span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: (product?.stock || 0) <= 5 ? '#fee2e2' : '#dcfce7', color: (product?.stock || 0) <= 5 ? '#ef4444' : '#10b981' }}>
                        {product?.stock || 0}
                      </span>
                    </td>
                    
                    <td style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                      {getActualPrice(product).toLocaleString()}đ
                    </td>
                    
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleSelectSuggest(product)} 
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }} 
                          title="Thêm vào giỏ"
                        >
                          🛒 Thêm
                        </button>
                        <button onClick={() => setPrintBarcodeProduct(product)} style={{ background: '#3b82f6', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="In mã vạch">🖨️</button>
                        {role === 'admin' && (
                          <>
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
