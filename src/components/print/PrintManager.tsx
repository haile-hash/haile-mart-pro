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

  const getCustomerDetail = (phone: string) => {
    if (!phone) return null;
    return customers[phone] || null;
  };

  // =====================================================================
  // 1A. IN BILL NHIỆT (MÁY POS K80) - TỐI ƯU HIỂN THỊ DỌC
  // =====================================================================
  if (printMode === 'receipt_thermal') {
    if (!lastOrder) return null;

    return (
      <div className="print-only-zone" style={{ width: '78mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000', padding: '0', boxSizing: 'border-box' }}>
        
        {/* Header Cửa hàng */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>HẢI LÊ MART</h2>
          <p style={{ margin: '0', fontSize: '11px' }}>ĐC: 123 Đường ABC, Hà Nội</p>
          <p style={{ margin: '0', fontSize: '11px' }}>Hotline: 0902 613 899</p>
          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }}></div>
          <h3 style={{ margin: '6px 0 2px 0', fontSize: '15px', fontWeight: 'bold' }}>PHIẾU THANH TOÁN</h3>
        </div>

        {/* Thông tin hóa đơn */}
        <div style={{ fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Số HĐ:</span><span style={{ fontWeight: 'bold' }}>{lastOrder.orderId}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ngày:</span><span>{lastOrder.time}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khách hàng:</span><span>{lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(${lastOrder.custPhone})` : ""}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thu ngân:</span><span>{role === 'admin' ? 'Quản lý' : 'Thu ngân'}</span></div>
        </div>

        {/* Chi tiết mặt hàng */}
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ padding: '2px 0', textAlign: 'left', borderBottom: '1px solid #000' }}>Tên SP</th>
                <th style={{ padding: '2px 0', textAlign: 'center', width: '20px', borderBottom: '1px solid #000' }}>SL</th>
                <th style={{ padding: '2px 0', textAlign: 'right', width: '60px', borderBottom: '1px solid #000' }}>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart?.map((item: any, idx: number) => {
                const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                return (
                  <tr key={idx}>
                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>
                      <div style={{ wordBreak: 'break-word', fontWeight: 'bold' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</div>
                      <div style={{ fontSize: '10px', color: '#333' }}>{price.toLocaleString()}</div>
                    </td>
                    <td style={{ padding: '4px 0', textAlign: 'center', verticalAlign: 'top' }}>{item.qty}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tổng kết tiền */}
        <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tổng tiền hàng:</span><span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span></div>
          {lastOrder.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khấu trừ/Giảm giá:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', margin: '4px 0' }}>
            <span>TỔNG CỘNG:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
          </div>
          
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}><span>Phương thức TT:</span><span style={{fontWeight: 'bold'}}>{lastOrder.paymentMethod}</span></div>
          {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}><span>Tiền khách đưa:</span><span>{Number(lastOrder.customerGiven).toLocaleString()}đ</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}><span>Tiền thối lại:</span><span style={{fontWeight: 'bold'}}>{Math.max(0, lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</span></div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', fontStyle: 'italic', borderTop: '1px dashed #000', paddingTop: '8px' }}>
          Cảm ơn Quý khách & Hẹn gặp lại!
        </div>
      </div>
    );
  }

  // =====================================================================
  // 1B. IN HÓA ĐƠN A4 / A5 - CHUẨN BIỂU MẪU KẾ TOÁN
  // =====================================================================
  if (printMode === 'receipt_a4') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);

    return (
      <div className="print-only-zone" style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
        
        {/* Header Cửa hàng & Chứng từ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ width: '50%' }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG HẢI LÊ MART</h1>
            <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP. Hà Nội</p>
            <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Điện thoại:</strong> 0902 613 899</p>
          </div>
          <div style={{ width: '40%', textAlign: 'center' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>HÓA ĐƠN BÁN HÀNG</p>
            <p style={{ margin: '2px 0', fontSize: '13px', fontStyle: 'italic' }}>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
            <p style={{ margin: '2px 0', fontSize: '13px' }}>Số: <strong>{lastOrder.orderId}</strong></p>
          </div>
        </div>

        {/* Thông tin Khách hàng */}
        <div style={{ marginBottom: '15px', fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px' }}>Họ tên khách hàng:</span>
            <strong>{lastOrder.custName || "Khách lẻ"}</strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px' }}>Số điện thoại:</span>
            <span>{lastOrder.custPhone || "........................................................................."}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px' }}>Địa chỉ:</span>
            <span>{cDetail?.address || "........................................................................."}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '150px' }}>Phương thức thanh toán:</span>
            <strong>{lastOrder.paymentMethod}</strong>
          </div>
        </div>

        {/* Bảng Chi Tiết Hàng Hóa (Kẻ khung đen tuyền solid) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '40px' }}>STT</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Tên hàng hóa, dịch vụ</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '60px' }}>ĐVT</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '60px' }}>Số lượng</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px' }}>Đơn giá</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '120px' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {lastOrder.cart?.map((item: any, idx: number) => {
              const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
              const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Cái</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{price.toLocaleString()}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{(price * item.qty).toLocaleString()}</td>
                </tr>
              );
            })}
            {/* Hàng Tổng cộng đính kèm đuôi bảng */}
            <tr>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Cộng tiền hàng:</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}</td>
            </tr>
            {lastOrder.discount > 0 && (
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Chiết khấu / Giảm giá:</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>-{Math.round(lastOrder.discount).toLocaleString()}</td>
              </tr>
            )}
            <tr>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>TỔNG CỘNG THANH TOÁN:</td>
              <td style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td>
            </tr>
          </tbody>
        </table>

        {/* Khối tiền khách đưa (Nếu là tiền mặt) */}
        {(lastOrder.paymentMethod === 'TIỀN MẶT' || lastOrder.paymentMethod === 'KẾT HỢP') && lastOrder.customerGiven > 0 && (
           <div style={{ fontSize: '14px', marginBottom: '20px' }}>
              <p style={{ margin: '4px 0' }}>- Số tiền khách đưa: <strong>{Number(lastOrder.customerGiven).toLocaleString()}đ</strong></p>
              <p style={{ margin: '4px 0' }}>- Số tiền trả lại khách: <strong>{Math.max(0, lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</strong></p>
           </div>
        )}

        {/* Chữ ký */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold' }}>Người mua hàng</p>
            <p style={{ margin: '0 0 80px 0', fontSize: '13px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
          </div>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold' }}>Người bán hàng</p>
            <p style={{ margin: '0 0 80px 0', fontSize: '13px', fontStyle: 'italic' }}>(Ký, đóng dấu)</p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{role === 'admin' ? 'Quản lý' : 'Thu ngân'} {shift}</p>
          </div>
        </div>

      </div>
    );
  }

  // =====================================================================
  // 2. IN MÃ VẠCH (BARCODE)
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
