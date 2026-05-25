/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { cleanName } from '../../utils/helpers';

interface PrintManagerProps {
  printMode: 'receipt_thermal' | 'receipt_a4' | 'barcode' | 'customer_card' | 'po_order' | 'po_receipt' | 'po_return' | null;
  lastOrder: any;
  shift: string;
  role: string;
  customers: any;
  VAT_RATE: number;
  printBarcodeProduct: any;
  barcodeCount: number;
  printCustomer: any;
  printPOData: any;
}

export const PrintManager: React.FC<PrintManagerProps> = ({
  printMode, lastOrder, shift, role, customers, VAT_RATE, printBarcodeProduct, barcodeCount, printCustomer, printPOData,
}) => {
  if (!printMode) return null;

  // Lấy thông tin khách hàng từ db cục bộ (để lấy địa chỉ)
  const getCustomerDetail = (phone: string) => {
    if (!phone) return null;
    return customers[phone] || null;
  };

  // =====================================================================
  // 1A. IN BILL NHIỆT (MÁY K80 / K58)
  // =====================================================================
  if (printMode === 'receipt_thermal') {
    if (!lastOrder) return null;

    return (
      <div className="print-only-zone" style={{ width: '80mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000', padding: '10px 5px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '5px', marginBottom: '8px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>HẢI LÊ MART</h2>
          <p style={{ margin: '2px 0', fontSize: '11px' }}>ĐC: 123 Đường ABC, Hà Nội</p>
          <p style={{ margin: '2px 0', fontSize: '11px' }}>Hotline: 0902 613 899</p>
          <h3 style={{ margin: '8px 0 2px 0', fontSize: '14px', fontWeight: 'bold' }}>PHIẾU THANH TOÁN</h3>
        </div>

        <div style={{ fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mã HĐ:</span><span>{lastOrder.orderId}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ngày:</span><span>{lastOrder.time}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khách:</span><span>{lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(${lastOrder.custPhone})` : ""}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thu ngân:</span><span>{role === 'admin' ? 'Quản lý' : 'Thu ngân'}</span></div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px' }}>
          <thead>
            <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
              <th style={{ padding: '4px 0', textAlign: 'left' }}>Sản phẩm</th>
              <th style={{ padding: '4px 0', textAlign: 'center', width: '25px' }}>SL</th>
              <th style={{ padding: '4px 0', textAlign: 'right', width: '60px' }}>T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {lastOrder.cart?.map((item: any, idx: number) => {
              const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
              const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
              return (
                <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                  <td style={{ padding: '4px 0', wordBreak: 'break-word' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</td>
                  <td style={{ padding: '4px 0', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{(price * item.qty).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontSize: '11px', lineHeight: '1.4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tổng hàng:</span><span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span></div>
          {lastOrder.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Giảm giá:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
            <span>TỔNG CỘNG:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thanh toán:</span><span style={{fontWeight: 'bold'}}>{lastOrder.paymentMethod}</span></div>
          {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tiền khách đưa:</span><span>{Number(lastOrder.customerGiven).toLocaleString()}đ</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thừa trả lại:</span><span>{Math.max(0, lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</span></div>
            </>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', fontStyle: 'italic' }}>Cảm ơn & Hẹn gặp lại!</div>
      </div>
    );
  }

  // =====================================================================
  // 1B. IN HÓA ĐƠN A4 / A5 (CHUYÊN NGHIỆP)
  // =====================================================================
  if (printMode === 'receipt_a4') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);

    return (
      <div className="print-only-zone" style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '20px 30px', fontFamily: 'Arial, sans-serif', color: '#000', boxSizing: 'border-box' }}>
        
        {/* Header Hóa Đơn */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '15px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '900', color: '#dc2626' }}>HẢI LÊ MART</h1>
            <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Địa chỉ:</strong> 123 Đường ABC, Hà Nội</p>
            <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Hotline:</strong> 0902 613 899</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>Hóa Đơn Bán Hàng</h2>
            <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Mã số:</strong> {lastOrder.orderId}</p>
            <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Ngày xuất:</strong> {lastOrder.time}</p>
          </div>
        </div>

        {/* Thông tin Khách hàng */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
          <p style={{ margin: 0 }}><strong>Tên khách hàng:</strong> {lastOrder.custName || "Khách lẻ"}</p>
          <p style={{ margin: 0 }}><strong>Số điện thoại:</strong> {lastOrder.custPhone || "---"}</p>
          <p style={{ margin: 0 }}><strong>Địa chỉ:</strong> {cDetail?.address || "---"}</p>
        </div>

        {/* Bảng Chi Tiết Hàng Hóa */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', textAlign: 'center', width: '50px' }}>STT</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', textAlign: 'left' }}>Tên hàng hóa, dịch vụ</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', textAlign: 'center', width: '80px' }}>Số lượng</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', textAlign: 'right', width: '120px' }}>Đơn giá</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', textAlign: 'right', width: '140px' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {lastOrder.cart?.map((item: any, idx: number) => {
              const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
              const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>{price.toLocaleString()}đ</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}đ</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Chữ ký & Tổng kết */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          
          {/* Vùng Ký Tá */}
          <div style={{ display: 'flex', gap: '50px', textAlign: 'center', marginTop: '10px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>Người mua hàng</p>
              <p style={{ margin: '0 0 60px 0', fontSize: '12px', fontStyle: 'italic', color: '#64748b' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>Đại diện cửa hàng</p>
              <p style={{ margin: '0 0 60px 0', fontSize: '12px', fontStyle: 'italic', color: '#64748b' }}>(Ký, đóng dấu)</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{role === 'admin' ? 'Quản lý' : 'Thu ngân'} ({lastOrder.shift || shift})</p>
            </div>
          </div>

          {/* Vùng Tính Tiền */}
          <div style={{ width: '350px', fontSize: '14px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
              <span>Cộng tiền hàng:</span><span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span>
            </div>
            {lastOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#ef4444' }}>
                <span>Chiết khấu / Trừ Ví VIP:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0 8px 0', fontSize: '18px', fontWeight: '900', borderTop: '2px solid #cbd5e1', paddingTop: '10px', color: '#0f172a' }}>
              <span>TỔNG THANH TOÁN:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
            
            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '13px' }}>
                <span>Hình thức thanh toán:</span><span style={{ fontWeight: 'bold', color: '#2563eb' }}>{lastOrder.paymentMethod}</span>
              </div>
              {lastOrder.paymentMethod === 'TIỀN MẶT' || lastOrder.paymentMethod === 'KẾT HỢP' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '13px' }}>
                    <span>Tiền mặt khách đưa:</span><span>{Number(lastOrder.customerGiven || 0).toLocaleString()}đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '13px' }}>
                    <span>Tiền thừa trả khách:</span><span style={{ fontWeight: 'bold' }}>{Math.max(0, (lastOrder.customerGiven || 0) - lastOrder.finalTotal).toLocaleString()}đ</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // =====================================================================
  // 2. IN MÃ VẠCH
  // =====================================================================
  if (printMode === 'barcode') {
    if (!printBarcodeProduct) return null;
    const code = printBarcodeProduct.product_code;
    const name = printBarcodeProduct.name.replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
    const price = printBarcodeProduct.sale_price;
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=3&height=12&includetext=false`;

    return (
      <div className="print-only-zone barcode-print-grid">
        {Array.from({ length: barcodeCount }).map((_, idx) => (
          <div key={idx} style={{ border: '1px dashed #94a3b8', padding: '6px', textAlign: 'center', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#000', height: '34mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', pageBreakInside: 'avoid', overflow: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>HẢI LÊ MART</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanName(name)}</div>
            <div style={{ width: '100%' }}>
              <img src={barcodeUrl} alt="Barcode" style={{ maxWidth: '95%', height: '13mm', objectFit: 'contain' }} />
              <div style={{ fontSize: '9px', fontFamily: 'monospace' }}>{code}</div>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '900' }}>{Number(price).toLocaleString()}đ</div>
          </div>
        ))}
      </div>
    );
  }

  // =====================================================================
  // CÁC CHẾ ĐỘ IN KHÁC (Thẻ VIP, PO) giữ nguyên...
  // =====================================================================
  if (printMode === 'customer_card') {
    if (!printCustomer) return null;
    const code = printCustomer.cardCode || printCustomer.phone;
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=false`;

    return (
      <div className="print-only-zone" style={{ padding: '20px', backgroundColor: '#fff', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '86mm', height: '54mm', border: '2px solid #b91c1c', borderRadius: '8px', padding: '10px', background: 'linear-gradient(135deg, #fff7ed 0%, #fffff0 100%)', fontFamily: 'Arial, sans-serif', color: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dc2626', paddingBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '14px' }}>HẢI LÊ MART</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ea580c', backgroundColor: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>VIP CARD</span>
          </div>
          <div style={{ margin: '8px 0' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{printCustomer.name}</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>SĐT: {printCustomer.phone}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src={barcodeUrl} alt="Barcode VIP" style={{ height: '25px', maxWidth: '100%' }} />
            <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}>{code}</div>
          </div>
        </div>
      </div>
    );
  }

  if (printMode === 'po_order' || printMode === 'po_receipt' || printMode === 'po_return') {
    if (!printPOData) return null;
    const isReceipt = printMode === 'po_receipt';
    const isReturn = printMode === 'po_return';
    let title = isReceipt ? "PHIẾU NHẬP KHO CHÍNH THỨC" : isReturn ? "PHIẾU ĐỔI TRẢ HÀNG LỖI (NCC)" : "PHIẾU ĐẶT HÀNG (PO)";

    return (
      <div className="print-only-zone" style={{ padding: '30px', color: '#000', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <div>
            <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>HẢI LÊ MART</h1>
            <p style={{ margin: '2px 0' }}>Hotline: 0902 613 899</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{title}</h2>
            <p style={{ margin: '2px 0' }}>Mã Số: {printPOData.po_code}</p>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #000', padding: '6px' }}>STT</th>
              <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Tên mặt hàng</th>
              <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>SL Đặt</th>
              <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Giá Nhập</th>
              <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {printPOData.items?.map((item: any, idx: number) => {
              const qty = isReceipt ? (item.qty - (item.damagedQty || 0)) : item.qty;
              if (qty <= 0) return null;
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{item.product?.name || item.name}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{qty}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{Number(item.importPrice).toLocaleString()}đ</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{(qty * item.importPrice).toLocaleString()}đ</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
          Tổng cộng thực tế: {Number(printPOData.total_amount || 0).toLocaleString()}đ
        </div>
      </div>
    );
  }

  return null;
};
