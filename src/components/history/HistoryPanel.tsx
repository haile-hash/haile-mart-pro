/* eslint-disable */
// @ts-nocheck
import React, { useState, useMemo, useEffect } from "react";
import { cleanName } from "../../utils/helpers";

export type TransactionType = "BÁN" | "NHẬP" | "NHẬP PO" | "TRẢ HÀNG" | "THU NỢ" | "GHI NỢ" | string;

export interface TransactionLog {
  id: string | number;
  type: TransactionType;
  customer?: string;
  order_id?: string;
  t?: string;
  time?: string;
  name: string;
  total: number;
  paymentMethod?: string;
  refundMethod?: string; // Mới: Hình thức hoàn tiền
  qty?: number;
  details?: string; // Mới: Chi tiết hàng hóa
}

interface HistoryPanelProps {
  onPrintK80?: (log: any) => void;
  onPrintA4?: (log: any) => void;
  logSearchTerm: string;
  setLogSearchTerm: (val: string) => void;
  logTypeFilter: string;
  setLogTypeFilter: (val: string) => void;
  exportToCSV: () => void;
  groupedHistory: Record<string, TransactionLog[]>;
  handleRefund: (logId: string | number) => void;
  handleReprint: (timeStr: string) => void; 
}

const LOG_TYPES: TransactionType[] = ["BÁN", "NHẬP", "NHẬP PO", "TRẢ HÀNG", "THU NỢ", "GHI NỢ"];

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  onPrintK80, onPrintA4, logSearchTerm, setLogSearchTerm,
  logTypeFilter, setLogTypeFilter, exportToCSV, groupedHistory, handleRefund
}) => {
  const [localExpanded, setLocalExpanded] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => { setVisibleCount(50); }, [groupedHistory]);

  const allLogs = useMemo(() => {
    const flat: TransactionLog[] = [];
    Object.values(groupedHistory || {}).forEach(logs => flat.push(...(logs || [])));
    return flat;
  }, [groupedHistory]);

  const { visibleGrouped, totalLogs } = useMemo(() => {
    const flatLogs: { dateStr: string; log: TransactionLog }[] = [];
    Object.entries(groupedHistory || {}).forEach(([dateStr, logs]) => {
      (logs || []).forEach(log => flatLogs.push({ dateStr, log }));
    });
    const total = flatLogs.length;
    const slicedLogs = flatLogs.slice(0, visibleCount);

    const regrouped: Record<string, TransactionLog[]> = {};
    slicedLogs.forEach(({ dateStr, log }) => {
      if (!regrouped[dateStr]) regrouped[dateStr] = [];
      regrouped[dateStr].push(log);
    });
    return { visibleGrouped: regrouped, totalLogs: total };
  }, [groupedHistory, visibleCount]);

  const toggleGroup = (dateStr: string) => {
    setLocalExpanded(prev => ({ ...prev, [dateStr]: !(prev[dateStr] ?? true) }));
  };

  const renderTransactionItem = (log: TransactionLog) => {
    if (!log) return null; 
    
    const safeType = log.type || "";
    const isRefund = safeType === "TRẢ HÀNG";
    const isImport = safeType.includes("NHẬP");
    const logTime = log.t || log.time?.split(" ")[1] || log.time || "---";
    
    let typeColor = "#2563eb"; // Mặc định bán (Xanh)
    if (isRefund) typeColor = "#dc2626"; // Hoàn trả (Đỏ)
    if (isImport) typeColor = "#7c3aed"; // Nhập hàng (Tím)
    if (safeType === "GHI NỢ" || safeType === "THU NỢ") typeColor = "#d97706"; // Nợ (Cam)

    let remainingQtyToRefund = log.qty || 0;
    if (safeType === "BÁN" || safeType === "GHI NỢ") {
      const safeLogName = log.name ? cleanName(log.name) : "";
      const existingRefunds = allLogs.filter(h => h.type === 'TRẢ HÀNG' && Number(h.id) > Number(log.id) && (h.name || "").includes(safeLogName));
      const alreadyRefundedQty = existingRefunds.reduce((sum, h) => sum + Math.abs(h.qty || 0), 0);
      remainingQtyToRefund = (log.qty || 0) - alreadyRefundedQty;
    }

    return (
      <div key={log.id} style={{ flexShrink: 0, padding: "12px", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "8px", background: isRefund ? "#fff5f5" : (isImport ? "#faf5ff" : "transparent"), opacity: (safeType === "BÁN" || safeType === "GHI NỢ") && remainingQtyToRefund <= 0 ? 0.6 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "12px" }}>
          <span><span role="img" aria-label="user">👤</span> {log.customer || (isImport ? "Nhà cung cấp" : "Khách lẻ")} {log.order_id && <b style={{ color: '#3b82f6', marginLeft: '6px' }}>({log.order_id})</b>}</span>
          <span style={{ fontFamily: "monospace" }}><span role="img" aria-label="time">🕒</span> {logTime}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", lineHeight: "1.4", textDecoration: remainingQtyToRefund <= 0 && (!isRefund && !isImport) ? "line-through" : "none" }}>
              <span style={{ color: typeColor, marginRight: "6px", fontWeight: "bold" }}>[{safeType || "KHÁC"}]</span>
              {log.name ? cleanName(log.name) : "Giao dịch không tên"}
            </span>
            {/* Hiển thị chi tiết số lượng và hàng hóa nếu có */}
            {(log.qty || log.details) && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {log.qty ? `SL: ${Math.abs(log.qty)}` : ""} {log.details ? `- ${log.details}` : ""}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "14px", fontWeight: "800", color: isRefund ? "#dc2626" : (safeType.includes("NHẬP") ? "#7c3aed" : "#10b981"), whiteSpace: "nowrap" }}>
              {isRefund ? "-" : "+"}{(log.total || 0).toLocaleString('vi-VN')}đ
            </span>
            {/* Hiển thị phương thức thanh toán / hoàn tiền rõ ràng */}
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: "600", marginTop: "2px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
              {isRefund ? `Hoàn: ${log.refundMethod || log.paymentMethod || "TM"}` : `TT: ${log.paymentMethod || "TM"}`}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
          {(safeType === "BÁN" || safeType === "GHI NỢ") && remainingQtyToRefund > 0 && (
            <button onClick={(e) => { e.stopPropagation(); handleRefund(log.id); }} style={{ padding: "4px 10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>↩️ Hoàn đơn ({remainingQtyToRefund})</button>
          )}

          {(safeType === "BÁN" || safeType === "GHI NỢ" || safeType === "TRẢ HÀNG") && log.time && (
            <>
              <button onClick={(e) => { e.stopPropagation(); if (onPrintK80) onPrintK80(log); }} style={{ padding: "4px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>🖨️ K80</button>
              <button onClick={(e) => { e.stopPropagation(); if (onPrintA4) onPrintA4(log); }} style={{ padding: "4px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>🖨️ A4</button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ... (Phần return giữ nguyên cấu trúc cũ, chỉ hiển thị lại renderTransactionItem)
  return (
    <div className="glass" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input type="text" className="custom-input" style={{ padding: "10px 12px 10px 34px", margin: 0, fontSize: "14px", width: "100%", boxSizing: "border-box" }} placeholder="Tìm giao dịch..." value={logSearchTerm || ""} onChange={(e) => setLogSearchTerm(e.target.value)} />
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
        </div>
        <select className="custom-input" style={{ width: "110px", padding: "10px", margin: 0, fontSize: "14px", height: "40px", cursor: "pointer" }} value={logTypeFilter || "Tất cả"} onChange={(e) => setLogTypeFilter(e.target.value)}>
          <option value="Tất cả">Tất cả</option>
          {LOG_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
        </select>
        <button onClick={exportToCSV} style={{ padding: "0 12px", height: "40px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>📊 EXCEL</button>
      </div>

      <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "2px" }}>
        {Object.keys(visibleGrouped || {}).length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>Không tìm thấy lịch sử</div>
        ) : (
          Object.entries(visibleGrouped).map(([dateStr, logs]) => {
            const isExpanded = localExpanded[dateStr] ?? true; 
            return (
              <div key={dateStr} style={{ flexShrink: 0, display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#ffffff", overflow: "hidden" }}>
                <div onClick={() => toggleGroup(dateStr)} style={{ padding: "12px", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: isExpanded ? "1px solid #e2e8f0" : "none" }}>
                  <strong style={{ fontSize: "13px", color: "#1e293b" }}>📅 Ngày {dateStr}</strong>
                  <span style={{ fontSize: "12px", color: "#4b5563", background: "#e5e7eb", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>{(logs || []).length} đơn {isExpanded ? "▲" : "▼"}</span>
                </div>
                {isExpanded && (<div style={{ display: "flex", flexDirection: "column" }}>{(logs || []).map(log => renderTransactionItem(log))}</div>)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
