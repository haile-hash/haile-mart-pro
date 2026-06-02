import React from 'react';
import { Product } from '../../types';
import { cleanName, getActualPrice } from '../../utils/helpers';

interface ScannerModalProps {
  product: Product;
  barcodeCount: number;
  setBarcodeCount: (val: number) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ product, barcodeCount, setBarcodeCount, onClose }) => {
  // Lấy tên cửa hàng động để chèn vào tem
  const storeInfo = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem("mart_current_store") || "{}") : {};
  const storeBrandName = storeInfo.store_name ? storeInfo.store_name.toUpperCase() : "HỆ THỐNG POS PRO";

  // Tạo URL ảnh mã vạch động
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(product.product_code || '')}&scale=2&height=10&includetext=false`;

  // Hàm kích hoạt in riêng khu vực tem
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
      
      {/* KHU VỰC CÀI ĐẶT (KHÔNG IN) */}
      <div className="no-print" style={{ background: '#ffffff', borderRadius: '12px', width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>🖨️ In Tem Mã Vạch</h2>
        
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{cleanName(product.name)}</div>
          <div style={{ color: '#64748b', fontSize: '13px' }}>Mã: {product.product_code}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Số lượng tem cần in:</label>
          <input 
            type="number" 
            min="1" 
            value={barcodeCount} 
            onChange={(e) => setBarcodeCount(parseInt(e.target.value) || 1)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handlePrint} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Ra Lệnh In</button>
        </div>
      </div>

      {/* KHU VỰC ẨN: CHỈ HIỂN THỊ TRÊN GIẤY IN */}
      <div className="print-only-zone barcode-print-grid" style={{ display: 'none' }}>
        {Array.from({ length: barcodeCount }).map((_, idx) => (
          <div key={idx} style={{ width: '100%', padding: '6px', border: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', background: '#fff', height: '100%' }}>
            {/* Tên thương hiệu trên cùng của tem */}
            <div style={{ fontSize: '11px', fontWeight: '900', color: '#000', marginBottom: '2px', textAlign: 'center', letterSpacing: '0.5px' }}>
              {storeBrandName}
            </div>
            {/* Tên sản phẩm */}
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {cleanName(product.name)}
            </div>
            {/* Mã Vạch */}
            <img src={barcodeUrl} alt="barcode" style={{ width: '90%', height: '40px', objectFit: 'contain' }} />
            {/* Mã số và Giá */}
            <div style={{ fontSize: '10px', color: '#000', marginTop: '4px', textAlign: 'center', fontFamily: 'monospace' }}>
              {product.product_code}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '900', color: '#000', marginTop: '2px' }}>
              {getActualPrice(product).toLocaleString()}đ
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
