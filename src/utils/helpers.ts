export const cleanName = (name: string) => {
  if (!name) return "";
  return name.replace(/\s*\[Lô[^\]]*\]/gi, '').trim();
};

export const formatCategoryStr = (cat: string) => {
  if (!cat) return "Khác";
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
};

export const parseGift = (giftStr: string | null) => {
  if (!giftStr) return { cond: 1, text: "" };
  const parts = giftStr.split(';;;');
  if (parts.length === 2) {
    return { cond: Number(parts[0]) || 1, text: parts[1] };
  }
  return { cond: 1, text: giftStr };
};

export const playSound = (type: 'success' | 'error') => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = context.createOscillator();
    const gainNode = context.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(context.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      osc.start(context.currentTime);
      osc.stop(context.currentTime + 0.1);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
      osc.start(context.currentTime);
      osc.stop(context.currentTime + 0.2);
    }
  } catch (e) {
    console.error("Audio API not supported");
  }
};

export const getCustomerTier = (totalSpent: number, config: any) => {
  if (totalSpent >= config.diamond) 
    return { name: "Kim Cương", color: "#8b5cf6", bg: "#ede9fe", discount: config.diamond_discount };
  
  if (totalSpent >= config.gold) 
    return { name: "Vàng", color: "#eab308", bg: "#fef9c3", discount: config.gold_discount };
  
  if (totalSpent >= config.silver) 
    return { name: "Bạc", color: "#94a3b8", bg: "#f1f5f9", discount: config.silver_discount };
  
  if (totalSpent >= config.bronze) 
    return { name: "Đồng", color: "#d97706", bg: "#ffedd5", discount: config.bronze_discount };
  
  return { name: "Thành viên", color: "#64748b", bg: "#f8fafc", discount: 0 };
};

// --- HÀM TÍNH TOÁN GIÁ TIỀN ÁP DỤNG % GIỜ VÀNG LINH HOẠT ---
export const getActualPrice = (product: any) => {
  let price = product.sale_price || 0;
  
  if (product.promo_price && product.promo_price > 0) {
    price = product.promo_price;
  }

  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;

    const happyStartStr = window.localStorage.getItem('mart_happy_start') || "11:00";
    const happyEndStr = window.localStorage.getItem('mart_happy_end') || "13:00";
    // Đọc % giảm đã cài đặt, mặc định là 20%
    const happyDiscount = Number(window.localStorage.getItem('mart_happy_discount') || 20); 

    const [startH, startM] = happyStartStr.split(':').map(Number);
    const [endH, endM] = happyEndStr.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    if (currentTime >= startTime && currentTime <= endTime) {
      // Giảm theo % linh hoạt
      price = price * (1 - (happyDiscount / 100));
      product.isHappyHour = true; 
    } else {
      product.isHappyHour = false;
    }
  } catch (e) {
    product.isHappyHour = false;
  }

  return Math.round(price);
};
