/* eslint-disable */
// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { cleanName, parseGift } from '../../utils/helpers';

interface ProductTableProps {
  role: string; sortedAndFilteredProducts: any[]; requestSort: (key: string) => void;
  handleEdit: (id: any, field: string, oldVal: any, isText?: boolean) => void;
  addToCart: (product: any) => void; handlePrintBarcode: (product: any) => void;
  handleDelete: (id: any, name: string) => void; sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
  filters: Record<string, any[]>; setFilters: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  openFilter: string | null; setOpenFilter: React.Dispatch<React.SetStateAction<string | null>>;
  uniqueNames: string[]; uniqueStocks: number[]; uniqueImportPrices: number[];
  uniqueSalePrices: number[]; uniqueExpiries: string[];
}

export const ProductTable: React.FC<ProductTableProps> = ({
  role, sortedAndFilteredProducts = [], requestSort, handleEdit, addToCart,
  handlePrintBarcode, handleDelete, sortConfig, filters, setFilters,
  openFilter, setOpenFilter, uniqueNames, uniqueStocks, uniqueImportPrices,
  uniqueSalePrices, uniqueExpiries
}) => {

  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => { setVisibleCount(50); }, [sortedAndFilteredProducts, filters, sortConfig]);

  const visibleProducts = useMemo(() => {
    return (sortedAndFilteredProducts || []).slice(0, visibleCount);
  }, [sortedAndFilteredProducts, visibleCount]);

  const totalProducts = (sortedAndFilteredProducts || []).length;

  const renderColumnHeader = (sortKey: string, filterKey: string, label: string, options: any[], formatValue: (val: any) => string, alignRight: boolean = false) => {
    const isActive = filters[filterKey]?.length > 0;
    const isOpen = openFilter === filterKey;
    const handleToggleAll = () => { const newFilters = { ...filters }; delete newFilters[filterKey]; setFilters(newFilters); };
    const handleToggleItem = (val: any, checked: boolean) => { const current = filters[filterKey] || []; const updated = checked ? [...current, val] : current.filter((item: any) => item !== val); setFilters({ ...filters, [filterKey]: updated.length ? updated : [] }); };
    const renderSortIcon = () => { if (sortConfig?.key !== sortKey) return <span style={{ opacity: 0.3, fontSize: '12px' }}>↕</span>; return sortConfig.direction === 'asc' ? <span style={{ color: '#3b82f6', fontSize: '14px' }}>↑</span> : <span style={{ color: '#3b82f6', fontSize: '14px' }}>↓</span>; };

    return (
      <th className="table-th-relative" key={filterKey} style={{ padding: '10px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none', color: '#64748b' }} onClick={() => requestSort(sortKey)} title={`Sắp xếp theo ${label}`}>{label} {renderSortIcon()}</div>
          <div className="filter-trigger" onClick={(e) => { e.stopPropagation(); setOpenFilter(isOpen ? null : filterKey); }} title={`Lọc ${label}`}>
            <svg className={`filter-icon ${isActive ? 'active' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </div>
        </div>
        {isOpen && (
          <div className="filter-popover" onClick={e => e.stopPropagation()} style={alignRight ? { right: 0, left: 'auto' } : { left: 0 }}>
            <div className="filter-popover-header">Lọc {label}</div>
            <div className="filter-popover-body">
              <label className="filter-checkbox-item"><input type="checkbox" checked={!isActive} onChange={handleToggleAll} /><span style={{ fontWeight: 'bold', color: '#0f172a' }}>Tất cả</span></label>
              {(options || []).map((val: any) => (
                <label key={val} className="filter-checkbox-item"><input type="checkbox" checked={filters[filterKey]?.includes(val) || false} onChange={(e) => handleToggleItem(val, e.target.checked)}/><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatValue(val)}</span></label>
              ))}
            </div>
            <div className="filter-popover-footer"><button className="filter-btn-reset" onClick={handleToggleAll}>Bỏ lọc</button><button className="filter-btn-apply" onClick={() => setOpenFilter(null)}>Áp dụng</button></div>
          </div>
        )}
      </th>
    );
  };

  const getStorageTime = (dateString: string | null) => {
    if (!dateString) return '';
    const diffMs = new Date().getTime() - new Date(dateString).getTime();
    const days = Math.floor(diffMs / 86400000); 
    if (days < 0) return ''; 
    if (days === 0) return 'Nhập hôm nay';
    if (days === 1) return '1 ngày trước';
    return `${days} ngày trước`;
  };

  return (
    <div className="table-responsive" style={{ overflow: 'visible' }}>
      <table className="mart-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: "10px" }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            {renderColumnHeader('name', 'name', 'SẢN PHẨM', uniqueNames, (val) => val)}
            {renderColumnHeader('stock', 'stock', 'TỒN', uniqueStocks, (val) => Number(val).toLocaleString())}
            {role === 'admin' && renderColumnHeader('import_price', 'import_price', 'GIÁ VỐN', uniqueImportPrices, (val) => `${Number(val || 0).toLocaleString()}đ`)}
            {renderColumnHeader('sale_price', 'sale_price', 'GIÁ BÁN', uniqueSalePrices, (val) => `${Number(val).toLocaleString()}đ`)}
            {renderColumnHeader('expiry_date', 'expiry_date', 'HẠN SỬ DỤNG', uniqueExpiries, (val) => val ? new Date(val).toLocaleDateString('vi-VN') : 'Không có', true)}
            <th style={{ padding: '10px 8px', color: '#64748b' }}>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {visibleProducts.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Không tìm thấy sản phẩm nào.</td></tr>
          ) : (
            visibleProducts.map(p => {
              if(!p) return null;
              const gift = parseGift(p.gift_info);
              const isUrgent = p.expiry_date && (new Date(p.expiry_date).getTime() - new Date().getTime()) / 86400000 <= 45;
              
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>{cleanName(p.name)}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}><span style={{ cursor: 'pointer' }} title="Click để sao chép" onClick={() => { navigator.clipboard.writeText(p.product_code); }}>Mã: {p.product_code}</span></div>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontWeight: 'bold', color: p.stock <= 0 ? '#ef4444' : p.stock < 10 ? '#f59e0b' : '#10b981', cursor: role === 'admin' ? 'pointer' : 'default' }} onClick={() => role === 'admin' && handleEdit(p.id, 'stock', p.stock)}>
                      {Number(p.stock || 0).toLocaleString()}
                    </span>
                  </td>
                  {role === 'admin' && (
                    <td style={{ padding: '10px 8px', color: '#64748b', cursor: 'pointer' }} onClick={() => handleEdit(p.id, 'import_price', p.import_price)}>
                      {Number(p.import_price || 0).toLocaleString()}đ
                    </td>
                  )}
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#3b82f6', cursor: role === 'admin' ? 'pointer' : 'default' }} onClick={() => role === 'admin' && handleEdit(p.id, 'sale_price', p.sale_price)}>{Number(p.sale_price || 0).toLocaleString()}đ</div>
                    {p.promo_price > 0 && <div style={{ fontSize: '11px', color: '#ef4444', cursor: role === 'admin' ? 'pointer' : 'default' }} onClick={() => role === 'admin' && handleEdit(p.id, 'promo_price', p.promo_price)}>[GV]: {Number(p.promo_price).toLocaleString()}đ</div>}
                    {gift && <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '2px', cursor: role === 'admin' ? 'pointer' : 'default' }} onClick={() => role === 'admin' && handleEdit(p.id, 'gift_info', p.gift_info, true)}>🎁 Tặng {gift.text} (HĐ ≥ {gift.cond.toLocaleString()})</div>}
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '12px' }}>
                    <div style={{ color: isUrgent ? '#ef4444' : '#0f172a', fontWeight: isUrgent ? 'bold' : '600', cursor: role === 'admin' ? 'pointer' : 'default' }} onClick={() => role === 'admin' && handleEdit(p.id, 'expiry_date', p.expiry_date, true)}>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : '---'}</div>
                    {p.created_at && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{getStorageTime(p.created_at)}</div>}
                    {isUrgent && p.expiry_date && <div style={{ fontSize: '10px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>Cận date!</div>}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => addToCart(p)} style={{ padding: '6px 12px', background: '#eab308', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>+ GIỎ</button>
                      <button onClick={() => handlePrintBarcode(p)} style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }} title="In Tem Mã Vạch">🖨️ Tem</button>
                      {role === 'admin' && <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '6px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Xóa sản phẩm">🗑️</button>}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {totalProducts > visibleCount && (
        <button onClick={() => setVisibleCount(prev => prev + 50)} style={{ width: "100%", padding: "12px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", color: "#3b82f6", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s", display: "block" }}>⏬ Tải thêm 50 sản phẩm (Còn {totalProducts - visibleCount} mặt hàng bị ẩn)</button>
      )}
    </div>
  );
};
