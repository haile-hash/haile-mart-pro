import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { cleanName, parseGift } from '../../utils/helpers';

export const ProductTable: React.FC<any> = ({ products, handleSelectSuggest, handleEdit, handleDelete, setPrintBarcodeProduct }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { 
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setActiveFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside); 
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortOrFilterClick = (e: React.MouseEvent, key: keyof Product) => {
    e.stopPropagation(); 
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction }); 
    setActiveFilterMenu(activeFilterMenu === key ? null : (key as string));
  };

  const getUniqueValues = (key: keyof Product): string[] => {
    return Array.from(new Set<string>(products.map((p: any) => String(p[key] || '---')))).sort();
  };

  const handleCheckboxChange = (key: string, value: string) => {
    setSelectedFilters(prev => {
      const curr = prev[key] || []; 
      const next = curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value];
      return { ...prev, [key]: next };
    });
  };

  const processedProducts = useMemo(() => {
    let result = [...products];
    Object.entries(selectedFilters).forEach(([key, allowed]) => { 
      if (allowed.length > 0) {
        result = result.filter((p: any) => allowed.includes(String(p[key as keyof Product] || '---'))); 
      }
    });
    
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key] ?? ''; 
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, sortConfig, selectedFilters]);

  const renderHeaderCell = (label: string, fieldKey: keyof Product) => {
    const isFiltered = (selectedFilters[fieldKey as string]?.length || 0) > 0;
    return (
      <th style={{ padding: '12px', color: '#475569', fontSize: '13px', position: 'relative', userSelect: 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={(e) => handleSortOrFilterClick(e, fieldKey)}>
          <span>{label}</span> <span style={{ color: isFiltered ? '#10b981' : '#94a3b8', fontSize: '11px' }}>▼</span>
        </div>
        {activeFilterMenu === fieldKey && (
          <div ref={filterMenuRef} style={{ position: 'absolute', top: '100%', left: '4px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', padding: '12px', zIndex: 999, minWidth: '180px', maxHeight: '220px', overflowY: 'auto' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>LỌC NHANH</span>
              {isFiltered && <span onClick={() => setSelectedFilters(p => { const u = {...p}; delete u[fieldKey as string]; return u; })} style={{ color: '#ef4444', cursor: 'pointer' }}>Xóa</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {getUniqueValues(fieldKey).map((val, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={(selectedFilters[fieldKey as string] || []).includes(val)} onChange={() => handleCheckboxChange(fieldKey as string, val)} /> {val}
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
              {renderHeaderCell('Mã & Tên SP', 'name')}
              {renderHeaderCell('Danh mục', 'category')}
              {renderHeaderCell('Tồn kho', 'stock')}
              {renderHeaderCell('Giá vốn', 'import_price')}
              {renderHeaderCell('Giá Bán & Khuyến Mãi', 'sale_price')}
              {renderHeaderCell('Quà tặng đi kèm', 'gift_info')}
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
                const giftObj = parseGift(p.gift_info);
                
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '11px', marginBottom: '4px' }}>Mã: {p.product_code}</div>
                      <div onClick={() => handleEdit(p.id, 'name', p.name, true)} style={{ fontWeight: '700', cursor: 'pointer', fontSize: '14px', color: '#1e293b' }} title="Click sửa tên">{cleanName(p.name)}</div>
                    </td>
                    
                    <td onClick={() => handleEdit(p.id, 'category', p.category, true)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>{p.category || '---'}</td>
                    <td style={{ padding: '12px' }}><span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: p.stock <= 5 ? '#fee2e2' : '#dcfce7', color: p.stock <= 5 ? '#ef4444' : '#10b981', fontSize: '13px' }}>{p.stock}</span></td>
                    <td onClick={() => handleEdit(p.id, 'import_price', p.import_price)} style={{ padding: '12px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>{(p.import_price || 0).toLocaleString()}đ</td>
                    
                    <td style={{ padding: '12px' }}>
                      <div onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)} style={{ fontWeight: 'bold', color: '#f59e0b', cursor: 'pointer', fontSize: '14px', marginBottom: '4px' }} title="Click sửa Giá Bán">{(p.sale_price || 0).toLocaleString()}đ</div>
                      <div onClick={() => handleEdit(p.id, 'promo_price', p.promo_price)} style={{ color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }} title="Click sửa Giá KM">
                        KM: {p.promo_price ? `${p.promo_price.toLocaleString()}đ` : '---'}
                      </div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <div onClick={() => handleEdit(p.id, 'gift_info', p.gift_info, true)} style={{ fontSize: '11px', color: '#8b5cf6', cursor: 'pointer', background: '#f3e8ff', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', fontWeight: '600' }} title="Click sửa (ĐK;;;Tên Quà)">
                        {p.gift_info ? `Mua ${giftObj.cond} tặng: ${giftObj.text}` : '🎁 Thêm quà'}
                      </div>
                    </td>
                    
                    <td style={{ padding: '12px', fontSize: '13px', lineHeight: '1.4' }}>
                      <div style={{ color: '#475569', fontWeight: '500' }} title="Ngày nhập kho">📥 {importDate}</div>
                      <div onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)} style={{ color: '#ea580c', fontWeight: 'bold', cursor: 'pointer', marginTop: '2px' }} title="Hạn sử dụng (Click sửa)">
                        ⏳ {p.expiry_date || '---'}
                      </div>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleSelectSuggest(p)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🛒 Thêm</button>
                        <button onClick={() => setPrintBarcodeProduct(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }} title="In tem mã vạch có tên CH">🖨️ Tem</button>
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
