// @ts-nocheck
import React, { useEffect } from "react";
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

  // Khởi tạo cả actualQty (Thực nhận) và returnQty (Hàng lỗi)
  const handleSelectPOToReceive = (po: any) => {
    setFoundPO(po);
    setReceiveItems((po.items || []).map(i => ({ ...i, actualQty: i.qty, returnQty: 0 })));
  };

  // --- XUẤT EXCEL (BẢN NHÁP - TAB TẠO MỚI) ---
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

      let totalAmount = 0;
      poItems.forEach((item: any, index: number) => {
        const qty = Number(item?.qty) || 0;
        const price = Number(item?.importPrice) || 0;
        const rowTotal = qty * price;
        totalAmount += rowTotal;
        wsData.push([index + 1, item?.product?.product_code || "", cleanName(item?.product?.name || "SP"), qty, price, rowTotal]);
      });

      wsData.push([""]);
      wsData.push(["", "", "", "", "TỔNG TIỀN HÀNG:", totalAmount]);
      wsData.push(["", "", "", "", "ĐÃ TRẢ TRƯỚC:", Number(paidAmount) || 0]);
      wsData.push(["", "", "", "", "SỐ TIỀN CÒN LẠI:", totalAmount - (Number(paidAmount) || 0)]);
      
      wsData.push([""]); wsData.push([""]);
      wsData.push(["", "ĐẠI DIỆN BÊN MUA", "", "", "", "ĐẠI DIỆN BÊN BÁN"]);
      wsData.push(["", "(Ký, ghi rõ họ tên & đóng dấu)", "", "", "", "(Ký, ghi rõ họ tên & đóng dấu)"]);

      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData);
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
        { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } },
        { s: { r: 9, c: 0 }, e: { r: 9, c: 5 } },
      ];
      ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 22 }, { wch: 22 }];

      (window as any).XLSX.utils.book_append_sheet(wb, ws, "Don_Dat_Hang");
      (window as any).XLSX.writeFile(wb, `DonDatHang_${Date.now()}.xlsx`);
    } catch (e) { alert("Lỗi xuất Excel! Vui lòng thử lại."); }
  };

  // --- HỆ THỐNG XUẤT PDF 3-TRONG-1 (ĐẶT HÀNG, NHẬP KHO, TRẢ HÀNG LỖI) ---
  const handlePrintPDF = (type: 'ORDER' | 'RECEIPT' | 'RETURN') => {
    let printData = [];
    let title = "";
    let poCodePrint = "";
    let supplierPrint = {};
    let notePrint = "";

    if (type === 'ORDER' && poTab === 'NEW') {
      if (!poItems || poItems.length === 0) return alert("Chưa có sản phẩm nào!");
      printData = poItems.map(i => ({ ...i, printQty: i.qty }));
      title = "ĐƠN ĐẶT HÀNG (PURCHASE ORDER)";
      poCodePrint = `PO_DRAFT_${Date.now().toString().slice(-6)}`;
      supplierPrint = (suppliers || []).find((s: any) => String(s.id) === String(selectedSupplierId)) || {};
      notePrint = poNote;
    } else {
      if (!foundPO) return alert("Chưa chọn phiếu PO!");
      poCodePrint = foundPO.po_code;
      supplierPrint = foundPO.supplier || {};
      notePrint = foundPO.note;
      
      if (type === 'ORDER') {
        title = "ĐƠN ĐẶT HÀNG (PURCHASE ORDER)";
        printData = receiveItems.map(i => ({ ...i, printQty: i.qty }));
      } else if (type === 'RECEIPT') {
        title = "PHIẾU NHẬP KHO (GOODS RECEIPT NOTE)";
        printData = receiveItems.map(i => ({ ...i, printQty: i.actualQty !== undefined ? i.actualQty : i.qty })).filter(i => i.printQty > 0);
        if(printData.length === 0) return alert("Không có sản phẩm nào được thực nhận!");
      } else if (type === 'RETURN') {
        title = "PHIẾU TRẢ HÀNG LỖI (RETURN NOTE)";
        printData = receiveItems.map(i => ({ ...i, printQty: i.returnQty || 0 })).filter(i => i.printQty > 0);
        if(printData.length === 0) return alert("Không có sản phẩm lỗi nào được ghi nhận trong phiếu này!");
      }
    }

    const storeInfo = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}");
    const dateStr = new Date().toLocaleDateString('vi-VN');

    let itemsHtml = "";
    let totalAmount = 0;
    
    printData.forEach((item: any, index: number) => {
      const qty = Number(item.printQty) || 0;
      const price = Number(item.importPrice) || 0;
      const rowTotal = qty * price;
      totalAmount += rowTotal;
      
      itemsHtml += `
        <tr>
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">${index + 1}</td>
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1;">${item?.product?.product_code || ""}</td>
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1;">${cleanName(item?.product?.name || "SP")}</td>
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">${qty}</td>
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: right;">${price.toLocaleString('vi-VN')} đ</td>
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${rowTotal.toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html>
        <head>
          <title>${title}_${poCodePrint}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: #000; margin: 0; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; }
            .flex-container { display: flex; justify-content: space-between; margin-bottom: 25px; }
            .box { width: 48%; padding: 15px; border: 1px solid #000; border-radius: 8px; }
            .box-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; font-size: 15px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { padding: 12px 8px; border: 1px solid #cbd5e1; background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 13px; }
            .total-section { text-align: right; font-size: 15px; margin-bottom: 40px; }
            .total-line { margin-bottom: 8px; }
            .signature-section { display: flex; justify-content: space-between; padding: 0 40px; text-align: center; }
            .sig-title { font-weight: bold; font-size: 15px; margin-bottom: 5px; }
            .sig-sub { font-style: italic; font-size: 13px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${title}</h1>
            <div>Tham chiếu gốc (Mã PO): <strong>${poCodePrint}</strong> &nbsp;|&nbsp; Ngày lập: ${dateStr}</div>
          </div>

          <div class="flex-container">
            <div class="box">
              <div class="box-title">${type === 'RETURN' ? 'Bên Trả Hàng (Cửa hàng)' : 'Thông tin Bên Mua (Buyer)'}</div>
              <table style="width: 100%; border: none; margin: 0; font-size: 14px;">
                <tr><td style="width: 90px; border: none; padding: 3px 0;"><strong>Tên ĐV:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.store_name || "HỆ THỐNG POS PRO"}</td></tr>
                <tr><td style="border: none; padding: 3px 0;"><strong>Địa chỉ:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.address || "Chưa cập nhật"}</td></tr>
                <tr><td style="border: none; padding: 3px 0;"><strong>Điện thoại:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.phone || "Chưa cập nhật"}</td></tr>
                <tr><td style="border: none; padding: 3px 0;"><strong>MST:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.tax_code || "Chưa cập nhật"}</td></tr>
              </table>
            </div>
            <div class="box">
              <div class="box-title">${type === 'RETURN' ? 'Bên Nhận Lại (Nhà CC)' : 'Thông tin Bên Bán (Seller)'}</div>
              <table style="width: 100%; border: none; margin: 0; font-size: 14px;">
                <tr><td style="width: 90px; border: none; padding: 3px 0;"><strong>Nhà CC:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.name || "Chưa chọn"}</td></tr>
                <tr><td style="border: none; padding: 3px 0;"><strong>Địa chỉ:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.address || "Chưa cập nhật"}</td></tr>
                <tr><td style="border: none; padding: 3px 0;"><strong>Điện thoại:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.phone || "Chưa cập nhật"}</td></tr>
                <tr><td style="border: none; padding: 3px 0;"><strong>STK/MST:</strong></td><td style="border: none; padding: 3px 0;">${supplierPrint.taxCode || supplierPrint.bankAccount || "Chưa cập nhật"}</td></tr>
              </table>
            </div>
          </div>

          <div style="margin-bottom: 15px; padding-left: 5px;"><strong>Ghi chú:</strong> ${notePrint || "Không có"}</div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%;">STT</th>
                <th style="width: 15%;">Mã SP</th>
                <th style="width: 35%; text-align: left;">Tên Sản Phẩm</th>
                <th style="width: 10%;">SL</th>
                <th style="width: 15%; text-align: right;">Đơn Giá</th>
                <th style="width: 20%; text-align: right;">Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-line" style="font-size: 18px; margin-top: 10px;"><strong>TỔNG CỘNG:</strong> &nbsp;&nbsp;&nbsp;&nbsp; ${totalAmount.toLocaleString('vi-VN')} đ</div>
            ${type === 'RETURN' ? '<div class="total-line" style="font-style: italic; font-size: 13px;">(Số tiền trên sẽ được trừ vào công nợ hoặc nhà cung cấp hoàn trả lại bằng tiền mặt)</div>' : ''}
          </div>

          <div class="signature-section">
            <div>
              <div class="sig-title">ĐẠI DIỆN CỬA HÀNG</div>
              <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
            </div>
            <div>
              <div class="sig-title">ĐẠI DIỆN NHÀ CUNG CẤP</div>
              <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
            </div>
          </div>

          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.onafterprint = function() { window.close(); }
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      alert("Trình duyệt đã chặn popup. Vui lòng cho phép popup để xuất PDF.");
    }
  };

  // Cập nhật State cho Tab 1
  const updateItemField = (idx, field, value) => {
    const newItems = [...poItems];
    newItems[idx][field] = value === "" ? "" : Number(value);
    setPoItems(newItems);
  };

  // Cập nhật State cho Tab 2 (Thực nhận & Lỗi)
  const updateReceiveItemField = (idx, field, value) => {
    const newItems = [...receiveItems];
    newItems[idx][field] = value === "" ? "" : Number(value);
    setReceiveItems(newItems);
  };

  return (
    <div className="custom-modal-overlay no-print" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999, backdropFilter: "blur(8px)" }}>
      
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
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

        .po-btn { padding: 12px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
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
        
        <div style={{ flexShrink: 0, background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: "#eff6ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontSize: "18px" }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>Quản lý Đặt Hàng (PO)</h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>Tạo, theo dõi và nhận kho từ nhà cung cấp</p>
              </div>
            </div>
            <button onClick={() => setShowPOModal(false)} style={{ background: "transparent", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }} onMouseOver={e=>e.currentTarget.style.color='#0f172a'} onMouseOut={e=>e.currentTarget.style.color='#94a3b8'}>
              &times;
            </button>
          </div>
          
          <div style={{ display: "flex", gap: "8px", padding: "0 24px 12px 24px" }}>
            <button className={`po-tab ${poTab === "NEW" ? "active" : ""}`} onClick={() => setPoTab("NEW")}>
              Tạo PO Mới (Chờ nhận)
            </button>
            <button className={`po-tab ${poTab === "RECEIVE" ? "active" : ""}`} onClick={() => setPoTab("RECEIVE")}>
              Lịch sử & Nhận hàng
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "20px", padding: "20px", overflow: "hidden" }}>
          
          {/* ==================== TAB 1: TẠO PO MỚI ==================== */}
          {poTab === "NEW" && (
            <>
              <div style={{ width: "340px", flexShrink: 0, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#1e293b", fontWeight: "600" }}>Thông tin Đặt hàng</h3>
                  
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "6px" }}>Nhà Cung Cấp</label>
                    <select className="po-input" value={selectedSupplierId || ""} onChange={(e) => setSelectedSupplierId(e.target.value)}>
                      <option value="">-- Chọn Nhà cung cấp --</option>
                      {(suppliers || []).map((s: any) => (<option key={s.id} value={s.id}>{s.name} ({s.phone})</option>))}
                    </select>
                  </div>

                  <div style={{ position: "relative" }}>
                    <label style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "6px" }}>Tìm Sản Phẩm</label>
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
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Tồn: {p?.stock || 0}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "6px" }}>Ghi chú (Tùy chọn)</label>
                  <textarea className="po-input" placeholder="Ghi chú nội bộ..." value={poNote || ""} onChange={(e) => setPoNote(e.target.value)} style={{ flex: 1, resize: "none" }} />
                </div>
              </div>

              <div style={{ flex: 1, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: "12px 20px", textAlign: "left" }}>Sản phẩm</th>
                        <th style={{ padding: "12px", textAlign: "right", width: "120px" }}>Số lượng</th>
                        <th style={{ padding: "12px", textAlign: "right", width: "150px" }}>Giá nhập (đ)</th>
                        <th style={{ padding: "12px 20px", textAlign: "right", width: "150px" }}>Thành tiền</th>
                        <th style={{ padding: "12px", textAlign: "center", width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!poItems || poItems.length === 0) ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "80px 20px" }}>
                            <div style={{ background: "#f8fafc", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", color: "#94a3b8" }}>
                              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: "500", color: "#475569", marginBottom: "4px" }}>Chưa có sản phẩm nào</div>
                            <div style={{ fontSize: "13px", color: "#94a3b8" }}>Tìm và chọn sản phẩm ở cột bên trái để thêm vào phiếu.</div>
                          </td>
                        </tr>
                      ) : (
                        poItems.map((item: any, idx: number) => (
                          <tr key={idx} style={{ transition: "0.1s" }}>
                            <td style={{ padding: "12px 20px" }}>
                              <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "14px" }}>{cleanName(item?.product?.name || "SP")}</div>
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Mã: {item?.product?.product_code}</div>
                            </td>
                            <td style={{ padding: "12px", verticalAlign: "top" }}>
                              <input 
                                type="number" className="po-editable-input" placeholder="0" min="0"
                                value={item.qty === "" ? "" : item.qty} 
                                onFocus={(e)=>e.target.select()} onChange={(e) => updateItemField(idx, 'qty', e.target.value)} 
                              />
                            </td>
                            <td style={{ padding: "12px", verticalAlign: "top" }}>
                              <input 
                                type="number" className="po-editable-input" placeholder="0" min="0"
                                value={item.importPrice === "" ? "" : item.importPrice} 
                                onFocus={(e)=>e.target.select()} onChange={(e) => updateItemField(idx, 'importPrice', e.target.value)} 
                              />
                            </td>
                            <td style={{ padding: "12px 20px", fontWeight: "600", textAlign: "right", color: "#2563eb", fontSize: "14px", verticalAlign: "top", paddingTop: "20px" }}>
                              {((Number(item.qty) || 0) * (Number(item.importPrice) || 0)).toLocaleString()}đ
                            </td>
                            <td style={{ padding: "12px", textAlign: "center", verticalAlign: "top", paddingTop: "16px" }}>
                              <button onClick={() => setPoItems((poItems || []).filter((_, ix) => ix !== idx))} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer", padding: "4px", opacity: 0.6 }} onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0.6'}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ flexShrink: 0, padding: "20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Tổng giá trị:</span>
                    <span style={{ fontSize: "20px", color: "#0f172a", fontWeight: "700" }}>
                      {(poItems || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.importPrice) || 0), 0).toLocaleString()}đ
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Đã trả trước:</span>
                    <input 
                      type="number" className="po-editable-input" style={{ width: "150px", color: "#10b981", fontSize: "16px" }} placeholder="0" min="0"
                      value={paidAmount === "" ? "" : paidAmount} 
                      onFocus={(e)=>e.target.select()} onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))} 
                    />
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handlePrintPDF('ORDER')} className="po-btn po-btn-outline" style={{ flex: 1, color: "#dc2626", borderColor: "#fca5a5" }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h6m-6-8h.01"></path></svg>
                      Xuất PDF
                    </button>
                    <button onClick={handleExportDraft} className="po-btn po-btn-outline" style={{ flex: 1, color: "#16a34a", borderColor: "#86efac" }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Xuất Excel
                    </button>
                    <button onClick={onSaveNewPO} disabled={loading || !poItems || poItems.length === 0} className="po-btn po-btn-primary" style={{ flex: 1.5 }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                      {loading ? "Đang xử lý..." : "Lưu PO"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== TAB 2: TÌM & NHẬN HÀNG ==================== */}
          {poTab === "RECEIVE" && (
            <>
              <div style={{ width: "340px", flexShrink: 0, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                   <svg style={{ position: "absolute", left: "26px", top: "26px", color: "#94a3b8" }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input type="text" className="po-input" style={{ paddingLeft: "34px" }} placeholder="Tìm theo mã PO..." value={searchPoCode || ""} onChange={(e) => setSearchPoCode(e.target.value)} />
                </div>
                
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {allPOs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Chưa có lịch sử đặt hàng.</div>
                  ) : (
                    allPOs.filter((po: any) => po.po_code.toLowerCase().includes((searchPoCode || "").toLowerCase())).map((po: any) => (
                      <div key={po.id} className={`po-list-item ${foundPO?.id === po.id ? 'active' : ''}`} onClick={() => handleSelectPOToReceive(po)}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: "#0f172a", fontSize: "14px", fontWeight: "600" }}>{po.po_code}</span>
                          <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "12px", background: po.status === 'COMPLETED' ? '#dcfce7' : '#f1f5f9', color: po.status === 'COMPLETED' ? '#059669' : '#64748b' }}>
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

              <div style={{ flex: 1, height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                {!foundPO ? (
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: "#94a3b8", flexDirection: "column" }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" style={{ marginBottom: "16px", opacity: 0.5 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <div style={{ fontSize: "15px", fontWeight: "500", color: "#64748b" }}>Vui lòng chọn một phiếu PO để xem chi tiết</div>
                  </div>
                ) : (
                  <>
                    <div style={{ flexShrink: 0, padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>{foundPO.po_code}</h3>
                          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Nhà cung cấp: <span style={{ color: "#1e293b", fontWeight: "500" }}>{foundPO.supplier?.name}</span></p>
                        </div>
                        <div>
                          <span style={{ display: "inline-block", fontSize: "12px", fontWeight: "600", padding: "6px 12px", borderRadius: "20px", background: foundPO.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: foundPO.status === 'COMPLETED' ? '#059669' : '#b45309' }}>
                            {foundPO.status === 'COMPLETED' ? '✓ Đã Nhận Hàng & Lưu Kho' : '⏳ Đang Chờ Nhận Hàng'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto" }}>
                      <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: "12px 24px", textAlign: "left" }}>Sản phẩm</th>
                            <th style={{ padding: "12px", textAlign: "right", width: "80px" }}>SL Đặt</th>
                            <th style={{ padding: "12px", textAlign: "right", width: "100px" }}>Giá nhập</th>
                            <th style={{ padding: "12px 10px", textAlign: "right", width: "110px", color: "#059669" }}>SL THỰC NHẬN</th>
                            <th style={{ padding: "12px 24px", textAlign: "right", width: "110px", color: "#ef4444" }}>SL LỖI (TRẢ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(receiveItems || []).map((item: any, idx: number) => {
                            const isCompleted = foundPO.status === 'COMPLETED';
                            return (
                              <tr key={idx}>
                                <td style={{ padding: "12px 24px" }}>
                                  <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "14px" }}>{cleanName(item?.product?.name || "SP")}</div>
                                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Mã: {item?.product?.product_code}</div>
                                </td>
                                <td style={{ padding: "12px", textAlign: "right", fontWeight: "500", color: "#64748b", fontSize: "14px", verticalAlign: "top", paddingTop: "20px" }}>
                                  {item.qty}
                                </td>
                                <td style={{ padding: "12px", textAlign: "right", color: "#475569", fontSize: "14px", verticalAlign: "top", paddingTop: "20px" }}>
                                  {(item.importPrice || 0).toLocaleString()}đ
                                </td>
                                
                                {/* Ô nhập SL Thực nhận (Hàng Tốt) */}
                                <td style={{ padding: "12px 10px", verticalAlign: "top" }}>
                                  <input 
                                    type="number" className="po-editable-input" min="0"
                                    style={{ borderColor: isCompleted ? "transparent" : "#a7f3d0", color: isCompleted ? "#0f172a" : "#059669", background: isCompleted ? "transparent" : "#f0fdf4" }} 
                                    value={item.actualQty === undefined ? item.qty : (item.actualQty === "" ? "" : item.actualQty)} 
                                    disabled={isCompleted} onFocus={(e)=>e.target.select()}
                                    onChange={(e) => updateReceiveItemField(idx, 'actualQty', e.target.value)} 
                                  />
                                </td>

                                {/* Ô nhập SL Lỗi (Trả lại) */}
                                <td style={{ padding: "12px 24px", verticalAlign: "top" }}>
                                  <input 
                                    type="number" className="po-editable-input error-mode" min="0"
                                    style={{ borderColor: isCompleted ? "transparent" : "#fecaca", color: isCompleted ? "#0f172a" : "#ef4444", background: isCompleted ? "transparent" : "#fef2f2" }} 
                                    value={item.returnQty === undefined ? 0 : (item.returnQty === "" ? "" : item.returnQty)} 
                                    disabled={isCompleted} onFocus={(e)=>e.target.select()}
                                    onChange={(e) => updateReceiveItemField(idx, 'returnQty', e.target.value)} 
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ flexShrink: 0, padding: "20px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Tổng tiền (Theo thực nhận):</span>
                        <span style={{ fontSize: "22px", color: "#059669", fontWeight: "700" }}>
                          {(receiveItems || []).reduce((sum, item) => sum + (Number(item.actualQty === undefined ? item.qty : item.actualQty) || 0) * (Number(item.importPrice) || 0), 0).toLocaleString()}đ
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px dashed #cbd5e1" }}>
                        <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: "500" }}>Tiền hàng lỗi (Trừ vào công nợ/trả lại):</span>
                        <span style={{ fontSize: "16px", color: "#ef4444", fontWeight: "600" }}>
                          - {(receiveItems || []).reduce((sum, item) => sum + (Number(item.returnQty) || 0) * (Number(item.importPrice) || 0), 0).toLocaleString()}đ
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => handlePrintPDF('ORDER')} className="po-btn po-btn-outline" style={{ flex: 1, padding: "10px" }}>
                          🖨️ In Lại Đơn Đặt
                        </button>
                        
                        <button onClick={() => handlePrintPDF('RETURN')} className="po-btn po-btn-outline" style={{ flex: 1.2, padding: "10px", borderColor: "#fca5a5", color: "#dc2626" }}>
                          🖨️ In Phiếu Trả Hàng
                        </button>
                        
                        {foundPO.status === 'COMPLETED' ? (
                          <button onClick={() => handlePrintPDF('RECEIPT')} className="po-btn po-btn-outline" style={{ flex: 1.5, borderColor: "#10b981", color: "#059669" }}>
                            🖨️ In Phiếu Nhập Kho
                          </button>
                        ) : (
                          <button onClick={onConfirmReceipt} disabled={loading} className="po-btn po-btn-success" style={{ flex: 2 }}>
                            {loading ? "Đang xử lý..." : "✓ Xác Nhận & Nhập Kho"}
                          </button>
                        )}
                      </div>
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
