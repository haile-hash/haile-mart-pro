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

  const getCustomerDetail = (phone: string) => phone ? (customers[phone] || null) : null;

  // =====================================================================
  // 1A. IN BILL NHIỆT (MÁY POS K80) - CĂN GIỮA, CHUẨN FORM CHUYÊN NGHIỆP
  // =====================================================================
  if (printMode === 'receipt_thermal') {
    if (!lastOrder) return null;

    return (
      <div className="print-only-zone" style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ width: '78mm', fontFamily: 'Arial, sans-serif', color: '#000', padding: '0', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>HẢI LÊ MART</h2>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>ĐC: 123 Đường ABC, Hà Nội</p>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>Hotline: 0902 613 899</p>
            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
            <h3 style={{ margin: '8px 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>PHIẾU THANH TOÁN</h3>
          </div>

          <div style={{ fontSize: '12px', marginBottom: '10px', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Số HĐ:</span><span style={{ fontWeight: 'bold' }}>{lastOrder.orderId}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ngày:</span><span>{lastOrder.time}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khách hàng:</span><span>{lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(${lastOrder.custPhone})` : ""}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thu ngân:</span><span>{role === 'admin' ? 'Quản lý' : 'Thu ngân'}</span></div>
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 0', textAlign: 'left', borderBottom: '1px solid #000' }}>Tên SP</th>
                  <th style={{ padding: '4px 0', textAlign: 'center', width: '25px', borderBottom: '1px solid #000' }}>SL</th>
                  <th style={{ padding: '4px 0', textAlign: 'right', width: '70px', borderBottom: '1px solid #000' }}>T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {lastOrder.cart?.map((item: any, idx: number) => {
                  const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                  const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                  return (
                    <tr key={idx}>
                      <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
                        <div style={{ wordBreak: 'break-word', fontWeight: 'bold' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</div>
                        <div style={{ fontSize: '11px', color: '#333' }}>{price.toLocaleString()}</div>
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'center', verticalAlign: 'top' }}>{item.qty}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tổng tiền hàng:</span><span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Chiết khấu/Giảm giá:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', margin: '6px 0' }}>
              <span>TỔNG CỘNG:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
            
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>Phương thức TT:</span><span style={{fontWeight: 'bold'}}>{lastOrder.paymentMethod}</span></div>
            {(lastOrder.paymentMethod === 'TIỀN MẶT' || lastOrder.paymentMethod === 'KẾT HỢP') && lastOrder.customerGiven > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>Tiền khách đưa:</span><span>{Number(lastOrder.customerGiven).toLocaleString()}đ</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>Tiền trả lại:</span><span style={{fontWeight: 'bold'}}>{Math.max(0, lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</span></div>
              </>
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', fontStyle: 'italic', borderTop: '1px dashed #000', paddingTop: '10px' }}>
            Cảm ơn Quý khách & Hẹn gặp lại!
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 1B. IN HÓA ĐƠN A4 / A5 - CHUẨN FORM KẾ TOÁN ERP TỐI THƯỢNG
  // =====================================================================
  if (printMode === 'receipt_a4') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);

    return (
      <div className="print-only-zone" style={{ width: '100%', backgroundColor: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '15mm 20mm', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
            <div style={{ width: '55%' }}>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG HẢI LÊ MART</h1>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP. Hà Nội</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Điện thoại:</strong> 0902 613 899</p>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 'bold' }}>HÓA ĐƠN BÁN HÀNG</h2>
              <p style={{ margin: '3px 0', fontSize: '14px', fontStyle: 'italic' }}>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}>Số: <strong>{lastOrder.orderId}</strong></p>
            </div>
          </div>

          <div style={{ marginBottom: '20px', fontSize: '15px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Họ tên khách hàng:</span><strong>{lastOrder.custName || "Khách lẻ"}</strong></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Số điện thoại:</span><span>{lastOrder.custPhone || "........................................................................................."}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Địa chỉ:</span><span>{cDetail?.address || "........................................................................................."}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Phương thức thanh toán:</span><strong>{lastOrder.paymentMethod}</strong></div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '15px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '50px' }}>STT</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>Tên hàng hóa, dịch vụ</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '70px' }}>ĐVT</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '80px' }}>Số lượng</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '120px' }}>Đơn giá</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '140px' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart?.map((item: any, idx: number) => {
                const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Cái</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{price.toLocaleString()}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{(price * item.qty).toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Cộng tiền hàng:</td>
                <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}</td>
              </tr>
              {lastOrder.discount > 0 && (
                <tr>
                  <td colSpan={5} style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Chiết khấu / Giảm giá:</td>
                  <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>-{Math.round(lastOrder.discount).toLocaleString()}</td>
                </tr>
              )}
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>TỔNG CỘNG THANH TOÁN:</td>
                <td style={{ border: '1px solid #000', padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td>
              </tr>
            </tbody>
          </table>

          {(lastOrder.paymentMethod === 'TIỀN MẶT' || lastOrder.paymentMethod === 'KẾT HỢP') && lastOrder.customerGiven > 0 && (
            <div style={{ fontSize: '15px', marginBottom: '25px', lineHeight: '1.6' }}>
                <p style={{ margin: 0 }}>- Số tiền khách đưa: <strong>{Number(lastOrder.customerGiven).toLocaleString()}đ</strong></p>
                <p style={{ margin: 0 }}>- Số tiền trả lại khách: <strong>{Math.max(0, lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</strong></p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            <div style={{ textAlign: 'center', width: '250px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Người mua hàng</p>
              <p style={{ margin: '0 0 90px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ textAlign: 'center', width: '250px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Người bán hàng</p>
              <p style={{ margin: '0 0 90px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, đóng dấu)</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{role === 'admin' ? 'Quản lý' : 'Thu ngân'} {shift}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 2. IN MÃ VẠCH (BARCODE) - API ỔN ĐỊNH CAO
  // =====================================================================
  if (printMode === 'barcode') {
    if (!printBarcodeProduct) return null;
    const code = printBarcodeProduct.product_code;
    const name = printBarcodeProduct.name.replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
    const price = printBarcodeProduct.sale_price;
    // Đổi sang API khác cực kỳ ổn định để tránh tình trạng ảnh không load được
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(code)}&code=Code128&dpi=96`;

    return (
      <div className="print-only-zone barcode-print-grid" style={{ width: '100%', backgroundColor: '#fff', padding: '10mm', boxSizing: 'border-box' }}>
        {Array.from({ length: barcodeCount }).map((_, idx) => (
          <div key={idx} style={{ border: '1px dashed #94a3b8', padding: '8px', textAlign: 'center', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#000', height: '36mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', pageBreakInside: 'avoid', overflow: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>HẢI LÊ MART</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanName(name)}</div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img src={barcodeUrl} alt={code} style={{ maxWidth: '95%', height: '14mm', objectFit: 'fill' }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900' }}>{Number(price).toLocaleString()}đ</div>
          </div>
        ))}
      </div>
    );
  }

  // Các chế độ khác giữ nguyên... (PO, Thẻ VIP)
  if (printMode === 'customer_card') {
    if (!printCustomer) return null;
    const code = printCustomer.cardCode || printCustomer.phone;
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(code)}&code=Code128&dpi=96`;

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
          </div>
        </div>
      </div>
    );
  }

  return null;
};
