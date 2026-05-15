/* eslint-disable */
// @ts-nocheck
import React,{useEffect,useState,useMemo}from "react";
import {supabase}from "./supabaseClient";

const getLS=(k:string,d:any)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const getLogDStr=(log:any)=>{if(log.time)return log.time.split(' ').pop();const d=new Date(Number(log.id));return isNaN(d.getTime())?"":d.toLocaleDateString('vi-VN')};
const getLogTStr=(log:any)=>{if(log.time)return log.time.split(' ')[0];const d=new Date(Number(log.id));return isNaN(d.getTime())?"":d.toLocaleTimeString('vi-VN')};

const styles=`@keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes logo-glow{0%,100%{box-shadow:0 0 10px rgba(250,204,21,0.2)}50%{box-shadow:0 0 20px rgba(250,204,21,0.6)}}@keyframes float{0%{transform:translateY(0)}50%{transform:translateY(-20px)}100%{transform:translateY(0)}}@keyframes pulse-fast{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}.logo-icon{background-color:#dc2626;padding:8px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(220,38,38,0.2);border: 1px solid rgba(250,204,21,0.5)}.text-wave{animation:wave 2.5s ease-in-out infinite}.glass{background:rgba(255,255,255,.98);border:1px solid #fed7aa;border-radius:12px;box-shadow:0 4px 15px rgba(251,146,60,.08)}body{background-color:#fff7ed;margin:0;font-family:'Inter',sans-serif;color:#431407}.tab-btn{padding:6px 12px;border-radius:20px;border:1px solid #fed7aa;background:#fff;cursor:pointer;font-size:12px;font-weight:bold;color:#9a3412;white-space:nowrap}.tab-btn.active{background:#ef4444;color:#fff;border-color:#ef4444}.qty-input{width:28px;text-align:center;border:1px solid #cbd5e1;border-radius:4px;outline:none;font-size:11px;font-weight:bold;color:#1e293b;padding:3px 0;background:#fff}.add-to-cart-btn{padding:8px 16px;background-color:#fbbf24;color:#78350f;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-size:12px;box-shadow:0 2px 4px rgba(251,191,36,.3)}@media print{.no-print{display:none!important}body{background:#fff!important;margin:0;padding:0}.print-receipt-container{display:block!important;width:80mm!important;margin:0 auto!important;padding:5mm!important;font-family:Arial,sans-serif;color:#000;font-size:12px;line-height:1.5}.print-flex{display:flex!important;width:100%}@page{margin:0}}.print-receipt-container,.print-flex{display:none}`;

export default function App(){
  const VAT_RATE=0.1;const EMAILJS_SERVICE_ID="service_7ie990l",EMAILJS_TEMPLATE_ID="template_t91erhg",EMAILJS_TEMPLATE_VIP_ID="template_m1j9i7k",EMAILJS_PUBLIC_KEY="5ric0kxuwNPlUleAv";
  const [isLoggedIn,setIsLoggedIn]=useState(()=>localStorage.getItem("mart_logged_in")==="true");const [role,setRole]=useState(()=>localStorage.getItem("mart_role")||"staff");const [shift,setShift]=useState(()=>localStorage.getItem("mart_shift")||"Ca Sáng");
  const [authUsername,setAuthUsername]=useState(""),[authPassword,setAuthPassword]=useState(""),[currentTime,setCurrentTime]=useState(new Date());
  const [adminPass,setAdminPass]=useState(()=>localStorage.getItem("mart_admin_pass")||"haile88"),[staffPass,setStaffPass]=useState(()=>localStorage.getItem("mart_staff_pass")||"123");
  const [bankBin,setBankBin]=useState(()=>localStorage.getItem("mart_bank_bin")||"970422"),[bankAcc,setBankAcc]=useState(()=>localStorage.getItem("mart_bank_acc")||"0680124181004"),[bankNameStr,setBankNameStr]=useState(()=>localStorage.getItem("mart_bank_name")||"LE HONG HAI");
  
  const [showSettings,setShowSettings]=useState(false),[newAdminPass,setNewAdminPass]=useState(""),[newStaffPass,setNewStaffPass]=useState(""),[newBankBin,setNewBankBin]=useState(""),[newBankAcc,setNewBankAcc]=useState(""),[newBankNameStr,setNewBankNameStr]=useState("");
  const [products,setProducts]=useState<any[]>([]),[searchTerm,setSearchTerm]=useState(""),[selectedCategory,setSelectedCategory]=useState("Tất cả"),[loading,setLoading]=useState(false),[showInputForm,setShowInputForm]=useState(false);
  const [sortConfig,setSortConfig]=useState<{key:string,direction:'asc'|'desc'}|null>(null),[openFilter,setOpenFilter]=useState<string|null>(null),[filters,setFilters]=useState<Record<string,any[]>>({}),[showSuggestions,setShowSuggestions]=useState(false),[showMainMenu,setShowMainMenu]=useState(false);
  const [showDebtModal,setShowDebtModal]=useState(false),[showStatsModal,setShowStatsModal]=useState(false),[showCustomerModal,setShowCustomerModal]=useState(false),[showHandoverModal,setShowHandoverModal]=useState(false),[showAuditModal,setShowAuditModal]=useState(false),[showHoldModal,setShowHoldModal]=useState(false),[showExpenseModal,setShowExpenseModal]=useState(false),[showSupplierModal,setShowSupplierModal]=useState(false),[showMarketingModal,setShowMarketingModal]=useState(false);
  const [scannerMode,setScannerMode]=useState<'product'|'voucher'|'customer'|null>(null),[scannedCodeObj,setScannedCodeObj]=useState<any>(null),[scanMessage,setScanMessage]=useState<{text:string,type:'success'|'error'}|null>(null);
  const [printBarcodeProduct,setPrintBarcodeProduct]=useState<any>(null),[printCustomer,setPrintCustomer]=useState<any>(null),[barcodeCount,setBarcodeCount]=useState<number>(30),[printMode,setPrintMode]=useState<'receipt'|'barcode'|'customer_card'|null>(null);
  
  const [newCode,setNewCode]=useState(""),[newName,setNewName]=useState(""),[newImportPrice,setNewImportPrice]=useState(""),[newPrice,setNewPrice]=useState(""),[newPromoPrice,setNewPromoPrice]=useState(""),[newGiftCondition,setNewGiftCondition]=useState("1"),[newGiftInfo,setNewGiftInfo]=useState(""),[newStock,setNewStock]=useState(""),[newExpiry,setNewExpiry]=useState(""),[newCategory,setNewCategory]=useState("Đồ uống");
  const [expName,setExpName]=useState(""),[expAmount,setExpAmount]=useState(""),[supName,setSupName]=useState(""),[supPhone,setSupPhone]=useState(""),[supItem,setSupItem]=useState(""),[marketingTier,setMarketingTier]=useState("Tất cả"),[marketingMsg,setMarketingMsg]=useState("");
  const [cart,setCart]=useState<any[]>([]),[barcodeInput,setBarcodeInput]=useState("");
  
  const [customers,setCustomers]=useState<any>(()=>getLS("mart_customers",{}));
  const [heldOrders,setHeldOrders]=useState<any[]>(()=>getLS("mart_held_orders",[]));
  const [auditLogs,setAuditLogs]=useState<any[]>(()=>getLS("mart_audit",[]));
  const [expenses,setExpenses]=useState<any[]>(()=>getLS("mart_expenses",[]));
  const [suppliers,setSuppliers]=useState<any[]>(()=>getLS("mart_suppliers",[]));
  const [history,setHistory]=useState<any[]>(()=>getLS("mart_history",[]));

  const loadCloudData=async()=>{try{const[rCust,rHist,rExp,rSup,rAud,rHold]=await Promise.all([supabase.from('customers').select('*'),supabase.from('history').select('*').order('id',{ascending:false}).limit(1500),supabase.from('expenses').select('*').order('id',{ascending:false}),supabase.from('suppliers').select('*').order('id',{ascending:false}),supabase.from('audit_logs').select('*').order('id',{ascending:false}).limit(300),supabase.from('held_orders').select('*')]);if(rCust.data){const cObj={};rCust.data.forEach((c:any)=>cObj[c.phone]=c);setCustomers(cObj);}if(rHist.data)setHistory(rHist.data);if(rExp.data)setExpenses(rExp.data);if(rSup.data)setSuppliers(rSup.data);if(rAud.data)setAuditLogs(rAud.data);if(rHold.data)setHeldOrders(rHold.data);}catch(err){console.error("Lỗi Cloud:",err);}};
  
  const [isCheckoutOpen,setIsCheckoutOpen]=useState(false),[checkoutStep,setCheckoutStep]=useState(1),[customerInput,setCustomerInput]=useState(""),[custPhone,setCustPhone]=useState(""),[custName,setCustName]=useState(""),[useWallet,setUseWallet]=useState(false),[voucherInput,setVoucherInput]=useState(""),[appliedVoucherAmount,setAppliedVoucherAmount]=useState<number>(0),[customerGiven,setCustomerGiven]=useState<number|"">(""),[lastOrder,setLastOrder]=useState<any>(null);
  const [expandedDates,setExpandedDates]=useState<Record<string,boolean>>({}),[logSearchTerm,setLogSearchTerm]=useState(""),[logTypeFilter,setLogTypeFilter]=useState("Tất cả");

  const playSound=(type:'success'|'error')=>{try{const ctx=new(window.AudioContext||(window as any).webkitAudioContext)();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);if(type==='success'){osc.frequency.value=800;gain.gain.setValueAtTime(0.1,ctx.currentTime);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.1)}else{osc.frequency.value=250;osc.type='square';gain.gain.setValueAtTime(0.1,ctx.currentTime);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.3)}}catch(e){}};
  const logAudit=async(action:string,detail:string)=>{const id=Math.floor(Date.now()+Math.random()*100);const newLog={id,time:new Date().toLocaleString('vi-VN'),user_name:role==='admin'?'Quản lý':'Thu ngân',shift,action,detail};setAuditLogs(prev=>[newLog,...prev].slice(0,300));await supabase.from('audit_logs').insert([newLog]);};
  const parseGift=(giftStr:string|null)=>{if(!giftStr)return{cond:0,text:""};if(giftStr.includes(';;;')){const parts=giftStr.split(';;;');return{cond:parseInt(parts[0])||1,text:parts[1]||""}}return{cond:1,text:giftStr}};
  const cleanName=(name:string)=>name?name.split(' [Lô')[0]:'';
  const getActualPrice=(p:any)=>{let price=(p.promo_price&&p.promo_price>0)?p.promo_price:p.sale_price;const currentHour=new Date().getHours();if((currentHour>=20||currentHour<6)&&(p.category==='Đồ ăn liền'||p.category==='Bánh Kẹo')){price=price*0.8;p.isHappyHour=true}else{p.isHappyHour=false}return Math.round(price)};
  
  const fetchProducts=async()=>{const{data}=await supabase.from("products").select("*").order("created_at",{ascending:false});if(data)setProducts(data)};
  const findProductByCode=(code:string)=>{const rawCode=code.trim();let matches=products.filter(prod=>prod.product_code===rawCode||prod.product_code.startsWith(`${rawCode}-`));let available=matches.filter(p=>p.stock>0);if(available.length>0){available.sort((a,b)=>{if(!a.expiry_date)return 1;if(!b.expiry_date)return -1;return new Date(a.expiry_date).getTime()-new Date(b.expiry_date).getTime()});return available[0]}return matches.length>0?matches[0]:null};
  
  useEffect(()=>{const timer=setInterval(()=>setCurrentTime(new Date()), 1000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{localStorage.setItem("mart_history",JSON.stringify(history));localStorage.setItem("mart_customers",JSON.stringify(customers));localStorage.setItem("mart_held_orders",JSON.stringify(heldOrders));localStorage.setItem("mart_audit",JSON.stringify(auditLogs));localStorage.setItem("mart_expenses",JSON.stringify(expenses));localStorage.setItem("mart_suppliers",JSON.stringify(suppliers))},[history,customers,heldOrders,auditLogs,expenses,suppliers]);
  useEffect(()=>{if(isLoggedIn){fetchProducts();loadCloudData();const channel=supabase.channel("db_changes").on("postgres_changes",{event:"*",schema:"public",table:"products"},()=>fetchProducts()).subscribe();return()=>supabase.removeChannel(channel)}},[isLoggedIn]);

  const handleSelectSuggest=(p_input:any)=>{
    const baseCode=p_input.product_code.split('-')[0];
    const totalStock=products.filter(p=>p.product_code===baseCode||p.product_code.startsWith(`${baseCode}-`)).reduce((s,p)=>s+p.stock,0);
    if(totalStock<=0){playSound('error');return alert("Đã hết hàng!");}
    const price=getActualPrice(p_input);const repName=cleanName(p_input.name);
    setCart(prev=>{
      const exist=prev.find(item=>cleanName(item.product.name)===repName);
      if(exist){
        if(exist.qty+1>totalStock){playSound('error');return prev;}
        playSound('success');return prev.map(i=>cleanName(i.product.name)===repName?{...i,qty:i.qty+1,total:Math.round((i.qty+1)*price*(1+VAT_RATE))}:i);
      }else{
        playSound('success');return[...prev,{product:p_input,qty:1,total:Math.round(price*(1+VAT_RATE))}];
      }
    });
    setScanMessage({text:`✅ Thêm: ${repName}`,type:'success'});setBarcodeInput("");setShowSuggestions(false);setTimeout(()=>setScanMessage(null),1500);
  };

  useEffect(()=>{
    if(scannedCodeObj){
      if(scannerMode==='product'){const p=findProductByCode(scannedCodeObj.code);if(p)handleSelectSuggest(p);else{const matchedPhone=Object.keys(customers).find(phone=>phone===scannedCodeObj.code.trim()||customers[phone].cardCode===scannedCodeObj.code.trim());if(matchedPhone){playSound('success');setCustomerInput(customers[matchedPhone].cardCode||matchedPhone);setCustPhone(matchedPhone);setCustName(customers[matchedPhone].name);setScanMessage({text:`✅ KH VIP: ${customers[matchedPhone].name}`,type:'success'})}else{playSound('error');setScanMessage({text:`❌ Lỗi mã`,type:'error'})}setTimeout(()=>setScannerMode(null),1500)}}
      else if(scannerMode==='voucher'){const code=scannedCodeObj.code.trim().toUpperCase();const VOUCHERS:Record<string,number>={"VC50K":50000,"VC100K":100000,"KM10K":10000};if(VOUCHERS[code]){setAppliedVoucherAmount(VOUCHERS[code]);setVoucherInput(code);playSound('success');setScanMessage({text:`✅ Giảm ${VOUCHERS[code]}đ`,type:'success'})}setTimeout(()=>setScannerMode(null),1000)}
      else if(scannerMode==='customer'){const val=scannedCodeObj.code.trim();setCustomerInput(val);const mp=Object.keys(customers).find(ph=>ph===val||customers[ph].cardCode===val);if(mp){setCustPhone(mp);setCustName(customers[mp].name);playSound('success');setScanMessage({text:`✅ VIP: ${customers[mp].name}`,type:'success'})}else{setCustPhone(val);setCustName("");playSound('success');setScanMessage({text:`✅ Khách mới`,type:'success'})}setTimeout(()=>setScannerMode(null),1000)}
      setScannedCodeObj(null);
    }
  },[scannedCodeObj]);

  useEffect(()=>{const handleAfterPrint=()=>setPrintMode(null);window.addEventListener("afterprint",handleAfterPrint);return()=>window.removeEventListener("afterprint",handleAfterPrint)},[]);

  const todayStrStr=new Date().toLocaleDateString('vi-VN');
  const currentShiftStats=useMemo(()=>{let cash=0,transfer=0,prof=0;history.forEach(h=>{if(getLogDStr(h)===todayStrStr&&h.shift===shift){if(h.type==='BÁN'||h.type==='THU NỢ'||h.type==='TRẢ HÀNG'){if(h.paymentMethod==='CHUYỂN KHOẢN')transfer+=h.total;else if(h.paymentMethod==='TIỀN MẶT')cash+=h.total}if(h.type!=='NHẬP')prof+=(h.profit||0)}});return{rev:cash+transfer,cash,transfer,prof}},[history,shift,todayStrStr]);
  const todayStats=useMemo(()=>{let totalSales=0,prof=0;history.forEach(h=>{if(getLogDStr(h)===todayStrStr){if(h.type==='BÁN'||h.type==='GHI NỢ')totalSales+=h.total;if(h.type!=='NHẬP')prof+=(h.profit||0)}});const exp=expenses.filter(e=>e.date===todayStrStr).reduce((s,e)=>s+e.amount,0);return{totalSales,netProfit:prof-exp,expenses:exp}},[history,expenses,todayStrStr]);
  const groupedHistory=useMemo(()=>{let filtered=history;if(logTypeFilter!=="Tất cả")filtered=filtered.filter(log=>log.type===logTypeFilter);if(logSearchTerm.trim()!==""){const t=logSearchTerm.toLowerCase();filtered=filtered.filter(log=>(log.name&&log.name.toLowerCase().includes(t))||(log.customer&&log.customer.toLowerCase().includes(t)))}return filtered.reduce((groups:any,log:any)=>{const d=getLogDStr(log);if(!d)return groups;if(!groups[d])groups[d]=[];groups[d].push({...log,t:getLogTStr(log)});return groups},{})},[history,logSearchTerm,logTypeFilter]);

  const totalValue=Math.round(products.reduce((sum,p)=>sum+((p.import_price||0)*(p.stock||0)),0));
  const lowStockCount=products.filter(p=>p.stock>0&&p.stock<10).length;
  const cartTotalAmountDisplay=cart.reduce((sum,item)=>sum+item.total,0);
  const getCustomerTierDiscount=(totalSpent=0)=>{if(totalSpent>=500000000)return 0.10;if(totalSpent>=200000000)return 0.05;if(totalSpent>=50000000)return 0.02;return 0;};
  const tierDiscountAmount=custPhone?Math.round(cartTotalAmountDisplay*getCustomerTierDiscount(customers[custPhone]?.totalSpent||0)):0;
  const amountAfterTierAndVoucher=Math.max(0,cartTotalAmountDisplay-appliedVoucherAmount-tierDiscountAmount);
  const walletUsedAmount=useWallet?Math.min(customers[custPhone]?.wallet||0,amountAfterTierAndVoucher):0;
  const finalToPay=amountAfterTierAndVoucher-walletUsedAmount;

  const uniqueNames=useMemo(()=>Array.from(new Set(products.map(p=>cleanName(p.name)))).sort(),[products]);
  const sortedAndFilteredProducts=useMemo(()=>{let filtered=products.filter(p=>(selectedCategory==="Tất cả"||(p.category||"Khác")===selectedCategory)).filter(p=>p.name.toLowerCase().includes(searchTerm.toLowerCase())||(p.product_code&&p.product_code.toLowerCase().includes(searchTerm.toLowerCase())));if(filters['name']?.length>0)filtered=filtered.filter(p=>filters['name'].includes(cleanName(p.name)));if(sortConfig!==null){filtered.sort((a,b)=>{let valA=a[sortConfig.key];let valB=b[sortConfig.key];if(sortConfig.key==='expiry_date'){valA=a.expiry_date?new Date(a.expiry_date).getTime():Infinity;valB=b.expiry_date?new Date(b.expiry_date).getTime():Infinity;}if(valA<valB)return sortConfig.direction==='asc'?-1:1;if(valA>valB)return sortConfig.direction==='asc'?1:-1;return 0})}return filtered},[products,searchTerm,selectedCategory,sortConfig,filters]);

  const handleLogin=(e:React.FormEvent)=>{e.preventDefault();const u=authUsername.trim().toLowerCase();const p=authPassword.trim();if(u==="admin"&&p==="khoiphuc88"){setAdminPass("haile88");localStorage.removeItem("mart_admin_pass");setStaffPass("123");localStorage.removeItem("mart_staff_pass");setAuthPassword("");alert("✅ MK gốc:\nAdmin: haile88\nNV: 123");return}if(u==="admin"&&p===adminPass){setIsLoggedIn(true);setRole("admin");localStorage.setItem("mart_shift",shift);localStorage.setItem("mart_logged_in","true");localStorage.setItem("mart_role","admin");logAudit("ĐĂNG NHẬP","Mở ca")}else if(u==="nhanvien"&&p===staffPass){setIsLoggedIn(true);setRole("staff");localStorage.setItem("mart_shift",shift);localStorage.setItem("mart_logged_in","true");localStorage.setItem("mart_role","staff");logAudit("ĐĂNG NHẬP","Mở ca")}else{alert("❌ Sai tài khoản!")}};
  
  const handleEditPhone=async(oldPhone:string)=>{
    const newPhone=window.prompt("Nhập SĐT mới:",oldPhone);
    if(newPhone&&newPhone.trim()!==""&&newPhone!==oldPhone){
      if(customers[newPhone])return alert("❌ SĐT đã tồn tại!");
      const cData = customers[oldPhone]; const newC = {...cData, phone: newPhone};
      setCustomers((prev:any)=>{const updated={...prev};updated[newPhone]=newC;delete updated[oldPhone];return updated});
      await supabase.from('customers').insert([{phone:newPhone, name: cData.name, email: cData.email, cardCode: cData.cardCode, totalSpent: cData.totalSpent, wallet: cData.wallet, debt: cData.debt}]);
      await supabase.from('customers').delete().eq('phone',oldPhone);
      setHistory((prev:any)=>prev.map((h:any)=>{if(h.customer&&h.customer.includes(oldPhone)){return{...h,customer:h.customer.replace(oldPhone,newPhone)}}return h}));
      logAudit("SỬA SĐT KH",`Đổi ${oldPhone} -> ${newPhone}`);alert("✅ Cập nhật thành công!");
    }
  };
  
  const confirmCheckout=async(payMethod:'TIỀN MẶT'|'CHUYỂN KHOẢN'|'GHI NỢ')=>{
    if(cart.length===0)return;if(payMethod==='GHI NỢ'&&!custPhone)return alert("Ghi nợ cần SĐT!");
    setLoading(true);let logs:any[]=[];
    const subTotal=Math.round(cart.reduce((s,i)=>s+(i.qty*getActualPrice(i.product)),0));
    const vatTotal=Math.round(subTotal*VAT_RATE);
    const baseTotal=subTotal+vatTotal;
    const totalAfterVoucher=Math.max(0,baseTotal-appliedVoucherAmount);
    const tDiscount=custPhone?Math.round(cartTotalAmountDisplay*getCustomerTierDiscount(customers[custPhone]?.totalSpent||0)):0;
    const amountAfterTierAndVoucher=Math.max(0,totalAfterVoucher-tDiscount);
    const walletUsedAmount=useWallet&&payMethod!=='GHI NỢ'?Math.round(Math.min(customers[custPhone]?.wallet||0,amountAfterTierAndVoucher)):0;
    const finalTotal=amountAfterTierAndVoucher-walletUsedAmount;
    const totalDiscount=appliedVoucherAmount+walletUsedAmount+tDiscount;
    const earned=payMethod==='GHI NỢ'?0:Math.round(finalTotal*0.02);
    
    for(const item of cart){
      const baseCode=item.product.product_code.split('-')[0];
      const batches=products.filter(p=>p.product_code===baseCode||p.product_code.startsWith(`${baseCode}-`)).sort((a,b)=>{if(!a.expiry_date)return 1;if(!b.expiry_date)return -1;return new Date(a.expiry_date).getTime()-new Date(b.expiry_date).getTime()});
      let rem=item.qty;const price=getActualPrice(item.product);
      for(const b of batches){
        if(rem<=0)break;if(b.stock>0){
          const take=Math.min(rem,b.stock);await supabase.from("products").update({stock:b.stock-take}).eq("id",b.id);
          logs.push({id:Math.floor(Date.now()+Math.random()*1000),shift,type:payMethod==='GHI NỢ'?"GHI NỢ":"BÁN",name:cleanName(b.name)+(item.product.isHappyHour?' [Giờ Vàng]':''),qty:take,total:Math.round(take*price*(1+VAT_RATE)),profit:Math.round(take*(price-(b.import_price||0))),customer:custPhone?`${custName} (${custPhone})`:"Khách lẻ",product_id:b.id,refunded_qty:0,paymentMethod:payMethod,time:new Date().toLocaleString('vi-VN')});rem-=take;
        }
      }
    }
    
    if(totalDiscount>0)logs.push({id:Math.floor(Date.now()+Math.random()*1000),shift,type:payMethod==='GHI NỢ'?"GHI NỢ":"BÁN",name:"Giảm giá/Ví/VIP",qty:1,total:-totalDiscount,profit:-totalDiscount,customer:custPhone?`${custName} (${custPhone})`:"Khách lẻ",product_id:'DISCOUNT',refunded_qty:0,paymentMethod:payMethod,time:new Date().toLocaleString('vi-VN')});
    await supabase.from('history').insert(logs);
    if(custPhone){
      const updatedCust={name:custName,wallet:payMethod==='GHI NỢ'?(customers[custPhone]?.wallet||0):Math.round((customers[custPhone]?.wallet||0)-walletUsedAmount+earned),debt:(customers[custPhone]?.debt||0)+(payMethod==='GHI NỢ'?finalTotal:0),totalSpent:(customers[custPhone]?.totalSpent||0)+(payMethod!=='GHI NỢ'?finalTotal:0),email:customers[custPhone]?.email||"",cardCode:customers[custPhone]?.cardCode||""};
      setCustomers(prev=>({...prev,[custPhone]:updatedCust}));await supabase.from('customers').upsert([{phone:custPhone,...updatedCust}]);
    }
    setHistory(prev=>[...logs,...prev]);
    setLastOrder({orderId:"HD"+Math.floor(Date.now()/1000).toString().slice(-6),shift,cart:[...cart],subTotal,vatTotal,finalTotal:payMethod==='GHI NỢ'?0:finalTotal,debtAmount:payMethod==='GHI NỢ'?finalTotal:0,discount:totalDiscount,time:new Date().toLocaleString('vi-VN'),paymentMethod:payMethod,customerGiven:payMethod==='TIỀN MẶT'?Number(customerGiven):0});
    setCheckoutStep(3);fetchProducts();setLoading(false);
  };

  const adjustCartQty=(productId:any,delta:number)=>{
    let exceedStock=false;
    setCart(prev=>{
      const updated=prev.map(item=>{
        if(item.product.id===productId){
          const baseCode=item.product.product_code.split('-')[0];
          const totalStock=products.filter(p=>p.product_code===baseCode||p.product_code.startsWith(`${baseCode}-`)).reduce((s,p)=>s+p.stock,0);
          const newQty=item.qty+delta;
          if(newQty>totalStock){exceedStock=true;return item;}
          const price=getActualPrice(item.product);
          return{...item,qty:newQty,total:Math.round(newQty*price*(1+VAT_RATE))};
        }
        return item;
      });
      return updated.filter(item=>item.qty>0);
    });
    if(exceedStock)playSound('error');
  };

  const handleDirectQtyChange=(productId:any,val:string)=>{
    setCart(prev=>{
      if(val==='')return prev.map(i=>i.product.id===productId?{...i,qty:'' as any,total:0}:i);
      let num=parseInt(val);if(isNaN(num)||num<0)return prev;
      let exceedStock=false;
      const updated=prev.map(i=>{
        if(i.product.id===productId){
          const baseCode=i.product.product_code.split('-')[0];
          const totalStock=products.filter(p=>p.product_code===baseCode||p.product_code.startsWith(`${baseCode}-`)).reduce((s,p)=>s+p.stock,0);
          if(num>totalStock){exceedStock=true;num=totalStock;}
          const price=getActualPrice(i.product);
          return{...i,qty:num,total:Math.round(num*price*(1+VAT_RATE))};
        }
        return i;
      });
      if(exceedStock)playSound('error');
      return updated;
    });
  };

  const HeaderLogo=()=>(<div style={{display:"flex",alignItems:"center",gap:"16px"}}><div className="logo-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></div><div className="text-wave" style={{display:"flex",flexDirection:"column"}}><h1 style={{margin:0,fontSize:"22px",fontWeight:"900",letterSpacing:"0.5px",color:"#0f172a",lineHeight:"1",whiteSpace:"nowrap"}}>HẢI LÊ <span style={{color:"#dc2626"}}>MART</span></h1><div style={{fontSize:"10px",color:"#64748b",fontWeight:"800",letterSpacing:"3px",textTransform:"uppercase",marginTop:"4px",whiteSpace:"nowrap"}}>ERP System</div></div></div>);
