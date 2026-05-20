// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useOfflineSync = ({
  isLoggedIn, history, setHistory, customers, setCustomers,
  heldOrders, setHeldOrders, auditLogs, setAuditLogs,
  expenses, setExpenses, suppliers, setSuppliers
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const isInitialMount = useRef(true);

  // 1. Lắng nghe trạng thái mạng
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncAllOfflineData(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [history, customers, heldOrders, auditLogs, expenses, suppliers]);

  // 2. Logic đẩy dữ liệu lên Cloud
  const syncToCloud = async (tableName: string, dataArray: any, isObject = false) => {
    if (!navigator.onLine) { setSyncStatus('error'); return false; }
    try {
      setSyncStatus('syncing');
      let formattedData = [];
      if (isObject) { formattedData = Object.keys(dataArray).map(key => ({ phone: key, ...dataArray[key] })); } else { formattedData = dataArray; }
      if (formattedData.length === 0) { setSyncStatus('synced'); return true; }
      const { error } = await supabase.from(tableName).upsert(formattedData, { onConflict: tableName === 'customers' ? 'phone' : 'id' });
      if (error) throw error;
      setSyncStatus('synced'); return true;
    } catch (err) { setSyncStatus('error'); return false; }
  };

  const syncAllOfflineData = async () => {
    if (!navigator.onLine) return;
    setSyncStatus('syncing');
    await Promise.all([ syncToCloud('history', history), syncToCloud('customers', customers, true), syncToCloud('held_orders', heldOrders), syncToCloud('audit_logs', auditLogs), syncToCloud('expenses', expenses), syncToCloud('suppliers', suppliers) ]);
  };

  // 3. Logic tải dữ liệu từ Cloud về
  const loadCloudData = async () => {
    try {
      setSyncStatus('syncing');
      const [rCust, rHist, rExp, rSup, rAud, rHold] = await Promise.all([
        supabase.from('customers').select('*'), supabase.from('history').select('*').order('id', { ascending: false }).limit(1500),
        supabase.from('expenses').select('*').order('id', { ascending: false }), supabase.from('suppliers').select('*').order('id', { ascending: false }),
        supabase.from('audit_logs').select('*').order('id', { ascending: false }).limit(300), supabase.from('held_orders').select('*')
      ]);
      if (rCust.data && rCust.data.length > 0) { setCustomers((prev: any) => { const updated = { ...prev }; rCust.data.forEach((c: any) => { updated[c.phone] = { ...updated[c.phone], ...c }; }); return updated; }); }
      if (rHist.data) { setHistory(prev => { const cloudIds = new Set(rHist.data.map(h => h.id)); const localOnly = prev.filter(h => !cloudIds.has(h.id)); return [...localOnly, ...rHist.data].sort((a, b) => b.id - a.id); }); }
      if (rExp.data) { setExpenses(prev => { const cloudIds = new Set(rExp.data.map(e => e.id)); const localOnly = prev.filter(e => !cloudIds.has(e.id)); return [...localOnly, ...rExp.data].sort((a, b) => b.id - a.id); }); }
      if (rSup.data) { setSuppliers(prev => { const cloudIds = new Set(rSup.data.map(s => s.id)); const localOnly = prev.filter(s => !cloudIds.has(s.id)); return [...localOnly, ...rSup.data].sort((a, b) => b.id - a.id); }); }
      if (rAud.data) { setAuditLogs(prev => { const cloudIds = new Set(rAud.data.map(a => a.id)); const localOnly = prev.filter(a => !cloudIds.has(a.id)); return [...localOnly, ...rAud.data].sort((a, b) => b.id - a.id); }); }
      if (rHold.data) { setHeldOrders(prev => { const cloudIds = new Set(rHold.data.map(o => o.id)); const localOnly = prev.filter(o => !cloudIds.has(o.id)); return [...localOnly, ...rHold.data].sort((a, b) => b.id - a.id); }); }
      setSyncStatus('synced');
    } catch (err) { setSyncStatus('error'); }
  };

  // 4. Lưu offline và Tự động đồng bộ
  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history)); localStorage.setItem("mart_customers", JSON.stringify(customers)); localStorage.setItem("mart_held_orders", JSON.stringify(heldOrders));
    localStorage.setItem("mart_audit", JSON.stringify(auditLogs)); localStorage.setItem("mart_expenses", JSON.stringify(expenses)); localStorage.setItem("mart_suppliers", JSON.stringify(suppliers));
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const delaySync = setTimeout(() => {
      if (isLoggedIn) { syncToCloud('history', history); syncToCloud('customers', customers, true); syncToCloud('held_orders', heldOrders); syncToCloud('audit_logs', auditLogs); syncToCloud('expenses', expenses); syncToCloud('suppliers', suppliers); }
    }, 2000);
    return () => clearTimeout(delaySync);
  }, [history, customers, heldOrders, auditLogs, expenses, suppliers, isLoggedIn]);

  return { isOnline, syncStatus, syncAllOfflineData, loadCloudData };
};
