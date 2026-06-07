import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { TransactionLog, Customer, HeldOrder, AuditLog, Expense, Supplier } from '../types';

interface OfflineSyncProps {
  isLoggedIn: boolean;
  history: TransactionLog[];
  setHistory: React.Dispatch<React.SetStateAction<TransactionLog[]>>;
  customers: Record<string, Customer>;
  setCustomers: React.Dispatch<React.SetStateAction<Record<string, Customer>>>;
  heldOrders: HeldOrder[];
  setHeldOrders: React.Dispatch<React.SetStateAction<HeldOrder[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
}

export const useOfflineSync = ({
  isLoggedIn, history, setHistory, customers, setCustomers,
  heldOrders, setHeldOrders, auditLogs, setAuditLogs,
  expenses, setExpenses, suppliers, setSuppliers
}: OfflineSyncProps) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  // Dùng Ref để lưu trữ dữ liệu mới nhất mà không làm trigger lại useEffect của EventListener
  const dataRef = useRef({ history, customers, heldOrders, auditLogs, expenses, suppliers });
  const isInitialMount = useRef(true);

  // Cập nhật Ref mỗi khi dữ liệu thay đổi
  useEffect(() => {
    dataRef.current = { history, customers, heldOrders, auditLogs, expenses, suppliers };
  }, [history, customers, heldOrders, auditLogs, expenses, suppliers]);

  // Hàm đồng bộ 1 bảng lên Cloud
  const syncToCloud = async (tableName: string, dataArray: any, isObject = false) => {
    if (!navigator.onLine) { setSyncStatus('error'); return false; }
    
    // BẢO MẬT: Lấy ID của cửa hàng để đóng dấu vào dữ liệu trước khi đẩy lên
    const ownerId = window.localStorage.getItem("mart_owner_id");
    if (!ownerId) return false;

    try {
      setSyncStatus('syncing');
      let formattedData = [];
      
      if (isObject) { 
        const safeObj = dataArray || {};
        // Tự động gắn owner_id vào mỗi object khách hàng
        formattedData = Object.keys(safeObj).map(key => ({ phone: key, ...safeObj[key], owner_id: ownerId })); 
      } else { 
        // Tự động gắn owner_id vào mỗi dòng dữ liệu (Nhật ký, Lịch sử, Chi phí...)
        formattedData = (dataArray || []).map((item: any) => ({ ...item, owner_id: ownerId })); 
      }
      
      if (formattedData.length === 0) { setSyncStatus('synced'); return true; }
      
      const { error } = await supabase.from(tableName).upsert(formattedData, { onConflict: tableName === 'customers' ? 'phone' : 'id' });
      if (error) throw error;
      
      setSyncStatus('synced'); 
      return true;
    } catch (err) { 
      setSyncStatus('error'); 
      return false; 
    }
  };

  // Hàm gom đồng bộ tất cả
  const syncAllOfflineData = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncStatus('syncing');
    const currentData = dataRef.current;
    
    await Promise.all([ 
      syncToCloud('history', currentData.history), 
      syncToCloud('customers', currentData.customers, true), 
      syncToCloud('held_orders', currentData.heldOrders), 
      syncToCloud('audit_logs', currentData.auditLogs), 
      syncToCloud('expenses', currentData.expenses), 
      syncToCloud('suppliers', currentData.suppliers) 
    ]);
  }, []);

  // Lắng nghe sự kiện Mạng (Chỉ chạy 1 lần khi mount)
  useEffect(() => {
    const handleOnline = () => { 
      setIsOnline(true); 
      syncAllOfflineData(); 
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => { 
      window.removeEventListener('online', handleOnline); 
      window.removeEventListener('offline', handleOffline); 
    };
  }, [syncAllOfflineData]);

  // Kéo dữ liệu từ Cloud về khi đăng nhập
  const loadCloudData = async () => {
    // CHỐT CHẶN BẢO MẬT: Bắt buộc phải có thẻ nhận diện cửa hàng (owner_id)
    const ownerId = window.localStorage.getItem("mart_owner_id");
    if (!ownerId) {
      console.warn("Không tìm thấy chủ sở hữu, từ chối tải dữ liệu đám mây!");
      return; 
    }

    try {
      setSyncStatus('syncing');
      
      // TẢI DỮ LIỆU ĐỘC LẬP: Chỉ tải những dòng có Sổ đỏ (owner_id) khớp với cửa hàng hiện tại
      const [rCust, rHist, rExp, rSup, rAud, rHold] = await Promise.all([
        supabase.from('customers').select('*').eq('owner_id', ownerId), 
        supabase.from('history').select('*').eq('owner_id', ownerId).order('id', { ascending: false }).limit(1500),
        supabase.from('expenses').select('*').eq('owner_id', ownerId).order('id', { ascending: false }), 
        supabase.from('suppliers').select('*').eq('owner_id', ownerId).order('id', { ascending: false }),
        supabase.from('audit_logs').select('*').eq('owner_id', ownerId).order('id', { ascending: false }).limit(300), 
        supabase.from('held_orders').select('*').eq('owner_id', ownerId)
      ]);

      if (rCust.data && rCust.data.length > 0) { 
        setCustomers((prev: any) => { 
          const updated = { ...prev }; 
          rCust.data.forEach((c: any) => { updated[c.phone] = { ...updated[c.phone], ...c }; }); 
          return updated; 
        }); 
      }
      
      // Xử lý đính kèm dữ liệu (Merge Data)
      const mergeData = (prev: any[], cloudData: any[]) => {
        const cloudIds = new Set(cloudData.map(item => item.id)); 
        const localOnly = (prev || []).filter(item => !cloudIds.has(item.id)); 
        return [...localOnly, ...cloudData].sort((a, b) => b.id - a.id);
      };

      if (rHist.data) setHistory(prev => mergeData(prev, rHist.data));
      if (rExp.data) setExpenses(prev => mergeData(prev, rExp.data));
      if (rSup.data) setSuppliers(prev => mergeData(prev, rSup.data));
      if (rAud.data) setAuditLogs(prev => mergeData(prev, rAud.data));
      if (rHold.data) setHeldOrders(prev => mergeData(prev, rHold.data));
      
      setSyncStatus('synced');
    } catch (err) { 
      setSyncStatus('error'); 
    }
  };

  // Debounce quá trình đồng bộ khi người dùng thao tác
  useEffect(() => {
    if (isInitialMount.current) { 
      isInitialMount.current = false; 
      return; 
    }
    
    const delaySync = setTimeout(() => {
      if (isLoggedIn) { syncAllOfflineData(); }
    }, 2000);
    
    return () => clearTimeout(delaySync);
  }, [history, customers, heldOrders, auditLogs, expenses, suppliers, isLoggedIn, syncAllOfflineData]);

  return { isOnline, syncStatus, syncAllOfflineData, loadCloudData };
};
