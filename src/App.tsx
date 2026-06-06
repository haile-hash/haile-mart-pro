/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';
import { Toaster, toast } from "react-hot-toast";

// --- HOOKS GỐC CỦA BẠN ---
import { useOfflineSync } from "./hooks/useOfflineSync";

// --- TYPES ĐÃ HỢP NHẤT ---
import { 
  Product, Customer, Supplier, PurchaseOrder, CustomerOrder, 
  RefundTicket, StockCount, AppNotification, DailyReport, TransactionLog 
} from "./types/index";

// --- CÁC COMPONENT GIAO DIỆN TỪ AI STUDIO ---
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DashboardTab from "./components/DashboardTab";
import InventoryTab from "./components/InventoryTab";
import PurchaseOrderTab from "./components/PurchaseOrderTab";
import StockCountTab from "./components/StockCountTab";
import ReturnRefundTab from "./components/ReturnRefundTab";
import CustomerTab from "./components/CustomerTab";
import ReportTab from "./components/ReportTab";
import CustomerPortal from "./components/CustomerPortal";
import { Login } from "./components/auth/Login"; 

// --- INDEXED DB HELPERS TỪ CODE GỐC ---
const dbName = "HaileMartIndexedDB";
const storeName = "kv_store";
const initDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { const request = indexedDB.open(dbName, 1); request.onupgradeneeded = () => { request.result.createObjectStore(storeName); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); };
const dbGet = async (key: string): Promise<any> => { const db = await initDB(); return new Promise((resolve, reject) => { const tx = db.transaction(storeName, "readonly"); const store = tx.objectStore(storeName); const req = store.get(key); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); };
const dbSet = async (key: string, value: any): Promise<void> => { const db = await initDB(); return new Promise((resolve, reject) => { const tx = db.transaction(storeName, "readwrite"); const store = tx.objectStore(storeName); const req = store.put(value, key); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); };
const dbRemove = async (key: string): Promise<void> => { const db = await initDB(); return new Promise((resolve, reject) => { const tx = db.transaction(storeName, "readwrite"); const store = tx.objectStore(storeName); const req = store.delete(key); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); };

export default function App() {
  // ========================================================
  // 1. STATE ĐIỀU PHỐI (PORTAL, AUTH, OFFLINE)
  // ========================================================
  const [isStorageLoading, setIsStorageLoading] = useState(true); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [currentPortal, setCurrentPortal] = useState<"client" | "admin">("admin");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const [adminSession, setAdminSession] = useState<{ cashierName: string; shift: string; startingCash: number } | null>(null);
  
  // ========================================================
  // 2. STATE DỮ LIỆU (SUPABASE)
  // ========================================================
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [refundTickets, setRefundTickets] = useState<RefundTicket[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [history, setHistory] = useState<TransactionLog[]>([]);
  const [expenses, setExpenses] = useState<{ id: string; amount: number; note: string; timestamp: string }[]>([]);

  // Hook Offline Gốc của bạn
  const { isOnline, syncStatus, loadCloudData } = useOfflineSync({ 
    isLoggedIn, history, setHistory, customers, setCustomers, 
    expenses, setExpenses, suppliers, setSuppliers 
  });

  // ========================================================
  // 3. FETCH DỮ LIỆU & REALTIME SUPABASE
  // ========================================================
  const fetchProducts = async () => { 
    try { 
      if (navigator.onLine) { 
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
        if (data && !error) { setProducts(data); await dbSet("mart_products_cache", data); } 
      } else { 
        const localData = await dbGet("mart_products_cache"); if (localData) setProducts(localData); 
      } 
    } catch (err) {} 
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts(); 
      loadCloudData();
      
      const channel = supabase.channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData())
        .subscribe();
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const initializeEnterpriseStorage = async () => {
      try {
        const loggedIn = await dbGet("mart_logged_in") === "true"; 
        setIsLoggedIn(loggedIn); 
        if (loggedIn) {
           const savedShift = await dbGet("mart_shift") || "Ca Sáng";
           const savedCash = Number(await dbGet("mart_starting_cash") || 5000000);
           setAdminSession({ cashierName: "Quản trị viên", shift: savedShift, startingCash: savedCash });
           setIsLocked(false);
        }
      } catch (err) {} finally { setIsStorageLoading(false); }
    };
    initializeEnterpriseStorage();
  }, []);

  // ========================================================
  // 4. BẢN VÁ LỖI: CHUNKING CHO KIỂM KHO
  // ========================================================
  const handleApproveStockCount = async (id: string) => {
    const sheet = stockCounts.find((sc) => sc.id === id);
    if (!sheet) return;

    let actualStockInput: Record<string, number> = {};
    sheet.items.forEach(item => { actualStockInput[item.productId] = item.countedQty; });

    toast.loading("Đang đẩy số liệu cân đối lên Cloud...", { id: "sync-stock" });
    try { 
      let count = 0; 
      if (navigator.onLine) {
        const entries = Object.entries(actualStockInput);
        for (let i = 0; i < entries.length; i += 20) {
           const chunk = entries.slice(i, i + 20);
           const updatePromises = chunk.map(([barcode, actualQty]) => 
              supabase.from("products").update({ stock: Number(actualQty), updated_at: new Date().toISOString() }).eq("barcode", barcode)
           );
           const results = await Promise.all(updatePromises);
           const errors = results.filter((r: any) => r.error);
           if (errors.length > 0) {
              toast.error("Lỗi mạng khi cập nhật: " + errors[0].error.message, { id: "sync-stock" });
              return; 
           }
        }
        count = entries.length;
      } else {
        count = Object.keys(actualStockInput).length;
        toast.error("Đã lưu Offline! Tự động đồng bộ khi có mạng.", { id: "sync-stock" });
      }

      setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(p => {
          if (actualStockInput[p.barcode] !== undefined) {
            return { ...p, stock: Number(actualStockInput[p.barcode]) };
          }
          return p;
        });
        dbSet("mart_products_cache", updatedProducts).catch(()=>{});
        return updatedProducts;
      });

      setStockCounts(stockCounts.map(sc => sc.id === id ? { ...sc, status: 'approved' } : sc));

      toast.success(`Đã cân đối & chốt sổ ${count} mã hàng!`, { id: "sync-stock" }); 
      handleAddNotification({ id: `NOT-${Date.now()}`, title: "⚖️ Chốt hồ sơ kiểm kê!", message: `Phiếu ${id} đã được chốt sổ.`, type: "success", timestamp: new Date().toLocaleTimeString(), read: false });
    } catch (e: any) { 
      toast.error("Lỗi đồng bộ kho: " + e.message, { id: "sync-stock" }); 
    } 
  };

  // ========================================================
  // 5. BẢN VÁ LỖI: NHẬP HÀNG PO ĐẨY LÊN CLOUD
  // ========================================================
  const handleReceivePO = async (id: string, lines: { productId: string; receivedQty: number }[]) => {
    const updatedPOs = purchaseOrders.map((po) => {
      if (po.id === id) {
        return {
          ...po, status: "received", receivedDate: new Date().toISOString(),
          items: po.items.map((item) => {
            const scanLine = lines.find((l) => l.productId === item.productId);
            return { ...item, receivedQty: scanLine ? scanLine.receivedQty : item.orderedQty };
          })
        };
      }
      return po;
    });
    setPurchaseOrders(updatedPOs as any);

    const updatedProducts = [...products];
    const updatePromises: any[] = [];

    lines.forEach((line) => {
      const pIdx = updatedProducts.findIndex((p) => p.barcode === line.productId);
      if (pIdx > -1) {
        updatedProducts[pIdx].stock += line.receivedQty; 
        
        if (navigator.onLine) {
          updatePromises.push(
            supabase.from('products')
              .update({ stock: updatedProducts[pIdx].stock, updated_at: new Date().toISOString() })
              .eq('barcode', line.productId)
          );
        }
      }
    });

    setProducts(updatedProducts);

    if (navigator.onLine && updatePromises.length > 0) {
      toast.loading("Đang đồng bộ số kho mới lên máy chủ...", { id: "po-sync" });
      try {
        await Promise.all(updatePromises);
        toast.success("Nhập kho & Đồng bộ Cloud thành công!", { id: "po-sync" });
      } catch (err: any) {
        toast.error("Có lỗi khi ghi lên máy chủ: " + err.message, { id: "po-sync" });
      }
    } else {
      toast.success("Nhập kho thành công (Lưu tạm Offline)!");
    }
  };

  // ========================================================
  // 6. CÁC HANDLER LOGIC KHÁC
  // ========================================================
  const handleAddProduct = async (newProd: Product) => {
    setProducts([newProd, ...products]);
    if (navigator.onLine) await supabase.from('products').insert([newProd]);
    toast.success("Thêm sản phẩm thành công!");
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    setProducts(products.map(p => p.barcode === updatedProd.barcode ? updatedProd : p));
    if (navigator.onLine) await supabase.from('products').update(updatedProd).eq('barcode', updatedProd.barcode);
    toast.success("Cập nhật thành công!");
  };

  const handleDeleteProduct = async (barcode: string) => {
    setProducts(products.filter(p => p.barcode !== barcode));
    if (navigator.onLine) await supabase.from('products').delete().eq('barcode', barcode);
    toast.success("Đã xóa sản phẩm!");
  };

  const handleDraftPO = (newPO: PurchaseOrder) => setPurchaseOrders([newPO, ...purchaseOrders]);
  
  const handlePlacePO = (id: string) => {
    setPurchaseOrders(purchaseOrders.map((po) => (po.id === id ? { ...po, status: "ordered" } : po)));
    toast.success(`Đã gửi PO ${id} cho Nhà cung cấp!`);
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers([...customers, newCustomer]);
    if (navigator.onLine) await supabase.from('customers').insert([newCustomer]);
    toast.success("Tạo thẻ VIP thành công!");
  };

  const handleAddNotification = (newNotif: AppNotification) => setNotifications([newNotif, ...notifications]);

  // ========================================================
  // 7. RENDER GIAO DIỆN
  // ========================================================
  if (!isStorageLoading && !isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" />
        <Login setIsLoggedIn={setIsLoggedIn} setRole={() => {}} shift="Ca Sáng" setShift={()=>{}} startingCash={2000000} setStartingCash={()=>{}} installPrompt={null} handleInstallApp={()=>{}} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-gray-800">
      <Toaster position="top-right" />
      
      <Header
        notifications={notifications}
        onMarkAllRead={() => setNotifications(notifications.map(n => ({...n, read: true})))}
        onClearNotifications={() => setNotifications([])}
        onRemoveNotification={(id) => setNotifications(notifications.filter(n => n.id !== id))}
        currentPortal={currentPortal}
        onSwitchPortal={setCurrentPortal}
        isOffline={!isOnline}
        onToggleOffline={() => {}} 
        onLockScreen={() => setIsLocked(true)}
        adminSession={adminSession}
        onLogout={() => {
          if (confirm("Chốt sổ & Kết thúc ca?")) {
            dbRemove("mart_logged_in"); setIsLoggedIn(false); window.location.reload();
          }
        }}
      />

      <div className="flex flex-1 items-stretch">
        {currentPortal === "client" ? (
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
            <CustomerPortal
              products={products} customers={customers} orders={orders}
              onAddOrder={(o) => setOrders([o, ...orders])}
              onUpdateInventoryAfterSale={(items) => {
                 // Trừ tồn kho tự động khi khách đặt đơn
                 setProducts(prev => prev.map(p => {
                    const cartItem = items.find(it => it.productId === p.barcode);
                    return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.qty) } : p;
                 }));
              }}
              onUpdateCustomerPoints={(id, pts) => {
                 setCustomers(prev => prev.map(c => c.id === id ? { ...c, points: c.points + pts } : c));
              }}
              onAddNotification={handleAddNotification}
              onAddRefundTicket={(t) => setRefundTickets([t, ...refundTickets])}
            />
          </main>
        ) : (
          <>
            <Sidebar 
              activeTab={activeTab} setActiveTab={setActiveTab} 
              lowStockCount={products.filter(p => p.stock <= p.minStock).length} 
              nearExpiryCount={0} 
            />
            <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-4rem)] bg-gray-50/50">
              {activeTab === "dashboard" && <DashboardTab products={products} orders={orders} reports={reports} onNavigateToTab={setActiveTab} startingCash={adminSession?.startingCash} cashierName={adminSession?.cashierName} shiftName={adminSession?.shift} expenses={expenses} onAddExpense={(amount, note) => setExpenses([{id: `EXP-${Date.now()}`, amount, note, timestamp: new Date().toISOString()}, ...expenses])} />}
              {activeTab === "inventory" && <InventoryTab products={products} suppliers={suppliers} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
              {activeTab === "po" && <PurchaseOrderTab products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} onDraftPO={handleDraftPO} onPlacePO={handlePlacePO} onReceivePO={handleReceivePO} />}
              {activeTab === "stocktake" && <StockCountTab products={products} stockCounts={stockCounts} onCreateStockCount={(sc) => setStockCounts([sc, ...stockCounts])} onApproveStockCount={handleApproveStockCount} />}
              {activeTab === "returns" && <ReturnRefundTab products={products} refundTickets={refundTickets} orders={orders} onApproveRefund={(id)=>{}} onRejectRefund={(id)=>{}} />}
              {activeTab === "customers" && <CustomerTab customers={customers} onAddCustomer={handleAddCustomer} onPayoffDebt={(id, amt)=>{}} onTopUpWallet={(id, amt)=>{}} />}
              {activeTab === "reports" && <ReportTab products={products} reports={reports} />}
            </main>
          </>
        )}
      </div>

      {isLocked && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md text-slate-100 select-none">
          <div className="w-full max-w-sm p-8 text-center space-y-6">
            <div className="inline-flex justify-center items-center w-14 h-14 bg-orange-500/20 text-orange-500 rounded-3xl animate-bounce">
              🔒
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-wide">Màn Hình Khóa</h2>
              <p className="text-xs text-slate-400">Trạm đang tạm khóa bảo đảm tài chính.</p>
            </div>
            <button onClick={() => setIsLocked(false)} className="px-6 py-3 bg-orange-500 rounded-xl font-bold w-full hover:bg-orange-600 transition-colors">
              Mở khóa (Demo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
