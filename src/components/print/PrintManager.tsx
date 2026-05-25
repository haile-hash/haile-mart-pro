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
  // 1. IN HÓA ĐƠN BÁN HÀNG - PHÂN TẦNG KHỔ RỘNG CHUẨN ĐẸP A4/A5 (2 LIÊN)
  // =====================================================================
  if (printMode === 'receipt') {
    if (!lastOrder) return null;

    const renderReceiptContent = (lienTitle: string) => {
      return (
        <div style={{ padding: '20px 30px', width: '100%', maxWidth: '210mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000', boxSizing: 'border-box' }}>
          {/* Đầu hóa đơn */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #000', paddingBottom: '12px', marginBottom: '15px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.5px' }}>HẢI LÊ MART</h1>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>📍 ĐC: 123 Đường ABC, Hà Nội</p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>📞 Hotline: 0902 613 899</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>HÓA ĐƠN BÁN HÀNG</h2>
              <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>{lienTitle}</p>
            </div>
          </div>

          {/* Thông tin đơn hàng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px', marginBottom: '15px' }}>
            <div>
              <p style={{ margin: '3px 0' }}><strong>Mã HĐ:</strong> {lastOrder.orderId}</p>
              <p style={{ margin: '3px 0' }}><strong>Thời gian:</strong> {lastOrder.time}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '3px 0' }}><strong>Khách hàng:</strong> {lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(${lastOrder.custPhone})` : ""}</p>
              <p style={{ margin: '3px 0' }}><strong>Thu ngân:</strong> {role === 'admin' ? 'Quản lý' : 'Thu ngân'} ({lastOrder.shift || shift})</p>
            </div>
          </div>

          {/* Bảng sản phẩm khổ rộng */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '8px', textAlign: 'center', width: '40px', border: '1px solid #cbd5e1' }}>STT</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Tên sản phẩm</th>
                <th style={{ padding: '8px', textAlign: 'center', width: '60px', border: '1px solid #cbd5e1' }}>SL</th>
                <th style={{ padding: '8px', textAlign: 'right', width: '100px', border: '1px solid #cbd5e1' }}>Đơn giá</th>
                <th style={{ padding: '8px', textAlign: 'right', width: '120px', border: '1px solid #cbd5e1' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart?.map((item: any, idx: number) => {
                const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                // HÀM CHẶT ĐỨT CHỮ LÔ MỚI / LÔ CŨ
                const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();

                return (
                  <tr key={idx}>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: '500' }}>
                      {cleanProductName} {item.product?.isHappyHour && '⭐'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{item.qty}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{price.toLocaleString()}đ</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}đ</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Phần chân tính tiền & chữ ký */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '10px' }}>
            <div style={{ textAlign: 'center', width: '200px', fontSize: '13px', paddingTop: '10px' }}>
              <p style={{ margin: '0 0 45px 0' }}><strong>Khách hàng</strong></p>
              <p style={{ margin: 0, fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>(Ký và ghi rõ họ tên)</p>
            </div>

            <div style={{ width: '320px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span>Tiền hàng tổng cộng:</span>
                <span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span>
              </div>
              {lastOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: '#dc2626' }}>
                  <span>Giảm giá / VIP / Voucher:</span>
                  <span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '16px', fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '6px' }}>
                <span>TỔNG THANH TOÁN:</span>
                <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontSize: '11px', color: '#475569' }}>
                <span>Hình thức thanh toán:</span>
                <span style={{ fontWeight: 'bold' }}>{lastOrder.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', fontSize: '11px', fontStyle: 'italic' }}>
            Cảm ơn Quý khách & Hẹn gặp lại! Powered by Hải Lê ERP
          </div>
        </div>
      );
    };

    return (
      <div className="print-only-zone">
        <div>{renderReceiptContent("LIÊN 1: LƯU TẠI TIỆM")}</div>
        <div style={{ pageBreakAfter: 'always', height: '1px' }}></div>
        <div style={{ marginTop: '20px' }}>{renderReceiptContent("LIÊN 2: GIAO KHÁCH HÀNG")}</div>
      </div>
    );
  }

  // =====================================================================
  // 2. IN MÃ VẠCH (BARCODE) CHUẨN ĐỨT NÉT KHỔ GIẤY
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
            <div style={{ width: '100%', textAlgin: 'center' }}>
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
  // 3. IN THÈ KHÁCH HÀNG VIP
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
