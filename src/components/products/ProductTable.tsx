import React from 'react';
import { Product } from '../../types';
import { cleanName, getActualPrice } from '../../utils/helpers';

interface ProductTableProps {
  products: Product[];
  handleSelectSuggest: (product: Product) => void;
  handleEdit: (id: string | number, field: string, oldVal: any, isText?: boolean) => void;
  handleDelete: (id: string | number, name: string) => void;
  setPrintBarcodeProduct: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  handleSelectSuggest, 
  handleEdit, 
  handleDelete, 
  setPrintBarcodeProduct 
}) => {
  return (
    <div className="products-zone">
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
        <table className="modern-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
            <tr>
              <th>Mã SP</th>
              <th>Tên Sản Phẩm</th>
              <th>Danh mục</th>
              <th>HSD</th>
              <th>Tồn kho</th>
              <th>Giá vốn</th>
              <th>Giá bán</th>
              <th>Giá KM</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                  📦 Không có sản phẩm nào trong kho hoặc không tìm thấy kết quả.
                </td>
              </tr>
            ) : (
              products.map((product: Product, index: number) => {
                if (!product) return null;

                return (
                  <tr key={product.id || index}>
                    {/* Cột Mã SP */}
                    <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                      {product.product_code || '---'}
                    </td>
                    
                    {/* Cột Tên SP (Click để sửa) */}
                    <td 
                      onClick={() => handleEdit(product.id, 'name', product.name, true)}
                      style={{ fontWeight: '600', cursor: 'pointer' }}
                      title="Nhấn để sửa tên sản phẩm"
                    >
                      {product.name ? cleanName(product.name) : 'Sản phẩm lỗi tên'}
                      {product.gift_info && (
                        <span style={{ marginLeft: '8px', fontSize: '10px', background: '#ec4899', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>
                          🎁 Quà
                        </span>
                      )}
                    </td>
                    
                    {/* Cột Danh mục (Click để sửa) */}
                    <td 
                      onClick={() => handleEdit(product.id, 'category', product.category, true)}
                      style={{ color: '#64748b', cursor: 'pointer' }}
                      title="Nhấn để sửa danh mục"
                    >
                      {product.category || '---'}
                    </td>

                    {/* Cột HSD (Click để sửa) */}
                    <td 
                      onClick={() => handleEdit(product.id, 'expiry_date', product.expiry_date, true)}
                      style={{ color: '#ea580c', cursor: 'pointer', fontSize: '13px' }}
                      title="Nhấn để sửa HSD (mm/yyyy)"
                    >
                      {product.expiry_date || '---'}
                    </td>
                    
                    {/* Cột Tồn Kho */}
                    <td>
                      <span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: (product.stock || 0) <= 5 ? '#fee2e2' : '#dcfce7', color: (product.stock || 0) <= 5 ? '#ef4444' : '#10b981' }}>
                        {product.stock || 0}
                      </span>
                    </td>

                    {/* Cột Giá Nhập/Vốn (Click để sửa) */}
                    <td 
                      onClick={() => handleEdit(product.id, 'import_price', product.import_price)}
                      style={{ color: '#64748b', cursor: 'pointer' }}
                      title="Nhấn để sửa Giá vốn"
                    >
                      {(product.import_price || 0).toLocaleString()}đ
                    </td>
                    
                    {/* Cột Giá Bán (Click để sửa) */}
                    <td 
                      onClick={() => handleEdit(product.id, 'sale_price', product.sale_price)}
                      style={{ fontWeight: 'bold', color: '#f59e0b', cursor: 'pointer' }}
                      title="Nhấn để sửa Giá bán"
                    >
                      {/* Hiển thị giá gốc để dễ click sửa, phần tính giờ vàng sẽ được xử lý lúc tính tiền trong giỏ */}
                      {(product.sale_price || 0).toLocaleString()}đ
                    </td>

                    {/* Cột Giá Khuyến Mãi (Click để sửa) */}
                    <td 
                      onClick={() => handleEdit(product.id, 'promo_price', product.promo_price)}
                      style={{ color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                      title="Nhấn để sửa Giá Khuyến Mãi"
                    >
                      {product.promo_price ? `${product.promo_price.toLocaleString()}đ` : '---'}
                    </td>
                    
                    {/* Cột Thao tác */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleSelectSuggest(product)} 
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }} 
                          title="Thêm vào giỏ"
                        >
                          🛒 Thêm
                        </button>
                        
                        <button 
                          onClick={() => setPrintBarcodeProduct(product)} 
                          style={{ background: '#3b82f6', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          title="In mã vạch"
                        >
                          🖨️
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(product.id, product.name)} 
                          style={{ background: '#ef4444', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          title="Xóa sản phẩm"
                        >
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
