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
  products, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct 
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setActiveFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortOrFilterClick = (e: React.MouseEvent, key: keyof Product) => {
    e.stopPropagation();
    // Vừa mở menu lọc kiểu Excel, vừa tự động Sort nhẹ cho người dùng dễ nhìn
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setActiveFilterMenu(activeFilterMenu === key ? null : (key as string));
  };

  const getUniqueValues = (key: keyof Product): string[] => {
    const values = products.map(p => String(p[key] || '---'));
    return Array.from(new Set(values)).sort();
  };

  const handleCheckboxChange = (key: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[key] || [];
      const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
      return { ...prev, [key]: newValues };
    });
  };

  const processedProducts = useMemo(() => {
    let result = [...products];
    Object.entries(selectedFilters).forEach(([key, allowedValues]) => {
      if (allowedValues.length > 0) {
        result = result.filter(p => allowedValues.includes(String(p[key as keyof Product] || '---')));
      }
    });
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

  // Tạo tiêu đề tinh giản: Chỉ gồm Tên cột + 1 Mũi tên duy nhất làm tất cả nhiệm vụ
  const renderHeaderCell = (label: string, fieldKey: keyof Product) => {
    const isFiltered = (selectedFilters[fieldKey as string]?.length || 0) > 0;
    return (
      <th style={{ padding: '12px', color: '#475569', fontSize: '13px', position: 'relative', userSelect: 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={(e) => handleSortOrFilterClick(e, fieldKey)}>
          <span>{label}</span>
          <span style={{ color: isFiltered ? '#10b981' : '#94a3b8', fontSize: '11px' }}>▼</span>
        </div>

        {activeFilterMenu === fieldKey && (
          <div ref={filterMenuRef} style={{ position: 'absolute', top: '100%', left: '4px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', padding: '12px', zIndex: 999, minWidth: '180px', maxHeight: '220px', overflowY: 'auto' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>LỌC NHANH</span>
              {isFiltered && <span onClick={() => setSelectedFilters(p => { const u = {...p}; delete u[fieldKey as string]; return u; })} style={{ color: '#ef4444', cursor: 'pointer' }}>Xóa</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {getUniqueValues(fieldKey).map((val, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={(selectedFilters[fieldKey as string] || []).includes(val)} onChange={() => handleCheckboxChange(fieldKey as string, val)} />
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
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 85, background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              {renderHeaderCell('Mã SP', 'product_code')}
              {renderHeaderCell('Tên Sản Phẩm', 'name')}
              {renderHeaderCell('Danh mục', 'category')}
              {renderHeaderCell('Tồn kho', 'stock')}
              {renderHeaderCell('Giá vốn', 'import_price')}
              {renderHeaderCell('Giá bán', 'sale_price')}
              {renderHeaderCell('Ngày Nhập / HSD', 'created_at')}
              <th style={{ padding: '12px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {processedProducts.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Không tìm thấy sản phẩm.</td></tr>
            ) : (
              processedProducts.map((p: Product) => {
                const importDate = p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : '---';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#3b82f6', fontSize: '13px' }}>{p.product_code}</td>
                    <td onClick={() => handleEdit(p.id, 'name', p.name, true)} style={{ padding: '12px', fontWeight: '600', cursor: 'pointer' }}>{cleanName(p.name)}</td>
                    <td onClick={() => handleEdit(p.id, 'category', p.category, true)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer' }}>{p.category || '---'}</td>
                    <td style={{ padding: '12px' }}><span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: p.stock <= 5 ? '#fee2e2' : '#dcfce7', color: p.stock <= 5 ? '#ef4444' : '#10b981' }}>{p.stock}</span></td>
                    <td onClick={() => handleEdit(p.id, 'import_price', p.import_price)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer' }}>{(p.import_price || 0).toLocaleString()}đ</td>
                    <td onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)} style={{ padding: '12px', fontWeight: 'bold', color: '#f59e0b', cursor: 'pointer' }}>{(p.sale_price || 0).toLocaleString()}đ</td>
                    
                    {/* CỘT GỘP THÔNG MINH: TRÊN NGÀY NHẬP - DƯỚI HSD */}
                    <td style={{ padding: '12px', fontSize: '13px', lineHeight: '1.4' }}>
                      <div style={{ color: '#475569', fontWeight: '500' }} title="Ngày nhập kho">📥 {importDate}</div>
                      <div onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)} style={{ color: '#ea580c', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }} title="Hạn sử dụng (Click để sửa)">
                        ⏳ {p.expiry_date || '---'}
                      </div>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🛒 Thêm</button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🖨️ Tem</button>
                        <button onClick={() => handleDelete(p.id, p.name)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Xóa</button>
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
