import React from 'react';
import { Product } from '../../types';
import { cleanName, getActualPrice } from '../../utils/helpers';

export const ProductTable: React.FC<any> = ({ products, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct, sortConfig, setSortConfig }) => {
  const requestSort = (key: string) => { let direction: 'asc' | 'desc' = 'asc'; if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') { direction = 'desc'; } setSortConfig({ key, direction }); };
  const renderSortArrow = (key: string) => { if (!sortConfig || sortConfig.key !== key) return ' ↕'; return sortConfig.direction === 'asc' ? ' ▲' : ' ▼'; };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th onClick={() => requestSort('product_code')} style={{ padding: '12px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>Mã SP{renderSortArrow('product_code')}</th>
              <th onClick={() => requestSort('name')} style={{ padding: '12px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>Tên Sản Phẩm{renderSortArrow('name')}</th>
              <th onClick={() => requestSort('category')} style={{ padding: '12px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>Danh mục{renderSortArrow('category')}</th>
              <th onClick={() => requestSort('stock')} style={{ padding: '12px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>Tồn kho{renderSortArrow('stock')}</th>
              <th onClick={() => requestSort('import_price')} style={{ padding: '12px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>Giá vốn{renderSortArrow('import_price')}</th>
              <th onClick={() => requestSort('sale_price')} style={{ padding: '12px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>Giá bán{renderSortArrow('sale_price')}</th>
              <th onClick={() => requestSort('created_at')} style={{ padding: '12px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>Ngày nhập kho{renderSortArrow('created_at')}</th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Không có sản phẩm nào.</td></tr>
            ) : (
              products.map((p: Product) => {
                const importDate = p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : '---';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#3b82f6', fontSize: '13px' }}>{p.product_code}</td>
                    <td onClick={() => handleEdit(p.id, 'name', p.name, true)} style={{ padding: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{cleanName(p.name)}</td>
                    <td onClick={() => handleEdit(p.id, 'category', p.category, true)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>{p.category || '---'}</td>
                    <td style={{ padding: '12px' }}><span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: p.stock <= 5 ? '#fee2e2' : '#dcfce7', color: p.stock <= 5 ? '#ef4444' : '#10b981', fontSize: '13px' }}>{p.stock}</span></td>
                    <td onClick={() => handleEdit(p.id, 'import_price', p.import_price)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>{(p.import_price || 0).toLocaleString()}đ</td>
                    <td onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)} style={{ padding: '12px', fontWeight: 'bold', color: '#f59e0b', cursor: 'pointer', fontSize: '14px' }}>{(p.sale_price || 0).toLocaleString()}đ</td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{importDate}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🛒 Thêm</button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🖨️</button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
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
