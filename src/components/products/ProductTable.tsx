import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { cleanName } from '../../utils/helpers';

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
  // --- STATE SẮP XẾP VÀ LỌC KIỂU EXCEL ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Đóng menu lọc khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setActiveFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý Sắp xếp
  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Lấy danh sách các giá trị độc nhất (Unique Values) cho menu lọc giống Excel
  const getUniqueValues = (key: keyof Product): string[] => {
    const values = products.map(p => String(p[key] || '---'));
    return Array.from(new Set(values)).sort();
  };

  // Thao tác tích chọn/bỏ chọn checkbox lọc
  const handleCheckboxChange = (key: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [key]: newValues };
    });
  };

  // Xóa bộ lọc của một cột cụ thể
  const clearColumnFilter = (key: string) => {
    setSelectedFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // --- THỰC THI LỌC VÀ SẮP XẾP DỮ LIỆU ---
  const processedProducts = useMemo(() => {
    let result = [...products];

    // 1. Áp dụng các bộ lọc kiểu Excel (Checkboxes)
    Object.entries(selectedFilters).forEach(([key, allowedValues]) => {
      if (allowedValues.length > 0) {
        result = result.filter(p => allowedValues.includes(String(p[key as keyof Product] || '---')));
      }
    });

    // 2. Áp dụng sắp xếp
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, sortConfig, selectedFilters]);

  // Vẽ giao diện nút bấm Lọc & Sắp xếp trên tiêu đề
  const renderHeaderCell = (label: string, fieldKey: keyof Product) => {
    const isFiltered = (selectedFilters[fieldKey as string]?.length || 0) > 0;
    const isSorted = sortConfig?.key === fieldKey;

    return (
      <th style={{ padding: '12px', color: '#475569', fontSize: '13px', position: 'relative', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {/* Click vào chữ để Sort */}
          <span onClick={() => handleSort(fieldKey)} style={{ cursor: 'pointer', userSelect: 'none' }}>
            {label} {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
          </span>
          
          {/* Nút Phễu để bấm mở Menu lọc giống Excel */}
          <span 
            onClick={(e) => { e.stopPropagation(); setActiveFilterMenu(activeFilterMenu === fieldKey ? null : (fieldKey as string)); }}
            style={{ cursor: 'pointer', color: isFiltered ? '#10b981' : '#cbd5e1', fontSize: '11px', padding: '2px 4px', background: isFiltered ? '#dcfce7' : 'transparent', borderRadius: '4px' }}
            title="Lọc dữ liệu cột này"
          >
            📋
          </span>
        </div>

        {/* Bảng Menu Thả xuống chứa Checkbox Lọc (Excel Dropdown) */}
        {activeFilterMenu === fieldKey && (
          <div ref={filterMenuRef} style={{ position: 'absolute', top: '100%', left: '12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', padding: '12px', zIndex: 9999, minWidth: '180px', maxHeight: '250px', overflowY: 'auto' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>BỘ LỌC EXCEL</span>
              {isFiltered && <span onClick={() => clearColumnFilter(fieldKey as string)} style={{ color: '#ef4444', cursor: 'pointer' }}>Xóa</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {getUniqueValues(fieldKey).map((val, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input 
                    type="checkbox" 
                    checked={(selectedFilters[fieldKey as string] || []).includes(val)}
                    onChange={() => handleCheckboxChange(fieldKey as string, val)}
                    style={{ cursor: 'pointer' }}
                  />
                  {val}
                </label>
              ))}
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 90, background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              {renderHeaderCell('Mã SP', 'product_code')}
              {renderHeaderCell('Tên Sản Phẩm', 'name')}
              {renderHeaderCell('Danh mục', 'category')}
              {renderHeaderCell('Tồn kho', 'stock')}
              {renderHeaderCell('Giá vốn', 'import_price')}
              {renderHeaderCell('Giá bán', 'sale_price')}
              {renderHeaderCell('Ngày nhập kho', 'created_at')}
              <th style={{ padding: '12px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {processedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  📭 Không tìm thấy sản phẩm phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              processedProducts.map((p: Product) => {
                const importDate = p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : '---';
                
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#3b82f6', fontSize: '13px' }}>{p.product_code}</td>
                    
                    {/* Inline-edit Tên */}
                    <td onClick={() => handleEdit(p.id, 'name', p.name, true)} style={{ padding: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }} title="Nhấn để sửa nhanh">
                      {cleanName(p.name)}
                    </td>
                    
                    {/* Inline-edit Danh mục */}
                    <td onClick={() => handleEdit(p.id, 'category', p.category, true)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>
                      {p.category || '---'}
                    </td>
                    
                    {/* Tồn kho màu sắc động */}
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: p.stock <= 5 ? '#fee2e2' : '#dcfce7', color: p.stock <= 5 ? '#ef4444' : '#10b981', fontSize: '13px' }}>
                        {p.stock}
                      </span>
                    </td>
                    
                    {/* Inline-edit Giá vốn */}
                    <td onClick={() => handleEdit(p.id, 'import_price', p.import_price)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>
                      {(p.import_price || 0).toLocaleString()}đ
                    </td>
                    
                    {/* Inline-edit Giá bán */}
                    <td onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)} style={{ padding: '12px', fontWeight: 'bold', color: '#f59e0b', cursor: 'pointer', fontSize: '14px' }}>
                      {(p.sale_price || 0).toLocaleString()}đ
                    </td>
                    
                    {/* Ngày nhập kho */}
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>{importDate}</td>
                    
                    {/* CÁC NÚT THAO TÁC */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {/* Nút thêm giỏ */}
                        <button onClick={() => handleSelectSuggest(p)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                          🛒 Thêm
                        </button>
                        
                        {/* Đã sửa: Nút In kết nối đúng hàm setPrintBarcodeProduct mở cấu hình mẫu tem */}
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }} title="In tem mã vạch sản phẩm">
                          🖨️ Tem
                        </button>
                        
                        {/* Nút xóa sản phẩm */}
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          Xóa
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
