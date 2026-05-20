// @ts-nocheck

export const styles = `
  @keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes float{0%{transform:translateY(0)}50%{transform:translateY(-20px)}100%{transform:translateY(0)}}
  @keyframes pulse-fast{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}
  @keyframes logo-glow{0%,100%{box-shadow:0 0 10px rgba(250,204,21,0.2), 0 0 20px rgba(250,204,21,0.2) inset; transform: scale(1)}50%{box-shadow:0 0 25px rgba(250,204,21,1), 0 0 40px rgba(250,204,21,0.8), 0 0 20px rgba(250,204,21,0.5) inset; transform: scale(1.05)}}
  .logo-icon{animation:logo-glow 2s infinite ease-in-out;background-color:#dc2626;padding:8px;border-radius:10px;display:flex;align-items:center;justify-content:center}
  .spring-bg{position:fixed;width:400px;height:400px;border-radius:50%;filter:blur(100px);z-index:-1;opacity:.3;animation:float 10s infinite ease-in-out; transition: all 0.3s;}
  .glass{background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,.08); color: var(--text-main); transition: all 0.3s;}
  body{background-color:var(--bg-main);margin:0;font-family:'Inter',sans-serif;color:var(--text-main); transition: all 0.3s;}
  .tab-btn{padding:6px 12px;border-radius:20px;border:1px solid var(--border-glass);background:var(--bg-glass);cursor:pointer;font-size:12px;font-weight:bold;color:var(--text-main);white-space:nowrap}
  .tab-btn.active{background:#ef4444;color:#fff;border-color:#ef4444}
  .chart-container-scroll{display:flex;align-items:flex-end;height:120px;margin-top:15px;padding-top:10px;border-top:1px dashed var(--border-glass);overflow-x:auto;padding-bottom:5px;gap:4px}
  .chart-bar-group{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:20px}
  .chart-bar{width:8px;background:linear-gradient(0deg,#ef4444 0%,#fca5a5 100%);border-radius:4px 4px 0 0;transition:height .5s;min-height:2px}
  .chart-label{font-size:8px;color:var(--text-muted);margin-top:4px;font-weight:bold;white-space:nowrap}
  .chart-val{font-size:8px;color:#ef4444;font-weight:bold;margin-bottom:2px}
  .noti-bell{position:relative;display:inline-block;cursor:pointer}
  .noti-badge{position:absolute;top:-5px;right:-5px;background:#ef4444;color:white;border-radius:50%;padding:2px 6px;font-size:9px;font-weight:bold;animation:pulse-fast 1s infinite}
  input, select, textarea { background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-glass); }
  .cash-box { transition: all 0.2s ease-in-out; border-radius: 8px; padding: 4px 10px; cursor: pointer; border: 1px solid transparent; }
  .cash-box:hover { background: var(--bg-glass); border: 1px dashed var(--border-glass); transform: scale(1.05); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  @media print{
    .no-print{display:none!important}
    .print-only{display:block!important;position:absolute!important;left:50%!important;transform:translateX(-50%)!important;width:80mm!important;padding:5mm!important;box-sizing:border-box!important; background:#fff!important; color:#000!important}
    .print-flex{display:flex!important;width:100%}
    body{background:#fff!important;margin:0;padding:0}
    @page{margin:0}
    .print-barcode-sheet{display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;gap:2mm!important;padding:5mm!important}
    .barcode-sticker{width:35mm!important;height:22mm!important;page-break-inside:avoid!important;border:1px dashed #ccc!important;padding:1mm!important;box-sizing:border-box!important;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:#fff!important;color:#000!important}
    .print-a4-container { width: 100%; background: #fff !important; color: #000 !important; padding: 20mm; box-sizing: border-box; }
  }
  .print-only,.print-flex{display:none}
  .qty-input{width:28px;text-align:center;border-radius:4px;outline:none;font-size:11px;font-weight:bold;padding:3px 0;}
  .qty-input::-webkit-outer-spin-button,.qty-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  .qty-input[type=number]{-moz-appearance:textfield}
  .add-to-cart-btn{padding:8px 16px;background-color:#fbbf24;color:#78350f;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-size:12px;transition:transform .1s,background-color .2s;box-shadow:0 2px 4px rgba(251,191,36,.3)}
  .add-to-cart-btn:hover{background-color:#f59e0b;transform:scale(1.05)}
  .add-to-cart-btn:active{transform:scale(.95)}
  :root { --bg-main: #fff7ed; --bg-glass: rgba(255,255,255,0.98); --border-glass: #fed7aa; --text-main: #431407; --text-muted: #64748b; --bg-input: #fff; }
  [data-theme='dark'] { --bg-main: #0f172a; --bg-glass: #1e293b; --border-glass: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --bg-input: #334155; }
`;

export const formatCategoryStr = (str: string) => { 
  if (!str) return "Khác"; 
  const t = str.trim(); 
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "Khác"; 
};

export const parseGift = (giftStr: string | null) => { 
  if (!giftStr) return { cond: 0, text: "" }; 
  if (giftStr.includes(';;;')) { 
    const parts = giftStr.split(';;;'); 
    return { cond: parseInt(parts[0]) || 1, text: parts[1] || "" } 
  } 
  return { cond: 1, text: giftStr } 
};

export const cleanName = (name: string) => name ? String(name).split(' [Lô')[0] : '';

export const getActualPrice = (p: any) => { 
  let price = (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price; 
  const currentHour = new Date().getHours(); 
  if ((currentHour >= 20 || currentHour < 6) && (p.category === 'Đồ ăn liền' || p.category === 'Bánh Kẹo')) { 
    price = price * 0.8; p.isHappyHour = true 
  } else { 
    p.isHappyHour = false 
  } 
  return Math.round(price) 
};

export const getCustomerTier = (totalSpent = 0) => { 
  if (totalSpent >= 500000000) return { name: "💎 KIM CƯƠNG", discountRate: 0.10, color: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" }; 
  if (totalSpent >= 200000000) return { name: "🥇 VÀNG", discountRate: 0.05, color: "#ca8a04", bg: "#fefce8", border: "#fef08a" }; 
  if (totalSpent >= 50000000) return { name: "🥈 BẠC", discountRate: 0.02, color: "#475569", bg: "#f8fafc", border: "#cbd5e1" }; 
  return { name: "🥉 ĐỒNG", discountRate: 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" } 
};

export const playSound = (type: 'success' | 'error') => { 
  try { 
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); 
    const osc = ctx.createOscillator(); const gain = ctx.createGain(); 
    osc.connect(gain); gain.connect(ctx.destination); 
    if (type === 'success') { 
      osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1) 
    } else { 
      osc.frequency.value = 250; osc.type = 'square'; gain.gain.setValueAtTime(0.1, ctx.currentTime); 
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3) 
    } 
  } catch (e) { } 
};
