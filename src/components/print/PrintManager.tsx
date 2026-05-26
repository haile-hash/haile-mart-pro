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
  // HÀM BỔ TRỢ: TÍNH TOÁN VÀ HIỂN THỊ DÒNG TIỀN THEO HÌNH THỨC THANH TOÁN
  // =====================================================================
  const renderPaymentDetails = (order: any, cDetail: any, isA4: boolean) => {
    const total = Math.round(order.debtAmount > 0 ? order.debtAmount : order.finalTotal);
    const given = Number(order.customerGiven || 0);
    
    let cashPart = 0;
    let transferPart = 0;
    let debtPart = 0;

    if (order.paymentMethod === 'TIỀN MẶT') {
        cashPart = given > 0 ? given : total;
    } else if (order.paymentMethod === 'KẾT HỢP') {
        cashPart = given;
        transferPart = total - given;
    } else if (order.paymentMethod === 'GHI NỢ') {
        debtPart = total;
    } else {
        transferPart = total;
    }

    const change = Math.max(0, cashPart - (total - transferPart));
    const rowStyle = isA4 
        ? { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '14px' }
        : { display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '12px' };

    return (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: isA4 ? '1px dashed #cbd5e1' : '1px dashed #000' }}>
            <div style={{ ...rowStyle, fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Hình thức TT:</span>
                <span style={{ color: isA4 ? '#2563eb' : '#000', textTransform: 'uppercase' }}>{order.paymentMethod}</span>
            </div>
            {cashPart > 0 && <div style={rowStyle}><span>- Tiền mặt:</span><span style={{ fontWeight: 'bold' }}>{cashPart.toLocaleString()}đ</span></div>}
            {transferPart > 0 && <div style={rowStyle}><span>- CK/Quẹt thẻ:</span><span style={{ fontWeight: 'bold' }}>{transferPart.toLocaleString()}đ</span></div>}
            {change > 0 && <div style={rowStyle}><span>- Tiền thối lại:</span><span style={{ fontWeight: 'bold' }}>{change.toLocaleString()}đ</span></div>}
            {debtPart > 0 && <div style={{ ...rowStyle, color: isA4 ? '#ef4444' : '#000' }}><span>- Khách nợ đơn này:</span><span style={{ fontWeight: 'bold' }}>{debtPart.toLocaleString()}đ</span></div>}
            {order.paymentMethod === 'GHI NỢ' && cDetail && (
                <div style={{ ...rowStyle, marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>=&gt; TỔNG NỢ HIỆN TẠI:</span>
                    <span style={{ fontWeight: 'bold', color: isA4 ? '#ef4444' : '#000', fontSize: isA4 ? '16px' : '13px' }}>{(cDetail.debt || 0).toLocaleString()}đ</span>
                </div>
            )}
        </div>
    );
  };

  // =====================================================================
  // 1A. IN BILL NHIỆT (MÁY POS K80 - 78mm)
  // =====================================================================
  if (printMode === 'receipt_thermal') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);

    return (
      <div className="print-only-zone" style={{ width: '100%', textAlign: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'inline-block', width: '78mm', margin: '0 auto', textAlign: 'left', fontFamily: 'Arial, sans-serif', color: '#000', padding: '10px 0', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>HẢI LÊ MART</h2>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>ĐC: 123 Đường ABC, Hà Nội</p>
            <p style={{ margin: '2px 0', fontSize: '12px' }}>Hotline: 0902 613 899</p>
            <h3 style={{ margin: '10px 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>HÓA ĐƠN THANH TOÁN</h3>
            <p style={{ margin: '0', fontSize: '12px' }}>Số: {lastOrder.orderId}</p>
          </div>

          <div style={{ fontSize: '12px', marginBottom: '10px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ngày:</span><span>{lastOrder.time}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khách hàng:</span><span style={{ fontWeight: 'bold' }}>{lastOrder.custName || "Khách lẻ"}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thu ngân:</span><span>{role === 'admin' ? 'Quản lý' : 'Nhân viên'}</span></div>
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 0 6px 0', textAlign: 'left', borderBottom: '1px solid #000' }}>Sản phẩm</th>
                  <th style={{ padding: '0 0 6px 0', textAlign: 'right', borderBottom: '1px solid #000' }}>T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {lastOrder.cart?.map((item: any, idx: number) => {
                  const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                  const cleanProductName = (item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                  return (
                    <React.Fragment key={idx}>
                      <tr>
                        <td colSpan={2} style={{ paddingTop: '6px', fontWeight: 'bold' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '6px', color: '#333' }}>{item.qty} x {price.toLocaleString()}</td>
                        <td style={{ paddingBottom: '6px', textAlign: 'right', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cộng tiền hàng:</span><span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Giảm giá:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', margin: '8px 0', borderTop: '1px solid #000', paddingTop: '8px' }}>
              <span>TỔNG CỘNG:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
            
            <div style={{ marginTop: '10px', background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
              {renderPaymentDetails(lastOrder, cDetail, false)}
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', fontStyle: 'italic' }}>
            Cảm ơn Quý khách & Hẹn gặp lại!
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 1B. IN HÓA ĐƠN BÁN HÀNG (KHỔ GIẤY A4 CHUẨN)
  // =====================================================================
  if (printMode === 'receipt_a4') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);

    return (
      <div className="print-only-zone" style={{ width: '100%', backgroundColor: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '15mm 20mm', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '25px' }}>
            <div style={{ width: '55%' }}>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG HẢI LÊ MART</h1>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP. Hà Nội</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Điện thoại:</strong> 0902 613 899</p>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 'bold' }}>HÓA ĐƠN BÁN HÀNG</h2>
              <p style={{ margin: '3px 0', fontSize: '14px', fontStyle: 'italic' }}>Ngày {dateObj.getDate()} tháng {dateObj.getMonth() + 1} năm {dateObj.getFullYear()}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}>Số chứng từ: <strong>{lastOrder.orderId}</strong></p>
            </div>
          </div>

          <div style={{ marginBottom: '25px', fontSize: '15px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Họ tên khách hàng:</span><strong>{lastOrder.custName || "Khách mua lẻ"}</strong></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Số điện thoại:</span><span>{lastOrder.custPhone || "........................................................................................."}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Địa chỉ giao hàng:</span><span>{cDetail?.address || "........................................................................................."}</span></div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
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
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{cleanProductName} {item.product?.isHappyHour && '⭐'}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Cái</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{price.toLocaleString()}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}>
                <span>Cộng tiền hàng hóa:</span>
                <span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span>
              </div>
              {lastOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}>
                  <span>Chiết khấu / Giảm giá:</span>
                  <span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '20px', fontWeight: 'bold', borderTop: '2px solid #000', borderBottom: '2px solid #000', margin: '8px 0' }}>
                <span>TỔNG PHẢI THANH TOÁN:</span>
                <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
              </div>
              
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                {renderPaymentDetails(lastOrder, cDetail, true)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <div style={{ textalign: 'center', width: '250px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Người mua hàng</p>
              <p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ textAlign: 'center', width: '250px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>HẢI LÊ MART</p>
              <p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Đại diện cửa hàng ký, đóng dấu)</p>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{role === 'admin' ? 'Quản lý' : 'Thu ngân'} {shift}</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // =====================================================================
  // 2. IN MÃ VẠCH SẢN PHẨM (BARCODE - GRID NHIỀU TEM)
  // =====================================================================
  if (printMode === 'barcode') {
    if (!printBarcodeProduct) return null;
    const code = printBarcodeProduct.product_code;
    const name = printBarcodeProduct.name.replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
    const price = printBarcodeProduct.sale_price;
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

  // =====================================================================
  // 3. IN THẺ VIP ĐẶC QUYỀN KHÁCH HÀNG (ĐÃ SỬA LỖI TÀNG HÌNH CHROME)
  // =====================================================================
  if (printMode === 'customer_card') {
    if (!printCustomer) return null;
    const code = printCustomer.cardCode || printCustomer.phone;
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(code)}&code=Code128&dpi=96`;

    return (
      <div className="print-only-zone" style={{ width: '100%', backgroundColor: '#fff', textAlign: 'center', paddingTop: '20mm' }}>
        <div style={{ 
          display: 'inline-flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '86mm', 
          height: '54mm', 
          border: '2px solid #b91c1c', 
          borderRadius: '8px', 
          padding: '12px', 
          background: '#fff7ed', 
          backgroundImage: 'linear-gradient(135deg, #fff7ed 0%, #fffff0 100%)', 
          fontFamily: 'Arial, sans-serif', 
          color: '#000', 
          boxSizing: 'border-box',
          textAlign: 'left',
          WebkitPrintColorAdjust: 'exact', 
          printColorAdjust: 'exact'       
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dc2626', paddingBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '14px' }}>HẢI LÊ MART</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ea580c', backgroundColor: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>VIP CARD</span>
          </div>
          
          <div style={{ margin: '8px 0', flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{printCustomer.name}</div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>SĐT: {printCustomer.phone}</div>
          </div>
          
          <div style={{ textAlign: 'center', background: '#fff', padding: '4px', borderRadius: '4px' }}>
            <img src={barcodeUrl} alt="Barcode VIP" style={{ height: '30px', maxWidth: '100%', objectFit: 'contain' }} />
            <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px' }}>{code}</div>
          </div>
          
        </div>
      </div>
    );
  }

  // =====================================================================
  // 4. IN PHIẾU ĐẶT HÀNG / NHẬP KHO / ĐỔI TRẢ NCC (PO - FORM KẾ TOÁN A4)
  // =====================================================================
  if (printMode === 'po_order' || printMode === 'po_receipt' || printMode === 'po_return') {
    if (!printPOData) return null;
    const isReceipt = printMode === 'po_receipt';
    const isReturn = printMode === 'po_return';
    let title = isReceipt ? "PHIẾU NHẬP KHO" : isReturn ? "PHIẾU ĐỔI TRẢ HÀNG LỖI" : "PHIẾU ĐẶT HÀNG (PO)";
    const dateObj = new Date();

    return (
      <div className="print-only-zone" style={{ width: '100%', backgroundColor: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '15mm 20mm', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
          
          {/* HEADER CHỨNG TỪ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
            <div style={{ width: '50%' }}>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG HẢI LÊ MART</h1>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Điện thoại:</strong> 0902 613 899</p>
            </div>
            <div style={{ width: '50%', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>{title}</h2>
              <p style={{ margin: '3px 0', fontSize: '14px', fontStyle: 'italic' }}>Ngày {dateObj.getDate()} tháng {dateObj.getMonth() + 1} năm {dateObj.getFullYear()}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}>Mã số: <strong>{printPOData.po_code}</strong></p>
            </div>
          </div>

          {/* THÔNG TIN CHI TIẾT NHÀ CUNG CẤP */}
          <div style={{ marginBottom: '20px', fontSize: '15px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Nhà cung cấp:</span><strong>{printPOData.supplier?.name || "................................................"}</strong></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Số điện thoại:</span><span>{printPOData.supplier?.phone || "................................................"}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Địa chỉ:</span><span>{printPOData.supplier?.address || "................................................"}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '150px' }}>Ghi chú phiếu:</span><span>{printPOData.note || "................................................"}</span></div>
          </div>

          {/* BẢNG LIỆK KÊ DANH SÁCH SẢN PHẨM PHIẾU PO */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '50px' }}>STT</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>Tên mặt hàng</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '60px' }}>ĐVT</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '80px' }}>{isReceipt ? 'SL Nhập' : 'SL Đặt'}</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '120px' }}>Đơn giá</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '140px' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {printPOData.items?.map((item: any, idx: number) => {
                const qty = isReceipt ? (item.qty - (item.damagedQty || 0)) : item.qty;
                if (qty <= 0) return null;
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{item.product?.name || item.name}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Cái</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{qty}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{Number(item.importPrice).toLocaleString()}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(qty * item.importPrice).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ĐỐI SOÁT DÒNG TIỀN CHỨNG TỪ (TIỀN HÀNG / ĐÃ TRẢ / CÒN NỢ) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}>
                <span>Cộng tiền hàng:</span>
                <span style={{ fontWeight: 'bold' }}>{Number(printPOData.total_amount || 0).toLocaleString()}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}>
                <span>Đã thanh toán:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>{Number(printPOData.paid_amount || 0).toLocaleString()}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #000' }}>
                <span>NỢ CHỨNG TỪ NÀY:</span>
                <span style={{ color: '#ef4444' }}>{Number((printPOData.total_amount || 0) - (printPOData.paid_amount || 0)).toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          {/* VÙNG CHỮ KÝ XÁC NHẬN CHUẨN PHÁP LÝ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', width: '30%' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Người lập phiếu</p>
              <p style={{ margin: '0 0 80px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ textAlign: 'center', width: '30%' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Kế toán trưởng</p>
              <p style={{ margin: '0 0 80px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ textAlign: 'center', width: '30%' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Đại diện NCC</p>
              <p style={{ margin: '0 0 80px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, đóng dấu)</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
};
