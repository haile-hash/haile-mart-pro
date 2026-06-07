// @ts-nocheck
import React, { useEffect, useMemo } from "react";
import { cleanName } from "../../utils/helpers";

export const POModal = ({
  showPOModal, setShowPOModal, poTab, setPoTab, suppliers, selectedSupplierId, setSelectedSupplierId,
  poSearch, setPoSearch, poItems, setPoItems, products, poNote, setPoNote, paidAmount, setPaidAmount,
  searchPoCode, setSearchPoCode, foundPO, setFoundPO, receiveItems, setReceiveItems, allPOs, loading,
  onSaveNewPO, onConfirmReceipt
}) => {
  if (!showPOModal) return null;

  useEffect(() => {
    if (poTab === "RECEIVE" && !foundPO && allPOs && allPOs.length > 0) {
      handleSelectPOToReceive(allPOs[0]);
    }
  }, [poTab, allPOs]);

  const handleSelectPOToReceive = (po: any) => {
    setFoundPO(po);
    setReceiveItems((po.items || []).map(i => ({ 
      ...i, 
      actualQty: i.actualQty !== undefined ? i.actualQty : i.qty, 
      returnQty: i.returnQty || 0 
    })));
  };

  // --- TÍNH TOÁN REALTIME TIỀN HÀNG VÀ CÔNG NỢ ---
  const currentTotalAmount = useMemo(() => {
    return (poItems || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.importPrice) || 0), 0);
  }, [poItems]);

  const currentDebtAmount = useMemo(() => {
    return currentTotalAmount - (Number(paidAmount) || 0);
  }, [currentTotalAmount, paidAmount]);


  // --- XUẤT EXCEL BẢN NHÁP ---
  const handleExportDraft = () => {
    if (!poItems || poItems.length === 0) return alert("Chưa có sản phẩm nào trong phiếu!");
    try {
      const supplier = (suppliers || []).find((s: any) => String(s.id) === String(selectedSupplierId)) || {};
      const storeInfo = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}");
      const wb = (window as any).XLSX.utils.book_new();
      
      const wsData = [
        ["ĐƠN ĐẶT HÀNG (PURCHASE ORDER)"],
        [""],
        ["THÔNG TIN BÊN MUA (BUYER)", "", "", "", "THÔNG TIN BÊN BÁN (SELLER)"],
        ["Tên đơn vị:", storeInfo.store_name || "HỆ THỐNG POS PRO", "", "", "Nhà cung cấp:", supplier.name || "Chưa chọn"],
        ["Địa chỉ:", storeInfo.address || "Chưa cập nhật", "", "", "Địa chỉ:", supplier.address || "Chưa cập nhật"],
        ["Điện thoại:", storeInfo.phone || "Chưa cập nhật", "", "", "Điện thoại:", supplier.phone || "Chưa cập nhật"],
        ["Mã số thuế:", storeInfo.tax_code || "Chưa cập nhật", "", "", "Mã số thuế:", supplier.taxCode || "Chưa cập nhật"],
        ["Email:", storeInfo.email || "Chưa cập nhật", "", "", "STK Ngân hàng:", supplier.bankAccount || "Chưa cập nhật"],
        [""],
        ["THÔNG TIN ĐƠN ĐẶT HÀNG"],
        ["Mã phiếu:", `PO_DRAFT_${Date.now().toString().slice(-6)}`, "", "", "Ngày lập:", new Date().toLocaleDateString('vi-VN')],
        ["Ghi chú:", poNote || "Không có", "", "", "Trạng thái:", "Bản nháp (Draft)"],
        [""],
        ["STT", "Mã Sản Phẩm", "Tên Sản Phẩm", "Số Lượng", "Đơn Giá Nhập (VNĐ)", "Thành Tiền (VNĐ)"]
      ];

      poItems.forEach((item: any, index: number) => {
        const qty = Number(item?.qty) || 0;
        const price = Number(item?.importPrice) || 0;
        const rowTotal = qty * price;
        wsData.push([index + 1, item?.product?.product_code || "", cleanName(item?.product?.name || "SP"), qty, price, rowTotal]);
      });

      wsData.push([""]);
      wsData.push(["", "", "", "", "TỔNG TIỀN HÀNG:", currentTotalAmount]);
      wsData.push(["", "", "", "", "ĐÃ TRẢ TRƯỚC:", Number(paidAmount) || 0]);
      wsData.push(["", "", "", "", "SỐ TIỀN CÒN LẠI:", currentDebtAmount]);
      
      wsData.push([""]); wsData.push([""]);
      wsData.push(["", "ĐẠI DIỆN BÊN MUA", "", "", "", "ĐẠI DIỆN BÊN BÁN"]);
      wsData.push(["", "(Ký, ghi rõ họ tên & đóng dấu)", "", "", "", "(Ký, ghi rõ họ tên & đóng dấu)"]);

      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData);
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } }, { s: { r: 9, c: 0 }, e: { r: 9, c: 5 } }];
      ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 22 }, { wch: 22 }];

      (window as any).XLSX.utils.book_append_sheet(wb, ws, "Don_Dat_Hang");
      (window as any).XLSX.writeFile(wb, `DonDatHang_${Date.now()}.xlsx`);
    } catch (e) { alert("Lỗi xuất Excel! Vui lòng kiểm tra lại thư viện."); }
  };

  const handleExportInventoryTemplate = () => {
    try {
      if (!window.XLSX) return;
      const wb = (window as any).XLSX.utils.book_new();
      const wsData = [
        ["Mã sản phẩm (*)", "Tên sản phẩm (*)", "Danh mục", "Giá Nhập", "Giá Bán (*)", "Giá Khuyến mãi", "Điều kiện mua tặng", "Sản phẩm tặng kèm", "Số lượng", "Hạn sử dụng (mm/yyyy)"]
      ];

      receiveItems.forEach((item: any) => {
        const qty = item.actualQty !== undefined ? item.actualQty : item.qty;
        if (qty > 0) {
          let giftCond = ""; let giftText = "";
          if (item.product?.gift_info) {
            const parts = item.product.gift_info.split(';;;');
            if (parts.length === 2) { giftCond = parts[0]; giftText = parts[1]; }
          }
          wsData.push([
            item.product?.product_code || "",
            cleanName(item.product?.name || ""),
            item.product?.category || "Khác",
            item.importPrice || 0,
            item.product?.sale_price || 0,
            item.product?.promo_price || "",
            giftCond,
            giftText,
            qty,
            item.product?.expiry_date || ""
          ]);
        }
      });

      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData);
      (window as any).XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Kho");
      (window as any).XLSX.writeFile(wb, `FileNhapKho_${foundPO?.po_code || Date.now()}.xlsx`);
    } catch (e) { console.error("Lỗi xuất file mẫu nhập kho", e); }
  };

  // --- IN PHIẾU PDF 3 TRONG 1 (CẬP NHẬT 3 DÒNG TIỀN) ---
  const handlePrintPDF = (type: 'ORDER' | 'RECEIPT' | 'RETURN') => {
    let printData = []; let title = ""; let poCodePrint = ""; let supplierPrint = {}; let notePrint = "";
    let printTotal = 0; let printPaid = 0; let printDebt = 0;

    if (type === 'ORDER' && poTab === 'NEW') {
      if (!poItems || poItems.length === 0) return alert("Chưa có sản phẩm nào!");
      printData = poItems.map(i => ({ ...i, printQty: i.qty }));
      title = "ĐƠN ĐẶT HÀNG (PURCHASE ORDER)"; poCodePrint = `PO_DRAFT_${Date.now().toString().slice(-6)}`;
      supplierPrint = (suppliers || []).find((s: any) => String(s.id) === String(selectedSupplierId)) || {};
      notePrint = poNote;
      printTotal = currentTotalAmount;
      printPaid = Number(paidAmount) || 0;
      printDebt = currentDebtAmount;
    } else {
      if (!foundPO) return alert("Chưa chọn phiếu PO!");
      poCodePrint = foundPO.po_code; supplierPrint = foundPO.supplier || {}; notePrint = foundPO.note;
      
      if (type === 'ORDER') {
        title = "ĐƠN ĐẶT HÀNG (PURCHASE ORDER)";
        printData = receiveItems.map(i => ({ ...i, printQty: i.qty }));
        printTotal = foundPO.total_amount || 0;
        printPaid = foundPO.paid_amount || 0;
        printDebt = printTotal - printPaid;
      } else if (type === 'RECEIPT') {
        title = "PHIẾU NHẬP KHO (GOODS RECEIPT NOTE)";
        printData = receiveItems.map(i => ({ ...i, printQty: i.actualQty !== undefined ? i.actualQty : i.qty })).filter(i => i.printQty > 0);
        if(printData.length === 0) return alert("Không có sản phẩm nào được thực nhận!");
        printTotal = printData.reduce((sum, item) => sum + item.printQty * item.importPrice, 0);
        printPaid = foundPO.paid_amount || 0;
        printDebt = printTotal - printPaid;
      } else if (type === 'RETURN') {
        title = "PHIẾU TRẢ HÀNG LỖI (RETURN NOTE)";
        printData = receiveItems.map(i => ({ ...i, printQty: i.returnQty || 0 })).filter(i => i.printQty > 0);
        if(printData.length === 0) return alert("Không có sản phẩm lỗi nào được ghi nhận trong phiếu này!");
        printTotal = printData.reduce((sum, item) => sum + item.printQty * item.importPrice, 0);
        // Phiếu trả hàng không cần in nợ, gán 0
        printPaid = 0; printDebt = 0; 
      }
    }

    const storeInfo = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}");
    const dateStr = new Date().toLocaleDateString('vi-VN');
    let itemsHtml = ""; 
    
    printData.forEach((item: any, index: number) => {
      const qty = Number(item.printQty) || 0; const price = Number(item.importPrice) || 0; const rowTotal = qty * price;
      itemsHtml += `<tr><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">${index + 1}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1;">${item?.product?.product_code || ""}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1;">${cleanName(item?.product?.name || "SP")}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">${qty}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: right;">${price.toLocaleString('vi-VN')} đ</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${rowTotal.toLocaleString('vi-VN')} đ</td></tr>`;
    });

    const htmlContent = `<html><head><title>${title}_${poCodePrint}</title><style>@page { size: A4; margin: 15mm; } body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: #000; margin: 0; } .header { text-align: center; margin-bottom: 30px; } .title { font-size: 24px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; } .flex-container { display: flex; justify-content: space-between; margin-bottom: 25px; } .box { width: 48%; padding: 15px; border: 1px solid #000; border-radius: 8px; } .box-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; font-size: 15px; text-transform: uppercase; } table { width: 100%; border-collapse: collapse; margin-bottom: 25px; } th { padding: 12px 8px; border: 1px solid #cbd5e1; background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 13px; } .total-section { width: 300px; margin-left: auto; text-align: right; font-size: 15px; margin-bottom: 40px; } .total-line { display: flex; justify-content: space-between; margin-bottom: 6px; } .signature-section { display: flex; justify-content: space-between; padding: 0 40px; text-align: center; } .sig-title { font-weight: bold; font-size: 15px; margin-bottom: 5px; } .sig-sub { font-style: italic; font-size: 13px; color: #475569; }</style></head><body><div class="header"><h1 class="title">${title}</h1><div>Tham chiếu gốc (Mã PO): <strong>${poCodePrint}</strong> &nbsp;|&nbsp; Ngày lập: ${dateStr}</div></div><div class="flex-container"><div class="box"><div class="box-title">${type === 'RETURN' ? 'Bên Trả Hàng (Cửa hàng)' : 'Thông tin Bên Mua (Buyer)'}</div><table style="width: 100%; border: none; margin: 0; font-size: 14px;"><tr><td style="width: 90px; border: none; padding: 3px 0;"><strong>Tên ĐV:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.store_name || "HỆ THỐNG POS PRO"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Địa chỉ:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.address || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Điện thoại:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.phone || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>MST:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.tax_code || "Chưa cập nhật"}</td></tr></table></div><div class="box"><div class="box-title">${type === 'RETURN' ? 'Bên Nhận Lại (Nhà CC)' : 'Thông tin Bên Bán (Seller)'}</div><table style="width: 100%; border: none; margin: 0; font-size: 14px;"><tr><td style="width: 90px; border: none; padding: 3px 0;"><strong>Nhà CC:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.name || "Chưa chọn"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Địa chỉ:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.address || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Điện thoại:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.phone || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>STK/MST:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.taxCode || supplierPrint.bankAccount || "Chưa cập nhật"}</td></tr></table></div></div><div style="margin-bottom: 15px; padding-left: 5px;"><strong>Ghi chú:</strong> ${notePrint || "Không có"}</div><table><thead><tr><th style="width: 5%;">STT</th><th style="width: 15%;">Mã SP</th><th style="width: 35%; text-align: left;">Tên Sản Phẩm</th><th style="width: 10%;">SL</th><th style="width: 15%; text-align: right;">Đơn Giá</th><th style="width: 20%; text-align: right;">Thành Tiền</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="total-section"><div class="total-line"><strong>TỔNG ĐƠN HÀNG:</strong> <span><strong>${printTotal.toLocaleString('vi-VN')} đ</strong></span></div>${type !== 'RETURN' ? `<div class="total-line" style="font-style: italic; color: #059669;"><span>Đã trả trước:</span> <span>${printPaid.toLocaleString('vi-VN')} đ</span></div><div class="total-line" style="border-top: 1px solid #000; padding-top: 5px; color: #dc2626;"><strong>CÒN NỢ LẠI:</strong> <span><strong>${printDebt.toLocaleString('vi-VN')} đ</strong></span></div>` : '<div style="font-style: italic; font-size: 13px; text-align: right; color: #475569; margin-top: 10px;">(Số tiền trên sẽ được trừ vào công nợ hoặc nhà cung cấp hoàn trả bằng tiền mặt)</div>'}</div><div class="signature-section"><div><div class="sig-title">ĐẠI DIỆN CỬA HÀNG</div><div class="sig-sub">(Ký, ghi rõ họ tên)</div></div><div><div class="sig-title">ĐẠI DIỆN NHÀ CUNG CẤP</div><div class="sig-sub">(Ký, ghi rõ họ tên)</div></div></div><script>window.onload = function() { setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); } }, 500); }</script></body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.open(); printWindow.document.write(htmlContent); printWindow.document.close(); } 
    else { alert("Trình duyệt đã chặn popup. Vui lòng cho phép popup để xuất PDF."); }
  };

  const handleConfirmAndProcess = () => {
    if (!window.confirm(`Xác nhận hoàn tất phiếu nhập kho ${foundPO?.po_code}?\nTrạng thái phiếu sẽ chuyển thành "Đã Nhập".`)) return;

    handleExportInventoryTemplate();
    handlePrintPDF('RECEIPT');

    const updatedPO = { ...foundPO, status: 'COMPLETED' };
    setFoundPO(updatedPO); 

    if (onConfirmReceipt) onConfirmReceipt(updatedPO, receiveItems);
  };

  const updateItemField = (idx, field, value) => {
    const newItems = [...poItems]; newItems[idx][field] = value === "" ? "" : Number(value); setPoItems(newItems);
  };
  const updateReceiveItemField = (idx, field, value) => {
    const newItems = [...receiveItems]; newItems[idx][field] = value === "" ? "" : Number(value); setReceiveItems(newItems);
  };

  return (
    <div className="custom-modal-overlay no-print" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999, backdropFilter: "blur(8px)" }}>
      
      <style>{`
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .po-modal-container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .po-modal-container *::-webkit-scrollbar { width: 6px; height: 6px; }
        .po-modal-container *::-webkit-scrollbar-track { background: transparent; }
        .po-modal-container *::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .po-modal-container *::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .po-input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #1e293b; background: #fff; transition: all 0.2s; box-sizing: border-box; }
        .po-input:hover { border-color: #94a3b8; }
        .po-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); outline: none; }
        .po-editable-input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; font-weight: 600; color: #0f172a; background: #f8fafc; transition: all 0.2s; box-sizing: border-box; text-align: right; }
        .po-editable-input:hover { border-color: #cbd5e1; background: #fff; }
        .po-editable-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); outline: none; }
        .po-editable-input.error-mode:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
        .po-tab { padding: 10px 20px; font-size: 14px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; background: transparent; color: #64748b; }
        .po-tab:hover { color: #1e293b; background: #f1f5f9; }
        .po-tab.active { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .po-btn { padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .po-btn-primary { background: #2563eb; color: #fff; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
        .po-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
        .po-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .po-btn-outline { background: #fff; border: 1px solid #cbd5e1; color: #475569; }
        .po-btn-outline:hover { background: #f8fafc; color: #1e293b; }
        .po-btn-success { background: #10b981; color: #fff; }
        .po-btn-success:hover:not(:disabled) { background: #059669; }
        .po-list-item { padding: 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: 0.2s; background: #fff; border-left: 3px solid transparent; }
        .po-list-item:hover { background: #f8fafc; }
        .po-list-item.active { background: #eff6ff; border-left-color: #2563eb; }
        .po-table th { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .po-table td { border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      `}</style>

      <div className="po-modal-container" style={{ background: "#f8fafc", width: "1350px", maxWidth: "95vw", height: "88vh", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset" }}>
        
        {/* HEADER CHUNG */}
        <div style={{ flexShrink: 0, background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: "#eff6ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontSize: "18px" }}>📦</div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>Quản lý Đặt Hàng (PO)</h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>Tạo, theo dõi và nhận kho từ nhà cung cấp</p>
              </div>
            </div>
            <button onClick={() => setShowPOModal(false)} style={{ background: "transparent", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }} onMouseOver={e=>e.currentTarget.style.color='#0f172a'} onMouseOut={e=>e.currentTarget.style.color='#94a3b8'}>&times;</button>
          </div>
          
          <div style={{ display: "flex", gap: "8px", padding: "0 24px 12px 24px" }}>
            <button className={`po-tab ${poTab === "NEW" ? "active" : ""}`} onClick={() => setPoTab("NEW")}>Tạo PO Mới (Chờ nhận)</button>
            <button className={`po-tab ${poTab === "RECEIVE" ? "active" : ""}`} onClick={() => setPoTab("RECEIVE")}>Lịch sử & Nhận hàng</button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "20px", padding: "20px", overflow: "hidden" }}>
          
          {/* ==================== TAB 1: TẠO PO MỚI ==================== */}
          {poTab === "NEW" && (
            <>
              {/* CỘT TRÁI - TÌM KIẾM */}
              <div style={{ width: "320px", flexShrink: 0, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#1e293b", fontWeight: "600" }}>Thông tin Đặt hàng</h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "6px" }}>Nhà Cung Cấp</label>
                    <select className="po-input" value={selectedSupplierId || ""} onChange={(e) => setSelectedSupplierId(e.target.value)}>
                      <option value="">-- Chọn Nhà cung cấp --</option>
                      {(suppliers || []).map((s: any) => (<option key={s.id} value={s.id}>{s.name} ({s.phone})</option>))}
                    </select>
                  </div>

                  <div style={{ position: "relative" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "6px" }}>Tìm Sản Phẩm</label>
                    <div style={{ position: "relative" }}>
                      <svg style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input type="text" className="po-input" style={{ paddingLeft: "34px" }} placeholder="Tên hoặc mã vạch..." value={poSearch || ""} onChange={(e) => setPoSearch(e.target.value)} />
                    </div>

                    {(poSearch || "").trim() && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "250px", overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", marginTop: "4px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 10 }}>
                        {(products || []).filter((p) => cleanName(p?.name || "").toLowerCase().includes(poSearch.toLowerCase()) || String(p?.product_code || "").toLowerCase().includes(poSearch.toLowerCase())).slice(0, 10).map((p) => (
                          <div key={p.id} onClick={() => {
                              const currentItems = poItems || []; const exist = currentItems.find((i) => i?.product?.id === p.id);
                              if (exist) { setPoItems(currentItems.map((i) => i?.product?.id === p.id ? { ...i, qty: (Number(i.qty) || 0) + 1 } : i)); } 
                              else { setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...currentItems]); }
                              setPoSearch("");
                            }} 
                            style={{ padding: "10px 14px", borderBottom: "1px solid #f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "0.1s" }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <div style={{ overflow: "hidden" }}>
                              <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "13px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{cleanName(p?.name || "SP")}</div>
                              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Mã: {p?.product_code}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                              <div style={{ fontWeight: "600", color: "#10b981", fontSize: "12px" }}>{(p?.import_price || 0).toLocaleString()}đ</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "6px" }}>Ghi chú (Tùy chọn)</label>
                  <textarea className="po-input" placeholder="Ghi chú nội bộ..." value={poNote || ""} onChange={(e) => setPoNote(e.target.value)} style={{ flex: 1, resize: "none" }} />
                </div>
              </div>

              {/* CỘT PHẢI - BẢNG VÀ CHỨC NĂNG */}
              <div style={{ flex: 1, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                
                {/* THANH TOP BAR: GIAO DIỆN THANH TOÁN 3 TRỤ CỘT MỚI */}
                <div style={{ flexShrink: 0, padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  
                  {/* Khu vực tính toán Realtime */}
                  <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "2px" }}>Tổng đơn hàng</div>
                      <div style={{ fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>{currentTotalAmount.toLocaleString()}đ</div>
                    </div>
                    
                    <div style={{ fontSize: "24px", color: "#cbd5e1", fontWeight: "900", marginTop: "12px" }}>-</div>
                    
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>Đã trả trước</div>
                      <input 
                        type="number" 
                        className="po-editable-input" 
                        style={{ width: "130px", color: "#2563eb", fontSize: "16px", padding: "6px 12px", border: "1px solid #93c5fd" }} 
                        placeholder="0" 
                        min="0" 
                        value={paidAmount === "" ? "" : paidAmount} 
                        onFocus={(e)=>e.target.select()} 
                        onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))} 
                      />
                    </div>

                    <div style={{ fontSize: "24px", color: "#cbd5e1", fontWeight: "900", marginTop: "12px" }}>=</div>

                    <div style={{ background: "#fef2f2", padding: "6px 16px", borderRadius: "8px", border: "1px dashed #fca5a5" }}>
                      <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>Cần thanh toán</div>
                      <div style={{ fontSize: "20px", color: currentDebtAmount > 0 ? "#ef4444" : "#10b981", fontWeight: "900" }}>
                        {currentDebtAmount.toLocaleString()}đ
                      </div>
                    </div>
                  </div>
                  
                  {/* Cụm Nút bấm */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handlePrintPDF('ORDER')} className="po-btn po-btn-outline" style={{ color: "#dc2626", borderColor: "#fca5a5" }}>🖨️ PDF</button>
                    <button onClick={handleExportDraft} className="po-btn po-btn-outline" style={{ color: "#16a34a", borderColor: "#86efac" }}>📥 Excel</button>
                    <button onClick={onSaveNewPO} disabled={loading || !poItems || poItems.length === 0} className="po-btn po-btn-primary" style={{ padding: "10px 20px" }}>
                      {loading ? "Đang xử lý..." : "💾 Lưu Phiếu"}
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                  <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: "12px 20px", textAlign: "left" }}>Sản phẩm</th>
                        <th style={{ padding: "12px", textAlign: "right", width: "100px" }}>Số lượng</th>
                        <th style={{ padding: "12px", textAlign: "right", width: "130px" }}>Giá nhập (đ)</th>
                        <th style={{ padding: "12px 20px", textAlign: "right", width: "130px" }}>Thành tiền</th>
                        <th style={{ padding: "12px", textAlign: "center", width: "50px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!poItems || poItems.length === 0) ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>Chưa có sản phẩm. Nhập từ cột bên trái.</td></tr>
                      ) : (
                        poItems.map((item: any, idx: number) => (
                          <tr key={idx} style={{ transition: "0.1s" }}>
                            <td style={{ padding: "12px 20px" }}>
                              <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "14px" }}>{cleanName(item?.product?.name || "SP")}</div>
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Mã: {item?.product?.product_code}</div>
                            </td>
                            <td style={{ padding: "12px", verticalAlign: "top" }}>
                              <input type="number" className="po-editable-input" placeholder="0" min="0" value={item.qty === "" ? "" : item.qty} onFocus={(e)=>e.target.select()} onChange={(e) => updateItemField(idx, 'qty', e.target.value)} />
                            </td>
                            <td style={{ padding: "12px", verticalAlign: "top" }}>
                              <input type="number" className="po-editable-input" placeholder="0" min="0" value={item.importPrice === "" ? "" : item.importPrice} onFocus={(e)=>e.target.select()} onChange={(e) => updateItemField(idx, 'importPrice', e.target.value)} />
                            </td>
                            <td style={{ padding: "12px 20px", fontWeight: "600", textAlign: "right", color: "#2563eb", fontSize: "14px", verticalAlign: "top", paddingTop: "20px" }}>
                              {((Number(item.qty) || 0) * (Number(item.importPrice) || 0)).toLocaleString()}đ
                            </td>
                            <td style={{ padding: "12px", textAlign: "center", verticalAlign: "top", paddingTop: "16px" }}>
                              <button onClick={() => setPoItems((poItems || []).filter((_, ix) => ix !== idx))} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer", padding: "4px" }}>✖</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ==================== TAB 2: TÌM & NHẬN HÀNG ==================== */}
          {poTab === "RECEIVE" && (
            <>
              {/* CỘT TRÁI - DANH SÁCH PO */}
              <div style={{ width: "320px", flexShrink: 0, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                   <svg style={{ position: "absolute", left: "26px", top: "26px", color: "#94a3b8" }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input type="text" className="po-input" style={{ paddingLeft: "34px" }} placeholder="Tìm theo mã PO..." value={searchPoCode || ""} onChange={(e) => setSearchPoCode(e.target.value)} />
                </div>
                
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {allPOs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Chưa có lịch sử.</div>
                  ) : (
                    allPOs.filter((po: any) => po.po_code.toLowerCase().includes((searchPoCode || "").toLowerCase())).map((po: any) => (
                      <div key={po.id} className={`po-list-item ${foundPO?.id === po.id ? 'active' : ''}`} onClick={() => handleSelectPOToReceive(po)}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: "#0f172a", fontSize: "14px", fontWeight: "600" }}>{po.po_code}</span>
                          <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "12px", background: po.status === 'COMPLETED' ? '#dcfce7' : '#f1f5f9', color: po.status === 'COMPLETED' ? '#059669' : '#64748b' }}>
                            {po.status === 'COMPLETED' ? 'Đã Nhập' : 'Chờ Hàng'}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#475569", marginBottom: "6px" }}>{po.supplier?.name || 'Không rõ NCC'}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                          <span>{new Date(po.created_at).toLocaleDateString('vi-VN')}</span>
                          <span style={{ fontWeight: "600", color: "#1e293b" }}>{(po.total_amount || 0).toLocaleString()}đ</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT PHẢI - CHI TIẾT PO VÀ XÁC NHẬN */}
              <div style={{ flex: 1, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                {!foundPO ? (
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: "#94a3b8" }}>Chọn phiếu PO để xem chi tiết.</div>
                ) : (
                  <>
                    <div style={{ flexShrink: 0, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>{foundPO.po_code}</h3>
                            <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", background: foundPO.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: foundPO.status === 'COMPLETED' ? '#059669' : '#b45309' }}>
                              {foundPO.status === 'COMPLETED' ? '✓ Đã Nhận & Lưu Kho' : '⏳ Chờ Nhận Hàng'}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Nhà cung cấp: <span style={{ color: "#1e293b", fontWeight: "500" }}>{foundPO.supplier?.name}</span></p>
                        </div>
                        
                        <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                           <div>
                             <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Thực nhận</div>
                             <div style={{ fontSize: "20px", color: "#059669", fontWeight: "700" }}>
                               {(receiveItems || []).reduce((sum, item) => sum + (Number(item.actualQty === undefined ? item.qty : item.actualQty) || 0) * (Number(item.importPrice) || 0), 0).toLocaleString()}đ
                             </div>
                           </div>
                           <div>
                             <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600", textTransform: "uppercase" }}>Hàng lỗi (Trừ)</div>
                             <div style={{ fontSize: "16px", color: "#ef4444", fontWeight: "600", marginTop: "2px" }}>
                               -{(receiveItems || []).reduce((sum, item) => sum + (Number(item.returnQty) || 0) * (Number(item.importPrice) || 0), 0).toLocaleString()}đ
                             </div>
                           </div>
                        </div>
                      </div>

                      <div style={{ padding: "12px 20px", borderTop: "1px dashed #cbd5e1", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button onClick={() => handlePrintPDF('ORDER')} className="po-btn po-btn-outline">🖨️ In Lại PO</button>
                        <button onClick={() => handlePrintPDF('RETURN')} className="po-btn po-btn-outline" style={{ borderColor: "#fca5a5", color: "#dc2626" }}>🖨️ In Phiếu Trả</button>
                        
                        {foundPO.status === 'COMPLETED' ? (
                          <button onClick={() => handlePrintPDF('RECEIPT')} className="po-btn po-btn-outline" style={{ borderColor: "#10b981", color: "#059669" }}>🖨️ In Phiếu Nhập Kho</button>
                        ) : (
                          <button onClick={handleConfirmAndProcess} disabled={loading} className="po-btn po-btn-success" style={{ padding: "8px 20px" }}>
                            {loading ? "Đang xử lý..." : "✓ Xác Nhận & Nhập Kho"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto" }}>
                      <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: "12px 20px", textAlign: "left" }}>Sản phẩm</th>
                            <th style={{ padding: "12px", textAlign: "right", width: "80px" }}>SL Đặt</th>
                            <th style={{ padding: "12px", textAlign: "right", width: "100px" }}>Giá nhập</th>
                            <th style={{ padding: "12px 10px", textAlign: "right", width: "120px", color: "#059669" }}>SL THỰC NHẬN</th>
                            <th style={{ padding: "12px 20px", textAlign: "right", width: "120px", color: "#ef4444" }}>SL LỖI (TRẢ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(receiveItems || []).map((item: any, idx: number) => {
                            const isCompleted = foundPO.status === 'COMPLETED';
                            return (
                              <tr key={idx}>
                                <td style={{ padding: "12px 20px" }}>
                                  <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "14px" }}>{cleanName(item?.product?.name || "SP")}</div>
                                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Mã: {item?.product?.product_code}</div>
                                </td>
                                <td style={{ padding: "12px", textAlign: "right", fontWeight: "500", color: "#64748b", fontSize: "14px", verticalAlign: "top", paddingTop: "20px" }}>
                                  {item.qty}
                                </td>
                                <td style={{ padding: "12px", textAlign: "right", color: "#475569", fontSize: "14px", verticalAlign: "top", paddingTop: "20px" }}>
                                  {(item.importPrice || 0).toLocaleString()}đ
                                </td>
                                
                                <td style={{ padding: "12px 10px", verticalAlign: "top" }}>
                                  <input type="number" className="po-editable-input" min="0" style={{ borderColor: isCompleted ? "transparent" : "#a7f3d0", color: isCompleted ? "#0f172a" : "#059669", background: isCompleted ? "transparent" : "#f0fdf4" }} value={item.actualQty === undefined ? item.qty : (item.actualQty === "" ? "" : item.actualQty)} disabled={isCompleted} onFocus={(e)=>e.target.select()} onChange={(e) => updateReceiveItemField(idx, 'actualQty', e.target.value)} />
                                </td>

                                <td style={{ padding: "12px 20px", verticalAlign: "top" }}>
                                  <input type="number" className="po-editable-input error-mode" min="0" style={{ borderColor: isCompleted ? "transparent" : "#fecaca", color: isCompleted ? "#0f172a" : "#ef4444", background: isCompleted ? "transparent" : "#fef2f2" }} value={item.returnQty === undefined ? 0 : (item.returnQty === "" ? "" : item.returnQty)} disabled={isCompleted} onFocus={(e)=>e.target.select()} onChange={(e) => updateReceiveItemField(idx, 'returnQty', e.target.value)} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
