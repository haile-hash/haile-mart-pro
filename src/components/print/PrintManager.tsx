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
  printMode,
  lastOrder,
  shift,
  role,
  customers,
  VAT_RATE,
  printBarcodeProduct,
  barcodeCount,
  printCustomer,
  printPOData,
}) => {
  if (!printMode) return null;

  // =====================================================================
  // 1. CHẾ ĐỘ: IN HÓA ĐƠN BÁN HÀNG (TỰ ĐỘNG IN 2 LIÊN)
  // =====================================================================
  if (printMode === 'receipt') {
    if (!lastOrder) return null;

    const renderReceiptContent = (lienTitle: string) => {
      return (
        <div className="receipt-bill" style={{ padding: '10px', maxWidth: '80mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '13px', lineHeight: '1.4' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '5px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>HẢI LÊ MART</h2>
            <p style={{ margin: '2px 0', fontSize: '11px' }}>Hotline: 0902 613 899</p>
            <p style={{ margin: '2px 0', fontSize: '11px' }}>ĐC: 123 Đường ABC, Hà Nội</p>
            <h3 style={{ margin: '8px 0 2px 0', fontSize: '14px', fontWeight: 'bold' }}>HÓA ĐƠN BÁN HÀNG</h3>
            <p style={{ margin: '0', fontSize: '11px', fontWeight: 'bold', color: '#555' }}>({lienTitle})</p>
          </div>

          <div style={{ marginBottom: '8px', fontSize: '12px' }}>
            <p style={{ margin: '2px 0' }}><strong>Mã HĐ:</strong> {lastOrder.orderId}</p>
            <p style={{ margin: '2px 0' }}><strong>Thời gian:</strong> {lastOrder.time}</p>
            <p style={{ margin: '2px 0' }}><strong>Thu ngân:</strong> {role === 'admin' ? 'Quản lý' : 'Thu ngân'} ({lastOrder.shift || shift})</p>
            <p style={{ margin: '2px 0' }}><strong>Khách hàng:</strong> {lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(${lastOrder.custPhone})` : ""}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '8px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
                <th style={{ padding: '4px 0', textAlign: 'left' }}>Sản phẩm</th>
                <th style={{ padding: '4px 0', textAlign: 'center', width: '35px' }}>SL</th>
                <th style={{ padding: '4px 0', textAlign: 'right', width: '75px' }}>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart?.map((item: any, idx: number) => {
                const price = item.priceIncludingVat !== undefined 
                  ? item.priceIncludingVat 
                  : Math.round((item.product?.sale_price || 0) * (1 + VAT_RATE));
                return (
                  <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                    <td style={{ padding: '4px 0' }}>
    {/* Dùng Regex chặt bỏ toàn bộ chữ [Lô...] khỏi tên in ra hóa đơn */}
    {(item.product?.name || item.name).replace(/\s*\[Lô[^\]]*\]/gi, '').trim()}
    {item.product?.isHappyHour && <span style={{ marginLeft: '4px' }}>⭐</span>}
  </td>
                    <td style={{ padding: '4px 0', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>{(price * item.qty).toLocaleString()}đ</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
              <span>Tiền hàng khách mua:</span>
              <span>{Math.round(lastOrder.subTotal + lastOrder.vatTotal).toLocaleString()}đ</span>
            </div>
            {lastOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Giảm giá / Thẻ VIP / Voucher:</span>
                <span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '14px', fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '4px' }}>
              <span>TỔNG THANH TOÁN:</span>
              <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '11px' }}>
              <span>Phương thức TT:</span>
              <span style={{ fontWeight: 'bold' }}>{lastOrder.paymentMethod}</span>
            </div>
            {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Tiền khách đưa:</span>
                  <span>{Number(lastOrder.customerGiven).toLocaleString()}đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Tiền trả lại khách:</span>
                  <span>{Math.max(0, lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</span>
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px', borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '11px' }}>
            <p style={{ margin: '2px 0', fontStyle: 'italic' }}>Cảm ơn Quý khách & Hẹn gặp lại!</p>
          </div>
        </div>
      );
    };

    return (
      <div className="print-only-zone receipt-print-wrapper">
        {/* LIÊN 1: LƯU TẠI QUẦY */}
        <div className="receipt-copy-section">
          {renderReceiptContent("LIÊN 1: LƯU TẠI QUẦY")}
        </div>

        {/* LỆNH NGẮT GIẤY / CẮT DAO TỰ ĐỘNG */}
        <div className="print-page-break" style={{ pageBreakAfter: 'always', borderBottom: '2px dashed #000', margin: '30px 0', width: '100%' }}></div>

        {/* LIÊN 2: GIAO KHÁCH HÀNG */}
        <div className="receipt-copy-section">
          {renderReceiptContent("LIÊN 2: GIAO KHÁCH HÀNG")}
        </div>
      </div>
    );
  }

  // =====================================================================
  // 2. CHẾ ĐỘ: IN MÃ VẠCH (BARCODE) SẢN PHẨM CHUẨN SIÊU THỊ
  // =====================================================================
  if (printMode === 'barcode') {
    if (!printBarcodeProduct) return null;
    const code = printBarcodeProduct.product_code;
    const name = printBarcodeProduct.name;
    const price = printBarcodeProduct.sale_price;
    
    // Tắt chữ mặc định của mã vạch (includetext=false) để ta tự render chữ cho nét và cân đối hơn
    // Tăng scale lên 3 để nét mã vạch cực kỳ sắc sảo khi in ra giấy
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=3&height=12&includetext=false`;

    return (
      <div className="print-only-zone" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', // Ép chuẩn 4 cột trên khổ A4
        gap: '2mm', /* Khoảng cách giữa các tem */
        padding: '5mm', /* Lề an toàn cho trang giấy */
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        {Array.from({ length: barcodeCount }).map((_, idx) => (
          <div key={idx} style={{ 
            border: '1px dashed #94a3b8', /* Viền nét đứt làm guide chém giấy cực kỳ chuyên nghiệp */
            padding: '6px', 
            textAlign: 'center', 
            fontFamily: 'Arial, sans-serif', 
            backgroundColor: '#fff', 
            color: '#000',
            height: '35mm', /* Cố định chiều cao tem chuẩn */
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            pageBreakInside: 'avoid', /* KHÔNG BAO GIỜ bị cắt đôi tem giữa 2 trang giấy */
            overflow: 'hidden'
          }}>
            {/* Tên siêu thị định diện */}
            <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              HẢI LÊ MART
            </div>

            {/* Tên sản phẩm */}
            <div style={{ fontSize: '12px', fontWeight: 'bold', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0' }}>
              {cleanName(name)}
            </div>

            {/* Hình ảnh mã vạch & Mã số */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
              <img src={barcodeUrl} alt="Barcode" style={{ maxWidth: '100%', maxHeight: '14mm', objectFit: 'contain' }} />
              {/* Tự render mã số font máy chữ đẹp hơn */}
              <div style={{ fontSize: '9px', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '1px' }}>{code}</div>
            </div>

            {/* Giá sản phẩm (Phải to, Rõ, Đập vào mắt) */}
            <div style={{ fontSize: '16px', fontWeight: '900', marginTop: '2px' }}>
              {Number(price).toLocaleString()}đ
            </div>
          </div>
        ))}
      </div>
    );
  }

  // =====================================================================
  // 3. CHẾ ĐỘ: IN THẺ VIP ĐIỆN TỬ / CỨNG CHO KHÁCH HÀNG VIP
  // =====================================================================
  if (printMode === 'customer_card') {
    if (!printCustomer) return null;
    const code = printCustomer.cardCode || printCustomer.phone;
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=false`;

    return (
      <div className="print-only-zone customer-card-print" style={{ padding: '20px', backgroundColor: '#fff', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '86mm', height: '54mm', border: '2px solid #b91c1c', borderRadius: '8px', padding: '10px', background: 'linear-gradient(135deg, #fff7ed 0%, #fffff0 100%)', fontFamily: 'Arial, sans-serif', color: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dc2626', paddingBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '14px' }}>HẢI LÊ MART</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ea580c', backgroundColor: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>VIP CARD</span>
          </div>
          <div style={{ margin: '8px 0', flexGrow: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>{printCustomer.name}</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>SĐT Khách hàng: {printCustomer.phone}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src={barcodeUrl} alt="Barcode VIP" style={{ height: '25px', maxWidth: '100%' }} />
            <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px' }}>{code}</div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 4. CHẾ ĐỘ: IN PHIẾU ĐẶT HÀNG (PO) / PHIẾU NHẬP KHO / PHIẾU TRẢ NCC
  // =====================================================================
  if (printMode === 'po_order' || printMode === 'po_receipt' || printMode === 'po_return') {
    if (!printPOData) return null;

    const isReceipt = printMode === 'po_receipt';
    const isReturn = printMode === 'po_return';
    
    let title = "PHIẾU ĐẶT HÀNG (PO)";
    if (isReceipt) title = "PHIẾU NHẬP KHO CHÍNH THỨC";
    if (isReturn) title = "PHIẾU ĐỔI TRẢ HÀNG LỖI (NCC)";

    return (
      <div className="print-only-zone po-print-container" style={{ padding: '30px', color: '#000', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>HẢI LÊ MART</h1>
            <p style={{ margin: '2px 0' }}>Hotline: 0902 613 899</p>
            <p style={{ margin: '2px 0' }}>ĐC: 123 Đường ABC, Hà Nội</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>{title}</h2>
            <p style={{ margin: '2px 0' }}><strong>Mã Số Phiếu:</strong> {printPOData.po_code}</p>
            <p style={{ margin: '2px 0' }}><strong>Ngày Lập:</strong> {printPOData.created_at ? new Date(printPOData.created_at).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Thông tin Đối tác / NCC:</h3>
            <p style={{ margin: '2px 0' }}><strong>Nhà cung cấp:</strong> {printPOData.supplier?.name || "Không xác định"}</p>
            <p style={{ margin: '2px 0' }}><strong>Số điện thoại:</strong> {printPOData.supplier?.phone || "---"}</p>
            <p style={{ margin: '2px 0' }}><strong>Địa chỉ kho:</strong> {printPOData.supplier?.address || "---"}</p>
          </div>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Thông tin chứng từ:</h3>
            <p style={{ margin: '2px 0' }}><strong>Trạng thái nhập:</strong> {printPOData.status === 'COMPLETED' ? '✅ Đã đối soát & Nhập kho' : '⏳ Chờ kiểm hàng'}</p>
            <p style={{ margin: '2px 0' }}><strong>Ghi chú đơn:</strong> {printPOData.note || "---"}</p>
            <p style={{ margin: '2px 0' }}><strong>Ca làm việc:</strong> {shift}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '40px' }}>STT</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Tên mặt hàng nhập</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '60px' }}>SL Đặt</th>
              {isReceipt && <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '60px' }}>SL Nhận</th>}
              {isReturn && <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '60px' }}>SL Lỗi</th>}
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', width: '90px' }}>Đơn giá gốc</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', width: '100px' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {printPOData.items?.map((item: any, index: number) => {
              const orderQty = item.qty || 0;
              const damagedQty = item.damagedQty || 0;
              const receivedQty = orderQty - damagedQty;

              let displayQty = orderQty;
              if (isReceipt) displayQty = receivedQty;
              if (isReturn) displayQty = damagedQty;

              // Bộ lọc: Ẩn dòng trống nếu in phiếu hàng lỗi mà item đó không lỗi
              if (isReturn && damagedQty <= 0) return null;
              if (isReceipt && receivedQty <= 0) return null;

              const itemTotal = displayQty * (item.importPrice || 0);

              return (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{item.product?.name || item.name}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{orderQty}</td>
                  {isReceipt && <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{receivedQty}</td>}
                  {isReturn && <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', color: 'red', fontWeight: 'bold' }}>{damagedQty}</td>}
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{Number(item.importPrice || 0).toLocaleString()}đ</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{itemTotal.toLocaleString()}đ</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '40px', flex: 1, textAlign: 'center' }}>
            <div style={{ minWidth: '120px' }}>
              <p style={{ margin: '0 0 50px 0' }}><strong>Người lập phiếu</strong></p>
              <p style={{ margin: '0', fontSize: '11px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div style={{ minWidth: '120px' }}>
              <p style={{ margin: '0 0 50px 0' }}><strong>Đại diện giao hàng</strong></p>
              <p style={{ margin: '0', fontSize: '11px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', minWidth: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>Tổng giá trị thực nhập:</span>
              <span style={{ fontWeight: 'bold' }}>{Number(printPOData.total_amount || 0).toLocaleString()}đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>Đã thanh toán (Tiền mặt/CK):</span>
              <span style={{ color: 'green', fontWeight: 'bold' }}>{Number(printPOData.paid_amount || 0).toLocaleString()}đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', borderTop: '1px solid #000', paddingTop: '5px', fontSize: '15px', fontWeight: 'bold' }}>
              <span>Dư nợ NCC ghi nhận:</span>
              <span style={{ color: 'red' }}>{Number((printPOData.total_amount || 0) - (printPOData.paid_amount || 0)).toLocaleString()}đ</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
