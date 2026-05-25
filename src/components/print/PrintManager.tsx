/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { cleanName } from '../../utils/helpers';

interface PrintManagerProps {
  printMode: 'receipt' | 'barcode' | 'customer_card' | 'po_order' | 'po_receipt' | 'po_return' | null;
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
  printMode, lastOrder, shift, role, VAT_RATE, printBarcodeProduct, barcodeCount, printCustomer, printPOData,
}) => {
  if (!printMode) return null;

  // =====================================================================
  // 1. IN HÓA ĐƠN BÁN HÀNG - HỖ TRỢ SONG SONG KHỔ BILL NHIỆT 80MM & KHỔ A4/A5
  // =====================================================================
  if (printMode === 'receipt') {
    if (!lastOrder) return null;

    const renderReceiptContent = (lienTitle: string) => {
      return (
        <div className="responsive-invoice-box" style={{ padding: '10px', width: '100%', maxWidth: '100%', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000', boxSizing: 'border-box', lineHeight: '1.4' }}>
          {/* Đầu hóa đơn */}
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>HẢI LÊ MART</h2>
            <p style={{ margin: '1px 0', fontSize: '11px' }}>📍 ĐC: 123 Đường ABC, Hà Nội | 📞 Hotline: 0902 613 899</p>
            <h3 style={{ margin: '8px 0 2px 0', fontSize: '15px', fontWeight: 'bold' }}>HÓA ĐƠN BÁN HÀNG</h3>
            <p style={{ margin: '0', fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>({lienTitle})</p>
          </div>

          {/* Thông tin đơn hàng ngắn gọn */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: '12px', marginBottom: '10px', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>
            <div>
              <div style={{ margin: '2px 0' }}><strong>Mã HĐ:</strong> {lastOrder.orderId}</div>
              <div style={{ margin: '2px 0' }}><strong>Thời gian:</strong> {lastOrder.time}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ margin: '2px 0' }}><strong>Khách:</strong> {lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(${lastOrder.custPhone})` : ""}</div>
              <div style={{ margin: '2px 0' }}><strong>Thu ngân:</strong> {role === 'admin' ? 'Quản lý' : 'Thu ngân'} ({lastOrder.shift || shift})</div>
            </div>
          </div>

          {/* Bảng sản phẩm tự thích ứng độ rộng dòng */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '6px 4px', textAlign: 'left' }}>Sản phẩm</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', width: '35px' }}>SL</th>
                <th style={{ padding: '6px 4px', textAlign: 'right', width: '70px' }}>Đơn giá</th>
                <th style={{ padding: '6px 4px', textAlign: 'right', width: '80px' }}>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart?.map((item: any, idx: number) => {
                const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                // CHẶT ĐỨT HOÀN TOÀN CHỮ [LÔ MỚI], [LÔ CŨ]
                const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();

                return (
                  <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                    <td style={{ padding: '6px 4px', wordBreak: 'break-word' }}>
                      {cleanProductName} {item.product?.isHappyHour && '⭐'}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>{price.toLocaleString()}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Phần cộng tiền */}
          <div style={{ borderTop: '1px solid #000', paddingTop: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Tổng tiền hàng mua:</span>
              <span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span>
            </div>
            {lastOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', color: '#dc2626' }}>
                <span>Chiết khấu / VIP / Voucher:</span>
                <span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '15px', fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '5px' }}>
              <span>TỔNG THANH TOÁN:</span>
              <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '11px', color: '#475569' }}>
              <span>Phương thức chi trả:</span>
              <span style={{ fontWeight: 'bold' }}>{lastOrder.paymentMethod}</span>
            </div>
            {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '11px' }}>
                <span>Tiền mặt trả thừa khách:</span>
                <span>{Math.max(0, lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px', borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '11px', fontStyle: 'italic' }}>
            Cảm ơn Quý khách & Hẹn gặp lại!
          </div>
        </div>
      );
    };

    return (
      <div className="print-only-zone">
        <div style={{ width: '100%', margin: '0 auto' }}>{renderReceiptContent("LIÊN 1: LƯU TẠI CỬA HÀNG")}</div>
        <div style={{ pageBreakAfter: 'always', height: '1px' }}></div>
        <div style={{ width: '100%', margin: '20px auto 0' }}>{renderReceiptContent("LIÊN 2: GIAO CHO KHÁCH HÀNG")}</div>
      </div>
    );
  }

  // =====================================================================
  // 2. IN MÃ VẠCH (BARCODE) SẢN PHẨM KHÔNG CHỨA CHỮ LÔ HÀNG
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
  // 3. IN THẺ VIP KHÁCH HÀNG
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

  // =====================================================================
  // 4. IN PHIẾU NHẬP HÀNG / ĐẶT HÀNG NCC (PO)
  // =====================================================================
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
