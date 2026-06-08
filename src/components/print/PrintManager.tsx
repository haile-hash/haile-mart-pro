/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { cleanName } from '../../utils/helpers';

interface PrintManagerProps {
  printMode: 'receipt_thermal' | 'receipt_a4' | 'barcode' | 'customer_card' | 'po_order' | 'po_receipt' | 'po_return' | 'po' | null;
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
  printMode, lastOrder, shift, role, customers, VAT_RATE = 0, printBarcodeProduct, barcodeCount, printCustomer, printPOData
}) => {
  const [currentStore, setCurrentStore] = useState<any>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("mart_current_store");
      if (stored) setCurrentStore(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Hàm Kế Toán tính toán số lượng thực nhập (Trừ đi hàng lỗi chuẩn xác)
  const getActualPOQty = (item: any) => {
    const orderQty = Number(item.qty) || 0;
    const receiveQty = item.receiveQty !== undefined ? Number(item.receiveQty) : orderQty;
    const faultQ = Number(item.faultyQty || item.faulty || item.errorQty || item.returnQty || item.rejectQty) || 0;

    if (receiveQty < orderQty) {
      return receiveQty;
    } else if (faultQ > 0) {
      return Math.max(0, orderQty - faultQ);
    } else {
      return receiveQty;
    }
  };

  if (!printMode) return null;

  const dateObj = new Date(); 
  const getCustomerDetail = (phone: string) => phone ? ((customers || {})[phone] || null) : null;

  const PrintStyles = () => (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        .force-print-zone, .force-print-zone * { visibility: visible !important; }
        .force-print-zone { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: white !important; margin: 0 !important; padding: 0 !important; }
        @page { margin: 0; }
      }
    `}</style>
  );

  const renderPaymentDetails = (order: any, isA4: boolean) => {
    const total = Math.round(order.debtAmount > 0 ? order.debtAmount : order.finalTotal);
    const given = Number(order.customerGiven || 0);
    const change = given > total ? given - total : 0;
    const isRefund = order.isRefund === true; 
    
    const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: isA4 ? '6px 0' : '4px 0', fontSize: isA4 ? '14px' : '13px' };

    return (
      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: isA4 ? '2px dashed #cbd5e1' : '1px dashed #000' }}>
        <div style={{ ...rowStyle, fontWeight: 'bold' }}>
          <span>Hình thức TT:</span>
          <span style={{ textTransform: 'uppercase', color: isA4 ? '#2563eb' : '#000' }}>{order.paymentMethod}</span>
        </div>

        {isRefund ? (
          <div style={rowStyle}>
            <span>Hoàn trả bằng {order.paymentMethod}:</span>
            <span style={{ fontWeight: 'bold' }}>{total.toLocaleString()}đ</span>
          </div>
        ) : (
          <>
            {order.paymentMethod === 'TIỀN MẶT' && (
              <>
                <div style={rowStyle}><span>Khách đưa:</span><span style={{ fontWeight: 'bold' }}>{given.toLocaleString()}đ</span></div>
                {change > 0 && <div style={rowStyle}><span>Tiền thừa trả khách:</span><span style={{ fontWeight: 'bold' }}>{change.toLocaleString()}đ</span></div>}
              </>
            )}

            {order.paymentMethod === 'KẾT HỢP' && (
              <>
                <div style={rowStyle}><span>Tiền mặt (Khách đưa):</span><span style={{ fontWeight: 'bold' }}>{Number(order.splitCash || 0).toLocaleString()}đ</span></div>
                <div style={rowStyle}><span>Chuyển khoản thêm:</span><span style={{ fontWeight: 'bold' }}>{Number(order.splitTransfer || 0).toLocaleString()}đ</span></div>
              </>
            )}

            {(order.paymentMethod === 'CHUYỂN KHOẢN' || order.paymentMethod === 'ZALO PAY' || order.paymentMethod === 'QUẸT THẺ') && (
              <div style={rowStyle}><span>Đã chuyển khoản:</span><span style={{ fontWeight: 'bold' }}>{total.toLocaleString()}đ</span></div>
            )}
          </>
        )}

        {order.debtAmount > 0 && (
          <div style={{ ...rowStyle, color: isA4 ? '#ef4444' : '#000', fontWeight: 'bold' }}>
            <span>Ghi nợ đơn này:</span><span>{Math.round(order.debtAmount).toLocaleString()}đ</span>
          </div>
        )}
      </div>
    );
  };

  // =====================================================================
  // 1. IN BILL NHIỆT K80
  // =====================================================================
  if (printMode === 'receipt_thermal') {
    if (!lastOrder) return null;
    return (
      <div className="force-print-zone" style={{ width: '100%', backgroundColor: '#fff', display: 'flex', justifyContent: 'center' }}>
        <PrintStyles />
        <div style={{ width: '78mm', textAlign: 'left', fontFamily: 'Arial, sans-serif', color: '#000', padding: '10px 15px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>{currentStore?.store_name || "TÊN CỬA HÀNG"}</h2>
            <p style={{ margin: '2px 0', fontSize: '13px' }}>ĐC: {currentStore?.address || "Chưa cập nhật địa chỉ"}</p>
            <p style={{ margin: '2px 0', fontSize: '13px' }}>Hotline: {currentStore?.phone || "Chưa cập nhật SĐT"}</p>
            <h3 style={{ margin: '15px 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>{lastOrder.isRefund ? "PHIẾU TRẢ HÀNG" : "HÓA ĐƠN BÁN HÀNG"}</h3>
            <p style={{ margin: '0', fontSize: '13px' }}>Số HĐ: {lastOrder.orderId}</p>
          </div>
          <div style={{ fontSize: '13px', marginBottom: '15px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ngày:</span><span>{lastOrder.time}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khách hàng:</span><span style={{ fontWeight: 'bold' }}>{lastOrder.custName || "Khách lẻ"}</span></div>
          </div>
          <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '10px 0', marginBottom: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead><tr><th style={{ padding: '0 0 8px 0', textAlign: 'left', borderBottom: '1px solid #000', width: '50%' }}>Sản phẩm</th><th style={{ padding: '0 0 8px 0', textAlign: 'center', borderBottom: '1px solid #000', width: '15%' }}>SL</th><th style={{ padding: '0 0 8px 0', textAlign: 'right', borderBottom: '1px solid #000', width: '35%' }}>Thành tiền</th></tr></thead>
              <tbody>
                {(lastOrder.cart || []).map((item: any, idx: number) => {
                  const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + (VAT_RATE || 0)));
                  const cleanProductName = (item.product?.name || item.name || "").replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                  return (
                    <tr key={idx}>
                      <td style={{ paddingTop: '8px', paddingBottom: '8px' }}><div style={{ fontWeight: 'bold' }}>{cleanProductName}</div><div style={{ fontSize: '12px', color: '#555' }}>{price.toLocaleString()}đ</div></td>
                      <td style={{ paddingTop: '8px', paddingBottom: '8px', textAlign: 'center', verticalAlign: 'top' }}>{item.qty}</td>
                      <td style={{ paddingTop: '8px', paddingBottom: '8px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>{(price * item.qty).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tổng tiền hàng:</span><span>{Math.round(lastOrder.subTotal).toLocaleString()}đ</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thuế VAT:</span><span>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Giảm giá/Voucher:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', margin: '10px 0', borderTop: '2px solid #000', paddingTop: '10px' }}><span>TỔNG CỘNG:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span></div>
            {renderPaymentDetails(lastOrder, false)}
          </div>
          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '13px', fontStyle: 'italic' }}>Cảm ơn Quý khách & Hẹn gặp lại!</div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 2. IN HÓA ĐƠN A4
  // =====================================================================
  if (printMode === 'receipt_a4') {
    if (!lastOrder) return null;
    const cDetail = getCustomerDetail(lastOrder.custPhone);
    return (
      <div className="force-print-zone" style={{ width: '100%', backgroundColor: '#fff' }}>
        <PrintStyles />
        <div style={{ width: '100%', maxWidth: '210mm', margin: '0 auto', padding: '15mm 20mm', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '25px' }}>
            <div style={{ width: '55%' }}>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG {currentStore?.store_name ? currentStore.store_name.toUpperCase() : "CỬA HÀNG"}</h1>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Địa chỉ:</strong> {currentStore?.address || "Chưa cập nhật địa chỉ"}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Điện thoại:</strong> {currentStore?.phone || "Chưa cập nhật SĐT"}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Mã số thuế:</strong> {currentStore?.tax_code || "................"}</p>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 'bold' }}>{lastOrder.isRefund ? "PHIẾU TRẢ HÀNG (HOÀN TIỀN)" : "HÓA ĐƠN BÁN HÀNG"}</h2>
              <p style={{ margin: '3px 0', fontSize: '14px', fontStyle: 'italic' }}>Ngày {dateObj.getDate()} tháng {dateObj.getMonth() + 1} năm {dateObj.getFullYear()}</p>
              <p style={{ margin: '3px 0', fontSize: '14px' }}>Số chứng từ: <strong>{lastOrder.orderId}</strong></p>
            </div>
          </div>
          <div style={{ marginBottom: '25px', fontSize: '15px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Họ tên khách hàng:</span><strong>{lastOrder.custName || "Khách mua lẻ"}</strong></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Số điện thoại:</span><span>{lastOrder.custPhone || "..................................................."}</span></div>
            <div style={{ display: 'flex' }}><span style={{ width: '180px' }}>Địa chỉ giao hàng:</span><span>{cDetail?.address || "..................................................."}</span></div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '15px' }}>
            <thead><tr style={{ backgroundColor: '#f1f5f9' }}><th style={{ border: '1px solid #000', padding: '10px' }}>STT</th><th style={{ border: '1px solid #000', padding: '10px' }}>Tên hàng hóa</th><th style={{ border: '1px solid #000', padding: '10px' }}>SL</th><th style={{ border: '1px solid #000', padding: '10px' }}>Đơn giá</th><th style={{ border: '1px solid #000', padding: '10px' }}>Thành tiền</th></tr></thead>
            <tbody>
              {(lastOrder.cart || []).map((item: any, idx: number) => {
                const price = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round((item.product?.sale_price || 0) * (1 + (VAT_RATE || 0)));
                const cleanProductName = (item.product?.name || item.name || "").replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{cleanProductName}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{price.toLocaleString()}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(price * item.qty).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '450px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}><span>Cộng tiền hàng:</span><span style={{ fontWeight: 'bold' }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}><span>Thuế VAT:</span><span style={{ fontWeight: 'bold' }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</span></div>
              {lastOrder.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' }}><span>Chiết khấu / Giảm giá:</span><span style={{ fontWeight: 'bold' }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '20px', fontWeight: 'bold', borderTop: '2px solid #000', borderBottom: '2px solid #000', marginTop: '10px' }}><span>TỔNG THANH TOÁN:</span><span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span></div>
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>{renderPaymentDetails(lastOrder, true)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', width: '250px' }}><p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>Người mua hàng</p><p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p></div>
            <div style={{ textAlign: 'center', width: '250px' }}><p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>{currentStore?.store_name || "ĐẠI DIỆN CỬA HÀNG"}</p><p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Đại diện ký, đóng dấu)</p></div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 3. IN THẺ VIP CARD
  // =====================================================================
  if (printMode === 'customer_card') {
    if (!printCustomer) return null;
    const code = printCustomer.cardCode || printCustomer.phone;
    // Dùng API tạo barcode thay vì thư viện react-qr-code
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=3&height=15&includetext=false`;

    return (
      <div className="force-print-zone" style={{ width: '100%', backgroundColor: '#fff', textAlign: 'center', paddingTop: '20mm' }}>
        <PrintStyles />
        <div style={{ 
          display: 'inline-flex', flexDirection: 'column', justifyContent: 'space-between',
          width: '86mm', height: '54mm', border: '2px solid #b91c1c', borderRadius: '8px', 
          padding: '12px', background: '#fff7ed', 
          fontFamily: 'Arial, sans-serif', color: '#000', boxSizing: 'border-box', textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dc2626', paddingBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '14px', textTransform: 'uppercase' }}>{currentStore?.store_name || "VIP MEMBER"}</span>
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
  // 4. IN PHIẾU NHẬP KHO (ĐÃ ADD CÔNG THỨC TRỪ LỖI CỦA SẾP)
  // =====================================================================
  if (printMode === 'po_receipt' || printMode === 'po_order' || printMode === 'po' || printMode === 'po_return') {
    if (!printPOData) return null;

    const totalPOAmount = (printPOData.items || []).reduce((sum: number, item: any) => {
      return sum + (getActualPOQty(item) * (Number(item.importPrice) || 0));
    }, 0);

    return (
      <div className="force-print-zone" style={{ width: '100%', backgroundColor: '#fff' }}>
        <PrintStyles />
        <div style={{ width: '210mm', padding: '20mm', margin: '0 auto', fontSize: '14px', fontFamily: '"Times New Roman", Times, serif', color: '#000', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' }}>PHIẾU NHẬP KHO (GOODS RECEIPT NOTE)</h2>
            <p style={{ margin: '3px 0', fontSize: '14px' }}>Tham chiếu gốc (Mã PO): <strong>{printPOData.po_code || printPOData.poCode || printPOData.id}</strong></p>
            <p style={{ margin: '3px 0', fontSize: '14px' }}>Nhà cung cấp: <strong>{printPOData.supplier?.name || printPOData.supplierName || 'N/A'}</strong></p>
            <p style={{ margin: '3px 0', fontSize: '14px' }}>Ngày nhập: {printPOData.importDate || new Date().toLocaleDateString('vi-VN')}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>STT</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Tên Sản Phẩm</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>Thực Nhận</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>Lỗi/Trả</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>SL (Trừ Lỗi)</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Đơn Giá</th>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'right' }}>Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              {(printPOData.items || []).map((item: any, idx: number) => {
                const orderQty = Number(item.qty) || 0;
                const receiveQty = item.receiveQty !== undefined ? Number(item.receiveQty) : orderQty;
                const faultQ = Number(item.faultyQty || item.faulty || item.errorQty || item.returnQty || item.rejectQty) || 0;
                
                const actualQty = getActualPOQty(item);
                const price = Number(item.importPrice) || 0;
                const lineTotal = actualQty * price;

                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{item.product?.name || item.name}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{receiveQty}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: faultQ > 0 ? '#ef4444' : 'inherit', fontWeight: faultQ > 0 ? 'bold' : 'normal' }}>
                      {faultQ > 0 ? `-${faultQ}` : 0}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {actualQty}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{price.toLocaleString()}đ</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{lineTotal.toLocaleString()}đ</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #000', fontSize: '18px', fontWeight: 'bold' }}>
                <span>TỔNG ĐƠN HÀNG:</span>
                <span>{totalPOAmount.toLocaleString()}đ</span>
              </div>
              <p style={{ textAlign: 'right', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>
                (Tổng tiền đã khấu trừ hàng lỗi/hoàn trả)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', textAlign: 'center', padding: '0 20px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold' }}>Người Giao Hàng</p>
              <p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold' }}>Thủ Kho</p>
              <p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold' }}>Kế Toán / Quản Lý</p>
              <p style={{ margin: '0 0 100px 0', fontSize: '14px', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 5. IN TEM MÃ VẠCH (CHUYỂN SANG DÙNG ẢNH API LUÔN)
  // =====================================================================
  if (printMode === 'barcode') {
    if (!printBarcodeProduct) return null;
    const code = printBarcodeProduct.barcode || printBarcodeProduct.product_code || printBarcodeProduct.id;
    // Dùng chung một API để hệ thống không cần thư viện
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=3&height=15&includetext=false`;

    return (
      <div className="force-print-zone" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '5px', backgroundColor: '#fff' }}>
        <PrintStyles />
        {Array.from({ length: barcodeCount || 1 }).map((_, idx) => (
          <div key={idx} style={{ width: '35mm', height: '22mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', padding: '2px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '9px', textAlign: 'center', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: 'bold', color: '#000' }}>
              {printBarcodeProduct.name}
            </div>
            <img src={barcodeUrl} alt="barcode" style={{ height: '20px', maxWidth: '100%', objectFit: 'contain' }} />
            <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', marginTop: '2px', color: '#000' }}>{code}</div>
            <div style={{ fontSize: '10px', marginTop: '1px', fontWeight: 'bold', color: '#000' }}>
              {Number(printBarcodeProduct.sale_price || printBarcodeProduct.price || 0).toLocaleString()}đ
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
