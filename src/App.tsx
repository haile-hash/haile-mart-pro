import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const SYS_USER = "admin";
  const SYS_PASS = "haile88";

  // --- HỆ THỐNG BẢO MẬT ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // --- STATES CỦA CỬA HÀNG ---
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Form nhập hàng có thêm Giá KM và Quà tặng
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newImportPrice, setNewImportPrice] = useState(""); 
  const [newPrice, setNewPrice] = useState(""); 
  const [newPromoPrice, setNewPromoPrice] = useState(""); 
  const [newGiftInfo, setNewGiftInfo] = useState(""); 
  const [newStock, setNewStock] = useState("");
  const [newExpiry, setNewExpiry] = useState(""); 

  // --- STATES GIỎ HÀNG & CRM ---
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [customers, setCustomers] = useState<any>(() => {
    const saved = localStorage.getItem("mart_customers");
    return saved ? JSON.parse(saved) : {}; 
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("mart_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [revenue, setRevenue] = useState<number>(() => {
    const saved = localStorage.getItem("mart_revenue");
    return saved ? Number(saved) : 0;
  });
  const [profit, setProfit] = useState<number>(() => {
    const saved = localStorage.getItem("mart_profit");
    return saved ? Number(saved) : 0;
  });

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history));
    localStorage.setItem("mart_revenue", revenue.toString());
    localStorage.setItem("mart_profit", profit.toString());
    localStorage.setItem("mart_customers", JSON.stringify(customers));
  }, [history, revenue, profit, customers]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      const channel = supabase
        .channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
          fetchProducts();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const exportToCSV = () => {
    if (history.length === 0) return alert("Chưa có lịch sử để xuất!");
    let csvContent = "\uFEFFThời gian,Loại,Khách hàng,Sản phẩm,Số lượng,Thành tiền (VNĐ),Lợi nhuận (VNĐ)\n";
    history.forEach(log => {
      const exactTime = new Date(Math.floor(log.id)).toLocaleString('vi-VN');
      csvContent += `${exactTime},${log.type},${log.customer || "Khách lẻ"},${log.name},${log.qty},${log.total},${log.profit || 0}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Hai_Le_Mart.csv`);
    link.click();
  };

  const handleSendEmailReport = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const todaysLogs = history.filter(log => {
      const logDate = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN');
      return logDate === todayStr;
    });
    
    if (todaysLogs.length === 0) return alert("Hôm nay chưa có giao dịch nào để chốt ca!");

    let todayRev = 0, todayProf = 0, soldCount = 0, importCount = 0;
    todaysLogs.forEach(log => {
      if (log.type === 'BÁN') { todayRev += log.total; todayProf += log.profit || 0; soldCount += log.qty; } 
      else if (log.type === 'NHẬP') { importCount += log.qty; }
    });

    const subject = encodeURIComponent(`Báo Cáo Chốt Ca - Ngày ${todayStr}`);
    const body = encodeURIComponent(
      `Xin chào Quản lý,\n\nĐây là báo cáo hoạt động kinh doanh ngày ${todayStr}:\n` +
      `--------------------------------------\n` +
      `- Số món đã bán: ${soldCount} món\n` +
      `- Số món nhập kho: ${importCount} món\n` +
      `- DOANH THU: ${todayRev.toLocaleString()} VNĐ\n` +
      `- LỢI NHUẬN: ${todayProf.toLocaleString()} VNĐ\n` +
      `--------------------------------------\n` +
      `Trân trọng,\nHệ thống Hải Lê Mart Pro.`
    );
    window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === SYS_USER && authPassword === SYS_PASS) {
      setIsLoggedIn(true); localStorage.setItem("mart_logged_in", "true");
    } else alert("Sai tài khoản hoặc mật khẩu!");
  };

  const handleLogout = () => {
    if (window.confirm("Khóa máy tính tiền?")) {
      setIsLoggedIn(false); localStorage.removeItem("mart_logged_in");
      setAuthUsername(""); setAuthPassword("");
    }
  };

  const getActualPrice = (p: any) => {
    return (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price;
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!barcodeInput.trim()) return;
      const p = products.find(prod => prod.product_code === barcodeInput.trim());
      if (p) {
        if (p.stock <= 0) alert("Hết hàng!");
        else {
          const actualPrice = getActualPrice(p);
          const existingItem = cart.find(item => item.product.id === p.id);
          if (existingItem) {
            setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * actualPrice, profit: (item.qty + 1) * (actualPrice - (p.import_price || 0)) } : item));
          } else {
            setCart([...cart, { product: p, qty: 1, total: actualPrice, profit: actualPrice - (p.import_price || 0) }]);
          }
        }
      } else alert("Mã sai!");
      setBarcodeInput(""); 
    }
  };

  const addToCart = (p: any) => {
    const qty = window.prompt(`Số lượng ${p.name}:`, "1");
    if (qty && parseInt(qty) > 0) {
      const addQty = parseInt(qty);
      const actualPrice = getActualPrice(p);
      const profitVal = (actualPrice - (p.import_price || 0)) * addQty;
      const existingItem = cart.find(item => item.product.id === p.id);
      if (existingItem) {
        setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + addQty, total: (item.qty + addQty) * actualPrice, profit: item.profit + profitVal } : item));
      } else {
        setCart([...cart, { product: p, qty: addQty, total: addQty * actualPrice, profit: profitVal }]);
      }
    }
  };

  const removeFromCart = (productId: any) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setCustPhone(phone);
    if (customers[phone]) setCustName(customers[phone].name);
    else { setCustName(""); setUseWallet(false); }
  };

  const handleNextToQR = () => {
    if (custPhone && !customers[custPhone] && !custName) {
      alert("Khách hàng mới! Vui lòng nhập Tên khách hàng.");
      return;
    }
    setCheckoutStep(2);
  };

  const confirmCheckout = async () => {
    setLoading(true);
    let rev = revenue; let prof = profit; let logs: any[] = [];
    
    const currentWallet = customers[custPhone]?.wallet || 0;
    const discount = useWallet ? Math.min(currentWallet, cartTotalAmount) : 0;
    const finalAmount = Math.max(0, cartTotalAmount - discount);
    const earnedWallet = Math.floor(finalAmount * 0.02);

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toLocaleTimeString('vi-VN');

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      rev += item.total; prof += item.profit;
      logs.push({ 
        id: Date.now() + Math.random(), type: "BÁN", 
        name: item.product.name, qty: item.qty, total: item.total, profit: item.profit, 
        customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ",
        date: dateStr, time: `${timeStr} ${dateStr}` 
      });
    }

    rev -= discount; prof -= discount;

    if (custPhone) {
      setCustomers((prev: any) => ({
        ...prev,
        [custPhone]: { name: custName, wallet: (prev[custPhone]?.wallet || 0) - discount + earnedWallet }
      }));
    }

    setRevenue(rev); setProfit(prof); setHistory(prev => [...logs, ...prev]);

    const orderId = "HD" + Date.now().toString().slice(-6); 
    setLastOrder({
      orderId: orderId, cart: [...cart], totalAmount: cartTotalAmount, discount: discount,
      finalAmount: finalAmount, earnedWallet: custPhone ? earnedWallet : 0,
      custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: `${timeStr} ${dateStr}`
    });
    
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const closeCheckout = () => {
    setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1);
    setCustPhone(""); setCustName(""); setUseWallet(false); setLastOrder(null);
  };

  const handleCodeChange = (
