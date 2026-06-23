import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api.js";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const PL  = "#7B3F6E";   // plum primary
const PLD = "#5C2E52";   // plum dark
const PLF = "#F9F0F7";   // plum faint bg
const GOLD= "#C9A84C";
const BK  = "#1A1A2E";
const WH  = "#FFFFFF";
const G1  = "#F5F5F7";
const G2  = "#E5E5EA";
const G4  = "#AEAEB2";
const G6  = "#636366";
const G8  = "#3A3A3C";
const OK  = "#34C759"; const OKB = "#E8F9EE";
const ER  = "#FF3B30"; const ERB = "#FFF0EF";
const WA  = "#FF9500"; const WAB = "#FFF5E6";
const IN  = "#5856D6"; const INB = "#F0F0FF";

const fmt  = n => "TZS " + Number(n||0).toLocaleString();
const td   = () => new Date().toISOString().split("T")[0];
const fmtDate = d => d ? String(d).split("T")[0] : "—";
const fmtTime = t => t ? String(t).slice(0,5) : "—";
const fmtDT   = dt => dt ? new Date(dt).toLocaleString("en-TZ",{dateStyle:"short",timeStyle:"short"}) : "—";

// ── ATOMS ─────────────────────────────────────────────────────────────────────
const Inp = ({label,style,...p})=>(
  <div style={{marginBottom:14,...style}}>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>}
    <input {...p} style={{width:"100%",padding:"9px 11px",border:`1px solid ${G2}`,borderRadius:8,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",...p.style}}/>
  </div>
);
const Sel = ({label,children,style,...p})=>(
  <div style={{marginBottom:14,...style}}>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>}
    <select {...p} style={{width:"100%",padding:"9px 11px",border:`1px solid ${G2}`,borderRadius:8,fontSize:14,outline:"none",fontFamily:"inherit",background:WH,boxSizing:"border-box",...p.style}}>{children}</select>
  </div>
);
const Txa = ({label,...p})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</label>}
    <textarea {...p} rows={p.rows||3} style={{width:"100%",padding:"9px 11px",border:`1px solid ${G2}`,borderRadius:8,fontSize:14,outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
  </div>
);
const Btn = ({v="fill",children,style,...p})=>{
  const base={padding:"9px 18px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"none",display:"inline-flex",alignItems:"center",gap:6,...style};
  const vs={fill:{background:PL,color:WH},out:{background:WH,color:PL,border:`1px solid ${PL}`},ghost:{background:"none",color:G6,border:`1px solid ${G2}`},ok:{background:OK,color:WH},er:{background:ER,color:WH}};
  return <button {...p} style={{...base,...vs[v],...(p.disabled?{opacity:.45,cursor:"not-allowed"}:{})}}>{children}</button>;
};
const Card = ({children,style,...p})=>(
  <div style={{background:WH,borderRadius:14,border:`1px solid ${G2}`,padding:20,marginBottom:14,...style}} {...p}>{children}</div>
);
const Badge = ({s})=>{
  const map={pending:[WA,WAB,"Pending"],confirmed:[IN,INB,"Confirmed"],inProgress:[PL,PLF,"In Progress"],completed:[OK,OKB,"Completed"],cancelled:[ER,ERB,"Cancelled"],noShow:[G6,G1,"No Show"]};
  const [c,bg,l]=map[s]||[G6,G1,s];
  return <span style={{background:bg,color:c,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{l}</span>;
};
const KPI = ({label,value,color,icon,sub})=>(
  <div style={{background:WH,border:`1px solid ${G2}`,borderRadius:12,padding:"14px 16px"}}>
    <div style={{fontSize:11,color:G6,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>{icon} {label}</div>
    <div style={{fontSize:24,fontWeight:700,color:color||BK,fontFamily:"'Playfair Display',serif"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:G4,marginTop:3}}>{sub}</div>}
  </div>
);
const ST = ({c})=><div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:13,color:BK}}>{c}</div>;

function Modal({title,onClose,wide,children}){
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:1000,overflowY:"auto",padding:"20px 12px"}}>
      <div style={{background:WH,borderRadius:16,width:"100%",maxWidth:wide?680:480,boxShadow:"0 20px 60px rgba(0,0,0,.2)",position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px 0"}}>
          {title&&<h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,margin:0,color:BK}}>{title}</h3>}
          <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"none",fontSize:22,cursor:"pointer",color:G4,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"16px 22px 22px"}}>{children}</div>
      </div>
    </div>
  );
}

function Toast({msg,type,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[onDone]);
  const col=type==="err"?ER:type==="warn"?WA:OK;
  return(
    <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:BK,color:WH,padding:"11px 22px",borderRadius:99,fontSize:14,fontWeight:700,zIndex:2000,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 24px rgba(0,0,0,.3)",maxWidth:"90vw"}}>
      <span style={{color:col}}>{type==="err"?"✗":type==="warn"?"⚠️":"✓"}</span>{msg}
    </div>
  );
}

// Image compression helper
async function compressPhoto(file){
  return new Promise(res=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      const max=800,scale=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement("canvas");
      c.width=img.width*scale;c.height=img.height*scale;
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL("image/jpeg",.78));URL.revokeObjectURL(url);
    };img.src=url;
  });
}


// ── PWA Install Banner ──
function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show,   setShow]   = useState(false);
  const [ios,    setIos]    = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isIOS && !isStandalone) {
      const dismissed = localStorage.getItem('pwa_dismissed');
      if (!dismissed) setIos(true), setShow(true);
    }
    // Android / Chrome
    const handler = (e) => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (prompt) { prompt.prompt(); const r = await prompt.userChoice; if (r.outcome === 'accepted') setShow(false); }
  };
  const dismiss = () => { setShow(false); localStorage.setItem('pwa_dismissed', '1'); };

  if (!show) return null;
  return (
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:3000,
      background:'linear-gradient(135deg,#1A1A2E,#7B3F6E)',
      padding:'14px 16px',boxShadow:'0 -4px 20px rgba(0,0,0,.3)',
      display:'flex',alignItems:'center',gap:12}}>
      <div style={{width:44,height:44,borderRadius:10,background:'#7B3F6E',
        flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:22,fontWeight:900,color:'#C9A84C',fontFamily:"'Playfair Display',serif"}}>M</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>Install MASSAGE TZ</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>
          {ios ? '📱 Tap the share icon → Add to Home Screen' : 'Add to your home screen for quick access'}
        </div>
      </div>
      {!ios && (
        <button onClick={install}
          style={{background:'#C9A84C',color:'#1A1A2E',border:'none',borderRadius:8,
            padding:'8px 14px',fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>
          Install
        </button>
      )}
      <button onClick={dismiss}
        style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'none',
          borderRadius:8,padding:'8px 10px',fontSize:14,cursor:'pointer',flexShrink:0}}>
        ✕
      </button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  // ── Session (persisted) ──
  const [user,setUser]         = useState(()=>{try{const s=localStorage.getItem("spa_staff");return s?JSON.parse(s):null;}catch{return null;}});
  const [therapistUser,setTherapistUser] = useState(()=>{try{const s=localStorage.getItem("spa_therapist");return s?JSON.parse(s):null;}catch{return null;}});
  const [customer,setCustomer] = useState(()=>{try{const s=localStorage.getItem("spa_customer");return s?JSON.parse(s):null;}catch{return null;}});
  const [view,setView]         = useState(()=>{
    try{
      if(localStorage.getItem("spa_staff"))     return "admin";
      if(localStorage.getItem("spa_therapist")) return "therapist";
      if(localStorage.getItem("spa_customer"))  return "customer";
      return "land";
    }catch{return "land";}
  });

  // ── Admin data ──
  const [therapists, setTherapists] = useState([]);
  const [rooms,      setRooms]      = useState([]);
  const [services,   setServices]   = useState([]);
  const [pricing,    setPricing]    = useState([]);
  const [offers,     setOffers]     = useState([]);
  const [appts,      setAppts]      = useState([]);
  const [reception,  setReception]  = useState([]);
  const [staff,      setStaff]      = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [payMethods, setPayMethods] = useState(["Cash","M-Pesa","Tigo Pesa","Airtel Money","Halopesa","Bank Transfer","Card"]);
  const [loading,    setLoading]    = useState(false);
  const [packages,   setPackages]   = useState([]);

  // ── Customer data ──
  const [custAppts, setCustAppts]   = useState([]);
  const [custLoading,setCustLoading]= useState(false);

  // ── UI state ──
  const [aTab,   setATab]   = useState("dash");
  const [custTab,setCustTab]= useState("appts");
  const [modal,  setModal]  = useState(null);
  const [custModal,setCustModal]= useState(null);
  const [toast,  setToast]  = useState(null);
  const pop = (msg,type="ok")=>setToast({msg,type});

  // Booking wizard
  const defaultTime = ()=>{
    const now = new Date();
    const mins = now.getMinutes();
    let h = now.getHours();
    let m;
    if(mins < 30) { m = 0; h = h + 1; }  // e.g. 10:29 → 11:00
    else          { m = 30; h = h + 1; }  // e.g. 10:34 → 11:30
    if(h >= 24) h = 0;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  };
  const initBD = {date:td(),time:defaultTime(),serviceType:"inhouse",therapistId:"",roomId:"",services:[],name:"",phone:"",email:"",notes:"",method:"Cash",disc:0,discT:"pct",outcallAddr:"",offerId:"",bookingMode:"standard",packageId:"",advancePct:10,guestMode:false};
  // Separate stable state for text inputs (prevents focus-loss on re-render)
  const [bdName,  setBdName]  = useState("");
  const [bdPhone, setBdPhone] = useState("");
  const [bdEmail, setBdEmail] = useState("");
  const [bdNotes, setBdNotes] = useState("");
  const resetBdText = () => { setBdName(""); setBdPhone(""); setBdEmail(""); setBdNotes(""); };
  const [bStep,setBStep]    = useState(1);
  const [bD,setBD]          = useState(initBD);
  const [pendingBook,setPendingBook] = useState(false); // auth gate at confirm

  // ── Load data ──
  const loadPublic = useCallback(async()=>{
    const safe = async (fn, fallback) => { try{ return await fn(); }catch{ return fallback; } };
    const [th,rm,sv,pk] = await Promise.all([
      safe(api.getTherapists,[]),
      safe(api.getRooms,[]),
      safe(api.getServices,{services:[],pricing:[]}),
      safe(api.getPackages,[]),
    ]);
    if(Array.isArray(th)) setTherapists(th.filter(t=>t.active));
    if(Array.isArray(rm)) setRooms(rm.filter(r=>r.active));
    if(sv?.services){ setServices(sv.services.filter(s=>s.active)); setPricing(sv.pricing||[]); }
    if(Array.isArray(pk)) setPackages(pk);
  },[]);

  const loadAdmin = useCallback(async()=>{
    setLoading(true);
    const safe = async (label, fn, fallback=[]) => {
      try{ return await fn(); }
      catch(e){ console.warn(`[loadAdmin] ${label} failed:`, e.message); return fallback; }
    };
    const [th,rm,sv,of,ap,rc,st,ex,pm,pk] = await Promise.all([
      safe("therapists",    api.getTherapists),
      safe("rooms",         api.getRooms),
      safe("services",      api.getServices, {services:[],pricing:[]}),
      safe("offers",        api.getOffers),
      safe("appointments",  api.getAppointments),
      safe("reception",     api.getReception),
      safe("staff",         api.getStaff),
      safe("expenses",      api.getExpenses),
      safe("payMethods",    api.getPayMethods),
      safe("packages",      api.getPackages),
    ]);
    if(Array.isArray(th))           setTherapists(th);
    if(Array.isArray(rm))           setRooms(rm);
    if(sv?.services)               { setServices(sv.services); setPricing(sv.pricing||[]); }
    if(Array.isArray(of))           setOffers(of);
    if(Array.isArray(ap))           setAppts(ap);
    if(Array.isArray(rc))           setReception(rc);
    if(Array.isArray(st))           setStaff(st);
    if(Array.isArray(ex))           setExpenses(ex);
    if(Array.isArray(pm)&&pm.length){ const names=pm.map(m=>m.name||m).filter(Boolean); if(names.length) setPayMethods(names); }
    if(Array.isArray(pk)) setPackages(pk);
    setLoading(false);
  },[]);

  const loadCustAppts = useCallback(async(id)=>{
    setCustLoading(true);
    try{ const a=await api.custAppts(id); setCustAppts(Array.isArray(a)?a:[]); }
    catch(e){pop("Couldn't load appointments","err");}
    setCustLoading(false);
  },[]);

  useEffect(()=>{ if(!user) loadPublic(); },[loadPublic,user]);
  useEffect(()=>{
    if(user) loadAdmin();
    if(customer) loadCustAppts(customer.id);
    if(therapistUser) loadPublic(); // therapist needs public data (services, rooms etc)
  // eslint-disable-next-line
  },[]);

  // ── Browser history ──
  const navTo = (v,step=1)=>{
    window.history.pushState({view:v,step},"");
    setView(v);
    if(v==="book") setBStep(step);
    window.scrollTo({top:0,behavior:"smooth"});
  };
  const goStep = s=>{
    window.history.pushState({view:"book",step:s},"");
    setBStep(s);
    window.scrollTo({top:0,behavior:"smooth"});
  };
  useEffect(()=>{
    window.history.replaceState({view,step:bStep},"");
    const onPop=e=>{
      const s=e.state;
      if(!s){setView("land");return;}
      setView(s.view||"land");
      if(s.view==="book") setBStep(s.step||1);
    };
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  // eslint-disable-next-line
  },[]);

  // ── AUTH ──
  const doLogin = async(email,pin)=>{
    try{
      const u=await api.staffLogin({email,pin});
      if(u.account_type==="therapist"){
        // Therapist account — go to therapist portal
        setTherapistUser(u);
        try{localStorage.setItem("spa_therapist",JSON.stringify(u));}catch{}
        setModal(null); navTo("therapist");
        await loadPublic();
      } else {
        setUser(u);
        try{localStorage.setItem("spa_staff",JSON.stringify(u));}catch{}
        setModal(null); navTo("admin"); setATab("dash");
        await loadAdmin();
      }
    }catch(e){throw e;}
  };
  const custLogin = async(email,password)=>{
    const u=await api.custLogin({email,password});
    setCustomer(u); try{localStorage.setItem("spa_customer",JSON.stringify(u));}catch{}
    setCustModal(null);
    if(pendingBook){ setPendingBook(false); /* stay on step 4 to confirm */ }
    else{ navTo("customer"); loadCustAppts(u.id); }
  };
  const custRegister = async(form)=>{
    const u=await api.custRegister(form);
    setCustomer(u); try{localStorage.setItem("spa_customer",JSON.stringify(u));}catch{}
    setCustModal(null); pop("Welcome, "+u.name+"!");
    if(pendingBook){ setPendingBook(false); }
    else{ navTo("customer"); loadCustAppts(u.id); }
  };
  const logout = ()=>{ setUser(null); try{localStorage.removeItem("spa_staff");}catch{} navTo("land"); };
  const therapistLogout = ()=>{ setTherapistUser(null); try{localStorage.removeItem("spa_therapist");}catch{} navTo("land"); };
  const custLogout = ()=>{ setCustomer(null); try{localStorage.removeItem("spa_customer");}catch{} navTo("land"); };

  // ── BOOKING HELPERS ──
  const getPrice = (serviceId,roomType,serviceType)=>{
    const p=pricing.find(p=>p.service_id===serviceId&&p.room_type===roomType&&p.service_type===serviceType);
    if(p) return Number(p.price);
    const p2=pricing.find(p=>p.service_id===serviceId&&p.service_type===serviceType);
    return p2?Number(p2.price):0;
  };
  const bRoomId = bD.roomId||null;
  const bPkg   = bD.bookingMode==="package" ? packages.find(p=>p.id===bD.packageId) : null;
  const bBase  = bPkg ? bPkg.price : bD.services.reduce((s,sv)=>s+getPrice(sv.id,bRoomId,bD.serviceType),0);
  const bDisc  = bPkg ? 0 : (bD.discT==="pct"?Math.round(bBase*bD.disc/100):Number(bD.disc));
  const bTotal = Math.max(0,bBase-bDisc);

  const [bookingLoading, setBookingLoading] = useState(false);

  const confirmBooking = async()=>{
    // For package bookings, pull package details
    const selPkg = bD.bookingMode==="package" ? packages.find(p=>p.id===bD.packageId) : null;
    const cName  = bdName.trim()  || customer?.name  || "";
    const cPhone = bdPhone.trim() || customer?.phone || "";
    const cEmail = bdEmail.trim() || customer?.email || "";
    const cNotes = bdNotes.trim();
    if(!cName||!cPhone)  return pop("Please enter your name and phone number","err");
    if(!bD.date||!bD.time) return pop("Please select a date and time","err");
    setBookingLoading(true);
    try{
      const finalTotal = selPkg ? selPkg.price : bTotal;
      const created = await api.createAppt({
        customer_id: customer?.id||null, customer_name: cName,
        customer_phone: cPhone, customer_email: cEmail,
        therapist_id: bD.therapistId||null, room_id: bD.roomId||null,
        service_type: bD.serviceType, outcall_address: bD.outcallAddr||"",
        appt_date: bD.date, appt_time: bD.time, duration_min: 60,
        services: selPkg ? selPkg.services : bD.services,
        base_amount: selPkg ? selPkg.price : bBase,
        discount: selPkg ? 0 : (bD.disc||0),
        discount_type: bD.discT||"pct",
        total_amount: finalTotal,
        paid_amount: 0,
        payment_method: bD.method||"Cash",
        notes: (selPkg ? `Package: ${selPkg.name}. ` : "") + cNotes,
        status:"pending"
      });
      setAppts(p=>[...p,created]);

      // If PesaPal selected, redirect to payment
      if(bD.method==="PesaPal") {
        try{
          const payRes = await fetch("/api/pesapal?action=create",{
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
              appointment_id: created.id,
              amount:         bD.serviceType==="outcall" ? Math.round(finalTotal*(bD.advancePct||10)/100) : finalTotal,
              customer_name:  cName,
              customer_email: cEmail,
              customer_phone: cPhone,
              description:    bD.services.map(s=>s.name).join(", ")||"Massage TZ Booking",
            })
          });
          const payData = await payRes.json();
          if(payData.redirect_url){
            window.location.href = payData.redirect_url;
            return;
          } else {
            pop("Payment gateway error: "+(payData.error||"Could not connect"),"err");
          }
        }catch(pe){ pop("Could not connect to payment gateway","err"); }
      }

      goStep(6);
    }catch(e){ pop(e.message||"Booking failed","err"); }
    setBookingLoading(false);
  };

  // ── PRICING HELPER: get price for selected booking ──
  const selServicePrice = (id)=>getPrice(id, bRoomId, bD.serviceType);

  // ── NAVBAR ──
  const isMobile = typeof window!=="undefined"&&window.innerWidth<640;


  // ── LANDING PAGE ──
  // Landing, CustomerPortal, AdminPortal are defined OUTSIDE App() below


  // ── BOOKING PORTAL (6 steps) ──

  // CustomerPortal defined outside App()

  // ── ADMIN PORTAL ──
  const ALL_TABS = [
    ["dash","Dashboard","📊",["Admin","Manager","Receptionist"]],
    ["appts","Appointments","📋",["Admin","Manager","Receptionist"]],
    ["reception","Reception Log","🚪",["Admin","Manager","Receptionist"]],
    ["therapists","Therapists","💆",["Admin","Manager"]],
    ["rooms","Rooms","🛁",["Admin","Manager"]],
    ["services","Services & Pricing","📋",["Admin","Manager"]],
    ["offers","Offers","🏷️",["Admin","Manager"]],
    ["expenses","Expenses","💸",["Admin","Manager","Receptionist"]],
    ["reports","Reports","📈",["Admin","Manager"]],
    ["packages","Packages","🎁",["Admin","Manager"]],
    ["payments","Payments","💳",["Admin","Manager"]],
    ["commission","Commission","💵",["Admin","Manager"]],
    ["staff","Staff","👥",["Admin"]],
  ];
  const userRole = user?.role||"Receptionist";
  const ADMIN_TABS = ALL_TABS.filter(([,,, roles])=>roles.includes(userRole)).map(([id,label,icon])=>[id,label,icon]);
  // AdminPortal defined outside App()


  // ── ROOT RENDER ──
  return(
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",minHeight:"100vh",background:G1}}>
      <InstallBanner/>
      {view==="land"&&<Landing navTo={navTo} customer={customer} user={user} therapistUser={therapistUser} therapistLogout={therapistLogout} custLogout={custLogout} setCustModal={setCustModal} setModal={setModal} therapists={therapists} setBD={setBD} setBdName={()=>{}} initBD={initBD} resetBdText={resetBdText}/>}
      {view==="book"&&<BookingPortal
        therapists={therapists} rooms={rooms} services={services} pricing={pricing}
        offers={offers} payMethods={payMethods} customer={customer} packages={packages}
        bD={bD} setBD={setBD} bStep={bStep} setBStep={setBStep}
        bBase={bBase} bDisc={bDisc} bTotal={bTotal} bRoomId={bRoomId}
        getPrice={getPrice} goStep={goStep} navTo={navTo} pop={pop}
        custModal={custModal} setCustModal={setCustModal}
        pendingBook={pendingBook} setPendingBook={setPendingBook}
        custLogin={custLogin} custRegister={custRegister} setAppts={setAppts}
        bdName={bdName} setBdName={setBdName} bdPhone={bdPhone} setBdPhone={setBdPhone}
        bdEmail={bdEmail} setBdEmail={setBdEmail} bdNotes={bdNotes} setBdNotes={setBdNotes}
        bookingLoading={bookingLoading} setBookingLoading={setBookingLoading}
        confirmBooking={confirmBooking} initBD={initBD} resetBdText={resetBdText}
        modal={modal} setModal={setModal}
      />}
      {view==="customer"&&customer&&<CustomerPortal navTo={navTo} customer={customer} setCustomer={setCustomer} user={user} therapistUser={therapistUser} therapistLogout={therapistLogout} custLogout={custLogout} setCustModal={setCustModal} setModal={setModal} custTab={custTab} setCustTab={setCustTab} custAppts={custAppts} custLoading={custLoading} loadCustAppts={loadCustAppts} therapists={therapists} setBD={setBD} initBD={initBD} resetBdText={resetBdText} pop={pop}/>}
      {view==="admin"&&user&&<AdminPortal navTo={navTo} customer={customer} user={user} therapistUser={therapistUser} therapistLogout={therapistLogout} custLogout={custLogout} setCustModal={setCustModal} setModal={setModal} aTab={aTab} setATab={setATab} loading={loading} logout={logout} appts={appts} setAppts={setAppts} reception={reception} setReception={setReception} therapists={therapists} setTherapists={setTherapists} rooms={rooms} setRooms={setRooms} services={services} setServices={setServices} pricing={pricing} setPricing={setPricing} offers={offers} setOffers={setOffers} expenses={expenses} setExpenses={setExpenses} payMethods={payMethods} setPayMethods={setPayMethods} packages={packages} setPackages={setPackages} staff={staff} setStaff={setStaff} pop={pop} ADMIN_TABS={ADMIN_TABS}/>}
      {view==="payment_complete"&&<PaymentCompletePage customer={customer} navTo={navTo} pop={pop}/>}
      {view==="therapist" &&therapistUser&&<TherapistPortal therapistUser={therapistUser} setTherapistUser={setTherapistUser} therapistLogout={therapistLogout} pricing={pricing} services={services} rooms={rooms} pop={pop}/>}
      {/* Modals */}
      {modal==="login"&&<StaffLoginModal onLogin={doLogin} onClose={()=>setModal(null)} pop={pop}/>}
      {custModal&&<CustAuthModal mode={custModal} setMode={setCustModal} onLogin={custLogin} onRegister={custRegister} onClose={()=>{setCustModal(null);setPendingBook(false);}} bookingIntent={pendingBook}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ── CUSTOMER PORTAL TABS ──────────────────────────────────────────────────────

function CustApptsTab({customer,appts,loading,onRefresh,onBook,therapists}){
  const [sel,setSel]=useState(null);
  const sB=appts.find(a=>a.id===sel);
  const sC=(s)=>({pending:WA,confirmed:PL,inProgress:PL,completed:OK,cancelled:ER,noShow:ER})[s]||G6;
  const sB2=(s)=>({pending:WAB,confirmed:PLF,inProgress:PLF,completed:OKB,cancelled:ERB,noShow:ERB})[s]||G1;

  if(loading) return <div style={{textAlign:"center",padding:40,color:G4}}>Loading…</div>;

  if(!appts.length) return(
    <div style={{textAlign:"center",padding:"60px 16px"}}>
      <div style={{fontSize:52,marginBottom:16}}>💆</div>
      <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:BK,marginBottom:10}}>No appointments yet</h3>
      <Btn onClick={onBook}>Book Your First Session</Btn>
    </div>
  );

  const upcoming=appts.filter(a=>["pending","confirmed"].includes(a.status));
  const active=appts.filter(a=>a.status==="inProgress");
  const past=appts.filter(a=>["completed","cancelled","noShow"].includes(a.status));

  const SH=({label,color,count})=>(
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"20px 0 10px"}}>
      <div style={{height:2,flex:1,background:color,opacity:.2,borderRadius:99}}/>
      <span style={{fontSize:11,fontWeight:700,color,textTransform:"uppercase",letterSpacing:".1em",whiteSpace:"nowrap"}}>{label} ({count})</span>
      <div style={{height:2,flex:1,background:color,opacity:.2,borderRadius:99}}/>
    </div>
  );

  const [paying, setPaying] = useState(null); // appt id being paid

  const initiatePayment = async(a)=>{
    setPaying(a.id);
    try{
      const res = await fetch("/api/pesapal?action=create",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          appointment_id: a.id,
          amount:         Number(a.total_amount)-Number(a.paid_amount),
          customer_name:  customer.name,
          customer_email: customer.email||"",
          customer_phone: customer.phone||"",
          description:    Array.isArray(a.services)?a.services.map(s=>s.name).join(", "):"Massage TZ",
        })
      });
      const data = await res.json();
      if(data.redirect_url) window.location.href = data.redirect_url;
      else alert("Payment error: "+(data.error||"Could not initiate payment"));
    }catch(e){ alert("Could not connect to payment gateway"); }
    setPaying(null);
  };

  const ApptCard=({a})=>{
    const th=therapists.find(t=>t.id===a.therapist_id);
    const svcs=Array.isArray(a.services)?a.services:[];
    const bal=Number(a.total_amount)-Number(a.paid_amount);
    const canPay=bal>0 && !["cancelled","noShow"].includes(a.status);
    return(
      <div style={{background:WH,border:`1px solid ${canPay&&a.paid_amount===0?WA:G2}`,borderRadius:14,marginBottom:12,overflow:"hidden"}}>
        <div style={{padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",color:BK}}>{svcs.map(s=>s.name).join(", ")||"Appointment"}</div>
              <div style={{fontSize:12,color:G6,marginTop:3}}>{a.service_type==="outcall"?"🏠 Outcall":"🏢 In-House"} · {th?.name||"Any Therapist"}</div>
            </div>
            <span style={{background:sB2(a.status),color:sC(a.status),padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:700,flexShrink:0}}>{a.status}</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px 14px",marginBottom:10,fontSize:13,color:G6}}>
            <span>📅 {fmtDate(a.appt_date)} at {fmtTime(a.appt_time)}</span>
            <span style={{fontWeight:700,color:PL}}>{fmt(a.total_amount)}</span>
          </div>
          {/* Payment summary */}
          {a.total_amount>0&&(
            <div style={{display:"flex",gap:12,marginBottom:10,fontSize:13,padding:"8px 12px",background:canPay?WAB:OKB,borderRadius:8}}>
              <span style={{color:G6}}>Paid: <strong style={{color:OK}}>{fmt(a.paid_amount)}</strong></span>
              {canPay&&<span style={{color:G6}}>Balance: <strong style={{color:ER}}>{fmt(bal)}</strong></span>}
              {!canPay&&a.paid_amount>=a.total_amount&&<span style={{color:OK,fontWeight:700}}>✓ Fully paid</span>}
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setSel(a.id)} style={{padding:"7px 14px",fontSize:12,borderRadius:7,border:`1px solid ${G2}`,background:WH,cursor:"pointer",color:G6,fontFamily:"inherit",fontWeight:600}}>Details</button>
            {canPay&&(
              <button onClick={()=>initiatePayment(a)} disabled={paying===a.id}
                style={{padding:"7px 16px",fontSize:12,borderRadius:7,border:"none",
                  background:`linear-gradient(135deg,#1565C0,#1976D2)`,color:WH,
                  cursor:paying===a.id?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:700,
                  opacity:paying===a.id?.7:1,display:"flex",alignItems:"center",gap:6}}>
                {paying===a.id?"Processing…":"💳 Pay Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{paddingBottom:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>My Appointments</h2>
        <button onClick={onRefresh} style={{background:"none",border:`1px solid ${G2}`,borderRadius:8,padding:"7px 13px",fontSize:13,cursor:"pointer",color:G6,fontFamily:"inherit"}}>↻ Refresh</button>
      </div>
      {active.length>0&&<>{<SH label="In Progress" color={PL} count={active.length}/>}{active.map(a=><ApptCard key={a.id} a={a}/>)}</>}
      {upcoming.length>0&&<>{<SH label="Upcoming" color={IN} count={upcoming.length}/>}{upcoming.map(a=><ApptCard key={a.id} a={a}/>)}</>}
      {past.length>0&&<>{<SH label="Past" color={G6} count={past.length}/>}{past.map(a=><ApptCard key={a.id} a={a}/>)}</>}
      {sel&&sB&&(
        <Modal title="Appointment Details" onClose={()=>setSel(null)}>
          <div style={{borderRadius:10,border:`1px solid ${G2}`,overflow:"hidden",marginBottom:14}}>
            {[["📋 Booking ID",sB.id],["📅 Date",fmtDate(sB.appt_date)],["🕐 Time",fmtTime(sB.appt_time)],["🔧 Type",sB.service_type],["💆 Therapist",therapists.find(t=>t.id===sB.therapist_id)?.name||"Any"],["💰 Total",fmt(sB.total_amount)],["✅ Paid",fmt(sB.paid_amount)],sB.outcall_address&&["📍 Address",sB.outcall_address]].filter(Boolean).map(([k,v],i)=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",background:i%2===0?WH:G1,fontSize:13,gap:10}}>
                <span style={{color:G6,flexShrink:0}}>{k}</span><span style={{fontWeight:700,textAlign:"right",wordBreak:"break-all"}}>{v}</span>
              </div>
            ))}
          </div>
          {Array.isArray(sB.services)&&sB.services.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:G6,marginBottom:8,textTransform:"uppercase"}}>Services</div>
              {sB.services.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0"}}><span>{s.name}</span><span style={{fontWeight:700}}>{fmt(s.price)}</span></div>)}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function CustProfileTab({customer,setCustomer,pop}){
  const [form,setForm]=useState({name:customer?.name||"",phone:customer?.phone||""});
  const save=async()=>{
    try{
      const u=await api.custAppts(customer.id); // placeholder — real update TBD
      pop("Profile saved");
    }catch(e){pop(e.message,"err");}
  };
  return(
    <Card>
      <ST c="My Profile"/>
      <Inp label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
      <Inp label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
      <Inp label="Email" value={customer?.email||""} disabled style={{opacity:.6}}/>
      <Btn onClick={save}>Save Changes</Btn>
    </Card>
  );
}

// ── ADMIN TABS ────────────────────────────────────────────────────────────────


function DashTab({appts,reception,therapists,rooms,pop,setReception,payMethods,services,pricing}){
  const today=td();
  const todayAppts=appts.filter(a=>(a.appt_date||"").slice(0,10)===today);
  const active=reception.filter(r=>r.status==="inProgress");
  const pending=appts.filter(a=>a.status==="pending");

  // Daily income breakdown
  const todayApptRev  = appts.filter(a=>(a.appt_date||"").slice(0,10)===today).reduce((s,a)=>s+Number(a.paid_amount||0),0);
  const todayWalkinRev= reception.filter(r=>(r.in_time||"").slice(0,10)===today).reduce((s,r)=>s+Number(r.paid_amount||0),0);
  const todayRev      = todayApptRev + todayWalkinRev;
  const todayInvoiced = appts.filter(a=>(a.appt_date||"").slice(0,10)===today).reduce((s,a)=>s+Number(a.total_amount||0),0)
                       +reception.filter(r=>(r.in_time||"").slice(0,10)===today).reduce((s,r)=>s+Number(r.total_amount||0),0);
  const todayOutstanding = Math.max(0, todayInvoiced - todayRev);

  // Therapist status — busy = has active session today
  const busyIds = new Set(active.map(r=>r.therapist_id).filter(Boolean));
  const therapistStatus = therapists.filter(t=>t.active).map(t=>({
    ...t,
    busy: busyIds.has(t.id),
    sessionClient: busyIds.has(t.id) ? active.find(r=>r.therapist_id===t.id)?.customer_name : null,
  }));

  const [editSession,setEditSession]=useState(null);
  const [coModal,setCoModal]=useState(null);
  const [payAmt,setPayAmt]=useState("");
  const [payMethod,setPayMethod]=useState((payMethods||[])[0]||"Cash");
  const [saving,setSaving]=useState(false);

  const checkout=async(id,extra,newSvcs,newTotal)=>{
    setSaving(true);
    try{
      const payload={out_time:new Date().toISOString(),status:"completed",add_payment:Number(extra)||0,payment_method:payMethod};
      if(newSvcs) payload.services=newSvcs;
      if(newTotal) payload.total_amount=newTotal;
      const r=await api.updateReception(id,payload);
      setReception(p=>p.map(x=>x.id===id?{...x,...r}:x));
      setCoModal(null);setPayAmt("");pop("Session ended ✓");
    }catch(e){pop(e.message,"err");}
    setSaving(false);
  };
  const addPay=async(id)=>{
    if(!payAmt) return;
    setSaving(true);
    try{
      const r=await api.updateReception(id,{add_payment:Number(payAmt),payment_method:payMethod});
      setReception(p=>p.map(x=>x.id===id?{...x,...r}:x));
      setPayAmt("");pop("Payment recorded ✓");setEditSession(null);
    }catch(e){pop(e.message,"err");}
    setSaving(false);
  };

  return(
    <div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:20,color:BK}}>Dashboard</h2>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        <KPI label="Today's Sales"  value={fmt(todayRev)}       color={PL} icon="💰"/>
        <KPI label="Active Sessions"value={active.length}        color={OK} icon="🏃"/>
        <KPI label="Today's Appts" value={todayAppts.length}    color={IN} icon="📅"/>
        <KPI label="Pending"       value={pending.length}       color={WA} icon="⏳"/>
      </div>

      {/* ── DAILY INCOME BREAKDOWN ── */}
      <div style={{background:WH,borderRadius:14,border:`1px solid ${G2}`,marginBottom:20,overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${BK},${PLD})`,padding:"12px 16px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:WH}}>📊 Today's Income — {fmtDate(today)}</div>
        </div>
        <div style={{padding:"14px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            {[["From Bookings",todayApptRev,IN],["From Walk-ins",todayWalkinRev,PL],["Outstanding",todayOutstanding,todayOutstanding>0?WA:G4]].map(([l,v,col])=>(
              <div key={l} style={{textAlign:"center",padding:"10px 8px",background:G1,borderRadius:10}}>
                <div style={{fontSize:16,fontWeight:700,color:col}}>{fmt(v)}</div>
                <div style={{fontSize:11,color:G6,marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:`${PL}10`,borderRadius:10,border:`1px solid ${PL}30`}}>
            <span style={{fontWeight:700,fontSize:14,color:PL}}>Total Collected Today</span>
            <span style={{fontWeight:700,fontSize:18,color:PL}}>{fmt(todayRev)}</span>
          </div>
        </div>
      </div>

      {/* ── ACTIVE SESSIONS ── */}
      {active.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:BK,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:OK,display:"inline-block",boxShadow:`0 0 0 3px ${OKB}`}}/>
            Active Sessions ({active.length})
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {active.map(r=>{
              const th=therapists.find(t=>t.id===r.therapist_id);
              const rm=rooms.find(rm=>rm.id===r.room_id);
              const elapsed=r.in_time?Math.floor((Date.now()-new Date(r.in_time))/60000):0;
              const hrs=Math.floor(elapsed/60), mins=elapsed%60;
              const svcs=Array.isArray(r.services)?r.services:(typeof r.services==="string"?JSON.parse(r.services||"[]"):[]);
              const bal=Number(r.total_amount||0)-Number(r.paid_amount||0);
              const isEditing=editSession===r.id;
              return(
                <div key={r.id} style={{background:WH,borderRadius:14,border:`2px solid ${PL}30`,overflow:"hidden",boxShadow:`0 2px 12px ${PL}15`}}>
                  {/* Header bar */}
                  <div style={{background:`linear-gradient(135deg,${PLD},${PL})`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{color:WH}}>
                      <div style={{fontWeight:700,fontSize:15}}>{r.customer_name}</div>
                      <div style={{fontSize:12,opacity:.8}}>{r.customer_phone||""}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{background:"rgba(255,255,255,.2)",color:WH,padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>
                        🕐 {hrs>0?`${hrs}h `:""}${mins}m
                      </div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:3}}>
                        In: {r.in_time?new Date(r.in_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}
                      </div>
                    </div>
                  </div>
                  {/* Body */}
                  <div style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                      {th&&<span style={{background:PLF,color:PL,padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>💆 {th.name}</span>}
                      {rm&&<span style={{background:G1,color:G6,padding:"3px 10px",borderRadius:99,fontSize:12}}>🛏 {rm.name}</span>}
                      <span style={{background:G1,color:G6,padding:"3px 10px",borderRadius:99,fontSize:12}}>{r.service_type==="outcall"?"🏠 Outcall":"🏢 In-House"}</span>
                    </div>
                    {svcs.length>0&&(
                      <div style={{fontSize:13,color:G6,marginBottom:10}}>{svcs.map(s=>s.name).join(" + ")}</div>
                    )}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",gap:16,fontSize:13}}>
                        <div><span style={{color:G6}}>Total: </span><strong style={{color:BK}}>{fmt(r.total_amount)}</strong></div>
                        <div><span style={{color:G6}}>Paid: </span><strong style={{color:OK}}>{fmt(r.paid_amount)}</strong></div>
                        {bal>0&&<div><span style={{color:G6}}>Due: </span><strong style={{color:ER}}>{fmt(bal)}</strong></div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <button onClick={()=>setEditSession(isEditing?null:r.id)}
                          style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${IN}`,background:INB,color:IN,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                          ✏️ Edit
                        </button>
                        {bal>0&&(
                          <button onClick={()=>{setCoModal({...r,bal});setPayAmt(String(bal));}}
                            style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${OK}`,background:OKB,color:OK,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            💵 Pay
                          </button>
                        )}
                        <button onClick={()=>{setCoModal({...r,bal});setPayAmt(bal>0?String(bal):"0");}}
                          style={{padding:"6px 12px",borderRadius:8,border:"none",background:ER,color:WH,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                          🚪 End Session
                        </button>
                      </div>
                    </div>
                    {/* Inline payment */}
                    {isEditing&&(
                      <div style={{marginTop:12,padding:"12px 14px",background:G1,borderRadius:10}}>
                        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>💵 Record Payment</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                          {(payMethods||["Cash"]).map(pm=>(
                            <button key={pm} onClick={()=>setPayMethod(pm)}
                              style={{padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                                border:`2px solid ${payMethod===pm?PL:G2}`,background:payMethod===pm?PLF:WH,color:payMethod===pm?PL:G6}}>
                              {pm}
                            </button>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <input type="number" value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder={`Amount (due: ${fmt(bal)})`}
                            style={{flex:1,padding:"8px 11px",border:`1px solid ${G2}`,borderRadius:8,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                          <button onClick={()=>addPay(r.id)} disabled={saving||!payAmt}
                            style={{padding:"8px 16px",borderRadius:8,border:"none",background:PL,color:WH,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── THERAPIST STATUS LIST ── */}
      {therapistStatus.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:BK,marginBottom:12}}>
            💆 Therapists Today
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,200px),1fr))",gap:8}}>
            {therapistStatus.map(t=>{
              const statusColor = t.busy ? PL : t.availability==="unavailable" ? ER : t.availability==="outcall_only" ? WA : OK;
              const statusLabel = t.busy ? "In Session" : t.availability==="unavailable" ? "Off Duty" : t.availability==="outcall_only" ? "Outcall Only" : "Available";
              const statusIcon  = t.busy ? "🟣" : t.availability==="unavailable" ? "🔴" : t.availability==="outcall_only" ? "🟡" : "🟢";
              return(
                <div key={t.id} style={{background:WH,borderRadius:12,border:`2px solid ${statusColor}30`,padding:"10px 12px",
                  display:"flex",alignItems:"center",gap:10,boxShadow:`0 1px 6px ${statusColor}15`}}>
                  {/* Avatar */}
                  {t.photo
                    ?<img src={t.photo} alt={t.name} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid ${statusColor}40`}}/>
                    :<div style={{width:38,height:38,borderRadius:"50%",background:statusColor+"20",flexShrink:0,
                      display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:statusColor}}>
                      {t.name?.[0]}
                    </div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:BK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                      <span style={{fontSize:11}}>{statusIcon}</span>
                      <span style={{fontSize:11,fontWeight:600,color:statusColor}}>{statusLabel}</span>
                    </div>
                    {t.busy&&t.sessionClient&&(
                      <div style={{fontSize:10,color:G4,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        with {t.sessionClient}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's appointments */}
      {todayAppts.length>0&&(
        <Card>
          <ST c="Today's Appointments"/>
          {todayAppts.slice(0,10).map(a=>{
            const th=therapists.find(t=>t.id===a.therapist_id);
            const svcs=Array.isArray(a.services)?a.services.map(s=>s.name).join(", "):"-";
            return(
              <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                <div>
                  <div style={{fontWeight:700}}>{a.customer_name}</div>
                  <div style={{fontSize:12,color:G6}}>{fmtTime(a.appt_time)} · {th?.name||"Any"} · {svcs.slice(0,40)}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <Badge s={a.status}/>
                  {["cancelled","noShow"].includes(a.status)&&(
                    <button onClick={e=>{e.stopPropagation();delAppt(a);}}
                      title="Delete appointment"
                      style={{background:"none",border:"none",color:ER,cursor:"pointer",fontSize:16,padding:"2px 4px",lineHeight:1}}>
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* End session modal */}
      {coModal&&(()=>{
        const coSvcs = Array.isArray(coModal.services)?coModal.services:(typeof coModal.services==="string"?JSON.parse(coModal.services||"[]"):[]);
        const coBase = coSvcs.reduce((s,sv)=>s+Number(sv.price||0),0);
        const coTotal = coModal._newTotal||Number(coModal.total_amount||0);
        const coPaid  = Number(coModal.paid_amount||0);
        const coBal   = Math.max(0, coTotal - coPaid);
        return(
        <Modal title="End Session — Checkout" onClose={()=>{setCoModal(null);setPayAmt("");}}>
          {/* Client summary */}
          <div style={{background:`linear-gradient(135deg,${BK},${PLD})`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:16,color:WH,marginBottom:2}}>{coModal.customer_name}</div>
            {coModal.customer_phone&&<div style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>{coModal.customer_phone}</div>}
          </div>

          {/* Add services */}
          {services&&services.length>0&&(
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>
                ➕ Add Services
              </label>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:8}}>
                {services.filter(s=>s.active).map(sv=>{
                  const alreadyIn = coSvcs.find(s=>s.id===sv.id);
                  const pr = pricing?(pricing.find(p=>p.service_id===sv.id&&p.service_type===(coModal.service_type||"inhouse"))?.price||0):0;
                  return(
                    <button key={sv.id}
                      onClick={()=>{
                        const newSvcs = alreadyIn
                          ? coSvcs.filter(s=>s.id!==sv.id)
                          : [...coSvcs,{id:sv.id,name:sv.name,price:Number(pr)}];
                        const newTotal = newSvcs.reduce((s,s2)=>s+Number(s2.price||0),0);
                        setCoModal(m=>({...m,services:newSvcs,_newTotal:newTotal}));
                      }}
                      style={{padding:"7px 12px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${alreadyIn?PL:G2}`,background:alreadyIn?PLF:WH,color:alreadyIn?PL:G6,
                        display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                      <span>{sv.name}</span>
                      {pr>0&&<span style={{fontSize:10,fontWeight:400,color:alreadyIn?PL:G4}}>{fmt(pr)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Services list */}
          {coSvcs.length>0&&(
            <div style={{background:G1,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:G6,textTransform:"uppercase",marginBottom:6}}>Services</div>
              {coSvcs.map((s,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
                  <span>{s.name}</span><span style={{fontWeight:700}}>{fmt(s.price)}</span>
                </div>
              ))}
              <div style={{borderTop:`1px solid ${G2}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}>
                <span>Total</span><span style={{color:PL}}>{fmt(coTotal)}</span>
              </div>
            </div>
          )}

          {/* Payment summary */}
          <div style={{background:G1,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
            {[["Total",fmt(coTotal),BK],["Paid so far",fmt(coPaid),OK],["Balance Due",fmt(coBal),coBal>0?ER:G4]].map(([k,v,col])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
                <span style={{color:G6}}>{k}</span><strong style={{color:col}}>{v}</strong>
              </div>
            ))}
          </div>

          {/* Payment amount — always shown */}
          <Inp label={coBal>0?`Amount Paid Now (balance: ${fmt(coBal)})`:"Amount Paid Now"} type="number" value={payAmt}
            onChange={e=>setPayAmt(e.target.value)} placeholder={coBal>0?fmt(coBal):"0"}/>

          {/* Payment method — always shown */}
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Payment Method</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(payMethods||["Cash"]).map(pm=>(
                <button key={pm} onClick={()=>setPayMethod(pm)}
                  style={{padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                    border:`2px solid ${payMethod===pm?PL:G2}`,background:payMethod===pm?PLF:WH,color:payMethod===pm?PL:G6}}>
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>{setCoModal(null);setPayAmt("");}} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <button onClick={()=>checkout(coModal.id,payAmt,coSvcs,coTotal)} disabled={saving}
              style={{flex:2,padding:"12px",borderRadius:9,border:"none",background:`linear-gradient(135deg,#dc2626,#ef4444)`,
                color:WH,fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?.7:1}}>
              {saving?"Ending…":"🚪 End Session"}
            </button>
          </div>
        </Modal>
        );
      })()}
    </div>
  );
}

function ApptsTab({appts,setAppts,therapists,rooms,services,pricing,payMethods,pop,user,offers}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [dateF,setDateF]=useState(td());
  const [sel,setSel]=useState(null);
  const [payAmt,setPayAmt]=useState("");
  const [payMethod,setPayMethod]=useState(payMethods[0]||"Cash");
  const [newModal,setNewModal]=useState(false);
  const selA=appts.find(a=>a.id===sel);

  const filtered=appts.filter(a=>{
    const dateOk=!dateF||(fmtDate(a.appt_date)===dateF);
    const statusOk=filter==="all"||a.status===filter;
    const searchOk=!search||a.customer_name?.toLowerCase().includes(search.toLowerCase())||a.id?.toLowerCase().includes(search.toLowerCase());
    return dateOk&&statusOk&&searchOk;
  }).sort((a,b)=>String(b.appt_date).localeCompare(String(a.appt_date)));

  const updStatus=async(id,status)=>{
    try{ const u=await api.updateAppt(id,{status}); setAppts(p=>p.map(a=>a.id===id?{...a,...u}:a)); pop("Status updated"); setSel(null); }catch(e){pop(e.message,"err");}
  };
  const recPay=async()=>{
    if(!payAmt||!selA) return;
    try{ const u=await api.updateAppt(selA.id,{add_payment:Number(payAmt),payment_method:payMethod}); setAppts(p=>p.map(a=>a.id===selA.id?{...a,...u}:a)); setPayAmt(""); pop("Payment recorded"); }catch(e){pop(e.message,"err");}
  };

  const STATUS_FLOW=["pending","confirmed","inProgress","completed","cancelled","noShow"];

  const delAppt=async(a)=>{
    if(!["cancelled","noShow"].includes(a.status)){
      return pop("Only cancelled or no-show appointments can be deleted","err");
    }
    if(!window.confirm(`Delete appointment for ${a.customer_name}? This cannot be undone.`)) return;
    try{
      await api.deleteAppt(a.id);
      setAppts(p=>p.filter(x=>x.id!==a.id));
      if(sel===a.id) setSel(null);
      pop("Appointment deleted");
    }catch(e){ pop(e.message,"err"); }
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>Appointments</h2>
        <Btn onClick={()=>setNewModal(true)}>+ New Appointment</Btn>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {["all","pending","confirmed","inProgress","completed","cancelled"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,border:`1px solid ${filter===s?PL:G2}`,background:filter===s?PL:WH,color:filter===s?WH:G6,cursor:"pointer",fontFamily:"inherit"}}>
            {s==="all"?"All":s}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <Inp label="" type="date" value={dateF} onChange={e=>setDateF(e.target.value)} style={{marginBottom:0,flex:"0 0 150px"}}/>
        {dateF&&<button onClick={()=>setDateF("")} style={{background:"none",border:`1px solid ${G2}`,borderRadius:7,padding:"8px 10px",fontSize:12,color:G6,cursor:"pointer",fontFamily:"inherit"}}>✕ All Dates</button>}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or ID…"
          style={{padding:"8px 11px",border:`1px solid ${G2}`,borderRadius:8,fontSize:13,outline:"none",fontFamily:"inherit",flex:1,minWidth:150}}/>
        <span style={{fontSize:12,color:G4}}>{filtered.length} appts</span>
      </div>

      {filtered.length===0&&<div style={{color:G4,fontSize:14,padding:20,textAlign:"center"}}>No appointments found</div>}
      {filtered.map(a=>{
        const th=therapists.find(t=>t.id===a.therapist_id);
        const rm=rooms.find(r=>r.id===a.room_id);
        const svcs=Array.isArray(a.services)?a.services:[];
        const bal=Number(a.total_amount)-Number(a.paid_amount);
        return(
          <div key={a.id} style={{background:WH,borderRadius:12,border:`1px solid ${G2}`,padding:"14px 16px",marginBottom:10,cursor:"pointer"}} onClick={()=>setSel(a.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:6}}>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{a.customer_name} <span style={{fontSize:11,color:G4,fontWeight:400}}>· {a.id}</span></div>
                <div style={{fontSize:12,color:G6,marginTop:2}}>{fmtDate(a.appt_date)} {fmtTime(a.appt_time)} · {th?.name||"Any"} · {a.service_type==="outcall"?"🏠 Outcall":"🏢 In-House"}</div>
                <div style={{fontSize:12,color:G6,marginTop:2}}>{svcs.map(s=>s.name).join(", ")}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <Badge s={a.status}/>
                <div style={{fontSize:13,fontWeight:700,color:PL,marginTop:4}}>{fmt(a.total_amount)}</div>
                {bal>0&&<div style={{fontSize:11,color:ER}}>Due: {fmt(bal)}</div>}
              </div>
            </div>
          </div>
        );
      })}

      {sel&&selA&&(
        <Modal title="Appointment Details" onClose={()=>{setSel(null);setPayAmt("");}} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[["Client",selA.customer_name],["Phone",selA.customer_phone],["Date",fmtDate(selA.appt_date)],["Time",fmtTime(selA.appt_time)],["Type",selA.service_type],["Therapist",therapists.find(t=>t.id===selA.therapist_id)?.name||"Any"],["Room",rooms.find(r=>r.id===selA.room_id)?.name||"—"],["Total",fmt(selA.total_amount)],["Paid",fmt(selA.paid_amount)],["Balance",fmt(Number(selA.total_amount)-Number(selA.paid_amount))]].map(([k,v])=>(
              <div key={k} style={{padding:"8px 10px",background:G1,borderRadius:8,fontSize:12}}>
                <div style={{color:G6,marginBottom:2}}>{k}</div><div style={{fontWeight:700}}>{v}</div>
              </div>
            ))}
          </div>
          {Array.isArray(selA.services)&&selA.services.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:G8,textTransform:"uppercase",marginBottom:6}}>Services</div>
              {selA.services.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0"}}><span>{s.name}</span><span style={{fontWeight:700}}>{fmt(s.price)}</span></div>)}
            </div>
          )}
          {selA.notes&&<div style={{padding:"9px 12px",background:G1,borderRadius:8,fontSize:13,color:G6,marginBottom:14}}>📝 {selA.notes}</div>}
          {/* Status buttons */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:G8,textTransform:"uppercase",marginBottom:7}}>Update Status</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {STATUS_FLOW.map(s=>(
                <button key={s} onClick={()=>updStatus(selA.id,s)} disabled={selA.status===s}
                  style={{padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${selA.status===s?PL:G2}`,background:selA.status===s?PLF:WH,color:selA.status===s?PL:G6}}>
                  {s}
                </button>
              ))}
            </div>
            {/* Delete — only for cancelled or no-show */}
            {["cancelled","noShow"].includes(selA.status)&&(
              <button onClick={()=>delAppt(selA)}
                style={{width:"100%",marginTop:10,padding:"10px",borderRadius:9,fontSize:13,fontWeight:700,
                  cursor:"pointer",fontFamily:"inherit",border:`2px solid ${ER}`,background:ERB,color:ER,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                🗑 Delete Appointment Permanently
              </button>
            )}
          </div>
          {/* Record payment */}
          {Number(selA.total_amount)>Number(selA.paid_amount)&&(
            <div style={{padding:14,background:G1,borderRadius:10}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Record Payment</div>
              <Inp label={`Amount (max ${fmt(Number(selA.total_amount)-Number(selA.paid_amount))})`} type="number" value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder="Amount"/>
              <div style={{marginBottom:10}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:7,textTransform:"uppercase",letterSpacing:".05em"}}>Method</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {payMethods.map(pm=><button key={pm} onClick={()=>setPayMethod(pm)} style={{padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${payMethod===pm?PL:G2}`,background:payMethod===pm?PLF:WH,color:payMethod===pm?PL:G6}}>{pm}</button>)}
                </div>
              </div>
              <Btn v="ok" onClick={recPay} disabled={!payAmt}>Record Payment</Btn>
            </div>
          )}
        </Modal>
      )}
      {newModal&&<NewApptModal therapists={therapists} rooms={rooms} services={services} pricing={pricing} payMethods={payMethods} offers={offers} user={user} pop={pop} onClose={()=>setNewModal(false)} onSave={a=>{setAppts(p=>[...p,a]);setNewModal(false);pop("Appointment created");}}/>}
    </div>
  );
}


function ReceptionTab({reception,setReception,therapists,rooms,services,pricing,payMethods,pop,user}){
  const [clientName,  setClientName]  = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [form, setForm] = useState({
    therapistId:"", roomId:"", serviceType:"inhouse",
    selServices:[], disc:0, discT:"pct", paid:0, method:"Cash", notes:"",
    gender:"male"
  });
  const [step,    setStep]    = useState(1);
  const [coModal, setCoModal] = useState(null);
  const [editModal,setEditModal] = useState(null);
  const [dateF,   setDateF]   = useState(td());
  const [payAmt,  setPayAmt]  = useState("");
  const [payMethod,setPayMethod] = useState((payMethods||[])[0]||"Cash");
  const [saving,  setSaving]  = useState(false);

  const getPrice=(svcId,roomId,svcType)=>{
    const p=pricing.find(p=>p.service_id===svcId&&(p.room_id===roomId||p.room_type===roomId)&&p.service_type===svcType)
           ||pricing.find(p=>p.service_id===svcId&&p.service_type===svcType);
    return p?Number(p.price):0;
  };
  const roomId=form.roomId||null;
  const base=form.selServices.reduce((s,sv)=>s+getPrice(sv.id,roomId,form.serviceType),0);
  const disc=form.discT==="pct"?Math.round(base*Number(form.disc||0)/100):Number(form.disc||0);
  const total=Math.max(0,base-disc);

  const toggleSvc=(sv)=>{
    setForm(f=>{
      const ex=f.selServices.find(s=>s.id===sv.id);
      if(ex) return{...f,selServices:f.selServices.filter(s=>s.id!==sv.id)};
      return{...f,selServices:[...f.selServices,{id:sv.id,name:sv.name,price:getPrice(sv.id,roomId,f.serviceType)}]};
    });
  };
  const updatePrices=(newRoom,newType)=>{
    setForm(f=>({...f,roomId:newRoom??f.roomId,serviceType:newType||f.serviceType,
      selServices:f.selServices.map(s=>({...s,price:getPrice(s.id,newRoom??f.roomId,newType||f.serviceType)}))}));
  };
  const resetForm=()=>{
    setClientName("");setClientPhone("");
    setForm({therapistId:"",roomId:"",serviceType:"inhouse",selServices:[],disc:0,discT:"pct",paid:0,method:(payMethods||[])[0]||"Cash",notes:"",gender:"male"});
    setStep(1);
  };

  const startSession=async()=>{
    if(!clientName.trim()) return pop("Client name required","err");
    if(!form.selServices.length) return pop("Select at least one service","err");
    setSaving(true);
    try{
      const r=await api.createReception({
        customer_name:clientName, customer_phone:clientPhone,
        client_gender:form.gender||"male",
        therapist_id:form.therapistId||null, room_id:form.roomId||null,
        service_type:form.serviceType,
        services:form.selServices.map(s=>({...s,price:getPrice(s.id,roomId,form.serviceType)})),
        base_amount:base, discount:Number(form.disc||0), discount_type:form.discT,
        total_amount:total, paid_amount:Number(form.paid||0),
        payment_method:form.method, notes:form.notes,
        status:"inProgress", staff_id:user?.id||null,
      });
      setReception(p=>[{...r,
        therapist_name:therapists.find(t=>t.id===r.therapist_id)?.name||null,
        room_name:rooms.find(rm=>rm.id===r.room_id)?.name||null,
      },...p]);
      resetForm();pop("Session started ✓");
    }catch(e){pop(e.message||"Failed","err");}
    setSaving(false);
  };

  const checkout=async(id,extra,newSvcs,newTotal)=>{
    setSaving(true);
    try{
      const payload={out_time:new Date().toISOString(),status:"completed",add_payment:Number(extra)||0,payment_method:payMethod};
      if(newSvcs) payload.services=newSvcs;
      if(newTotal) payload.total_amount=newTotal;
      const r=await api.updateReception(id,payload);
      setReception(p=>p.map(x=>x.id===id?{...x,...r}:x));
      setCoModal(null);setPayAmt("");pop("Checked out ✓");
    }catch(e){pop(e.message||"Failed","err");}
    setSaving(false);
  };

  const filtered=reception.filter(r=>!dateF||(r.in_time||r.created_at||"").slice(0,10)===dateF)
    .sort((a,b)=>new Date(b.in_time||b.created_at)-new Date(a.in_time||a.created_at));

  const STEPS=["Client & Room","Services","Payment"];

  return(
    <div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:20,color:BK}}>Reception</h2>

      {/* ── NEW WALK-IN FORM ── */}
      <div style={{background:WH,borderRadius:16,border:`1px solid ${G2}`,overflow:"hidden",marginBottom:24,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
        {/* Form header */}
        <div style={{background:`linear-gradient(135deg,${BK},${PLD})`,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{color:WH}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>New Walk-In Session</div>
            <div style={{fontSize:12,opacity:.7,marginTop:2}}>Step {step} of 3 — {STEPS[step-1]}</div>
          </div>
          {step>1&&<button onClick={resetForm}
            style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",color:WH,borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
            ✕ Reset
          </button>}
        </div>

        {/* Step progress */}
        <div style={{display:"flex",height:3}}>
          {STEPS.map((_,i)=>(
            <div key={i} style={{flex:1,background:step>i?PL:G2,transition:"background .3s"}}/>
          ))}
        </div>

        <div style={{padding:"18px 18px 20px"}}>
          {/* ── STEP 1: Client & Room ── */}
          {step===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Client name + phone */}
              {/* Gender selector */}
              <div style={{marginBottom:4}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Client Gender</label>
                <div style={{display:"flex",gap:8}}>
                  {[["male","👨 Male"],["female","👩 Female"],["other","⚧ Other"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setForm(f=>({...f,gender:v}))}
                      style={{flex:1,padding:"9px 8px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${form.gender===v?PL:G2}`,
                        background:form.gender===v?(v==="male"?"#1565C020":v==="female"?"#e91e6320":PLF):WH,
                        color:form.gender===v?PL:G6}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Client Name *</label>
                  <input value={clientName} onChange={e=>setClientName(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&clientName.trim()&&setStep(2)}
                    placeholder="Jane Mwangi"
                    style={{width:"100%",padding:"10px 12px",border:`2px solid ${clientName?PL:G2}`,borderRadius:9,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color .15s"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Phone</label>
                  <input value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="+255 7XX XXX XXX"
                    style={{width:"100%",padding:"10px 12px",border:`2px solid ${G2}`,borderRadius:9,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
              </div>

              {/* Therapist + Room — visually prominent */}
              <div style={{background:`linear-gradient(135deg,${PLF},${WH})`,borderRadius:12,border:`1px solid ${PL}30`,padding:"14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:PL,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12}}>
                  💆 Assign Therapist & Room
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Therapist</label>
                    <select value={form.therapistId} onChange={e=>setForm(f=>({...f,therapistId:e.target.value}))}
                      style={{width:"100%",padding:"9px 11px",border:`2px solid ${form.therapistId?PL:G2}`,borderRadius:8,fontSize:13,outline:"none",fontFamily:"inherit",background:WH,boxSizing:"border-box",cursor:"pointer"}}>
                      <option value="">🎲 Any Available</option>
                      {therapists.filter(t=>t.active).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>Room</label>
                    <select value={form.roomId} onChange={e=>updatePrices(e.target.value,null)}
                      style={{width:"100%",padding:"9px 11px",border:`2px solid ${form.roomId?PL:G2}`,borderRadius:8,fontSize:13,outline:"none",fontFamily:"inherit",background:WH,boxSizing:"border-box",cursor:"pointer"}}>
                      <option value="">🏠 Outcall / No Room</option>
                      {rooms.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Service type */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Service Type</label>
                <div style={{display:"flex",gap:8}}>
                  {[["inhouse","🏢","In-House"],["outcall","🏠","Outcall"]].map(([v,ic,l])=>(
                    <button key={v} onClick={()=>updatePrices(null,v)}
                      style={{flex:1,padding:"10px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${form.serviceType===v?PL:G2}`,background:form.serviceType===v?PLF:WH,color:form.serviceType===v?PL:G6,
                        display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <span>{ic}</span>{l}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={()=>{if(!clientName.trim())return pop("Client name required","err");setStep(2);}}
                style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${PLD},${PL})`,
                  color:WH,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                Continue → Choose Services
              </button>
            </div>
          )}

          {/* ── STEP 2: Services ── */}
          {step===2&&(
            <div>
              {/* Summary bar */}
              <div style={{background:PLF,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                <span style={{background:PL,color:WH,padding:"2px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>{clientName}</span>
                {form.therapistId&&<span style={{background:WH,color:PL,padding:"2px 10px",borderRadius:99,fontSize:12,border:`1px solid ${PL}30`}}>
                  💆 {therapists.find(t=>t.id===form.therapistId)?.name}
                </span>}
                {form.roomId&&<span style={{background:WH,color:G6,padding:"2px 10px",borderRadius:99,fontSize:12,border:`1px solid ${G2}`}}>
                  🛏 {rooms.find(r=>r.id===form.roomId)?.name}
                </span>}
                <span style={{background:WH,color:G6,padding:"2px 10px",borderRadius:99,fontSize:12,border:`1px solid ${G2}`}}>
                  {form.serviceType==="outcall"?"🏠 Outcall":"🏢 In-House"}
                </span>
              </div>

              <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>
                Select Services *
              </label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {services.filter(s=>s.active).map(sv=>{
                  const price=getPrice(sv.id,roomId,form.serviceType);
                  const sel=form.selServices.find(s=>s.id===sv.id);
                  return(
                    <button key={sv.id} onClick={()=>toggleSvc(sv)}
                      style={{padding:"10px 14px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${sel?PL:G2}`,background:sel?PLF:WH,color:sel?PL:G8,
                        display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:100,transition:"all .15s",
                        boxShadow:sel?`0 0 0 3px ${PL}20`:"none"}}>
                      <span>{sv.name}</span>
                      <span style={{fontSize:12,color:sel?PL:G4,fontWeight:400}}>{price>0?fmt(price):"—"}</span>
                    </button>
                  );
                })}
              </div>

              {form.selServices.length>0&&(
                <div style={{background:PLF,borderRadius:10,padding:"12px 14px",marginBottom:14,border:`1px solid ${PL}30`}}>
                  <div style={{fontSize:12,fontWeight:700,color:PL,marginBottom:8}}>Selected ({form.selServices.length})</div>
                  {form.selServices.map(s=>(
                    <div key={s.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                      <span>{s.name}</span><span style={{fontWeight:700,color:PL}}>{fmt(getPrice(s.id,roomId,form.serviceType))}</span>
                    </div>
                  ))}
                  <div style={{borderTop:`1px solid ${PL}30`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}>
                    <span>Subtotal</span><span style={{color:PL}}>{fmt(base)}</span>
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setStep(1)}
                  style={{flex:1,padding:"10px",borderRadius:9,border:`1px solid ${G2}`,background:WH,color:G6,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ← Back
                </button>
                <button onClick={()=>{if(!form.selServices.length)return pop("Select at least one service","err");setStep(3);}}
                  disabled={!form.selServices.length}
                  style={{flex:2,padding:"10px",borderRadius:9,border:"none",background:form.selServices.length?`linear-gradient(135deg,${PLD},${PL})`:"#ccc",
                    color:WH,fontSize:13,fontWeight:700,cursor:form.selServices.length?"pointer":"not-allowed",fontFamily:"inherit"}}>
                  Continue → Payment
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Payment & Confirm ── */}
          {step===3&&(
            <div>
              <div style={{background:PLF,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                <span style={{background:PL,color:WH,padding:"2px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>{clientName}</span>
                {form.selServices.map(s=>(
                  <span key={s.id} style={{background:WH,color:PL,padding:"2px 9px",borderRadius:99,fontSize:12,border:`1px solid ${PL}30`}}>{s.name}</span>
                ))}
              </div>

              {/* Discount */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                <Inp label="Discount" type="number" value={form.disc} onChange={e=>setForm(f=>({...f,disc:e.target.value}))} placeholder="0" style={{marginBottom:0}}/>
                <Sel label="Type" value={form.discT} onChange={e=>setForm(f=>({...f,discT:e.target.value}))} style={{marginBottom:0}}>
                  <option value="pct">% Percentage</option>
                  <option value="fix">TZS Fixed</option>
                </Sel>
              </div>

              {/* Totals */}
              <div style={{background:`linear-gradient(135deg,${BK},${PLD})`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4,color:"rgba(255,255,255,.7)"}}>
                  <span>Subtotal</span><span>{fmt(base)}</span>
                </div>
                {disc>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4,color:"rgba(255,255,255,.7)"}}>
                  <span>Discount</span><span style={{color:"#86efac"}}>−{fmt(disc)}</span>
                </div>}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:700,borderTop:"1px solid rgba(255,255,255,.2)",paddingTop:10,marginTop:6,color:GOLD}}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>

              <Inp label="Amount Paid Now" type="number" value={form.paid} onChange={e=>setForm(f=>({...f,paid:e.target.value}))} placeholder={`0 — full: ${fmt(total)}`}/>
              <div style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Payment Method</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(payMethods.length?payMethods:["Cash"]).map(pm=>(
                    <button key={pm} onClick={()=>setForm(f=>({...f,method:pm}))}
                      style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${form.method===pm?PL:G2}`,background:form.method===pm?PLF:WH,color:form.method===pm?PL:G6}}>
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
              <Txa label="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} placeholder="Session notes…"/>

              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setStep(2)}
                  style={{flex:1,padding:"10px",borderRadius:9,border:`1px solid ${G2}`,background:WH,color:G6,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ← Back
                </button>
                <button onClick={startSession} disabled={saving}
                  style={{flex:2,padding:"12px",borderRadius:9,border:"none",background:`linear-gradient(135deg,#16a34a,#22c55e)`,
                    color:WH,fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?.7:1}}>
                  {saving?"Starting…":"🚪 Start Session"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SESSION LOG ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:BK}}>Session Log</div>
        <Inp label="" type="date" value={dateF} onChange={e=>setDateF(e.target.value)} style={{marginBottom:0,width:"auto"}}/>
      </div>

      {filtered.length===0&&(
        <div style={{color:G4,fontSize:14,textAlign:"center",padding:30,background:WH,borderRadius:12,border:`1px solid ${G2}`}}>
          No sessions for this date
        </div>
      )}

      {filtered.map(r=>{
        const th=therapists.find(t=>t.id===r.therapist_id);
        const rm=rooms.find(rm=>rm.id===r.room_id);
        const svcs=Array.isArray(r.services)?r.services:(typeof r.services==="string"?JSON.parse(r.services||"[]"):[]);
        const bal=Number(r.total_amount||0)-Number(r.paid_amount||0);
        const inT=r.in_time?new Date(r.in_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—";
        const outT=r.out_time?new Date(r.out_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):null;
        const isActive=r.status==="inProgress";
        return(
          <div key={r.id} style={{background:WH,borderRadius:14,border:`2px solid ${isActive?PL:r.status==="completed"?OK+"40":G2}`,
            marginBottom:12,overflow:"hidden",boxShadow:isActive?`0 4px 16px ${PL}20`:"0 1px 4px rgba(0,0,0,.06)"}}>
            {/* Row header */}
            <div style={{background:isActive?`linear-gradient(135deg,${PLD},${PL})`:G1,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{fontWeight:700,fontSize:14,color:isActive?WH:BK}}>{r.customer_name}</span>
                {r.customer_phone&&<span style={{fontSize:12,color:isActive?"rgba(255,255,255,.7)":G6,marginLeft:8}}>{r.customer_phone}</span>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{background:isActive?"rgba(255,255,255,.2)":r.status==="completed"?OKB:G2,
                  color:isActive?WH:r.status==="completed"?OK:G6,
                  padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>
                  {isActive?"● In Session":r.status==="completed"?"✓ Done":r.status}
                </span>
              </div>
            </div>
            {/* Body */}
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                {th&&<span style={{background:PLF,color:PL,padding:"2px 9px",borderRadius:99,fontSize:12,fontWeight:600}}>💆 {th.name}</span>}
                {rm&&<span style={{background:G1,color:G6,padding:"2px 9px",borderRadius:99,fontSize:12}}>🛏 {rm.name}</span>}
                <span style={{background:G1,color:G6,padding:"2px 9px",borderRadius:99,fontSize:12}}>
                  🕐 {inT}{outT?` → ${outT}`:""}
                </span>
              </div>
              {svcs.length>0&&<div style={{fontSize:13,color:G6,marginBottom:8}}>{svcs.map(s=>s.name).join(" + ")}</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:12,fontSize:13}}>
                  <span><span style={{color:G6}}>Total: </span><strong style={{color:BK}}>{fmt(r.total_amount)}</strong></span>
                  <span><span style={{color:G6}}>Paid: </span><strong style={{color:OK}}>{fmt(r.paid_amount)}</strong></span>
                  {bal>0&&<span><span style={{color:G6}}>Due: </span><strong style={{color:ER}}>{fmt(bal)}</strong></span>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {isActive&&bal>0&&(
                    <button onClick={()=>{setCoModal({...r,bal});setPayAmt(String(bal));}}
                      style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${OK}`,background:OKB,color:OK,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      💵 Pay
                    </button>
                  )}
                  {isActive&&(
                    <button onClick={()=>{setCoModal({...r,bal});setPayAmt(bal>0?String(bal):"0");}}
                      style={{padding:"6px 12px",borderRadius:7,border:"none",background:ER,color:WH,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      🚪 End
                    </button>
                  )}
                </div>
              </div>
              {r.notes&&<div style={{marginTop:8,fontSize:12,color:G6,padding:"6px 10px",background:G1,borderRadius:7}}>📝 {r.notes}</div>}
            </div>
          </div>
        );
      })}

      {/* Checkout modal */}
      {coModal&&(()=>{
        const coSvcs = Array.isArray(coModal.services)?coModal.services:(typeof coModal.services==="string"?JSON.parse(coModal.services||"[]"):[]);
        const coTotal = coModal._newTotal||Number(coModal.total_amount||0);
        const coPaid  = Number(coModal.paid_amount||0);
        const coBal   = Math.max(0, coTotal - coPaid);
        return(
        <Modal title="End Session — Checkout" onClose={()=>{setCoModal(null);setPayAmt("");}}>
          <div style={{background:`linear-gradient(135deg,${BK},${PLD})`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:16,color:WH,marginBottom:2}}>{coModal.customer_name}</div>
            {coModal.customer_phone&&<div style={{fontSize:13,color:"rgba(255,255,255,.6)"}}>{coModal.customer_phone}</div>}
          </div>

          {/* Add services */}
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>➕ Add / Remove Services</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {services.filter(s=>s.active).map(sv=>{
                const alreadyIn=coSvcs.find(s=>s.id===sv.id);
                const pr=pricing?(pricing.find(p=>p.service_id===sv.id&&p.service_type===(coModal.service_type||"inhouse"))?.price||0):0;
                return(
                  <button key={sv.id}
                    onClick={()=>{
                      const newSvcs=alreadyIn?coSvcs.filter(s=>s.id!==sv.id):[...coSvcs,{id:sv.id,name:sv.name,price:Number(pr)}];
                      setCoModal(m=>({...m,services:newSvcs,_newTotal:newSvcs.reduce((s,s2)=>s+Number(s2.price||0),0)}));
                    }}
                    style={{padding:"7px 12px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      border:`2px solid ${alreadyIn?PL:G2}`,background:alreadyIn?PLF:WH,color:alreadyIn?PL:G6,
                      display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                    <span>{sv.name}</span>
                    {pr>0&&<span style={{fontSize:10,fontWeight:400,color:alreadyIn?PL:G4}}>{fmt(pr)}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services + totals */}
          {coSvcs.length>0&&(
            <div style={{background:G1,borderRadius:10,padding:"10px 14px",marginBottom:12}}>
              {coSvcs.map((s,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
                  <span>{s.name}</span><span style={{fontWeight:700}}>{fmt(s.price)}</span>
                </div>
              ))}
              <div style={{borderTop:`1px solid ${G2}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}>
                <span>Total</span><span style={{color:PL}}>{fmt(coTotal)}</span>
              </div>
            </div>
          )}
          <div style={{background:G1,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
            {[["Paid so far",fmt(coPaid),OK],["Balance Due",fmt(coBal),coBal>0?ER:G4]].map(([k,v,col])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
                <span style={{color:G6}}>{k}</span><strong style={{color:col}}>{v}</strong>
              </div>
            ))}
          </div>

          <Inp label={coBal>0?`Amount Paid Now (balance: ${fmt(coBal)})`:"Amount Paid Now"} type="number" value={payAmt}
            onChange={e=>setPayAmt(e.target.value)} placeholder={coBal>0?fmt(coBal):"0"}/>

          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Payment Method</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(payMethods.length?payMethods:["Cash"]).map(pm=>(
                <button key={pm} onClick={()=>setPayMethod(pm)}
                  style={{padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                    border:`2px solid ${payMethod===pm?PL:G2}`,background:payMethod===pm?PLF:WH,color:payMethod===pm?PL:G6}}>
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>{setCoModal(null);setPayAmt("");}} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <button onClick={()=>checkout(coModal.id,payAmt,coSvcs,coTotal)} disabled={saving}
              style={{flex:2,padding:"12px",borderRadius:9,border:"none",background:`linear-gradient(135deg,#dc2626,#ef4444)`,
                color:WH,fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?.7:1}}>
              {saving?"Ending…":"🚪 End Session"}
            </button>
          </div>
        </Modal>
        );
      })()}
    </div>
  );
}


function TherapistsTab({therapists,setTherapists,pop}){
  const [modal,setModal]   = useState(false);
  const [uploading,setUploading] = useState(false);
  const [form,setForm]     = useState({
    id:null,name:"",phone:"",email:"",bio:"",
    photo:"",photos:[],specialties:"",
    outcall:true,active:true,pin:"",availability:"available"
  });

  const open = (t) => {
    if(t) setForm({...t, specialties:(t.specialties||[]).join(", "), pin:"", photos:t.photos||[], photo:t.photo||""});
    else  setForm({id:null,name:"",phone:"",email:"",bio:"",photo:"",photos:[],specialties:"",outcall:true,active:true,pin:"",availability:"available"});
    setModal(true);
  };

  const save = async() => {
    if(!form.name) return;
    const specs = typeof form.specialties==="string"
      ? form.specialties.split(",").map(s=>s.trim()).filter(Boolean)
      : (form.specialties||[]);
    const payload = {
      name:form.name, phone:form.phone||"", email:form.email||"",
      bio:form.bio||"", photo:form.photos[0]||form.photo||null,
      photos:form.photos||[], specialties:specs,
      outcall:!!form.outcall, active:form.active!==false,
      availability:form.availability||"available"
    };
    if(form.pin) payload.pin = form.pin;
    try{
      if(form.id){ const u=await api.updateTherapist(form.id,payload); setTherapists(p=>p.map(t=>t.id===form.id?u:t)); pop("Therapist updated"); }
      else        { const u=await api.createTherapist(payload);         setTherapists(p=>[...p,u]);                    pop("Therapist added"); }
      setModal(false);
    }catch(e){ pop(e.message,"err"); }
  };

  const addPhotos = async(e) => {
    const files = Array.from(e.target.files||[]);
    if(!files.length) return;
    setUploading(true);
    const compressed = await Promise.all(files.map(f=>compressPhoto(f)));
    setForm(f=>({ ...f, photos:[...f.photos,...compressed].slice(0,8) }));
    setUploading(false);
    e.target.value="";
  };

  const removePhoto = (i) => setForm(f=>({ ...f, photos:f.photos.filter((_,idx)=>idx!==i) }));
  const moveFirst   = (i) => setForm(f=>{ const p=[...f.photos]; const [img]=p.splice(i,1); p.unshift(img); return {...f,photos:p}; });

  const deactivate = async(t) => {
    try{ const u=await api.updateTherapist(t.id,{active:!t.active}); setTherapists(p=>p.map(x=>x.id===t.id?{...x,...u}:x)); pop(u.active?"Activated":"Deactivated"); }catch(e){pop(e.message,"err");}
  };
  const del = async(t) => {
    if(!window.confirm(`Delete ${t.name}?`)) return;
    try{ await api.deleteTherapist(t.id); setTherapists(p=>p.filter(x=>x.id!==t.id)); pop("Deleted"); }catch(e){pop(e.message,"err");}
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>Therapists</h2>
        <Btn onClick={()=>open(null)}>+ Add Therapist</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
        {therapists.map(t=>{
          const mainPhoto = (t.photos||[])[0] || t.photo;
          const photoCount = (t.photos||[]).length || (t.photo?1:0);
          return(
            <Card key={t.id} style={{padding:0,overflow:"hidden",opacity:t.active?1:.65}}>
              <div style={{paddingTop:"75%",position:"relative",background:mainPhoto?G1:`linear-gradient(135deg,${PLD},${PL})`}}>
                {mainPhoto
                  ? <img src={mainPhoto} alt={t.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,color:WH,fontFamily:"'Playfair Display',serif"}}>{t.name?.[0]}</div>
                }
                {photoCount>1&&<div style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,.6)",color:WH,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99}}>📷 {photoCount}</div>}
              </div>
              <div style={{padding:"12px 14px 14px"}}>
                <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",color:BK,marginBottom:4}}>{t.name}</div>
                {(t.specialties||[]).length>0&&<div style={{fontSize:12,color:G6,marginBottom:6}}>{(t.specialties||[]).join(" · ")}</div>}
                <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                  {t.outcall&&<span style={{background:PLF,color:PL,padding:"2px 7px",borderRadius:99,fontSize:10,fontWeight:700}}>Outcall ✓</span>}
                  <span style={{background:t.active?OKB:G1,color:t.active?OK:G4,padding:"2px 7px",borderRadius:99,fontSize:10,fontWeight:700}}>{t.active?"Active":"Inactive"}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>open(t)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${G2}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:G6,fontWeight:700}}>✏️ Edit</button>
                  <button onClick={()=>deactivate(t)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${t.active?WA:OK}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:t.active?WA:OK,fontWeight:700}}>{t.active?"Deactivate":"Activate"}</button>
                  <button onClick={()=>del(t)} style={{flex:1,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${ER}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:ER,fontWeight:700}}>🗑</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {modal&&(
        <Modal title={form.id?"Edit Therapist":"Add Therapist"} onClose={()=>setModal(false)} wide>
          <Inp label="Full Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Aisha Mwangi"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Inp label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
            <Inp label="Email (for login)" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="aisha@massagetz.com"/>
          </div>
          <Inp label="Specialties (comma separated)" value={form.specialties} onChange={e=>setForm(f=>({...f,specialties:e.target.value}))} placeholder="Swedish, Deep Tissue, Hot Stone"/>
          <Txa label="Bio" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={2} placeholder="Short therapist bio…"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Inp label={form.id?"New Login PIN (blank = keep)":"Login PIN (4–6 digits)"} type="password" value={form.pin||""} onChange={e=>setForm(f=>({...f,pin:e.target.value}))} placeholder={form.id?"Leave blank to keep…":"Set a PIN"} maxLength={6}/>
            <Sel label="Availability" value={form.availability||"available"} onChange={e=>setForm(f=>({...f,availability:e.target.value}))}>
              <option value="available">🟢 Available</option>
              <option value="outcall_only">🟡 Outcall Only</option>
              <option value="unavailable">🔴 Unavailable</option>
            </Sel>
          </div>
          <div style={{display:"flex",gap:12,marginBottom:14}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
              <input type="checkbox" checked={form.outcall} onChange={e=>setForm(f=>({...f,outcall:e.target.checked}))}/>
              Accepts Outcall Requests
            </label>
          </div>

          {/* ── MULTI-PHOTO UPLOAD ── */}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>
              Photos ({form.photos.length}/8) — First photo is the profile picture
            </label>
            {/* Photo grid */}
            {form.photos.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:8,marginBottom:10}}>
                {form.photos.map((src,i)=>(
                  <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",border:`2px solid ${i===0?PL:G2}`}}>
                    <div style={{paddingTop:"100%",position:"relative"}}>
                      <img src={src} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                    {i===0&&<div style={{position:"absolute",top:3,left:3,background:PL,color:WH,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:99}}>MAIN</div>}
                    <div style={{position:"absolute",top:3,right:3,display:"flex",gap:3}}>
                      {i>0&&(
                        <button onClick={()=>moveFirst(i)} title="Set as main"
                          style={{width:20,height:20,borderRadius:"50%",background:"rgba(0,0,0,.6)",color:WH,border:"none",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>★</button>
                      )}
                      <button onClick={()=>removePhoto(i)}
                        style={{width:20,height:20,borderRadius:"50%",background:"rgba(200,0,0,.8)",color:WH,border:"none",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Upload button */}
            {form.photos.length<8&&(
              <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 14px",border:`2px dashed ${G2}`,borderRadius:8,cursor:"pointer",fontSize:13,color:G6,background:WH}}>
                📷 {uploading?"Uploading…":"Add Photos (select multiple)"}
                <input type="file" accept="image/*" multiple onChange={addPhotos} style={{display:"none"}} disabled={uploading}/>
              </label>
            )}
            <div style={{fontSize:11,color:G4,marginTop:5}}>Click ★ to set any photo as the main profile picture. Up to 8 photos.</div>
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setModal(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name} style={{flex:1,justifyContent:"center"}}>{form.id?"Save Changes":"Add Therapist"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RoomsTab({rooms,setRooms,pop}){
  const [modal,setModal]     = useState(false);
  const [uploading,setUploading] = useState(false);
  const [form,setForm]       = useState({id:null,name:"",description:"",amenities:"",photos:[]});

  const open=(r)=>{
    if(r) setForm({id:r.id,name:r.name,description:r.description||"",amenities:(r.amenities||[]).join(", "),photos:r.photos||[]});
    else  setForm({id:null,name:"",description:"",amenities:"",photos:[]});
    setModal(true);
  };

  const addPhotos=async(e)=>{
    const files=Array.from(e.target.files||[]);
    if(!files.length) return;
    setUploading(true);
    const compressed=await Promise.all(files.map(f=>compressPhoto(f)));
    setForm(f=>({...f,photos:[...f.photos,...compressed].slice(0,6)}));
    setUploading(false);
    e.target.value="";
  };
  const removePhoto=(i)=>setForm(f=>({...f,photos:f.photos.filter((_,idx)=>idx!==i)}));

  const save=async()=>{
    if(!form.name) return;
    const amen=typeof form.amenities==="string"
      ?form.amenities.split(",").map(s=>s.trim()).filter(Boolean)
      :(form.amenities||[]);
    const payload={name:form.name,description:form.description||"",amenities:amen,photos:form.photos||[]};
    try{
      if(form.id){const u=await api.updateRoom(form.id,payload);setRooms(p=>p.map(r=>r.id===form.id?u:r));pop("Room updated");}
      else{const u=await api.createRoom(payload);setRooms(p=>[...p,u]);pop("Room added");}
      setModal(false);
    }catch(e){pop(e.message,"err");}
  };
  const del=async(r)=>{
    if(!window.confirm(`Delete ${r.name}?`)) return;
    try{await api.deleteRoom(r.id);setRooms(p=>p.filter(x=>x.id!==r.id));pop("Deleted");}catch(e){pop(e.message,"err");}
  };
  const toggle=async(r)=>{
    try{const u=await api.updateRoom(r.id,{active:!r.active});setRooms(p=>p.map(x=>x.id===r.id?{...x,...u}:x));pop(u.active?"Activated":"Deactivated");}catch(e){pop(e.message,"err");}
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>Treatment Rooms</h2>
        <Btn onClick={()=>open(null)}>+ Add Room</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {rooms.map(r=>{
          const photos=r.photos||[];
          return(
          <Card key={r.id} style={{opacity:r.active?1:.65,padding:0,overflow:"hidden"}}>
            {/* Room photo or color block */}
            <div style={{paddingTop:"55%",position:"relative",background:photos[0]?G1:`linear-gradient(135deg,#7B3F6E,#5C2E52)`}}>
              {photos[0]
                ?<img src={photos[0]} alt={r.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                :<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,color:"rgba(255,255,255,.25)",fontFamily:"'Playfair Display',serif",fontWeight:900}}>{r.name[0]}</div>
              }
              {photos.length>1&&<div style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,.5)",color:WH,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99}}>📷 {photos.length}</div>}
              <span style={{position:"absolute",top:8,right:8,background:r.active?OKB:G1,color:r.active?OK:G4,padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700}}>{r.active?"Active":"Off"}</span>
            </div>
            <div style={{padding:"12px 14px 14px"}}>
              <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",color:BK,marginBottom:4}}>{r.name}</div>
              {r.description&&<div style={{fontSize:12,color:G6,marginBottom:8,lineHeight:1.5}}>{r.description}</div>}
              {(r.amenities||[]).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>{(r.amenities||[]).slice(0,5).map((a,i)=><span key={i} style={{background:G1,fontSize:10,padding:"2px 7px",borderRadius:99,color:G6}}>{a}</span>)}</div>}
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>open(r)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${G2}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:G6,fontWeight:700}}>✏️ Edit</button>
                <button onClick={()=>toggle(r)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${r.active?WA:OK}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:r.active?WA:OK,fontWeight:700}}>{r.active?"Disable":"Enable"}</button>
                <button onClick={()=>del(r)} style={{flex:1,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${ER}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:ER,fontWeight:700}}>🗑</button>
              </div>
            </div>
          </Card>
          );
        })}
      </div>
      {modal&&(
        <Modal title={form.id?"Edit Room":"Add Room"} onClose={()=>setModal(false)}>
          <Inp label="Room Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Lotus Room, Room 1…"/>
          <Inp label="Description (optional)" value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Peaceful room with soft lighting…"/>
          <Inp label="Amenities (comma separated)" value={form.amenities||""} onChange={e=>setForm(f=>({...f,amenities:e.target.value}))} placeholder="Air conditioning, Music, Private shower…"/>
          {/* Photos */}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>
              Room Photos ({form.photos.length}/6)
            </label>
            {form.photos.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:7,marginBottom:10}}>
                {form.photos.map((src,i)=>(
                  <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",border:`2px solid ${i===0?PL:G2}`}}>
                    <div style={{paddingTop:"75%",position:"relative"}}>
                      <img src={src} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                    {i===0&&<div style={{position:"absolute",top:2,left:2,background:PL,color:WH,fontSize:8,fontWeight:700,padding:"1px 4px",borderRadius:99}}>MAIN</div>}
                    <button onClick={()=>removePhoto(i)} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(200,0,0,.85)",color:WH,border:"none",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                ))}
              </div>
            )}
            {form.photos.length<6&&(
              <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 14px",border:`2px dashed ${G2}`,borderRadius:8,cursor:"pointer",fontSize:13,color:G6}}>
                📷 {uploading?"Uploading…":"Add Photos"}
                <input type="file" accept="image/*" multiple onChange={addPhotos} style={{display:"none"}} disabled={uploading}/>
              </label>
            )}
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setModal(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name} style={{flex:1,justifyContent:"center"}}>{form.id?"Save":"Add Room"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ServicesTab({services,setServices,pricing,setPricing,rooms,pop}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({id:null,name:"",category:"Massage",description:"",duration_min:60});
  const [priceForm,setPriceForm]=useState({serviceId:"",roomId:"",serviceType:"inhouse",price:""});
  const CATS=["Massage","Facial","Body","Wellness","Other"];
  const catColor={Massage:PL,Facial:GOLD,Body:OK,Wellness:IN,Other:G6};

  const openSvc=(s)=>{ if(s) setForm({...s}); else setForm({id:null,name:"",category:"Massage",description:"",duration_min:60}); setModal(true); };

  const saveSvc=async()=>{
    if(!form.name) return;
    const payload={name:form.name,category:form.category,description:form.description||"",duration_min:Number(form.duration_min)||60};
    try{
      if(form.id){ const u=await api.updateService(form.id,payload); setServices(p=>p.map(s=>s.id===form.id?u:s)); pop("Service updated"); }
      else{ const u=await api.createService(payload); setServices(p=>[...p,u]); pop("Service added"); }
      setModal(false);
    }catch(e){ pop(e.message,"err"); }
  };

  const savePrice=async()=>{
    if(!priceForm.serviceId||!priceForm.price) return pop("Select a service and enter price","err");
    if(priceForm.serviceType==="inhouse"&&!priceForm.roomId) return pop("Select a room for in-house pricing","err");
    try{
      const u=await api.upsertPrice({
        service_id:   priceForm.serviceId,
        room_id:      priceForm.serviceType==="inhouse" ? priceForm.roomId : null,
        service_type: priceForm.serviceType,
        price:        Number(priceForm.price)
      });
      setPricing(p=>{
        const ex=p.findIndex(x=>x.service_id===u.service_id&&x.room_id===u.room_id&&x.service_type===u.service_type);
        if(ex>=0){const n=[...p];n[ex]=u;return n;}
        return[...p,u];
      });
      setPriceForm(f=>({...f,price:""}));
      pop("Price saved");
    }catch(e){ pop(e.message,"err"); }
  };

  const delPrice=async(id)=>{
    try{ await api.deletePrice(id); setPricing(p=>p.filter(x=>x.id!==id)); pop("Price removed"); }
    catch(e){ pop(e.message,"err"); }
  };

  // Get all prices for a service
  const getPrices=(sId)=>pricing.filter(p=>p.service_id===sId).map(p=>({
    ...p,
    room_name: p.room_name || rooms.find(r=>r.id===p.room_id)?.name || p.room_type || null
  }));

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>Services & Pricing</h2>
        <Btn onClick={()=>openSvc(null)}>+ Add Service</Btn>
      </div>

      {/* Pricing tool */}
      <Card style={{marginBottom:20}}>
        <ST c="Set / Update Price"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
          <Sel label="Service *" value={priceForm.serviceId} onChange={e=>setPriceForm(f=>({...f,serviceId:e.target.value}))}>
            <option value="">Select service…</option>
            {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel>
          <Sel label="Service Type *" value={priceForm.serviceType} onChange={e=>setPriceForm(f=>({...f,serviceType:e.target.value,roomId:e.target.value==="outcall"?"":f.roomId}))}>
            <option value="inhouse">🏢 In-House</option>
            <option value="outcall">🏠 Outcall</option>
          </Sel>
          {priceForm.serviceType==="inhouse"&&(
            <Sel label="Room *" value={priceForm.roomId} onChange={e=>setPriceForm(f=>({...f,roomId:e.target.value}))}>
              <option value="">Select room…</option>
              {rooms.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </Sel>
          )}
          {priceForm.serviceType==="outcall"&&(
            <div style={{display:"flex",alignItems:"flex-end",paddingBottom:14}}>
              <div style={{fontSize:12,color:G6,padding:"9px 0"}}>No room needed for outcall</div>
            </div>
          )}
          <Inp label="Price (TZS) *" type="number" value={priceForm.price} onChange={e=>setPriceForm(f=>({...f,price:e.target.value}))} placeholder="50000" style={{marginBottom:0}}/>
        </div>
        <div style={{marginTop:12}}>
          <Btn onClick={savePrice} disabled={!priceForm.serviceId||!priceForm.price||(priceForm.serviceType==="inhouse"&&!priceForm.roomId)}>
            Save Price
          </Btn>
        </div>
      </Card>

      {/* Services list */}
      {CATS.map(cat=>{
        const svcs=services.filter(s=>s.category===cat);
        if(!svcs.length) return null;
        return(
          <div key={cat} style={{marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:700,color:catColor[cat]||G6,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:catColor[cat]||G6}}/>
              {cat}
            </div>
            {svcs.map(sv=>{
              const svPrices=getPrices(sv.id);
              const inhousePrices=svPrices.filter(p=>p.service_type==="inhouse");
              const outcallPrice =svPrices.find(p=>p.service_type==="outcall");
              return(
                <Card key={sv.id} style={{marginBottom:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:BK}}>{sv.name}</div>
                      <div style={{fontSize:12,color:G6,marginTop:2}}>{sv.duration_min} min{sv.description?" · "+sv.description:""}</div>
                    </div>
                    <button onClick={()=>openSvc(sv)} style={{padding:"5px 10px",fontSize:11,borderRadius:6,border:`1px solid ${G2}`,background:"none",cursor:"pointer",color:G6,fontFamily:"inherit",flexShrink:0}}>Edit</button>
                  </div>

                  {/* In-house prices per room */}
                  {inhousePrices.length>0&&(
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:G6,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>🏢 In-House</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {inhousePrices.map(p=>(
                          <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,background:G1,borderRadius:8,padding:"5px 11px",fontSize:13}}>
                            <span style={{color:G8,fontWeight:600}}>{p.room_name||rooms.find(r=>r.id===p.room_id)?.name||"Room"}</span>
                            <span style={{color:G4}}>·</span>
                            <span style={{fontWeight:700}}>{fmt(p.price)}</span>
                            <button onClick={()=>delPrice(p.id)} style={{background:"none",border:"none",color:ER,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outcall price */}
                  {outcallPrice?(
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:G6,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>🏠 Outcall</div>
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:PLF,borderRadius:8,padding:"5px 11px",fontSize:13}}>
                        <span style={{fontWeight:700,color:PL}}>{fmt(outcallPrice.price)}</span>
                        <button onClick={()=>delPrice(outcallPrice.id)} style={{background:"none",border:"none",color:ER,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
                      </div>
                    </div>
                  ):null}

                  {!svPrices.length&&(
                    <div style={{fontSize:12,color:G4,fontStyle:"italic"}}>No prices set — use the form above to add prices</div>
                  )}
                </Card>
              );
            })}
          </div>
        );
      })}
      {!services.length&&<div style={{color:G4,fontSize:14,padding:20}}>No services yet. Add your first service.</div>}

      {/* Service form modal */}
      {modal&&(
        <Modal title={form.id?"Edit Service":"Add Service"} onClose={()=>setModal(false)}>
          <Inp label="Service Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Swedish Massage"/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Category</label>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {CATS.map(ct=>(
                <button key={ct} onClick={()=>setForm(f=>({...f,category:ct}))}
                  style={{padding:"6px 13px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                    border:`2px solid ${form.category===ct?(catColor[ct]||G6):G2}`,
                    background:form.category===ct?`${catColor[ct]||G6}15`:WH,
                    color:form.category===ct?(catColor[ct]||G6):G6}}>
                  {ct}
                </button>
              ))}
            </div>
          </div>
          <Inp label="Duration (minutes)" type="number" value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} placeholder="60"/>
          <Inp label="Description (optional)" value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Full body relaxation massage…"/>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setModal(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={saveSvc} disabled={!form.name} style={{flex:1,justifyContent:"center"}}>{form.id?"Save":"Add Service"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function OffersTab({offers,setOffers,pop}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({id:null,name:"",code:"",type:"pct",value:"",min_amount:0,valid_from:"",valid_to:""});
  const today=td();

  const open=(o)=>{ if(o) setForm({...o,value:String(o.value),min_amount:o.min_amount||0});else setForm({id:null,name:"",code:"",type:"pct",value:"",min_amount:0,valid_from:"",valid_to:""}); setModal(true); };
  const save=async()=>{
    if(!form.name||!form.value) return;
    const payload={...form,value:Number(form.value),min_amount:Number(form.min_amount)||0};
    try{
      if(form.id){ const u=await api.updateOffer(form.id,payload); setOffers(p=>p.map(o=>o.id===form.id?u:o)); pop("Offer updated"); }
      else{ const u=await api.createOffer(payload); setOffers(p=>[...p,u]); pop("Offer created"); }
      setModal(false);
    }catch(e){pop(e.message,"err");}
  };
  const del=async(o)=>{
    if(!window.confirm(`Delete ${o.name}?`)) return;
    try{ await api.deleteOffer(o.id); setOffers(p=>p.filter(x=>x.id!==o.id)); pop("Deleted"); }catch(e){pop(e.message,"err");}
  };
  const toggle=async(o)=>{
    try{ const u=await api.updateOffer(o.id,{active:!o.active}); setOffers(p=>p.map(x=>x.id===o.id?{...x,...u}:x)); pop(u.active?"Activated":"Deactivated"); }catch(e){pop(e.message,"err");}
  };
  const isValid=(o)=>o.active&&(!o.valid_from||o.valid_from<=today)&&(!o.valid_to||o.valid_to>=today);

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>Offers & Discounts</h2>
        <Btn onClick={()=>open(null)}>+ New Offer</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
        {offers.map(o=>{
          const valid=isValid(o);
          return(
            <Card key={o.id} style={{borderTop:`3px solid ${valid?GOLD:G2}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif"}}>{o.name}</div>
                  {o.code&&<div style={{fontSize:12,color:G6,fontFamily:"monospace",background:G1,display:"inline-block",padding:"2px 8px",borderRadius:6,marginTop:4}}>{o.code}</div>}
                </div>
                <span style={{background:valid?`${GOLD}20`:G1,color:valid?GOLD:G4,padding:"3px 8px",borderRadius:99,fontSize:11,fontWeight:700}}>{valid?"✓ Active":"Inactive"}</span>
              </div>
              <div style={{fontSize:22,fontWeight:700,color:valid?GOLD:G4,fontFamily:"'Playfair Display',serif",marginBottom:6}}>
                {o.type==="pct"?`${o.value}% OFF`:`TZS ${Number(o.value).toLocaleString()} OFF`}
              </div>
              {Number(o.min_amount)>0&&<div style={{fontSize:12,color:G6,marginBottom:4}}>Min. order: {fmt(o.min_amount)}</div>}
              {(o.valid_from||o.valid_to)&&<div style={{fontSize:12,color:G6,marginBottom:8}}>{o.valid_from||"—"} → {o.valid_to||"—"}</div>}
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>open(o)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${G2}`,background:"none",cursor:"pointer",color:G6,fontFamily:"inherit",fontWeight:700}}>✏️ Edit</button>
                <button onClick={()=>toggle(o)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${o.active?WA:OK}`,background:"none",cursor:"pointer",color:o.active?WA:OK,fontFamily:"inherit",fontWeight:700}}>{o.active?"Disable":"Enable"}</button>
                <button onClick={()=>del(o)} style={{flex:1,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${ER}`,background:"none",cursor:"pointer",color:ER,fontFamily:"inherit",fontWeight:700}}>🗑</button>
              </div>
            </Card>
          );
        })}
        {offers.length===0&&<div style={{color:G4,fontSize:14,padding:20}}>No offers yet. Create your first discount!</div>}
      </div>
      {modal&&(
        <Modal title={form.id?"Edit Offer":"New Offer"} onClose={()=>setModal(false)}>
          <Inp label="Offer Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Weekend Special"/>
          <Inp label="Promo Code (optional)" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="e.g. SPA20"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Sel label="Discount Type" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
              <option value="pct">Percentage (%)</option>
              <option value="fix">Fixed Amount (TZS)</option>
            </Sel>
            <Inp label={form.type==="pct"?"Percentage (0-100)":"Amount (TZS)"} type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder={form.type==="pct"?"20":"5000"}/>
          </div>
          <Inp label="Minimum Order Amount (TZS)" type="number" value={form.min_amount} onChange={e=>setForm(f=>({...f,min_amount:e.target.value}))} placeholder="0 = no minimum"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Inp label="Valid From" type="date" value={form.valid_from} onChange={e=>setForm(f=>({...f,valid_from:e.target.value}))}/>
            <Inp label="Valid To" type="date" value={form.valid_to} onChange={e=>setForm(f=>({...f,valid_to:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setModal(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name||!form.value} style={{flex:1,justifyContent:"center"}}>{form.id?"Save":"Create Offer"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ExpensesTab({expenses,setExpenses,pop,user}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({category:"",description:"",amount:"",expense_date:td()});
  const CATS=["Supplies","Rent","Utilities","Salaries","Marketing","Equipment","Other"];

  const save=async()=>{
    if(!form.category||!form.amount) return;
    try{ const u=await api.createExpense({...form,amount:Number(form.amount),staff_id:user?.id}); setExpenses(p=>[u,...p]); setModal(false); pop("Expense recorded"); }catch(e){pop(e.message,"err");}
  };
  const total=expenses.reduce((s,e)=>s+Number(e.amount),0);
  const byCat=CATS.map(c=>({cat:c,total:expenses.filter(e=>e.category===c).reduce((s,e)=>s+Number(e.amount),0)})).filter(x=>x.total>0);

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>Expenses</h2>
        <Btn onClick={()=>setModal(true)}>+ Add Expense</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
        <KPI label="Total Expenses" value={fmt(total)} color={ER} icon="💸"/>
        {byCat.slice(0,3).map(x=><KPI key={x.cat} label={x.cat} value={fmt(x.total)} color={G6} icon="📂"/>)}
      </div>
      {byCat.length>0&&(
        <Card style={{marginBottom:16}}>
          <ST c="By Category"/>
          {byCat.map(x=>(
            <div key={x.cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:13,color:G6,width:90,flexShrink:0}}>{x.cat}</span>
              <div style={{flex:1,height:5,background:G1,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:total>0?Math.round(x.total/total*100)+"%":"0%",background:ER,borderRadius:99}}/>
              </div>
              <span style={{fontSize:13,fontWeight:700,minWidth:80,textAlign:"right"}}>{fmt(x.total)}</span>
            </div>
          ))}
        </Card>
      )}
      {expenses.slice(0,50).map(e=>(
        <div key={e.id} style={{background:WH,borderRadius:10,border:`1px solid ${G2}`,padding:"11px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:13}}>{e.description}</div>
            <div style={{fontSize:11,color:G6,marginTop:2}}>{e.category} · {fmtDate(e.expense_date)}</div>
          </div>
          <div style={{fontWeight:700,fontSize:14,color:ER}}>{fmt(e.amount)}</div>
        </div>
      ))}
      {modal&&(
        <Modal title="Add Expense" onClose={()=>setModal(false)}>
          <Sel label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            <option value="">Select category…</option>
            {CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </Sel>
          <Inp label="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What was purchased?"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Inp label="Amount (TZS)" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
            <Inp label="Date" type="date" value={form.expense_date} onChange={e=>setForm(f=>({...f,expense_date:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setModal(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.category||!form.amount} style={{flex:1,justifyContent:"center"}}>Save Expense</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReportsTab({appts,reception,expenses,therapists,services,payMethods}){
  const [df,setDf]=useState("");
  const [dt,setDt]=useState("");
  const [tab,setTab]=useState("financial");

  const allRev=[...appts,...reception];
  const inRange=r=>{
    const d=(r.appt_date||r.in_time||r.created_at||"").slice(0,10);
    return(!df||d>=df)&&(!dt||d<=dt);
  };
  const filtered=allRev.filter(inRange);
  const filteredRec=reception.filter(inRange);
  const filteredAppts=appts.filter(inRange);
  const filteredExp=expenses.filter(e=>inRange({appt_date:e.expense_date}));

  const totRev=filtered.reduce((s,a)=>s+Number(a.paid_amount||0),0);
  const totExp=filteredExp.reduce((s,e)=>s+Number(e.amount||0),0);
  const net=totRev-totExp;
  const totInvoiced=filtered.reduce((s,a)=>s+Number(a.total_amount||0),0);
  const outstanding=totInvoiced-totRev;

  // gender breakdown (reception only)
  const genderCounts={male:0,female:0,other:0};
  filteredRec.forEach(r=>{const g=r.client_gender||"male";genderCounts[g]=(genderCounts[g]||0)+1;});
  const totalGender=Object.values(genderCounts).reduce((a,b)=>a+b,0);

  const byMethod=payMethods.map(m=>({method:m,total:filtered.filter(a=>a.payment_method===m).reduce((s,a)=>s+Number(a.paid_amount||0),0),count:filtered.filter(a=>a.payment_method===m).length})).filter(x=>x.total>0);
  const byTherapist=therapists.map(t=>({...t,rev:filtered.filter(a=>a.therapist_id===t.id).reduce((s,a)=>s+Number(a.paid_amount||0),0),count:filtered.filter(a=>a.therapist_id===t.id).length})).sort((a,b)=>b.rev-a.rev);
  const byService=services.map(sv=>({...sv,rev:filtered.filter(a=>(a.services||[]).find(s=>s.id===sv.id)).reduce((s,a)=>s+Number(a.paid_amount||0),0),count:filtered.filter(a=>(a.services||[]).find(s=>s.id===sv.id)).length})).filter(x=>x.rev>0).sort((a,b)=>b.rev-a.rev);
  const byServiceType={inhouse:filtered.filter(a=>a.service_type!=="outcall").length,outcall:filtered.filter(a=>a.service_type==="outcall").length};
  const byExpCat=[...new Set(filteredExp.map(e=>e.category||"General"))].map(cat=>({cat,total:filteredExp.filter(e=>(e.category||"General")===cat).reduce((s,e)=>s+Number(e.amount||0),0)})).sort((a,b)=>b.total-a.total);

  const presets=[["Today",td(),td()],["This Week",(()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10);})(),(()=>{const d=new Date();d.setDate(d.getDate()+(6-d.getDay()));return d.toISOString().slice(0,10);})()],["This Month",(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-01";})(),new Date(new Date().getFullYear(),new Date().getMonth()+1,0).toISOString().slice(0,10)],["All Time","",""]];

  const Bar=({pct,color})=>(
    <div style={{height:6,background:G1,borderRadius:99,overflow:"hidden",marginTop:4}}>
      <div style={{height:"100%",width:pct+"%",background:color||PL,borderRadius:99,transition:"width .4s"}}/>
    </div>
  );

  return(
    <div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:16,color:BK}}>Reports</h2>

      {/* Date range */}
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {presets.map(([l,f,t])=>(
            <button key={l} onClick={()=>{setDf(f);setDt(t);}}
              style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,
                border:`1px solid ${df===f&&dt===t?PL:G2}`,background:df===f&&dt===t?PLF:WH,
                color:df===f&&dt===t?PL:G6,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <Inp label="From" type="date" value={df} onChange={e=>setDf(e.target.value)} style={{marginBottom:0,flex:"0 0 150px"}}/>
          <Inp label="To"   type="date" value={dt} onChange={e=>setDt(e.target.value)} style={{marginBottom:0,flex:"0 0 150px"}}/>
          {(df||dt)&&<button onClick={()=>{setDf("");setDt("");}} style={{padding:"8px 12px",borderRadius:7,border:`1px solid ${G2}`,background:"none",cursor:"pointer",color:G6,fontSize:12,fontFamily:"inherit"}}>✕ Clear</button>}
        </div>
      </Card>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {[["financial","💰 Financial"],["clients","👥 Clients"],["therapists","💆 Therapists"],["services","📋 Services"],["expenses","📤 Expenses"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:700,
              border:`1px solid ${tab===id?PL:G2}`,background:tab===id?PL:WH,color:tab===id?WH:G6,cursor:"pointer",fontFamily:"inherit"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── FINANCIAL ── */}
      {tab==="financial"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            <KPI label="Total Revenue"  value={fmt(totRev)}  color={PL}           icon="💰"/>
            <KPI label="Total Expenses" value={fmt(totExp)}  color={ER}           icon="📤"/>
            <KPI label="Net Profit"     value={fmt(net)}     color={net>=0?OK:ER} icon="📈"/>
            <KPI label="Outstanding"    value={fmt(outstanding)} color={WA}       icon="⏳"/>
            <KPI label="Appointments"   value={filteredAppts.filter(a=>a.status==="completed").length} color={IN} icon="✅"/>
            <KPI label="Walk-ins"       value={filteredRec.filter(r=>r.status==="completed").length} color={G6} icon="🚪"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card>
              <ST c="Payment Methods"/>
              {byMethod.length===0&&<div style={{color:G4,fontSize:13}}>No payment data</div>}
              {byMethod.map((m,i)=>(
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                    <span style={{color:G6}}>{m.method}</span>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontWeight:700}}>{fmt(m.total)}</span>
                      <span style={{fontSize:11,color:G4,marginLeft:6}}>{totRev>0?Math.round(m.total/totRev*100):0}%</span>
                    </div>
                  </div>
                  <Bar pct={totRev>0?Math.round(m.total/totRev*100):0}/>
                </div>
              ))}
              {byMethod.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${G2}`,display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700}}><span>Total</span><span style={{color:PL}}>{fmt(totRev)}</span></div>}
            </Card>
            <Card>
              <ST c="Summary"/>
              {[["Invoiced",fmt(totInvoiced),G6],["Collected",fmt(totRev),OK],["Outstanding",fmt(outstanding),outstanding>0?ER:G4],["Expenses",fmt(totExp),ER],["Net Profit",fmt(net),net>=0?OK:ER],["Sessions",String(filtered.length),PL]].map(([k,v,col])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                  <span style={{color:G6}}>{k}</span><span style={{fontWeight:700,color:col}}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
          <Card>
            <ST c="Service Type Breakdown"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["🏢 In-House",byServiceType.inhouse,"#1565C0"],["🏠 Outcall",byServiceType.outcall,"#7B3F6E"]].map(([l,n,col])=>(
                <div key={l} style={{background:col+"10",borderRadius:10,padding:"14px",textAlign:"center",border:`1px solid ${col}20`}}>
                  <div style={{fontSize:28,fontWeight:700,color:col}}>{n}</div>
                  <div style={{fontSize:12,color:G6,marginTop:4}}>{l} sessions</div>
                  <div style={{fontSize:11,color:G4}}>{filtered.length>0?Math.round(n/filtered.length*100):0}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── CLIENTS ── */}
      {tab==="clients"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            <KPI label="Total Clients" value={filteredRec.length} color={PL} icon="👥"/>
            <KPI label="Male"   value={genderCounts.male}   color={"#1565C0"} icon="👨"/>
            <KPI label="Female" value={genderCounts.female} color={"#e91e63"} icon="👩"/>
            {genderCounts.other>0&&<KPI label="Other" value={genderCounts.other} color={G6} icon="⚧"/>}
          </div>
          <Card>
            <ST c="Gender Breakdown (Walk-ins)"/>
            {totalGender===0&&<div style={{color:G4,fontSize:13}}>No walk-in data</div>}
            {[["👨 Male",genderCounts.male,"#1565C0"],["👩 Female",genderCounts.female,"#e91e63"],["⚧ Other",genderCounts.other,"#6A1B9A"]].filter(x=>x[1]>0).map(([l,n,col])=>(
              <div key={l} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                  <span style={{fontWeight:600}}>{l}</span>
                  <span><strong>{n}</strong> <span style={{color:G4,fontSize:11}}>({totalGender>0?Math.round(n/totalGender*100):0}%)</span></span>
                </div>
                <Bar pct={totalGender>0?Math.round(n/totalGender*100):0} color={col}/>
              </div>
            ))}
          </Card>
          <Card>
            <ST c="Repeat Clients"/>
            {(()=>{
              const freq={};
              filteredRec.forEach(r=>{const k=(r.customer_name||"").toLowerCase();freq[k]=(freq[k]||0)+1;});
              const sorted=Object.entries(freq).filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).slice(0,10);
              return sorted.length===0
                ?<div style={{color:G4,fontSize:13}}>No repeat clients in this period</div>
                :sorted.map(([name,count],i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                    <span style={{textTransform:"capitalize",fontWeight:600}}>{name}</span>
                    <span style={{background:PLF,color:PL,padding:"2px 9px",borderRadius:99,fontSize:12,fontWeight:700}}>{count}x</span>
                  </div>
                ));
            })()}
          </Card>
          <Card>
            <ST c="Walk-ins by Service Type"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["🏢 In-House",filteredRec.filter(r=>r.service_type!=="outcall").length,"#1565C0"],["🏠 Outcall",filteredRec.filter(r=>r.service_type==="outcall").length,"#7B3F6E"]].map(([l,n,col])=>(
                <div key={l} style={{background:col+"10",borderRadius:10,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:26,fontWeight:700,color:col}}>{n}</div>
                  <div style={{fontSize:12,color:G6,marginTop:4}}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── THERAPISTS ── */}
      {tab==="therapists"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <ST c="Revenue by Therapist"/>
            {byTherapist.filter(t=>t.rev>0).length===0&&<div style={{color:G4,fontSize:13}}>No data</div>}
            {byTherapist.filter(t=>t.rev>0).map((t,i)=>{
              const maxR=byTherapist[0]?.rev||1;
              return(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:i===0?GOLD:i===1?"#aaa":G2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i<2?WH:G6,flexShrink:0}}>{i+1}</div>
                  {t.photo?<img src={t.photo} alt="" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
                    :<div style={{width:36,height:36,borderRadius:"50%",background:PL,display:"flex",alignItems:"center",justifyContent:"center",color:WH,fontWeight:700,flexShrink:0}}>{t.name?.[0]}</div>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700}}>{t.name}</div>
                    <Bar pct={Math.round(t.rev/maxR*100)} color={i===0?GOLD:PL}/>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:PL}}>{fmt(t.rev)}</div>
                    <div style={{fontSize:11,color:G6}}>{t.count} sessions</div>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <ST c="Therapist Session Count"/>
            {byTherapist.filter(t=>t.count>0).map((t,i)=>(
              <div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                <span style={{fontWeight:600}}>{t.name}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:G6}}>{t.count} sessions</span>
                  <span style={{fontWeight:700,color:PL}}>{fmt(t.rev)}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── SERVICES ── */}
      {tab==="services"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <ST c="Popular Services"/>
            {byService.length===0&&<div style={{color:G4,fontSize:13}}>No data</div>}
            {byService.map((sv,i)=>{
              const maxR=byService[0]?.rev||1;
              return(
                <div key={sv.id} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:2}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:i===0?GOLD:G2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i===0?WH:G6,flexShrink:0}}>{i+1}</div>
                      <span style={{fontWeight:700}}>{sv.name}</span>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontWeight:700,color:PL}}>{fmt(sv.rev)}</span>
                      <span style={{fontSize:11,color:G4,marginLeft:6}}>{sv.count} sessions</span>
                    </div>
                  </div>
                  <Bar pct={Math.round(sv.rev/maxR*100)} color={i===0?GOLD:PL}/>
                </div>
              );
            })}
          </Card>
          <Card>
            <ST c="Service Type Revenue"/>
            {(()=>{
              const inRev=filtered.filter(a=>a.service_type!=="outcall").reduce((s,a)=>s+Number(a.paid_amount||0),0);
              const outRev=filtered.filter(a=>a.service_type==="outcall").reduce((s,a)=>s+Number(a.paid_amount||0),0);
              return(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[["🏢 In-House",inRev,"#1565C0"],["🏠 Outcall",outRev,"#7B3F6E"]].map(([l,v,col])=>(
                    <div key={l} style={{background:col+"10",borderRadius:10,padding:"14px",textAlign:"center"}}>
                      <div style={{fontSize:14,color:G6,marginBottom:4}}>{l}</div>
                      <div style={{fontSize:20,fontWeight:700,color:col}}>{fmt(v)}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {tab==="expenses"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            <KPI label="Total Expenses" value={fmt(totExp)} color={ER} icon="📤"/>
            <KPI label="Net Profit"     value={fmt(net)}    color={net>=0?OK:ER} icon="📈"/>
            <KPI label="Expense Count"  value={filteredExp.length} color={G6} icon="🧾"/>
          </div>
          <Card>
            <ST c="Expenses by Category"/>
            {byExpCat.length===0&&<div style={{color:G4,fontSize:13}}>No expenses in this period</div>}
            {byExpCat.map((e,i)=>{
              const pct=totExp>0?Math.round(e.total/totExp*100):0;
              return(
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:2}}>
                    <span style={{fontWeight:600}}>{e.cat}</span>
                    <span><strong style={{color:ER}}>{fmt(e.total)}</strong> <span style={{color:G4,fontSize:11}}>({pct}%)</span></span>
                  </div>
                  <Bar pct={pct} color={ER}/>
                </div>
              );
            })}
          </Card>
          <Card>
            <ST c="Expense Log"/>
            {filteredExp.length===0&&<div style={{color:G4,fontSize:13}}>No expenses</div>}
            {filteredExp.slice().reverse().slice(0,20).map((e,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                <div>
                  <div style={{fontWeight:600}}>{e.description||"Expense"}</div>
                  <div style={{fontSize:11,color:G4}}>{e.category||"General"} · {fmtDate(e.expense_date)}</div>
                </div>
                <span style={{fontWeight:700,color:ER}}>{fmt(e.amount)}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function PaymentsTab({payMethods,setPayMethods,pop}){
  const [name,setName]=useState("");
  const [dbMethods,setDbMethods]=useState([]);
  useEffect(()=>{ api.getPayMethods().then(r=>setDbMethods(r)).catch(()=>{}); },[]);

  const add=async()=>{
    if(!name.trim()) return;
    try{ const u=await api.createPayMethod(name.trim()); setDbMethods(p=>[...p,u]); setPayMethods(p=>[...p,name.trim()]); setName(""); pop("Method added"); }catch(e){pop(e.message,"err");}
  };
  const del=async(pm)=>{
    if(pm.name==="Cash") return pop("Cash cannot be removed","err");
    try{ await api.deletePayMethod(pm.id); setDbMethods(p=>p.filter(x=>x.id!==pm.id)); setPayMethods(p=>p.filter(x=>x!==pm.name)); pop("Removed"); }catch(e){pop(e.message,"err");}
  };

  return(
    <div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:20}}>Payment Methods</h2>
      <Card>
        <ST c="Active Methods"/>
        {(dbMethods.length?dbMethods:payMethods.map(n=>({name:n}))).map((pm,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${G1}`,fontSize:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:OK,display:"inline-block"}}/>
              <span style={{fontWeight:600}}>{pm.name||pm}</span>
            </div>
            {(pm.name||pm)!=="Cash"&&pm.id&&<button onClick={()=>del(pm)} style={{background:"none",border:"none",color:ER,cursor:"pointer",fontSize:13,fontWeight:700}}>Remove</button>}
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <Inp label="" value={name} onChange={e=>setName(e.target.value)} placeholder="Add new method (e.g. Cheque)" style={{marginBottom:0,flex:1}}/>
          <Btn onClick={add} disabled={!name.trim()} style={{flexShrink:0,marginTop:0}}>Add</Btn>
        </div>
      </Card>
    </div>
  );
}

function CommissionTab({therapists, setTherapists, staff, setStaff, user, pop}) {
  const [dateFrom, setDateFrom] = useState(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-01";});
  const [dateTo,   setDateTo]   = useState(()=>new Date().toISOString().split("T")[0]);
  const [report,   setReport]   = useState(null);
  const [loadingR, setLoadingR] = useState(false);
  const [payouts,    setPayouts]    = useState([]);
  const [fines,      setFines]      = useState([]);
  const [payoutModal, setPayoutModal] = useState(null);
  const [fineModal,   setFineModal]   = useState(null); // {id, name, type}
  const [payoutAmt,   setPayoutAmt]   = useState("");
  const [payoutNote,  setPayoutNote]  = useState("");
  const [fineAmt,     setFineAmt]     = useState("");
  const [fineNote,    setFineNote]    = useState("");
  const [savingPct, setSavingPct] = useState({});

  // Local editable commission % state — initialized from props
  const [thPcts, setThPcts] = useState(()=>{
    const m={}; therapists.forEach(t=>{m[t.id]=String(t.commission_pct||0);}); return m;
  });
  const [stPcts, setStPcts] = useState(()=>{
    const m={}; staff.forEach(s=>{m[s.id]=String(s.commission_pct||0);}); return m;
  });

  // Keep pct state in sync when parent data loads
  useEffect(()=>{
    const m={}; therapists.forEach(t=>{if(thPcts[t.id]===undefined) m[t.id]=String(t.commission_pct||0);});
    if(Object.keys(m).length) setThPcts(p=>({...m,...p}));
  },[therapists]);
  useEffect(()=>{
    const m={}; staff.forEach(s=>{if(stPcts[s.id]===undefined) m[s.id]=String(s.commission_pct||0);});
    if(Object.keys(m).length) setStPcts(p=>({...m,...p}));
  },[staff]);

  const loadReport = async()=>{
    setLoadingR(true);
    try{ const r=await api.getCommission(dateFrom,dateTo); setReport(r); }
    catch(e){ pop(e.message||"Failed to load report","err"); }
    setLoadingR(false);
  };

  const loadPayouts = async()=>{
    try{
      const [p, f] = await Promise.all([api.getPayouts(), api.getFines()]);
      setPayouts(Array.isArray(p)?p:[]);
      setFines(Array.isArray(f)?f:[]);
    } catch(e){ console.warn("loadPayouts:", e.message); }
  };

  const recordFine = async()=>{
    if(!fineModal||!fineAmt) return;
    try{
      const f = await api.createFine({
        recipient_id:   fineModal.id,
        recipient_type: fineModal.type,
        recipient_name: fineModal.name,
        amount:         Number(fineAmt),
        notes:          fineNote||null,
        created_by:     user?.id||null,
      });
      setFines(prev=>[f,...prev]);
      setFineModal(null); setFineAmt(""); setFineNote("");
      pop(`Fine recorded for ${fineModal.name} ✓`);
    }catch(e){ pop(e.message,"err"); }
  };

  const deleteFine = async(id,name)=>{
    if(!window.confirm(`Remove fine for ${name}?`)) return;
    try{ await api.deleteFine(id); setFines(f=>f.filter(x=>x.id!==id)); pop("Fine removed"); }
    catch(e){ pop(e.message,"err"); }
  };

  useEffect(()=>{ loadReport(); loadPayouts(); },[]);

  const saveThPct = async(t)=>{
    const pct = Number(thPcts[t.id]||0);
    setSavingPct(s=>({...s,[t.id]:true}));
    try{
      const u=await api.updateTherapist(t.id,{commission_pct:pct});
      setTherapists(p=>p.map(x=>x.id===t.id?{...x,commission_pct:pct}:x));
      pop(`${t.name}: ${pct}% saved`);
    }catch(e){ pop(e.message,"err"); }
    setSavingPct(s=>({...s,[t.id]:false}));
  };

  const saveStPct = async(s)=>{
    const pct = Number(stPcts[s.id]||0);
    setSavingPct(sv=>({...sv,[s.id]:true}));
    try{
      const u=await api.updateStaff(s.id,{commission_pct:pct});
      setStaff(p=>p.map(x=>x.id===s.id?{...x,commission_pct:pct}:x));
      pop(`${s.name}: ${pct}% saved`);
    }catch(e){ pop(e.message,"err"); }
    setSavingPct(sv=>({...sv,[s.id]:false}));
  };

  const recordPayout = async()=>{
    if(!payoutModal||!payoutAmt) return;
    try{
      const p=await api.createPayout({
        recipient_id:   payoutModal.id,
        recipient_type: payoutModal.type,
        recipient_name: payoutModal.name,
        amount:         Number(payoutAmt),
        period_from:    dateFrom,
        period_to:      dateTo,
        notes:          payoutNote||null,
        paid_by:        user?.id||null,
      });
      setPayouts(prev=>[p,...prev]);
      setPayoutModal(null); setPayoutAmt(""); setPayoutNote("");
      pop(`Payout recorded for ${payoutModal.name} ✓`);
    }catch(e){ pop(e.message,"err"); }
  };

  const deletePayout = async(id,name)=>{
    if(!window.confirm(`Delete payout for ${name}?`)) return;
    try{ await api.deletePayout(id); setPayouts(p=>p.filter(x=>x.id!==id)); pop("Deleted"); }
    catch(e){ pop(e.message,"err"); }
  };

  // Calculate already paid per recipient (all time, not period-filtered — shows true balance)
  const alreadyPaid = (recipientId)=>
    payouts.filter(p=>p.recipient_id===recipientId)
           .reduce((s,p)=>s+Number(p.amount),0);

  // Calculate fines per recipient in current period
  const totalFines = (recipientId)=>
    fines.filter(f=>f.recipient_id===recipientId)
         .reduce((s,f)=>s+Number(f.amount),0);

  const presets=[
    ["This Month",()=>{const d=new Date();setDateFrom(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-01");setDateTo(new Date().toISOString().split("T")[0]);}],
    ["Last Month",()=>{const d=new Date();d.setMonth(d.getMonth()-1);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0");setDateFrom(`${y}-${m}-01`);setDateTo(new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().split("T")[0]);}],
    ["This Year", ()=>{const y=new Date().getFullYear();setDateFrom(`${y}-01-01`);setDateTo(`${y}-12-31`);}],
  ];

  // Pct input widget
  const PctInput = ({id, val, onChange, onSave, saving, color=PL})=>(
    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        <input type="number" min="0" max="100" step="0.5" value={val}
          onChange={e=>onChange(e.target.value)}
          style={{width:66,padding:"7px 22px 7px 9px",border:`1px solid ${G2}`,borderRadius:7,fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit",textAlign:"right"}}/>
        <span style={{position:"absolute",right:6,fontSize:12,color:G4,pointerEvents:"none"}}>%</span>
      </div>
      <button onClick={onSave} disabled={saving}
        style={{padding:"7px 12px",borderRadius:7,border:`1px solid ${color}`,background:saving?G1:`${color}15`,
          color:saving?G4:color,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
        {saving?"…":"Save"}
      </button>
    </div>
  );

  return(
    <div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:"0 0 20px"}}>Commission & Payouts</h2>

      {/* ── SET RATES ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        <Card>
          <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:3}}>💆 Therapist Rates</div>
          <div style={{fontSize:12,color:G6,marginBottom:14}}>% of revenue each therapist personally earns</div>
          {therapists.filter(t=>t.active).length===0&&<div style={{color:G4,fontSize:13}}>No active therapists</div>}
          {therapists.filter(t=>t.active).map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${G1}`}}>
              {t.photo
                ?<img src={t.photo} alt={t.name} style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
                :<div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${PLD},${PL})`,display:"flex",alignItems:"center",justifyContent:"center",color:WH,fontWeight:700,fontSize:12,flexShrink:0}}>{t.name[0]}</div>
              }
              <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
                <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
              </div>
              <PctInput id={t.id} val={thPcts[t.id]??String(t.commission_pct||0)}
                onChange={v=>setThPcts(p=>({...p,[t.id]:v}))}
                onSave={()=>saveThPct(t)} saving={!!savingPct[t.id]} color={PL}/>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:3}}>🚪 Reception Staff Rates</div>
          <div style={{fontSize:12,color:G6,marginBottom:14}}>% of total sales for the period</div>
          {staff.filter(s=>s.active).length===0&&<div style={{color:G4,fontSize:13}}>No staff</div>}
          {staff.filter(s=>s.active).map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${G1}`}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${IN}BB,${IN})`,display:"flex",alignItems:"center",justifyContent:"center",color:WH,fontWeight:700,fontSize:12,flexShrink:0}}>{s.name[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{fontSize:11,color:G6}}>{s.role}</div>
              </div>
              <PctInput id={s.id} val={stPcts[s.id]??String(s.commission_pct||0)}
                onChange={v=>setStPcts(p=>({...p,[s.id]:v}))}
                onSave={()=>saveStPct(s)} saving={!!savingPct[s.id]} color={IN}/>
            </div>
          ))}
        </Card>
      </div>

      {/* ── COMMISSION REPORT + PAYOUT ── */}
      <Card style={{marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:14}}>📊 Commission Report & Payout</div>
        {/* Date range */}
        <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          {presets.map(([l,fn])=>(
            <button key={l} onClick={()=>{fn();setTimeout(loadReport,50);}}
              style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,border:`1px solid ${G2}`,background:WH,color:G6,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{padding:"6px 9px",border:`1px solid ${G2}`,borderRadius:7,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <span style={{color:G4}}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{padding:"6px 9px",border:`1px solid ${G2}`,borderRadius:7,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <button onClick={()=>{loadReport();loadPayouts();}}
            style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${PL}`,background:PLF,color:PL,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            Generate
          </button>
        </div>

        {loadingR&&<div style={{textAlign:"center",padding:30,color:G4}}>Calculating…</div>}

        {report&&!loadingR&&(()=>{
          const totalComm = (report.therapist_commissions||[]).reduce((s,t)=>s+t.commission_amount,0)
                          + (report.staff_commissions||[]).reduce((s,t)=>s+t.commission_amount,0);
          return(
            <div>
              {/* Summary */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
                {[["Total Sales",fmt(report.total_sales),PL,"💰"],
                  ["Total Commission",fmt(totalComm),ER,"💵"],
                  ["Net After Commission",fmt(report.total_sales-totalComm),OK,"📈"]
                ].map(([l,v,col,ic])=>(
                  <div key={l} style={{background:G1,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:11,color:G6,fontWeight:700,marginBottom:4}}>{ic} {l.toUpperCase()}</div>
                    <div style={{fontSize:20,fontWeight:700,color:col,fontFamily:"'Playfair Display',serif"}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Therapist rows */}
              {(report.therapist_commissions||[]).length>0&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:G6,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>💆 Therapists</div>
                  {report.therapist_commissions.map(t=>{
                    const earned = t.commission_amount;
                    const fined  = totalFines(t.therapist_id);
                    const net    = Math.max(0, earned - fined);
                    const paid   = alreadyPaid(t.therapist_id);
                    const unpaid = Math.max(0, net - paid);
                    return(
                      <div key={t.therapist_id} style={{background:WH,borderRadius:10,border:`1px solid ${G2}`,marginBottom:8,overflow:"hidden"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",flexWrap:"wrap"}}>
                          <div style={{flex:1,minWidth:160}}>
                            <div style={{fontWeight:700,fontSize:14}}>{t.name}</div>
                            <div style={{fontSize:12,color:G6,marginTop:2}}>Revenue: {fmt(t.revenue)} · Rate: {t.commission_pct||0}%</div>
                          </div>
                          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
                            <div style={{textAlign:"center"}}>
                              <div style={{fontSize:10,color:G6,marginBottom:2}}>EARNED</div>
                              <div style={{fontWeight:700,fontSize:15,color:PL}}>{fmt(earned)}</div>
                            </div>
                            {fined>0&&<div style={{textAlign:"center"}}>
                              <div style={{fontSize:10,color:ER,marginBottom:2}}>FINES</div>
                              <div style={{fontWeight:700,fontSize:15,color:ER}}>−{fmt(fined)}</div>
                            </div>}
                            <div style={{textAlign:"center",background:fined>0?G1:"none",borderRadius:6,padding:fined>0?"4px 8px":0}}>
                              <div style={{fontSize:10,color:G6,marginBottom:2}}>NET</div>
                              <div style={{fontWeight:700,fontSize:15,color:BK}}>{fmt(net)}</div>
                            </div>
                            <div style={{textAlign:"center"}}>
                              <div style={{fontSize:10,color:G6,marginBottom:2}}>PAID OUT</div>
                              <div style={{fontWeight:700,fontSize:15,color:OK}}>{fmt(paid)}</div>
                            </div>
                            <div style={{textAlign:"center"}}>
                              <div style={{fontSize:10,color:unpaid>0?ER:G4,marginBottom:2}}>REMAINING</div>
                              <div style={{fontWeight:700,fontSize:15,color:unpaid>0?ER:G4}}>{fmt(unpaid)}</div>
                            </div>
                            <div style={{display:"flex",gap:6}}>
                              <button onClick={()=>{setFineModal({id:t.therapist_id,name:t.name,type:"therapist"});setFineAmt("");setFineNote("");}}
                                style={{padding:"7px 12px",borderRadius:7,border:`1px solid ${ER}`,background:ERB,color:ER,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                                ⚠️ Fine
                              </button>
                              <button onClick={()=>{setPayoutModal({id:t.therapist_id,name:t.name,type:"therapist",earned,fined,net,paid});setPayoutAmt(String(unpaid>0?unpaid:""));setPayoutNote("");}}
                                disabled={unpaid<=0}
                                style={{padding:"7px 12px",borderRadius:7,border:`1px solid ${unpaid>0?OK:G2}`,background:unpaid>0?OKB:G1,color:unpaid>0?OK:G4,fontSize:12,fontWeight:700,cursor:unpaid>0?"pointer":"not-allowed",fontFamily:"inherit"}}>
                                💵 Pay
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Fines list for this therapist */}
                        {fines.filter(f=>f.recipient_id===t.therapist_id).length>0&&(
                          <div style={{background:ERB,padding:"8px 14px",borderTop:`1px solid ${ER}20`}}>
                            <div style={{fontSize:11,fontWeight:700,color:ER,marginBottom:5}}>Active Fines</div>
                            {fines.filter(f=>f.recipient_id===t.therapist_id).map(f=>(
                              <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,marginBottom:3}}>
                                <span style={{color:G6}}>{f.notes||"Fine"} · {fmtDate(f.created_at)}</span>
                                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                  <span style={{fontWeight:700,color:ER}}>−{fmt(f.amount)}</span>
                                  <button onClick={()=>deleteFine(f.id,t.name)} style={{background:"none",border:"none",color:ER,cursor:"pointer",fontSize:14,padding:0}}>×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Staff rows */}
              {(report.staff_commissions||[]).length>0&&(
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:G6,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>🚪 Reception Staff</div>
                  {report.staff_commissions.map(s=>{
                    const paid   = alreadyPaid(s.id);
                    const unpaid = Math.max(0, s.commission_amount - paid);
                    return(
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:WH,borderRadius:10,border:`1px solid ${G2}`,marginBottom:8,flexWrap:"wrap"}}>
                        <div style={{flex:1,minWidth:160}}>
                          <div style={{fontWeight:700,fontSize:14}}>{s.name} <span style={{fontSize:12,color:G6,fontWeight:400}}>· {s.role}</span></div>
                          <div style={{fontSize:12,color:G6,marginTop:2}}>Total Sales: {fmt(s.total_sales)} · Rate: {s.commission_pct||0}%</div>
                        </div>
                        <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:10,color:G6,marginBottom:2}}>EARNED</div>
                            <div style={{fontWeight:700,fontSize:16,color:IN}}>{fmt(s.commission_amount)}</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:10,color:G6,marginBottom:2}}>PAID OUT</div>
                            <div style={{fontWeight:700,fontSize:16,color:OK}}>{fmt(paid)}</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:10,color:G6,marginBottom:2}}>REMAINING</div>
                            <div style={{fontWeight:700,fontSize:16,color:unpaid>0?ER:OK}}>{fmt(unpaid)}</div>
                          </div>
                          <button onClick={()=>{setPayoutModal({id:s.id,name:s.name,type:"staff",earned:s.commission_amount,paid});setPayoutAmt(String(unpaid>0?unpaid:""));setPayoutNote("");}}
                            style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${OK}`,background:OKB,color:OK,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            💵 Pay Out
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(report.therapist_commissions||[]).length===0&&(report.staff_commissions||[]).length===0&&(
                <div style={{textAlign:"center",padding:30,color:G4,fontSize:14}}>No commission data for this period. Set rates above and make sure appointments exist.</div>
              )}
            </div>
          );
        })()}
      </Card>

      {/* ── PAYOUT HISTORY ── */}
      <Card>
        <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:14}}>📋 Payout History</div>
        {payouts.length===0&&<div style={{color:G4,fontSize:13,textAlign:"center",padding:16}}>No payouts recorded yet</div>}
        {payouts.map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${G1}`,flexWrap:"wrap"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:p.recipient_type==="therapist"?PLF:INB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
              {p.recipient_type==="therapist"?"💆":"🚪"}
            </div>
            <div style={{flex:1,minWidth:120}}>
              <div style={{fontWeight:700,fontSize:13}}>{p.recipient_name}</div>
              <div style={{fontSize:11,color:G6}}>{fmtDate(p.period_from)} → {fmtDate(p.period_to)}</div>
              {p.notes&&<div style={{fontSize:11,color:G4}}>{p.notes}</div>}
            </div>
            <div style={{fontWeight:700,fontSize:16,color:OK}}>{fmt(p.amount)}</div>
            <div style={{fontSize:11,color:G4}}>{fmtDate(p.created_at)}</div>
            <button onClick={()=>deletePayout(p.id,p.recipient_name)}
              style={{background:"none",border:"none",color:ER,cursor:"pointer",fontSize:16,padding:"2px 6px"}}>×</button>
          </div>
        ))}
      </Card>

      {/* Payout modal */}
      {fineModal&&(
        <Modal title={`Record Fine — ${fineModal.name}`} onClose={()=>setFineModal(null)}>
          <div style={{background:ERB,borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13,color:ER}}>
            ⚠️ This fine will be deducted from {fineModal.name}'s commission earnings.
          </div>
          <Inp label="Fine Amount (TZS) *" type="number" value={fineAmt} onChange={e=>setFineAmt(e.target.value)} placeholder="e.g. 20000"/>
          <Inp label="Reason *" value={fineNote} onChange={e=>setFineNote(e.target.value)} placeholder="e.g. Late arrival, No show, Damaged equipment…"/>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setFineModal(null)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={recordFine} disabled={!fineAmt||!fineNote} style={{flex:1,justifyContent:"center",background:ER}}>Record Fine</Btn>
          </div>
        </Modal>
      )}

      {payoutModal&&(
        <Modal title={`Pay Out — ${payoutModal.name}`} onClose={()=>setPayoutModal(null)}>
          <div style={{background:G1,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            {[["Commission Earned", fmt(payoutModal.earned)],
              payoutModal.fined>0&&["Fines / Deductions", `−${fmt(payoutModal.fined)}`],
              payoutModal.fined>0&&["Net Payable",        fmt(payoutModal.net)],
              ["Already Paid Out",  fmt(payoutModal.paid)],
              ["Remaining Balance", fmt(Math.max(0,(payoutModal.net||payoutModal.earned)-payoutModal.paid))],
            ].filter(Boolean).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,borderBottom:`1px solid ${G2}`}}>
                <span style={{color:G6}}>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
          <Inp label="Amount to Pay (TZS)" type="number" value={payoutAmt} onChange={e=>setPayoutAmt(e.target.value)} placeholder="Enter amount"/>
          <Inp label="Notes (optional)" value={payoutNote} onChange={e=>setPayoutNote(e.target.value)} placeholder="e.g. Cash payment, Bank transfer…"/>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setPayoutModal(null)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn v="ok" onClick={recordPayout} disabled={!payoutAmt} style={{flex:1,justifyContent:"center"}}>
              Record Payout ✓
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PackagesTab({packages,setPackages,services,rooms,pop}){
  const [modal,setModal] = useState(false);
  const [form,setForm]   = useState({id:null,name:"",description:"",room_id:"",services:[],masseuses:1,amenities:"",price:"",duration_min:60});

  const open=(pkg)=>{
    if(pkg) setForm({...pkg,amenities:(pkg.amenities||[]).join(", "),services:pkg.services||[]});
    else    setForm({id:null,name:"",description:"",room_id:"",services:[],masseuses:1,amenities:"",price:"",duration_min:60});
    setModal(true);
  };

  const toggleSvc=(sv)=>{
    setForm(f=>{
      const ex=f.services.find(s=>s.id===sv.id);
      if(ex) return{...f,services:f.services.filter(s=>s.id!==sv.id)};
      return{...f,services:[...f.services,{id:sv.id,name:sv.name,duration_min:sv.duration_min}]};
    });
  };

  const save=async()=>{
    if(!form.name||!form.price) return pop("Name and price required","err");
    const amen=typeof form.amenities==="string"?form.amenities.split(",").map(s=>s.trim()).filter(Boolean):(form.amenities||[]);
    const payload={name:form.name,description:form.description||"",room_id:form.room_id||null,
      services:form.services,masseuses:Number(form.masseuses)||1,amenities:amen,
      price:Number(form.price),duration_min:Number(form.duration_min)||60};
    try{
      if(form.id){const u=await api.updatePackage(form.id,payload);setPackages(p=>p.map(x=>x.id===form.id?u:x));pop("Package updated");}
      else{const u=await api.createPackage(payload);setPackages(p=>[...p,u]);pop("Package created");}
      setModal(false);
    }catch(e){pop(e.message,"err");}
  };

  const del=async(pkg)=>{
    if(!window.confirm(`Delete "${pkg.name}"?`)) return;
    try{await api.deletePackage(pkg.id);setPackages(p=>p.filter(x=>x.id!==pkg.id));pop("Deleted");}catch(e){pop(e.message,"err");}
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>🎁 Packages</h2>
        <Btn onClick={()=>open(null)}>+ Add Package</Btn>
      </div>
      {packages.length===0&&<div style={{textAlign:"center",padding:40,color:G4}}>No packages yet. Create your first package deal.</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {packages.map(pkg=>(
          <Card key={pkg.id}>
            <div style={{fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif",color:BK,marginBottom:4}}>{pkg.name}</div>
            {pkg.description&&<div style={{fontSize:12,color:G6,marginBottom:8,lineHeight:1.5}}>{pkg.description}</div>}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8,fontSize:12}}>
              <span style={{background:PLF,color:PL,padding:"3px 9px",borderRadius:99,fontWeight:700}}>{fmt(pkg.price)}</span>
              <span style={{background:G1,color:G6,padding:"3px 9px",borderRadius:99}}>⏱ {pkg.duration_min} min</span>
              <span style={{background:G1,color:G6,padding:"3px 9px",borderRadius:99}}>💆 {pkg.masseuses} masseuse{pkg.masseuses>1?"s":""}</span>
              {pkg.room_name&&<span style={{background:G1,color:G6,padding:"3px 9px",borderRadius:99}}>🛏 {pkg.room_name}</span>}
            </div>
            {(pkg.services||[]).length>0&&(
              <div style={{fontSize:12,color:G6,marginBottom:8}}>{pkg.services.map(s=>s.name).join(" + ")}</div>
            )}
            {(pkg.amenities||[]).length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                {pkg.amenities.map((a,i)=><span key={i} style={{background:G1,fontSize:10,padding:"2px 7px",borderRadius:99,color:G6}}>{a}</span>)}
              </div>
            )}
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>open(pkg)} style={{flex:1,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${G2}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:G6,fontWeight:700}}>✏️ Edit</button>
              <button onClick={()=>del(pkg)} style={{flex:1,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${ER}`,background:"none",cursor:"pointer",fontFamily:"inherit",color:ER,fontWeight:700}}>🗑 Delete</button>
            </div>
          </Card>
        ))}
      </div>

      {modal&&(
        <Modal title={form.id?"Edit Package":"New Package"} onClose={()=>setModal(false)}>
          <Inp label="Package Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Couples Bliss, VIP Retreat…"/>
          <Txa label="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="What's included, mood, experience…"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Inp label="Total Price (TZS) *" type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="150000"/>
            <Inp label="Duration (minutes)" type="number" value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} placeholder="90"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Number of Masseuses</label>
              <div style={{display:"flex",gap:6}}>
                {[1,2,3,4].map(n=>(
                  <button key={n} onClick={()=>setForm(f=>({...f,masseuses:n}))}
                    style={{flex:1,padding:"8px 4px",borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      border:`2px solid ${form.masseuses===n?PL:G2}`,background:form.masseuses===n?PLF:WH,color:form.masseuses===n?PL:G6}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Sel label="Room" value={form.room_id||""} onChange={e=>setForm(f=>({...f,room_id:e.target.value}))}>
              <option value="">No specific room</option>
              {rooms.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </Sel>
          </div>
          <Inp label="Included Amenities (comma separated)" value={form.amenities} onChange={e=>setForm(f=>({...f,amenities:e.target.value}))} placeholder="Champagne, Rose petals, Hot towels…"/>
          {/* Services selector */}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>
              Services Included ({form.services.length} selected)
            </label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:180,overflowY:"auto",padding:4}}>
              {services.filter(s=>s.active).map(sv=>{
                const sel=form.services.find(s=>s.id===sv.id);
                return(
                  <button key={sv.id} onClick={()=>toggleSvc(sv)}
                    style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      border:`2px solid ${sel?PL:G2}`,background:sel?PLF:WH,color:sel?PL:G6}}>
                    {sel?"✓ ":""}{sv.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setModal(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name||!form.price} style={{flex:1,justifyContent:"center"}}>{form.id?"Save":"Create Package"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}


function StaffTab({staff,setStaff,pop,currentUser}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({id:null,name:"",email:"",phone:"",role:"Receptionist",pin:""});
  const ROLES=["Admin","Manager","Receptionist","Therapist"];
  const roleColor={Admin:PL,Manager:IN,Receptionist:OK,Therapist:GOLD};

  const open=(s)=>{ if(s) setForm({...s,pin:""}); else setForm({id:null,name:"",email:"",phone:"",role:"Receptionist",pin:""}); setModal(true); };
  const save=async()=>{
    if(!form.name||!form.email) return;
    if(!form.id&&!form.pin) return pop("PIN required for new accounts","err");
    const payload={name:form.name,email:form.email,phone:form.phone,role:form.role};
    if(form.pin) payload.pin=form.pin;
    try{
      if(form.id){ const u=await api.updateStaff(form.id,payload); setStaff(p=>p.map(s=>s.id===form.id?{...s,...u}:s)); pop("Updated"); }
      else{ const u=await api.createStaff({...payload,pin:form.pin}); setStaff(p=>[...p,u]); pop("Account created for "+form.name); }
      setModal(false);
    }catch(e){pop(e.message,"err");}
  };
  const del=async(s)=>{
    if(!window.confirm(`Delete ${s.name}?`)) return;
    try{ await api.deleteStaff(s.id); setStaff(p=>p.filter(x=>x.id!==s.id)); pop("Deleted"); }catch(e){pop(e.message,"err");}
  };
  const toggle=async(s)=>{
    try{ const u=await api.updateStaff(s.id,{active:!s.active}); setStaff(p=>p.map(x=>x.id===s.id?{...x,...u}:x)); pop(u.active?"Activated":"Deactivated"); }catch(e){pop(e.message,"err");}
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,margin:0}}>Staff Accounts</h2>
        <Btn onClick={()=>open(null)}>+ Add Staff</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
        {staff.map(s=>{
          const isSelf=s.id===currentUser?.id;
          const rc=roleColor[s.role]||G6;
          return(
            <Card key={s.id} style={{opacity:s.active?1:.65,borderTop:`3px solid ${rc}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{width:42,height:42,background:`linear-gradient(135deg,${rc}BB,${rc})`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:WH,fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",flexShrink:0}}>
                  {s.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{s.name} {isSelf&&<span style={{fontSize:10,color:G4}}>(you)</span>}</div>
                  <div style={{display:"flex",gap:5,marginTop:3}}>
                    <span style={{background:`${rc}18`,color:rc,padding:"2px 7px",borderRadius:99,fontSize:10,fontWeight:700}}>{s.role}</span>
                    <span style={{background:s.active?OKB:G1,color:s.active?OK:G4,padding:"2px 7px",borderRadius:99,fontSize:10,fontWeight:700}}>{s.active?"Active":"Inactive"}</span>
                  </div>
                </div>
              </div>
              <div style={{fontSize:12,color:G6,marginBottom:12}}>📧 {s.email}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>open(s)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${G2}`,background:"none",cursor:"pointer",color:G6,fontFamily:"inherit",fontWeight:700}}>✏️ Edit</button>
                <button onClick={()=>toggle(s)} style={{flex:2,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${s.active?WA:OK}`,background:"none",cursor:"pointer",color:s.active?WA:OK,fontFamily:"inherit",fontWeight:700}}>{s.active?"Deactivate":"Activate"}</button>
                {!isSelf&&<button onClick={()=>del(s)} style={{flex:1,padding:"6px",fontSize:12,borderRadius:7,border:`1px solid ${ER}`,background:"none",cursor:"pointer",color:ER,fontFamily:"inherit",fontWeight:700}}>🗑</button>}
              </div>
            </Card>
          );
        })}
      </div>
      {modal&&(
        <Modal title={form.id?"Edit Staff":"Add Staff"} onClose={()=>setModal(false)}>
          <Inp label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <Inp label="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            <Inp label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Role</label>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {ROLES.map(r=>{const rc=roleColor[r]||G6;return<button key={r} onClick={()=>setForm(f=>({...f,role:r}))} style={{padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${form.role===r?rc:G2}`,background:form.role===r?`${rc}15`:WH,color:form.role===r?rc:G6}}>{r}</button>;})}
            </div>
          </div>
          <Inp label={form.id?"New PIN (blank = keep current)":"Login PIN (4-6 digits)"} type="password" value={form.pin} onChange={e=>setForm(f=>({...f,pin:e.target.value}))} placeholder={form.id?"Leave blank to keep…":"4-6 digits"} maxLength={6}/>
          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" onClick={()=>setModal(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name||!form.email||(!form.id&&!form.pin)} style={{flex:1,justifyContent:"center"}}>{form.id?"Save":"Create Account"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── PAYMENT COMPLETE PAGE ─────────────────────────────────────
function PaymentCompletePage({ customer, navTo, pop }) {
  const [status, setStatus] = useState("checking"); // checking | completed | failed | pending
  const [apptId, setApptId] = useState(null);

  useEffect(()=>{
    const params   = new URLSearchParams(window.location.search);
    const aid      = params.get("appt");
    const trackId  = params.get("OrderTrackingId") || params.get("order_tracking_id");
    setApptId(aid);

    if(!trackId || !aid) { setStatus("pending"); return; }

    fetch(`/api/pesapal?action=status&order_tracking_id=${trackId}&appointment_id=${aid}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.status==="Completed")  setStatus("completed");
        else if(d.status==="Failed" || d.status==="Invalid") setStatus("failed");
        else setStatus("pending");
      })
      .catch(()=>setStatus("pending"));
  },[]);

  const CONFIG = {
    checking:  { icon:"⏳", color:WA, bg:WAB, title:"Checking payment…",       msg:"Please wait while we verify your payment." },
    completed: { icon:"✅", color:OK, bg:OKB, title:"Payment Successful!",      msg:"Your booking is confirmed. We'll see you soon!" },
    failed:    { icon:"❌", color:ER, bg:ERB, title:"Payment Failed",           msg:"Your payment was not completed. Please try again or choose a different method." },
    pending:   { icon:"⏳", color:WA, bg:WAB, title:"Booking Received",         msg:"Your appointment is booked. Payment can be completed at the venue." },
  };
  const cfg = CONFIG[status] || CONFIG.pending;

  return(
    <div style={{minHeight:"100vh",background:G1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:WH,borderRadius:16,padding:"40px 32px",maxWidth:460,width:"100%",textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,.1)"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 20px"}}>
          {cfg.icon}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:cfg.color,marginBottom:10}}>{cfg.title}</h2>
        <p style={{color:G6,fontSize:15,lineHeight:1.7,marginBottom:24}}>{cfg.msg}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          {customer&&(
            <button onClick={()=>{ window.history.pushState({},"","/"); navTo("customer"); }}
              style={{padding:"11px 22px",borderRadius:9,border:"none",background:PL,color:WH,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              View My Bookings
            </button>
          )}
          <button onClick={()=>{ window.history.pushState({},"","/"); navTo("land"); }}
            style={{padding:"11px 22px",borderRadius:9,border:`1px solid ${G2}`,background:WH,color:G6,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            Back to Home
          </button>
        </div>
        {status==="failed"&&(
          <button onClick={()=>{ window.history.pushState({},"","/"); navTo("book"); }}
            style={{marginTop:12,padding:"11px 22px",borderRadius:9,border:`1px solid ${PL}`,background:PLF,color:PL,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
            Try Booking Again
          </button>
        )}
      </div>
    </div>
  );
}


// ── THERAPIST GRID (marketplace) ──────────────────────────────────────────────

function NavBar({navTo,customer,user,therapistUser,therapistLogout,custLogout,setCustModal,setModal}){
const isMobile = typeof window!=="undefined" && window.innerWidth<640;
return (
  <nav style={{background:BK,height:62,display:"flex",alignItems:"center",padding:"0 18px",justifyContent:"space-between",flexShrink:0,position:"fixed",top:0,left:0,right:0,zIndex:200,boxShadow:"0 2px 12px rgba(0,0,0,.25)"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navTo("land")}>
      <div style={{width:36,height:36,background:PL,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{color:WH,fontWeight:900,fontSize:9,fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.1,letterSpacing:".02em"}}>MTZ</span>
      </div>
      {!isMobile&&<div>
        <div style={{color:WH,fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>MASSAGE TZ</div>
        <div style={{color:G4,fontSize:10,letterSpacing:".12em",textTransform:"uppercase"}}>Massage & Outcall</div>
      </div>}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {!isMobile&&!customer&&!user&&<button onClick={()=>navTo("book",1)} style={{background:"transparent",color:WH,border:"1px solid rgba(255,255,255,.25)",borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Book Now</button>}
      {therapistUser&&!user&&(
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>navTo("therapist")} style={{background:"transparent",color:WH,border:`1px solid ${PL}`,borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:22,height:22,background:PL,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>💆</span>
            {!isMobile&&therapistUser.name}
          </button>
          <button onClick={therapistLogout} style={{background:"transparent",color:G4,border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
        </div>
      )}
      {customer&&!user&&!therapistUser&&(
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>navTo("customer")} style={{background:"transparent",color:WH,border:"1px solid rgba(255,255,255,.2)",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:22,height:22,background:PL,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{customer.name?.[0]?.toUpperCase()}</span>
            {!isMobile&&customer.name}
          </button>
          <button onClick={custLogout} style={{background:"transparent",color:G4,border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
        </div>
      )}
      {!customer&&!user&&<button onClick={()=>setCustModal("login")} style={{background:PL,color:WH,border:"none",borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{isMobile?"Login":"My Account"}</button>}
      
      
    </div>
  </nav>
);
}

function Landing({navTo,customer,user,therapistUser,therapistLogout,custLogout,setCustModal,setModal,therapists,setBD,initBD,resetBdText}){
  return(
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingTop:62}}>
      <NavBar navTo={navTo} customer={customer} user={user} therapistUser={therapistUser}
        therapistLogout={therapistLogout} custLogout={custLogout}
        setCustModal={setCustModal} setModal={setModal}/>
      <div style={{background:`linear-gradient(150deg,${BK} 0%,${PLD} 60%,${PL} 100%)`,padding:"36px 20px 28px",textAlign:"center"}}>
        <div style={{fontSize:11,color:GOLD,letterSpacing:".25em",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>✦ Professional Massage & Spa ✦</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,7vw,48px)",color:WH,margin:"0 0 10px",lineHeight:1.15}}>MASSAGE TZ</h1>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:22}}>
          {[["🏢","In-House","Visit our studio"],["🏨","Outcall","We come to you"]].map(([ic,t,s])=>(
            <div key={t} onClick={()=>navTo("book",1)}
              style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.1)",borderRadius:10,padding:"10px 16px",cursor:"pointer",border:"1px solid rgba(255,255,255,.2)",transition:"background .2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.18)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.1)"}>
              <span style={{fontSize:22}}>{ic}</span>
              <div style={{textAlign:"left"}}>
                <div style={{color:WH,fontWeight:700,fontSize:14}}>{t}</div>
                <div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{s}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={()=>navTo("book",1)} style={{background:PL,color:WH,border:`2px solid ${GOLD}`,borderRadius:10,padding:"12px 32px",fontSize:15,cursor:"pointer",fontWeight:700,fontFamily:"'Playfair Display',serif"}}>
          Book Appointment →
        </button>
      </div>
      {therapists.filter(t=>t.active).length>0&&(
        <div style={{padding:"32px 16px 40px",maxWidth:1000,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:BK,margin:"0 0 4px"}}>Our Therapists</h2>
              <p style={{color:G6,fontSize:13,margin:0}}>Tap a card to view profile & book</p>
            </div>
            <button onClick={()=>navTo("book",1)} style={{background:"none",border:`1px solid ${PL}`,color:PL,borderRadius:8,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Book Now →</button>
          </div>
          <TherapistGrid therapists={therapists} onBook={(thId)=>{ if(thId) setBD(d=>({...d,therapistId:thId})); navTo("book",1); }}/>
        </div>
      )}
      <div style={{background:BK,padding:"32px 20px",textAlign:"center"}}>
        <button onClick={()=>navTo("book",1)} style={{background:PL,color:WH,border:`2px solid ${GOLD}`,borderRadius:10,padding:"12px 28px",fontSize:15,cursor:"pointer",fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Book a Session →</button>
        <div style={{marginTop:14}}>
          <button onClick={()=>setModal("login")} style={{background:"none",border:"none",color:G4,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Staff Login</button>
        </div>
      </div>
    </div>
  );
}

function CustomerPortal({navTo,customer,setCustomer,user,therapistUser,therapistLogout,custLogout,setCustModal,setModal,custTab,setCustTab,custAppts,custLoading,loadCustAppts,therapists,setBD,initBD,resetBdText,pop}){
  return(
    <div style={{minHeight:"100vh",background:G1,paddingTop:62}}>
      <NavBar navTo={navTo} customer={customer} user={user} therapistUser={therapistUser} therapistLogout={therapistLogout} custLogout={custLogout} setCustModal={setCustModal} setModal={setModal}/>
      <div style={{background:WH,borderBottom:`1px solid ${G2}`,display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",position:"sticky",top:62,zIndex:100}}>
        {[["appts","My Appointments","📋"],["newappt","Book Session","💆"],["profile","My Profile","👤"]].map(([id,label,icon])=>(
          <button key={id} onClick={()=>{ if(id==="newappt"){setBD(initBD);resetBdText();navTo("book",1);}else setCustTab(id); }}
            style={{padding:"13px 18px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,fontWeight:700,color:custTab===id?PL:G6,borderBottom:`3px solid ${custTab===id?PL:"transparent"}`,fontFamily:"inherit",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",flexShrink:0}}>
            {icon} {label}
          </button>
        ))}
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:"16px 12px 40px"}}>
        {custTab==="appts"&&<CustApptsTab customer={customer} appts={custAppts} loading={custLoading} onRefresh={()=>loadCustAppts(customer.id)} onBook={()=>{setBD(initBD);resetBdText();navTo("book",1);}} therapists={therapists}/>}
        {custTab==="profile"&&<CustProfileTab customer={customer} setCustomer={setCustomer} pop={pop}/>}
      </div>
    </div>
  );
}

function AdminPortal({navTo,customer,user,therapistUser,therapistLogout,custLogout,setCustModal,setModal,aTab,setATab,loading,logout,appts,setAppts,reception,setReception,therapists,setTherapists,rooms,setRooms,services,setServices,pricing,setPricing,offers,setOffers,expenses,setExpenses,payMethods,setPayMethods,packages,setPackages,staff,setStaff,pop,ADMIN_TABS}){
  const [menuOpen,setMenuOpen] = useState(false);
  const isDesktop = typeof window!=="undefined" && window.innerWidth >= 900;
  const SIDEBAR_W = 210;
  return(
    <div style={{minHeight:"100vh",background:G1,display:"flex",flexDirection:"column",paddingTop:62}}>
      <NavBar navTo={navTo} customer={customer} user={user} therapistUser={therapistUser} therapistLogout={therapistLogout} custLogout={custLogout} setCustModal={setCustModal} setModal={setModal}/>
      <div style={{display:"flex",flex:1,position:"relative"}}>
        {isDesktop&&(
          <div style={{width:SIDEBAR_W,flexShrink:0,background:BK,minHeight:"100%",position:"sticky",top:0,height:"100vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:2,padding:"12px 0"}}>
            {ADMIN_TABS.map(([id,label,icon])=>(
              <button key={id} onClick={()=>setATab(id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"11px 20px",border:"none",background:aTab===id?"rgba(123,63,110,.3)":"transparent",cursor:"pointer",fontSize:13,fontWeight:700,color:aTab===id?PL:G4,fontFamily:"inherit",textAlign:"left",borderLeft:`3px solid ${aTab===id?PL:"transparent"}`,transition:"all .15s"}}>
                <span style={{fontSize:16}}>{icon}</span>{label}
              </button>
            ))}
            <div style={{flex:1}}/>
            <button onClick={logout} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 20px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,fontWeight:700,color:ER,fontFamily:"inherit",textAlign:"left"}}>
              <span>🚪</span>Logout
            </button>
          </div>
        )}
        {!isDesktop&&(
          <>
            <div style={{position:"fixed",top:62,left:0,right:0,background:BK,zIndex:50,display:"flex",alignItems:"center",padding:"0 14px",height:46,gap:12}}>
              <button onClick={()=>setMenuOpen(v=>!v)} style={{background:"none",border:"1px solid rgba(255,255,255,.2)",color:WH,borderRadius:7,padding:"5px 11px",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>☰ Menu</button>
              <span style={{color:GOLD,fontSize:13,fontWeight:700}}>{ADMIN_TABS.find(t=>t[0]===aTab)?.[1]||"Dashboard"}</span>
            </div>
            {menuOpen&&(
              <>
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:100}} onClick={()=>setMenuOpen(false)}/>
                <div style={{position:"fixed",top:108,left:0,bottom:0,width:240,background:BK,zIndex:101,overflowY:"auto",padding:"8px 0",display:"flex",flexDirection:"column"}}>
                  {ADMIN_TABS.map(([id,label,icon])=>(
                    <button key={id} onClick={()=>{setATab(id);setMenuOpen(false);}}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"13px 20px",border:"none",background:aTab===id?"rgba(123,63,110,.3)":"transparent",cursor:"pointer",fontSize:14,fontWeight:700,color:aTab===id?PL:G4,fontFamily:"inherit",textAlign:"left",borderLeft:`3px solid ${aTab===id?PL:"transparent"}`}}>
                      <span style={{fontSize:18}}>{icon}</span>{label}
                    </button>
                  ))}
                  <div style={{flex:1}}/>
                  <button onClick={logout} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 20px",border:"none",background:"transparent",cursor:"pointer",fontSize:14,fontWeight:700,color:ER,fontFamily:"inherit",textAlign:"left"}}><span>🚪</span>Logout</button>
                </div>
              </>
            )}
          </>
        )}
        <div style={{flex:1,padding:isDesktop?"28px 28px 60px":`${46+16}px 14px 60px`,paddingTop:isDesktop?"24px":"70px",maxWidth:isDesktop?900:"100%",overflowX:"hidden"}}>
          {loading&&<div style={{textAlign:"center",padding:40,color:G4}}>Loading…</div>}
          {!loading&&aTab==="dash"&&<DashTab appts={appts} reception={reception} therapists={therapists} rooms={rooms} pop={pop} setReception={setReception} payMethods={payMethods} services={services} pricing={pricing}/>}
          {!loading&&aTab==="appts"&&<ApptsTab appts={appts} setAppts={setAppts} therapists={therapists} rooms={rooms} services={services} pricing={pricing} payMethods={payMethods} pop={pop} user={user} offers={offers}/>}
          {!loading&&aTab==="reception"&&<ReceptionTab reception={reception} setReception={setReception} therapists={therapists} rooms={rooms} services={services} pricing={pricing} payMethods={payMethods} pop={pop} user={user}/>}
          {!loading&&aTab==="therapists"&&<TherapistsTab therapists={therapists} setTherapists={setTherapists} pop={pop}/>}
          {!loading&&aTab==="rooms"&&<RoomsTab rooms={rooms} setRooms={setRooms} pop={pop}/>}
          {!loading&&aTab==="services"&&<ServicesTab services={services} setServices={setServices} pricing={pricing} setPricing={setPricing} rooms={rooms} pop={pop}/>}
          {!loading&&aTab==="offers"&&<OffersTab offers={offers} setOffers={setOffers} pop={pop}/>}
          {!loading&&aTab==="expenses"&&<ExpensesTab expenses={expenses} setExpenses={setExpenses} pop={pop} user={user}/>}
          {!loading&&aTab==="reports"&&<ReportsTab appts={appts} reception={reception} expenses={expenses} therapists={therapists} services={services} payMethods={payMethods}/>}
          {!loading&&aTab==="packages"&&<PackagesTab packages={packages} setPackages={setPackages} services={services} rooms={rooms} pop={pop}/>}
          {!loading&&aTab==="payments"&&<PaymentsTab payMethods={payMethods} setPayMethods={setPayMethods} pop={pop}/>}
          {!loading&&aTab==="commission"&&<CommissionTab therapists={therapists} setTherapists={setTherapists} staff={staff} setStaff={setStaff} user={user} pop={pop}/>}
          {!loading&&aTab==="staff"&&user?.role==="Admin"&&<StaffTab staff={staff} setStaff={setStaff} pop={pop} currentUser={user}/>}
        </div>
      </div>
    </div>
  );
}


// ── Step 2: Therapist picker — must be outside render to use hooks ──
function TherapistPickerStep({locTherapists, bD, setBD, goStep}) {
  const [viewTh,     setViewTh]     = useState(null);
  const [thPhotoIdx, setThPhotoIdx] = useState(0);
  return (
  <div>
    <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6,color:BK}}>Choose Therapist</h2>
    <p style={{color:G6,fontSize:14,marginBottom:20}}>Select a therapist or let us assign one</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:20}}>
      {/* Any therapist option */}
      <div onClick={()=>setBD(d=>({...d,therapistId:""}))}
        style={{border:`2px solid ${!bD.therapistId?PL:G2}`,borderRadius:12,padding:"16px 12px",cursor:"pointer",background:!bD.therapistId?PLF:WH,textAlign:"center",transition:"all .15s"}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:G2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 10px"}}>🎲</div>
        <div style={{fontWeight:700,fontSize:14,color:!bD.therapistId?PL:BK}}>Any Available</div>
        <div style={{fontSize:11,color:G6,marginTop:4}}>We'll assign the best match</div>
      </div>
      {locTherapists.map(th=>{
        const photos=[...(th.photos||[]),th.photo].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
        const sel=bD.therapistId===th.id;
        return(
        <div key={th.id} style={{border:`2px solid ${sel?PL:G2}`,borderRadius:12,overflow:"hidden",background:sel?PLF:WH,transition:"all .15s",display:"flex",flexDirection:"column"}}>
          <div onClick={()=>setBD(d=>({...d,therapistId:th.id}))} style={{cursor:"pointer"}}>
            {photos[0]?(
              <div style={{paddingTop:"85%",position:"relative",background:G1}}>
                <img src={photos[0]} alt={th.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
                {sel&&<div style={{position:"absolute",top:6,right:6,background:PL,color:WH,borderRadius:99,fontSize:10,fontWeight:700,padding:"2px 7px"}}>✓</div>}
              </div>
            ):(
              <div style={{paddingTop:"85%",position:"relative",background:`linear-gradient(135deg,${PLD},${PL})`}}>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,color:WH,fontFamily:"'Playfair Display',serif"}}>{th.name?.[0]}</div>
              </div>
            )}
          </div>
          <div style={{padding:"8px 10px 10px",flex:1,display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontWeight:700,fontSize:13,color:BK}}>{th.name}</div>
            {th.specialties?.slice(0,2).map((s,i)=><span key={i} style={{fontSize:10,color:G6,lineHeight:1.4}}>{s}</span>)}
            <div style={{display:"flex",gap:5,marginTop:"auto"}}>
              <button onClick={()=>setBD(d=>({...d,therapistId:th.id}))}
                style={{flex:1,padding:"5px 0",fontSize:11,fontWeight:700,borderRadius:6,
                  border:`1px solid ${sel?PL:G2}`,background:sel?PL:WH,color:sel?WH:G6,cursor:"pointer",fontFamily:"inherit"}}>
                {sel?"✓ Selected":"Select"}
              </button>
              <button onClick={()=>{setViewTh(th);setThPhotoIdx(0);}}
                style={{flex:1,padding:"5px 0",fontSize:11,fontWeight:700,borderRadius:6,
                  border:`1px solid ${PL}`,background:PLF,color:PL,cursor:"pointer",fontFamily:"inherit"}}>
                View
              </button>
            </div>
          </div>
        </div>
        );
      })}
      {locTherapists.length===0&&<div style={{color:G4,fontSize:14,padding:20,gridColumn:"1/-1"}}>No therapists available.</div>}
    </div>
    <div style={{display:"flex",gap:10}}>
      <Btn v="ghost" onClick={()=>goStep(1)}>← Back</Btn>
      <Btn onClick={()=>goStep(bD.serviceType==="outcall"?4:3)} style={{flex:1,justifyContent:"center"}}>Continue →</Btn>
    </div>

    {/* Therapist profile popup */}
    {viewTh&&(()=>{
      const vPhotos=[...(viewTh.photos||[]),viewTh.photo].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
      const avColor={available:OK,outcall_only:WA,unavailable:ER};
      const avLabel={available:"🟢 Available",outcall_only:"🟡 Outcall Only",unavailable:"🔴 Unavailable"};
      return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px 12px",overflowY:"auto"}}
        onClick={e=>e.target===e.currentTarget&&setViewTh(null)}>
        <div style={{background:WH,borderRadius:20,width:"100%",maxWidth:520,boxShadow:"0 20px 60px rgba(0,0,0,.3)",overflow:"hidden"}}>
          <div style={{paddingTop:"70%",position:"relative",background:vPhotos[0]?BK:`linear-gradient(135deg,${PLD},${PL})`}}>
            {vPhotos.length>0
              ? vPhotos.map((src,i)=>(
                  <img key={i} src={src} alt={viewTh.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top",opacity:i===thPhotoIdx?1:0,transition:"opacity .3s"}}/>
                ))
              : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:72,color:"rgba(255,255,255,.3)",fontFamily:"'Playfair Display',serif"}}>{viewTh.name[0]}</div>
            }
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:"45%",background:"linear-gradient(to top,rgba(0,0,0,.75),transparent)",pointerEvents:"none"}}/>
            <button onClick={()=>setViewTh(null)} style={{position:"absolute",top:12,right:12,width:34,height:34,borderRadius:"50%",background:"rgba(0,0,0,.5)",border:"none",color:WH,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>×</button>
            {vPhotos.length>1&&(
              <>
                <button onClick={()=>setThPhotoIdx(i=>(i-1+vPhotos.length)%vPhotos.length)} style={{position:"absolute",left:10,top:"45%",transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(0,0,0,.45)",border:"none",color:WH,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                <button onClick={()=>setThPhotoIdx(i=>(i+1)%vPhotos.length)} style={{position:"absolute",right:10,top:"45%",transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(0,0,0,.45)",border:"none",color:WH,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                <div style={{position:"absolute",bottom:54,left:0,right:0,display:"flex",gap:4,justifyContent:"center"}}>
                  {vPhotos.map((_,i)=><div key={i} onClick={()=>setThPhotoIdx(i)} style={{width:i===thPhotoIdx?14:5,height:5,borderRadius:99,background:i===thPhotoIdx?"rgba(255,255,255,1)":"rgba(255,255,255,.4)",transition:"all .2s",cursor:"pointer"}}/>)}
                </div>
              </>
            )}
            <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 18px"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:WH,margin:"0 0 4px"}}>{viewTh.name}</h2>
              {viewTh.specialties?.length>0&&<div style={{fontSize:13,color:"rgba(255,255,255,.8)"}}>{viewTh.specialties.join(" · ")}</div>}
            </div>
          </div>
          {vPhotos.length>1&&(
            <div style={{display:"flex",gap:6,padding:"8px 12px",background:G1,overflowX:"auto"}}>
              {vPhotos.map((src,i)=>(
                <img key={i} src={src} onClick={()=>setThPhotoIdx(i)} alt="" style={{width:56,height:44,objectFit:"cover",objectPosition:"top",borderRadius:6,cursor:"pointer",flexShrink:0,border:`2px solid ${i===thPhotoIdx?PL:"transparent"}`,opacity:i===thPhotoIdx?1:.6,transition:"all .15s"}}/>
              ))}
            </div>
          )}
          <div style={{padding:"18px 20px 24px"}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
              {viewTh.availability&&<span style={{background:`${avColor[viewTh.availability]||G4}18`,color:avColor[viewTh.availability]||G4,padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700}}>{avLabel[viewTh.availability]||viewTh.availability}</span>}
              <span style={{background:OKB,color:OK,padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700}}>🏢 In-House</span>
              {viewTh.outcall&&<span style={{background:PLF,color:PL,padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700}}>🏠 Outcall</span>}
            </div>
            {viewTh.bio&&<p style={{fontSize:14,color:G6,lineHeight:1.8,marginBottom:16}}>{viewTh.bio}</p>}
            {viewTh.phone&&<div style={{fontSize:13,color:G6,marginBottom:16}}>📞 {viewTh.phone}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setViewTh(null)} style={{flex:1,padding:"11px",borderRadius:9,border:`1px solid ${G2}`,background:WH,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:G6}}>Close</button>
              <button onClick={()=>{setBD(d=>({...d,therapistId:viewTh.id}));setViewTh(null);}}
                style={{flex:2,padding:"11px",borderRadius:9,border:"none",background:bD.therapistId===viewTh.id?OK:PL,color:WH,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {bD.therapistId===viewTh.id?"✓ Selected":"Select & Book"}
              </button>
            </div>
          </div>
        </div>
      </div>
      );
    })()}
  </div>
  );
}


function BookingPortal({therapists,rooms,services,pricing,offers,payMethods,customer,packages,
bD,setBD,bStep,setBStep,bBase,bDisc,bTotal,bRoomId,
getPrice,goStep,navTo,pop,custModal,setCustModal,
pendingBook,setPendingBook,custLogin,custRegister,setAppts,
bdName,setBdName,bdPhone,setBdPhone,bdEmail,setBdEmail,bdNotes,setBdNotes,
bookingLoading,setBookingLoading,confirmBooking,initBD,resetBdText,modal,setModal}){
const isMobile = typeof window!=="undefined" && window.innerWidth<640;
  const locTherapists = bD.serviceType==="outcall" ? therapists.filter(t=>t.outcall) : therapists;
  const selTh = therapists.find(t=>t.id===bD.therapistId);
  const selRm = rooms.find(r=>r.id===bD.roomId);

  // Use App-level stable state for text fields (prevents focus-loss on re-render)
  // bdName, bdPhone, bdEmail, bdNotes and their setters come from App() closure

  // Pre-fill from customer when they log in or when reaching step 5
  useEffect(()=>{
    if(customer) {
      if(!bdName  && customer.name)  setBdName(customer.name);
      if(!bdPhone && customer.phone) setBdPhone(customer.phone);
      if(!bdEmail && customer.email) setBdEmail(customer.email);
    }
  },[customer?.id]);

  const toggleService = (sv)=>{
    setBD(d=>{
      const exists=d.services.find(s=>s.id===sv.id);
      if(exists) return {...d,services:d.services.filter(s=>s.id!==sv.id)};
      return {...d,services:[...d.services,{id:sv.id,name:sv.name,price:getPrice(sv.id,bRoomId,d.serviceType)}]};
    });
  };

  const steps=[{n:1,l:"Date & Type"},{n:2,l:"Therapist"},{n:3,l:"Room"},{n:4,l:"Services"},{n:5,l:"Confirm"}];

  return(
    <div style={{minHeight:"100vh",background:G1}}>
      <NavBar navTo={navTo} customer={customer} user={null} therapistUser={null} therapistLogout={()=>{}} custLogout={()=>{}} setCustModal={setCustModal} setModal={setModal}/>
      <div style={{maxWidth:680,margin:"0 auto",padding:"24px 16px 60px"}}>
        {/* Progress */}
        {bStep<6&&(
          <div style={{display:"flex",gap:2,marginBottom:28}}>
            {steps.map(s=>(
              <div key={s.n} style={{flex:1,textAlign:"center"}}>
                <div style={{height:4,borderRadius:99,background:bStep>=s.n?PL:G2,marginBottom:5,transition:"background .3s"}}/>
                {!isMobile&&<div style={{fontSize:10,color:bStep===s.n?PL:G4,fontWeight:bStep===s.n?700:400}}>{s.l}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Step 1 — Date, Time, Service Type + Package option */}
        {bStep===1&&(
          <div>
            {/* Mode toggle — only when packages exist */}
            {packages&&packages.length>0&&(
              <div style={{display:"flex",gap:0,marginBottom:22,background:G1,borderRadius:10,padding:4}}>
                <button onClick={()=>setBD(d=>({...d,bookingMode:"standard"}))}
                  style={{flex:1,padding:"9px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"none",
                    background:bD.bookingMode!=="package"?WH:"transparent",
                    color:bD.bookingMode!=="package"?BK:G6,
                    boxShadow:bD.bookingMode!=="package"?"0 1px 4px rgba(0,0,0,.1)":"none",transition:"all .2s"}}>
                  💆 Individual
                </button>
                <button onClick={()=>setBD(d=>({...d,bookingMode:"package"}))}
                  style={{flex:1,padding:"9px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"none",
                    background:bD.bookingMode==="package"?PL:"transparent",
                    color:bD.bookingMode==="package"?WH:G6,transition:"all .2s"}}>
                  🎁 Package
                </button>
              </div>
            )}

            {/* ── PACKAGE MODE ── */}
            {bD.bookingMode==="package"&&packages&&packages.length>0&&(
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:6,color:BK}}>Choose a Package</h2>
                <p style={{color:G6,fontSize:13,marginBottom:16}}>Curated spa experiences — everything included</p>
                <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
                  {packages.map(pkg=>{
                    const sel=bD.packageId===pkg.id;
                    return(
                      <div key={pkg.id} onClick={()=>setBD(d=>({...d,packageId:pkg.id,roomId:pkg.room_id||d.roomId,services:pkg.services||[]}))}
                        style={{border:`2px solid ${sel?PL:G2}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",background:sel?PLF:WH,transition:"all .15s"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",color:sel?PL:BK,marginBottom:3}}>{pkg.name}</div>
                            {pkg.description&&<div style={{fontSize:12,color:G6,lineHeight:1.6}}>{pkg.description}</div>}
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontWeight:700,fontSize:17,color:PL}}>{fmt(pkg.price)}</div>
                            <div style={{fontSize:11,color:G4}}>{pkg.duration_min} min</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <span style={{background:G1,color:G6,padding:"2px 8px",borderRadius:99,fontSize:11}}>💆 {pkg.masseuses} masseuse{pkg.masseuses>1?"s":""}</span>
                          {pkg.room_name&&<span style={{background:G1,color:G6,padding:"2px 8px",borderRadius:99,fontSize:11}}>🛏 {pkg.room_name}</span>}
                          {(pkg.services||[]).map((s,i)=><span key={i} style={{background:G1,color:G6,padding:"2px 8px",borderRadius:99,fontSize:11}}>{s.name}</span>)}
                          {(pkg.amenities||[]).map((a,i)=><span key={i} style={{background:sel?`${PL}15`:G1,color:sel?PL:G4,padding:"2px 8px",borderRadius:99,fontSize:10}}>{a}</span>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  <Inp label="Date *" type="date" value={bD.date} min={td()} onChange={e=>setBD(d=>({...d,date:e.target.value}))}/>
                  <Inp label="Time *" type="time" value={bD.time} onChange={e=>setBD(d=>({...d,time:e.target.value}))}/>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  {[["inhouse","🏢 At Studio"],["outcall","🏠 Outcall"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setBD(d=>({...d,serviceType:v}))}
                      style={{flex:1,padding:"9px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${bD.serviceType===v?PL:G2}`,background:bD.serviceType===v?PLF:WH,color:bD.serviceType===v?PL:G6}}>
                      {l}
                    </button>
                  ))}
                </div>
                {bD.serviceType==="outcall"&&(
                  <Inp label="Your Address *" value={bD.outcallAddr||""} onChange={e=>setBD(d=>({...d,outcallAddr:e.target.value}))} placeholder="Street, area, landmark…"/>
                )}
                <Btn onClick={()=>goStep(5)} disabled={!bD.packageId||!bD.date||!bD.time||(bD.serviceType==="outcall"&&!bD.outcallAddr)} style={{width:"100%",justifyContent:"center"}}>
                  Review & Confirm →
                </Btn>
              </div>
            )}

            {/* ── STANDARD MODE ── */}
            {bD.bookingMode!=="package"&&(
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6,color:BK}}>When & How?</h2>
                <p style={{color:G6,fontSize:14,marginBottom:24}}>Choose your date, time, and service type</p>
                <Card>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <Inp label="Date" type="date" value={bD.date} min={td()} onChange={e=>setBD(d=>({...d,date:e.target.value}))}/>
                    <Inp label="Time" type="time" value={bD.time} onChange={e=>setBD(d=>({...d,time:e.target.value}))}/>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>Service Type</label>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {[["inhouse","🏢","In-House","Visit our spa studio"],["outcall","🏠","Outcall","We come to you (home/hotel)"]].map(([val,ic,label,sub])=>(
                        <div key={val} onClick={()=>setBD(d=>({...d,serviceType:val,roomId:val==="outcall"?"":d.roomId}))}
                          style={{border:`2px solid ${bD.serviceType===val?PL:G2}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",background:bD.serviceType===val?PLF:WH,transition:"all .15s"}}>
                          <div style={{fontSize:24,marginBottom:6}}>{ic}</div>
                          <div style={{fontWeight:700,fontSize:14,color:bD.serviceType===val?PL:BK}}>{label}</div>
                          <div style={{fontSize:12,color:G6,marginTop:3}}>{sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {bD.serviceType==="outcall"&&(
                    <Inp label="Your Address / Hotel Name & Room" value={bD.outcallAddr} onChange={e=>setBD(d=>({...d,outcallAddr:e.target.value}))} placeholder="e.g. Serena Hotel, Room 312 or 15 Masaki Street"/>
                  )}
                </Card>
                <div style={{display:"flex",gap:10,marginTop:6}}>
                  <Btn v="ghost" onClick={()=>navTo("land")}>← Back</Btn>
                  <Btn onClick={()=>goStep(2)} disabled={!bD.date||!bD.time||(bD.serviceType==="outcall"&&!bD.outcallAddr)} style={{flex:1,justifyContent:"center"}}>Continue →</Btn>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Step 2 — Therapist */}
        {bStep===2&&(
          <TherapistPickerStep
            locTherapists={locTherapists}
            bD={bD} setBD={setBD}
            goStep={goStep}
          />
        )}

                {/* Step 3 — Room (inhouse only) */}
        {bStep===3&&(
          <div>
            {bD.serviceType==="outcall" ? (
              /* Outcall — no room needed, just show info and continue */
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:20,color:BK}}>Outcall Service</h2>
                <div style={{background:PLF,border:`1px solid ${PL}30`,borderRadius:14,padding:"28px 24px",textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:48,marginBottom:14}}>🏠</div>
                  <div style={{fontWeight:700,fontSize:18,fontFamily:"'Playfair Display',serif",color:BK,marginBottom:8}}>We come to you</div>
                  <div style={{fontSize:14,color:G6,lineHeight:1.7}}>
                    Our therapist will visit you at:<br/>
                    <strong style={{color:PL}}>{bD.outcallAddr}</strong>
                  </div>
                  <div style={{marginTop:14,fontSize:12,color:G4}}>No room selection needed for outcall bookings</div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <Btn v="ghost" onClick={()=>goStep(2)}>← Back</Btn>
                  <Btn onClick={()=>goStep(4)} style={{flex:1,justifyContent:"center"}}>Continue →</Btn>
                </div>
              </div>
            ) : (
              /* In-house — choose a room */
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6,color:BK}}>Choose Room</h2>
                <p style={{color:G6,fontSize:14,marginBottom:20}}>Select the room for your session</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,260px),1fr))",gap:14,marginBottom:20}}>
                  {rooms.length===0&&(
                    <div style={{textAlign:"center",padding:"30px 20px",color:G4,background:WH,borderRadius:12,border:`1px solid ${G2}`,gridColumn:"1/-1"}}>
                      No rooms available
                    </div>
                  )}
                  {rooms.map((rm,ri)=>{
                    const sel=bD.roomId===rm.id;
                    const COLORS=["#7B3F6E","#1565C0","#2E7D32","#E65100","#6A1B9A","#00695C","#AD1457","#4527A0"];
                    const col=COLORS[ri%COLORS.length];
                    return(
                    <div key={rm.id} onClick={()=>setBD(d=>({...d,roomId:rm.id}))}
                      style={{borderRadius:14,border:`3px solid ${sel?PL:G2}`,cursor:"pointer",
                        overflow:"hidden",transition:"all .15s",
                        boxShadow:sel?`0 4px 20px ${PL}40`:"0 1px 6px rgba(0,0,0,.08)"}}>
                      {/* Room visual — color gradient with initial */}
                      <div style={{paddingTop:"55%",position:"relative",background:`linear-gradient(135deg,${col}CC,${col})`}}>
                        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:52,color:"rgba(255,255,255,.25)",fontFamily:"'Playfair Display',serif",fontWeight:900,userSelect:"none"}}>
                          {rm.name[0]}
                        </div>
                        {sel&&(
                          <div style={{position:"absolute",top:8,right:8,background:WH,color:PL,
                            padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>✓ Selected</div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{padding:"12px 14px 14px",background:sel?PLF:WH}}>
                        <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",
                          color:sel?PL:BK,marginBottom:4}}>{rm.name}</div>
                        {rm.description&&(
                          <div style={{fontSize:12,color:G6,marginBottom:8,lineHeight:1.5}}>{rm.description}</div>
                        )}
                        {rm.amenities?.length>0&&(
                          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {rm.amenities.map((a,i)=>(
                              <span key={i} style={{background:sel?`${PL}15`:G1,color:sel?PL:G6,
                                fontSize:10,padding:"2px 8px",borderRadius:99,fontWeight:600}}>
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <Btn v="ghost" onClick={()=>goStep(2)}>← Back</Btn>
                  <Btn onClick={()=>goStep(4)} disabled={!bD.roomId} style={{flex:1,justifyContent:"center"}}>Continue →</Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Services */}
        {bStep===4&&(
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6,color:BK}}>Select Services</h2>
            <p style={{color:G6,fontSize:14,marginBottom:20}}>You can select multiple services</p>
            {Object.entries(services.reduce((a,s)=>{(a[s.category]||(a[s.category]=[])).push(s);return a;},{})).map(([cat,svs])=>(
              <div key={cat} style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,color:PL,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>{cat}</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {svs.map(sv=>{
                    const price=getPrice(sv.id,bRoomId,bD.serviceType);
                    const sel=bD.services.find(s=>s.id===sv.id);
                    return(
                      <div key={sv.id} onClick={()=>toggleService(sv)}
                        style={{background:sel?PLF:WH,borderRadius:10,border:`2px solid ${sel?PL:G2}`,padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,transition:"all .15s"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,color:BK}}>{sv.name}</div>
                          <div style={{fontSize:12,color:G6,marginTop:2}}>{sv.duration_min} min {sv.description&&"· "+sv.description.slice(0,40)}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:price?PL:G4}}>{price?fmt(price):"—"}</div>
                          {sel&&<div style={{fontSize:11,color:OK,fontWeight:700}}>✓ Selected</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {bD.services.length>0&&(
              <div style={{background:PLF,border:`1px solid ${PL}30`,borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:PL,marginBottom:6}}>Selected ({bD.services.length})</div>
                {bD.services.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:G8,paddingBottom:4}}><span>{s.name}</span><span style={{fontWeight:700}}>{fmt(getPrice(s.id,bRoomId,bD.serviceType))}</span></div>)}
                <div style={{borderTop:`1px solid ${PL}20`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:BK}}><span>Subtotal</span><span style={{color:PL}}>{fmt(bBase)}</span></div>
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <Btn v="ghost" onClick={()=>goStep(bD.serviceType==="outcall"?2:3)}>← Back</Btn>
              <Btn onClick={()=>goStep(5)} disabled={bD.services.length===0} style={{flex:1,justifyContent:"center"}}>Continue →</Btn>
            </div>
          </div>
        )}

        {/* Step 5 — Review & Confirm */}
        {bStep===5&&(
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6,color:BK}}>Review & Confirm</h2>
            <p style={{color:G6,fontSize:14,marginBottom:20}}>Check details before confirming</p>
            <Card>
              <ST c="Your Details"/>
              <BookingDetailsForm
                bdName={bdName}   setBdName={setBdName}
                bdPhone={bdPhone} setBdPhone={setBdPhone}
                bdEmail={bdEmail} setBdEmail={setBdEmail}
                bdNotes={bdNotes} setBdNotes={setBdNotes}
                customer={customer}
              />
            </Card>
            {/* Summary */}
            <Card>
              <ST c="Booking Summary"/>
              {[
                ["📅 Date & Time", `${bD.date} at ${bD.time}`],
                ["🔧 Type",        bD.serviceType==="outcall"?"Outcall – "+bD.outcallAddr:"In-House"],
                ["💆 Therapist",   selTh?.name||"Any Available"],
                ...(bD.serviceType==="inhouse"&&selRm?[["🚪 Room", selRm.name]]:[]),
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                  <span style={{color:G6}}>{k}</span><span style={{fontWeight:700,color:BK,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                </div>
              ))}
              <div style={{marginTop:12}}>
                {bD.services.map(s=>(
                  <div key={s.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0"}}>
                    <span style={{color:G6}}>💆 {s.name}</span><span style={{fontWeight:700}}>{fmt(getPrice(s.id,bRoomId,bD.serviceType))}</span>
                  </div>
                ))}
                <div style={{borderTop:`1px solid ${G2}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:700}}>
                  <span>Total</span><span style={{color:PL}}>{fmt(bTotal)}</span>
                </div>
              </div>
            </Card>
            {/* Outcall advance payment selector */}
            {(customer||bD.guestMode)&&bD.serviceType==="outcall"&&(
              <Card style={{border:`1px solid ${WA}40`,marginBottom:0}}>
                <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:4}}>🏠 Advance Payment</div>
                <div style={{fontSize:12,color:G6,marginBottom:12}}>Select how much to pay in advance (min 10%)</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
                  {[10,25,50,75,100].map(pct=>(
                    <button key={pct} onClick={()=>setBD(d=>({...d,advancePct:pct}))}
                      style={{padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${(bD.advancePct||10)===pct?PL:G2}`,
                        background:(bD.advancePct||10)===pct?PL:WH,
                        color:(bD.advancePct||10)===pct?WH:G6}}>
                      {pct===100?"Full amount":pct+"%"}
                    </button>
                  ))}
                </div>
                <div style={{background:G1,borderRadius:8,padding:"10px 14px",fontSize:13}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{color:G6}}>Total</span><span style={{fontWeight:700}}>{fmt(bTotal)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,color:PL}}>
                    <span>Pay now ({bD.advancePct||10}%)</span>
                    <span>{fmt(Math.round(bTotal*(bD.advancePct||10)/100))}</span>
                  </div>
                  {(bD.advancePct||10)<100&&(
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:G4,marginTop:3}}>
                      <span>Remaining on arrival</span><span>{fmt(bTotal-Math.round(bTotal*(bD.advancePct||10)/100))}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Payment method selection */}
            {(customer||bD.guestMode)&&(
              <Card>
                <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:14}}>💳 How would you like to pay?</div>

                {/* PesaPal online */}
                <div onClick={()=>setBD(d=>({...d,method:"PesaPal"}))}
                  style={{border:`2px solid ${bD.method==="PesaPal"?PL:G2}`,background:bD.method==="PesaPal"?PLF:WH,borderRadius:12,padding:"14px 16px",cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",gap:14,transition:"all .15s"}}>
                  <span style={{fontSize:28}}>💳</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:bD.method==="PesaPal"?PL:BK}}>Pay Online Now</div>
                    <div style={{fontSize:12,color:G6,marginTop:2}}>M-Pesa · Tigo Pesa · Airtel Money · Card — secure & instant</div>
                  </div>
                  <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${bD.method==="PesaPal"?PL:G2}`,background:bD.method==="PesaPal"?PL:"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {bD.method==="PesaPal"&&<div style={{width:8,height:8,borderRadius:"50%",background:WH}}/>}
                  </div>
                </div>

                {/* Pay on arrival */}
                <div style={{fontSize:12,fontWeight:700,color:G6,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Or pay on arrival</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {(payMethods.length?payMethods:["Cash"]).map(pm=>(
                    <button key={pm} onClick={()=>setBD(d=>({...d,method:pm}))}
                      style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        border:`2px solid ${bD.method===pm?PL:G2}`,background:bD.method===pm?PLF:WH,color:bD.method===pm?PL:G6}}>
                      {pm}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Account options for non-logged-in customers */}
            {!customer&&(
              <Card style={{border:`1px solid ${G2}`}}>
                <div style={{fontWeight:700,fontSize:14,color:BK,marginBottom:12}}>Continue as:</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {/* Guest option */}
                  <div style={{border:`2px solid ${bD.guestMode?PL:G2}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",background:bD.guestMode?PLF:WH,transition:"all .15s"}}
                    onClick={()=>setBD(d=>({...d,guestMode:true}))}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${bD.guestMode?PL:G2}`,background:bD.guestMode?PL:"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {bD.guestMode&&<div style={{width:7,height:7,borderRadius:"50%",background:WH}}/>}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:bD.guestMode?PL:BK}}>Continue as Guest</div>
                        <div style={{fontSize:11,color:G6}}>No account needed — just fill your name and phone</div>
                      </div>
                    </div>
                  </div>
                  {/* Sign in option */}
                  <div style={{border:`2px solid ${!bD.guestMode?PL:G2}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",background:!bD.guestMode?PLF:WH,transition:"all .15s"}}
                    onClick={()=>setBD(d=>({...d,guestMode:false}))}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${!bD.guestMode?PL:G2}`,background:!bD.guestMode?PL:"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {!bD.guestMode&&<div style={{width:7,height:7,borderRadius:"50%",background:WH}}/>}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:!bD.guestMode?PL:BK}}>Sign In / Create Account</div>
                        <div style={{fontSize:11,color:G6}}>Track appointments, view history, pay online</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Show login/register buttons when sign-in selected */}
                {!bD.guestMode&&(
                  <div style={{display:"flex",gap:10,marginTop:12}}>
                    <Btn onClick={()=>{setPendingBook(true);setCustModal("login");}} style={{flex:1,justifyContent:"center"}}>Sign In</Btn>
                    <Btn v="out" onClick={()=>{setPendingBook(true);setCustModal("register");}} style={{flex:1,justifyContent:"center"}}>Create Account</Btn>
                  </div>
                )}
              </Card>
            )}

            {/* Action buttons */}
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <Btn v="ghost" onClick={()=>goStep(4)} style={{flex:"0 0 auto"}}>← Back</Btn>
              {(customer||bD.guestMode)&&(
                <button onClick={confirmBooking} disabled={bookingLoading}
                  style={{flex:1,padding:"13px",border:"none",borderRadius:10,cursor:bookingLoading?"not-allowed":"pointer",fontFamily:"inherit",fontSize:15,fontWeight:700,
                    background:bD.method==="PesaPal"?`linear-gradient(135deg,#1565C0,#1976D2)`:`linear-gradient(135deg,${PLD},${PL})`,
                    color:WH,opacity:bookingLoading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {bookingLoading
                    ? "Processing…"
                    : bD.method==="PesaPal"
                    ? "💳 Pay & Confirm"
                    : "✓ Confirm Booking"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 6 — Confirmed */}
        {bStep===6&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            {bD.guestMode&&!customer&&(
              <div style={{background:PLF,border:`1px solid ${PL}30`,borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:13,color:PL,textAlign:"left"}}>
                <div style={{fontWeight:700,marginBottom:4}}>💡 Want to track your booking?</div>
                Create a free account to view your appointments and pay online anytime.
                <div style={{marginTop:10,display:"flex",gap:8}}>
                  <button onClick={()=>{setCustModal("register");}} style={{padding:"7px 14px",borderRadius:7,border:"none",background:PL,color:WH,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Create Account</button>
                  <button onClick={()=>{setCustModal("login");}} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${PL}`,background:WH,color:PL,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
                </div>
              </div>
            )}
            <div style={{fontSize:64,marginBottom:20}}>🎉</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:BK,marginBottom:10}}>Booking Confirmed!</h2>
            <p style={{color:G6,fontSize:16,marginBottom:8}}>We'll confirm your appointment shortly.</p>
            <p style={{color:G6,fontSize:14,marginBottom:32}}>{bD.date} at {bD.time} · {bD.serviceType==="outcall"?"Outcall":"In-House"}</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <Btn onClick={()=>{navTo("customer");setCustTab("appts");loadCustAppts(customer?.id);}}>View My Bookings</Btn>
              <Btn v="ghost" onClick={()=>{setBD(initBD);resetBdText();navTo("land");}}>Back to Home</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stable booking details form — defined outside App() to prevent remounting ──
function BookingDetailsForm({ bdName, setBdName, bdPhone, setBdPhone, bdEmail, setBdEmail, bdNotes, setBdNotes, customer }) {
  const L = { display:"block", fontSize:11, fontWeight:700, color:G8, marginBottom:5, textTransform:"uppercase", letterSpacing:".05em" };
  const I = { width:"100%", padding:"9px 11px", border:`1px solid ${G2}`, borderRadius:8, fontSize:14, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };
  return (
    <div>
      <div style={{marginBottom:14}}>
        <label style={L}>Full Name</label>
        <input value={bdName} onChange={e=>setBdName(e.target.value)}
          placeholder={customer?.name||"Your name"} style={I}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div>
          <label style={L}>Phone</label>
          <input value={bdPhone} onChange={e=>setBdPhone(e.target.value)}
            placeholder={customer?.phone||"+255 7XX…"} style={I}/>
        </div>
        <div>
          <label style={L}>Email (optional)</label>
          <input value={bdEmail} onChange={e=>setBdEmail(e.target.value)}
            placeholder={customer?.email||""} style={I}/>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={L}>Notes (optional)</label>
        <textarea value={bdNotes} onChange={e=>setBdNotes(e.target.value)}
          placeholder="Any preferences, allergies or health notes…" rows={2}
          style={{...I, resize:"vertical"}}/>
      </div>
    </div>
  );
}


function TherapistCard({th, onClick}) {
  const photos = [...new Set([...(th.photos||[]),th.photo].filter(Boolean))];
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);

  const prev = (e)=>{ e.stopPropagation(); setIdx(i=>(i-1+photos.length)%photos.length); };
  const next = (e)=>{ e.stopPropagation(); setIdx(i=>(i+1)%photos.length); };

  const onTouchStart = (e)=>{ touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e)=>{
    if(touchStartX.current===null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if(Math.abs(diff)>40){
      if(diff>0) setIdx(i=>(i+1)%photos.length);
      else       setIdx(i=>(i-1+photos.length)%photos.length);
    }
    touchStartX.current = null;
  };

  const mainPhoto = photos[idx];
  return (
    <div
      onClick={onClick}
      style={{width:"100%",borderRadius:16,overflow:"hidden",cursor:"pointer",
        background:WH,boxShadow:"0 2px 12px rgba(0,0,0,.08)",transition:"box-shadow .2s,transform .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 36px rgba(123,63,110,.25)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.08)";}}>
      <div style={{paddingTop:"130%",position:"relative",background:mainPhoto?G1:`linear-gradient(160deg,${PLD},${PL})`}}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Photo with fade transition */}
        {photos.length>0
          ? photos.map((src,i)=>(
              <img key={i} src={src} alt={th.name}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
                  objectPosition:"top",opacity:i===idx?1:0,transition:"opacity .35s ease"}}/>
            ))
          : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:64,color:"rgba(255,255,255,.4)",fontFamily:"'Playfair Display',serif",fontWeight:700}}>
              {th.name?.[0]}
            </div>
        }
        {/* Gradient */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"50%",
          background:"linear-gradient(to top,rgba(0,0,0,.75),transparent)",pointerEvents:"none"}}/>
        {/* Prev / Next arrows — only when multiple photos */}
        {photos.length>1&&(
          <>
            <button onClick={prev}
              style={{position:"absolute",left:8,top:"42%",transform:"translateY(-50%)",
                width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,.45)",
                border:"none",color:WH,fontSize:16,cursor:"pointer",display:"flex",
                alignItems:"center",justifyContent:"center",zIndex:2}}>‹</button>
            <button onClick={next}
              style={{position:"absolute",right:8,top:"42%",transform:"translateY(-50%)",
                width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,.45)",
                border:"none",color:WH,fontSize:16,cursor:"pointer",display:"flex",
                alignItems:"center",justifyContent:"center",zIndex:2}}>›</button>
            {/* Dot indicators */}
            <div style={{position:"absolute",bottom:52,left:0,right:0,
              display:"flex",gap:4,justifyContent:"center",zIndex:2}}>
              {photos.map((_,i)=>(
                <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}}
                  style={{width:i===idx?16:5,height:5,borderRadius:99,
                    background:i===idx?"rgba(255,255,255,1)":"rgba(255,255,255,.45)",
                    transition:"all .25s",cursor:"pointer"}}/>
              ))}
            </div>
          </>
        )}
        {/* Name overlay */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 16px",zIndex:2}}>
          <div style={{fontWeight:700,fontSize:17,fontFamily:"'Playfair Display',serif",
            color:WH,marginBottom:3,textShadow:"0 1px 4px rgba(0,0,0,.5)"}}>{th.name}</div>
          {th.specialties?.length>0&&(
            <div style={{fontSize:12,color:"rgba(255,255,255,.8)"}}>{th.specialties.slice(0,2).join(" · ")}</div>
          )}
        </div>
      </div>
      <div style={{padding:"10px 14px 14px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{background:OKB,color:OK,padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>🏢 Incall</span>
        {th.outcall&&<span style={{background:PLF,color:PL,padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>🏠 Outcall</span>}
        {photos.length>1&&<span style={{marginLeft:"auto",fontSize:11,color:G4}}>{idx+1}/{photos.length}</span>}
      </div>
    </div>
  );
}

function TherapistGrid({therapists,onBook}){
  const [filter, setFilter] = useState("all");
  const [selTh,  setSelTh]  = useState(null);

  const shown = filter==="incall"
    ? therapists.filter(t=>t.active)
    : filter==="outcall"
    ? therapists.filter(t=>t.outcall&&t.active)
    : therapists.filter(t=>t.active);

  if(selTh) return (
    <TherapistPage th={selTh} onBack={()=>setSelTh(null)} onBook={(id)=>{setSelTh(null);onBook(id);}}/>
  );

  return(
    <div>
      {/* Filter chips */}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24,flexWrap:"wrap"}}>
        {[["all","All"],["incall","In-House"],["outcall","Outcall"]].map(([f,l])=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:"7px 18px",borderRadius:99,fontSize:13,fontWeight:700,
              border:`2px solid ${filter===f?PL:G2}`,background:filter===f?PL:WH,
              color:filter===f?WH:G6,cursor:"pointer",fontFamily:"inherit"}}>
            {l}
          </button>
        ))}
      </div>

      {shown.length===0&&(
        <div style={{textAlign:"center",color:G4,fontSize:14,padding:40}}>No therapists found</div>
      )}

      {/* Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,280px),1fr))",
        gap:16,
      }}>
        {shown.map(th=>(
          <TherapistCard key={th.id} th={th} onClick={()=>setSelTh(th)}/>
        ))}
      </div>

      {shown.length>0&&(
        <div style={{textAlign:"center",marginTop:28}}>
          <button onClick={()=>onBook(null)}
            style={{background:PL,color:WH,border:`2px solid ${GOLD}`,borderRadius:10,
              padding:"12px 34px",fontSize:15,cursor:"pointer",fontWeight:700,
              fontFamily:"'Playfair Display',serif"}}>
            Book a Session →
          </button>
        </div>
      )}
    </div>
  );
}


function TherapistPage({th, onBack, onBook}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = [...new Set([...(th.photos||[]), th.photo].filter(Boolean))];
  const avColor = {available:OK, outcall_only:WA, unavailable:ER};
  const avLabel = {available:"🟢 Available", outcall_only:"🟡 Outcall Only", unavailable:"🔴 Unavailable"};

  return(
    <div style={{maxWidth:800,margin:"0 auto"}}>
      {/* Back */}
      <button onClick={onBack}
        style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:G6,cursor:"pointer",fontSize:14,fontFamily:"inherit",marginBottom:16,fontWeight:600}}>
        ← Back to Therapists
      </button>

      <div style={{background:WH,borderRadius:20,overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,.12)"}}>

        {/* ── BIG HERO PHOTO ── */}
        {photos.length>0?(
          <div>
            {/* Main large image */}
            <div style={{paddingTop:"75%",position:"relative",background:BK}}>
              <img src={photos[photoIdx]} alt={th.name}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>

              {/* Dark gradient — name overlay at bottom */}
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:"50%",
                background:"linear-gradient(to top,rgba(0,0,0,.8) 0%,rgba(0,0,0,.3) 60%,transparent 100%)",
                pointerEvents:"none"}}/>

              {/* Name + availability overlaid on photo */}
              <div style={{position:"absolute",bottom:20,left:24,right:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:12}}>
                  <div>
                    <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,5vw,36px)",color:WH,margin:"0 0 6px",textShadow:"0 2px 8px rgba(0,0,0,.4)"}}>{th.name}</h1>
                    {th.specialties?.length>0&&(
                      <div style={{fontSize:13,color:"rgba(255,255,255,.85)"}}>{th.specialties.slice(0,3).join(" · ")}</div>
                    )}
                  </div>
                  {th.availability&&(
                    <span style={{background:`${avColor[th.availability]||G4}CC`,color:WH,padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,flexShrink:0,backdropFilter:"blur(6px)"}}>
                      {avLabel[th.availability]||th.availability}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow nav */}
              {photos.length>1&&(
                <>
                  <button onClick={()=>setPhotoIdx(i=>(i-1+photos.length)%photos.length)}
                    style={{position:"absolute",left:14,top:"45%",transform:"translateY(-50%)",width:44,height:44,borderRadius:"50%",background:"rgba(0,0,0,.45)",border:"2px solid rgba(255,255,255,.3)",color:WH,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>‹</button>
                  <button onClick={()=>setPhotoIdx(i=>(i+1)%photos.length)}
                    style={{position:"absolute",right:14,top:"45%",transform:"translateY(-50%)",width:44,height:44,borderRadius:"50%",background:"rgba(0,0,0,.45)",border:"2px solid rgba(255,255,255,.3)",color:WH,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>›</button>
                  {/* Dot indicators */}
                  <div style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,.45)",color:WH,fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:99,backdropFilter:"blur(4px)"}}>
                    {photoIdx+1} / {photos.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length>1&&(
              <div style={{display:"flex",gap:6,padding:"10px 12px",background:G1,overflowX:"auto",scrollbarWidth:"none"}}>
                {photos.map((src,i)=>(
                  <img key={i} src={src} onClick={()=>setPhotoIdx(i)} alt=""
                    style={{width:70,height:56,objectFit:"cover",objectPosition:"top",borderRadius:8,cursor:"pointer",flexShrink:0,
                      border:`3px solid ${i===photoIdx?PL:"transparent"}`,transition:"all .15s",
                      opacity:i===photoIdx?1:.65}}/>
                ))}
              </div>
            )}
          </div>
        ):(
          <div style={{paddingTop:"65%",position:"relative",background:`linear-gradient(160deg,${PLD},${PL})`}}>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,color:"rgba(255,255,255,.3)",fontFamily:"'Playfair Display',serif",fontWeight:700}}>{th.name[0]}</div>
            <div style={{position:"absolute",bottom:24,left:24}}>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,color:WH,margin:0}}>{th.name}</h1>
            </div>
          </div>
        )}

        {/* ── DETAILS ── */}
        <div style={{padding:"24px 28px 32px"}}>

          {/* Badges */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            <span style={{background:OKB,color:OK,padding:"6px 16px",borderRadius:99,fontSize:13,fontWeight:700}}>🏢 In-House</span>
            {th.outcall&&<span style={{background:PLF,color:PL,padding:"6px 16px",borderRadius:99,fontSize:13,fontWeight:700}}>🏠 Outcall</span>}
          </div>

          {/* Specialties chips */}
          {th.specialties?.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:G6,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Specialties</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {th.specialties.map((s,i)=>(
                  <span key={i} style={{background:G1,color:G8,padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:`1px solid ${G2}`}}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {th.bio&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:700,color:G6,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>About</div>
              <p style={{fontSize:15,color:G6,lineHeight:1.85,margin:0}}>{th.bio}</p>
            </div>
          )}

          {/* Contact */}
          {th.phone&&(
            <div style={{fontSize:14,color:G6,marginBottom:24,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>📞</span><span>{th.phone}</span>
            </div>
          )}

          {/* Book button */}
          <button onClick={()=>onBook(th.id)}
            style={{width:"100%",padding:"16px",border:"none",borderRadius:12,
              background:`linear-gradient(135deg,${PLD},${PL})`,
              color:WH,fontSize:17,fontWeight:700,cursor:"pointer",
              fontFamily:"'Playfair Display',serif",letterSpacing:".02em",
              boxShadow:`0 4px 20px ${PL}60`}}>
            Book with {th.name.split(" ")[0]} →
          </button>
        </div>
      </div>
    </div>
  );
}

function TherapistGallery({photos}) {
  const [idx,setIdx]=useState(0);
  return(
    <div style={{borderRadius:"16px 16px 0 0",overflow:"hidden"}}>
      <div style={{paddingTop:"65%",position:"relative",background:G2}}>
        <img src={photos[idx]} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        {photos.length>1&&(
          <>
            <button onClick={()=>setIdx(i=>(i-1+photos.length)%photos.length)}
              style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,.5)",border:"none",color:WH,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <button onClick={()=>setIdx(i=>(i+1)%photos.length)}
              style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,.5)",border:"none",color:WH,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
            <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4}}>
              {photos.map((_,i)=><div key={i} onClick={()=>setIdx(i)} style={{width:6,height:6,borderRadius:"50%",background:i===idx?"rgba(255,255,255,1)":"rgba(255,255,255,.4)",cursor:"pointer"}}/>)}
            </div>
          </>
        )}
      </div>
      {photos.length>1&&(
        <div style={{display:"flex",gap:6,padding:"8px 8px 0",overflowX:"auto",background:G1}}>
          {photos.map((src,i)=>(
            <img key={i} src={src} onClick={()=>setIdx(i)} alt="" style={{width:56,height:44,objectFit:"cover",borderRadius:6,cursor:"pointer",flexShrink:0,border:`2px solid ${i===idx?PL:"transparent"}`}}/>
          ))}
        </div>
      )}
    </div>
  );
}


// ── MODALS ───────────────────────────────────────────────────────────────────

function StaffLoginModal({onLogin,onClose,pop}){
  const [email,setEmail]=useState("");
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");
  const go=async()=>{
    setErr("");
    try{ await onLogin(email,pin); }catch(e){ setErr(e.message||"Invalid credentials"); }
  };
  return(
    <Modal title="Staff Login" onClose={onClose}>
      <Inp label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@spa.com"/>
      <Inp label="PIN" type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter your PIN" maxLength={6} onKeyDown={e=>e.key==="Enter"&&go()}/>
      {err&&<div style={{background:ERB,color:ER,borderRadius:8,padding:"9px 12px",fontSize:13,marginBottom:12,fontWeight:700}}>{err}</div>}
      <Btn onClick={go} style={{width:"100%",justifyContent:"center"}}>Login</Btn>
    </Modal>
  );
}

function CustAuthModal({mode,setMode,onLogin,onRegister,onClose,bookingIntent}){
  const [form,setForm]=useState({name:"",email:"",phone:"",password:""});
  const [err,setErr]=useState("");
  const go=async()=>{
    setErr("");
    try{
      if(mode==="login") await onLogin(form.email,form.password);
      else await onRegister({name:form.name,email:form.email,phone:form.phone,password:form.password});
    }catch(e){ setErr(e.message||"Failed"); }
  };
  return(
    <Modal title={mode==="login"?"Sign In":"Create Account"} onClose={onClose}>
      {bookingIntent&&<div style={{background:PLF,border:`1px solid ${PL}30`,borderRadius:8,padding:"10px 12px",marginBottom:14,fontSize:13,color:PL,fontWeight:700}}>💆 Sign in to confirm your appointment booking</div>}
      {mode==="register"&&<Inp label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name"/>}
      <Inp label="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="your@email.com"/>
      {mode==="register"&&<Inp label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+255 7XX…"/>}
      <Inp label="Password" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Password" onKeyDown={e=>e.key==="Enter"&&go()}/>
      {err&&<div style={{background:ERB,color:ER,borderRadius:8,padding:"9px 12px",fontSize:13,marginBottom:12,fontWeight:700}}>{err}</div>}
      <Btn onClick={go} style={{width:"100%",justifyContent:"center",marginBottom:12}}>{mode==="login"?"Sign In":"Create Account"}</Btn>
      <div style={{textAlign:"center",fontSize:13,color:G6}}>
        {mode==="login"?<>Don't have an account? <button onClick={()=>setMode("register")} style={{background:"none",border:"none",color:PL,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Sign up</button></>:<>Already have an account? <button onClick={()=>setMode("login")} style={{background:"none",border:"none",color:PL,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Sign in</button></>}
      </div>
    </Modal>
  );
}

function NewApptModal({therapists,rooms,services,pricing,payMethods,offers,user,pop,onClose,onSave}){
  const [form,setForm]=useState({customerName:"",customerPhone:"",customerEmail:"",therapistId:"",roomId:"",serviceType:"inhouse",outcallAddr:"",date:td(),time:"10:00",selServices:[],disc:0,discT:"pct",method:"Cash",notes:""});

  const getP=(sId,rt,st)=>{const p=pricing.find(p=>p.service_id===sId&&p.room_type===rt&&p.service_type===st)||pricing.find(p=>p.service_id===sId&&p.service_type===st);return p?Number(p.price):0;};
  const rmRoomId=form.roomId||null;
  const base=form.selServices.reduce((s,sv)=>s+getP(sv.id,rmRoomId,form.serviceType),0);
  const disc=form.discT==="pct"?Math.round(base*form.disc/100):Number(form.disc);
  const total=Math.max(0,base-disc);

  const toggleSvc=(sv)=>setForm(f=>{const ex=f.selServices.find(s=>s.id===sv.id);if(ex) return {...f,selServices:f.selServices.filter(s=>s.id!==sv.id)};return {...f,selServices:[...f.selServices,{id:sv.id,name:sv.name,price:getP(sv.id,rmRoomId,f.serviceType)}]};});

  const save=async()=>{
    if(!form.customerName||!form.customerPhone||form.selServices.length===0) return pop("Name, phone, and at least one service required","err");
    try{
      const u=await api.createAppt({customer_name:form.customerName,customer_phone:form.customerPhone,customer_email:form.customerEmail,therapist_id:form.therapistId||null,room_id:form.roomId||null,service_type:form.serviceType,outcall_address:form.outcallAddr,appt_date:form.date,appt_time:form.time,duration_min:60,services:form.selServices,base_amount:base,discount:form.disc,discount_type:form.discT,total_amount:total,paid_amount:0,payment_method:form.method,notes:form.notes,status:"confirmed",staff_id:user?.id});
      onSave(u);
    }catch(e){pop(e.message,"err");}
  };

  return(
    <Modal title="New Appointment" onClose={onClose} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        <Inp label="Client Name *" value={form.customerName} onChange={e=>setForm(f=>({...f,customerName:e.target.value}))}/>
        <Inp label="Phone *" value={form.customerPhone} onChange={e=>setForm(f=>({...f,customerPhone:e.target.value}))}/>
        <Inp label="Email" value={form.customerEmail} onChange={e=>setForm(f=>({...f,customerEmail:e.target.value}))}/>
        <Sel label="Therapist" value={form.therapistId} onChange={e=>setForm(f=>({...f,therapistId:e.target.value}))}>
          <option value="">Any Available</option>
          {therapists.filter(t=>t.active).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </Sel>
        <Inp label="Date" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        <Inp label="Time" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Service Type</label>
        <div style={{display:"flex",gap:8}}>
          {["inhouse","outcall"].map(v=><button key={v} onClick={()=>setForm(f=>({...f,serviceType:v,roomId:v==="outcall"?"":f.roomId}))} style={{padding:"7px 14px",borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${form.serviceType===v?PL:G2}`,background:form.serviceType===v?PLF:WH,color:form.serviceType===v?PL:G6}}>{v==="inhouse"?"🏢 In-House":"🏠 Outcall"}</button>)}
        </div>
      </div>
      {form.serviceType==="inhouse"&&<Sel label="Room" value={form.roomId} onChange={e=>setForm(f=>({...f,roomId:e.target.value}))}><option value="">Select room…</option>{rooms.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</Sel>}
      {form.serviceType==="outcall"&&<Inp label="Outcall Address" value={form.outcallAddr} onChange={e=>setForm(f=>({...f,outcallAddr:e.target.value}))} placeholder="Hotel/address"/>}
      {/* Services */}
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:G8,marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Services *</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:160,overflowY:"auto"}}>
          {services.filter(s=>s.active).map(sv=>{const price=getP(sv.id,rmRoomId,form.serviceType);const sel=form.selServices.find(s=>s.id===sv.id);return<button key={sv.id} onClick={()=>toggleSvc(sv)} style={{padding:"6px 11px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${sel?PL:G2}`,background:sel?PLF:WH,color:sel?PL:G6}}>{sv.name}{price?` · ${fmt(price)}`:""}</button>;})}
        </div>
      </div>
      {form.selServices.length>0&&<div style={{background:PLF,borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:13}}>{form.selServices.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span>{s.name}</span><span style={{fontWeight:700}}>{fmt(getP(s.id,rmRoomId,form.serviceType))}</span></div>)}<div style={{borderTop:`1px solid ${PL}20`,paddingTop:6,marginTop:4,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Total</span><span style={{color:PL}}>{fmt(total)}</span></div></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <Inp label="Discount" type="number" value={form.disc} onChange={e=>setForm(f=>({...f,disc:e.target.value}))} style={{marginBottom:0}}/>
        <Sel label="Type" value={form.discT} onChange={e=>setForm(f=>({...f,discT:e.target.value}))} style={{marginBottom:0}}><option value="pct">%</option><option value="fix">TZS</option></Sel>
        <Sel label="Method" value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))} style={{marginBottom:0}}>{payMethods.map(m=><option key={m} value={m}>{m}</option>)}</Sel>
      </div>
      <Txa label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{marginTop:10}}/>
      <div style={{display:"flex",gap:10,marginTop:14}}>
        <Btn v="ghost" onClick={onClose} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
        <Btn onClick={save} disabled={!form.customerName||!form.customerPhone||form.selServices.length===0} style={{flex:1,justifyContent:"center"}}>Create Appointment</Btn>
      </div>
    </Modal>
  );
}

function TherapistCommissionTab({ therapistUser, data }) {
  const [dateFrom, setDateFrom] = useState(()=>{
    const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-01";
  });
  const [dateTo,  setDateTo]  = useState(()=>new Date().toISOString().split("T")[0]);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        api.getCommission(dateFrom, dateTo),
        api.getPayouts(therapistUser.id),
      ]);
      setReport(r);
      setPayouts(Array.isArray(p) ? p : []);
    } catch(e) { console.warn("Commission load error:", e.message); }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const presets = [
    ["This Month", ()=>{ const d=new Date(); setDateFrom(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-01"); setDateTo(new Date().toISOString().split("T")[0]); }],
    ["Last Month", ()=>{ const d=new Date(); d.setMonth(d.getMonth()-1); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"); setDateFrom(`${y}-${m}-01`); setDateTo(new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().split("T")[0]); }],
    ["This Year",  ()=>{ const y=new Date().getFullYear(); setDateFrom(`${y}-01-01`); setDateTo(`${y}-12-31`); }],
  ];

  // Find this therapist's data in the report
  const myData = report?.therapist_commissions?.find(t => t.therapist_id === therapistUser.id);
  const totalPaidOut = payouts.reduce((s,p)=>s+Number(p.amount),0);
  const remaining    = Math.max(0, (myData?.commission_amount||0) - totalPaidOut);

  return (
    <div>
      {/* Period selector */}
      <Card style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif",marginBottom:12}}>💵 My Earnings</div>
        <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
          {presets.map(([l,fn])=>(
            <button key={l} onClick={()=>{ fn(); setTimeout(load,50); }}
              style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,border:`1px solid ${G2}`,background:WH,color:G6,cursor:"pointer",fontFamily:"inherit"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{padding:"6px 9px",border:`1px solid ${G2}`,borderRadius:7,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <span style={{color:G4}}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{padding:"6px 9px",border:`1px solid ${G2}`,borderRadius:7,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <button onClick={load}
            style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${PL}`,background:PLF,color:PL,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            Calculate
          </button>
        </div>
        {(dateFrom||dateTo)&&<div style={{marginTop:6,fontSize:12,color:G6}}>{dateFrom} → {dateTo}</div>}
      </Card>

      {loading&&<div style={{textAlign:"center",padding:30,color:G4}}>Calculating…</div>}

      {!loading&&(
        <div>
          {/* Summary cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:WH,border:`1px solid ${G2}`,borderRadius:12,padding:"16px"}}>
              <div style={{fontSize:11,color:G6,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>💰 Revenue Generated</div>
              <div style={{fontSize:26,fontWeight:700,color:PL,fontFamily:"'Playfair Display',serif"}}>{fmt(myData?.revenue||0)}</div>
              {myData&&(
                <div style={{fontSize:11,color:G4,marginTop:4}}>
                  Appointments: {fmt(myData.appt_revenue||0)} · Walk-ins: {fmt(myData.recep_revenue||0)}
                </div>
              )}
            </div>
            <div style={{background:WH,border:`1px solid ${G2}`,borderRadius:12,padding:"16px"}}>
              <div style={{fontSize:11,color:G6,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>📊 Commission Rate</div>
              <div style={{fontSize:26,fontWeight:700,color:BK,fontFamily:"'Playfair Display',serif"}}>{data.commission_pct||0}%</div>
              <div style={{fontSize:11,color:G4,marginTop:4}}>Set by management</div>
            </div>
            <div style={{background:OKB,border:`1px solid ${OK}20`,borderRadius:12,padding:"16px"}}>
              <div style={{fontSize:11,color:OK,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>✅ Total Earned</div>
              <div style={{fontSize:26,fontWeight:700,color:OK,fontFamily:"'Playfair Display',serif"}}>{fmt(myData?.commission_amount||0)}</div>
              <div style={{fontSize:11,color:G4,marginTop:4}}>{data.commission_pct||0}% of {fmt(myData?.revenue||0)}</div>
            </div>
            <div style={{background:remaining>0?ERB:OKB,border:`1px solid ${remaining>0?ER:OK}20`,borderRadius:12,padding:"16px"}}>
              <div style={{fontSize:11,color:remaining>0?ER:OK,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>
                {remaining>0?"⏳ Pending Payout":"✓ Fully Paid"}
              </div>
              <div style={{fontSize:26,fontWeight:700,color:remaining>0?ER:OK,fontFamily:"'Playfair Display',serif"}}>{fmt(remaining)}</div>
              <div style={{fontSize:11,color:G4,marginTop:4}}>Paid out: {fmt(totalPaidOut)}</div>
            </div>
          </div>

          {!myData&&(
            <div style={{textAlign:"center",padding:"24px 20px",background:WH,borderRadius:12,border:`1px solid ${G2}`,color:G4,fontSize:14,marginBottom:16}}>
              No sessions recorded for this period
            </div>
          )}

          {/* Payout history */}
          <Card>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>📋 Payout History</div>
            {payouts.length===0
              ? <div style={{color:G4,fontSize:13,textAlign:"center",padding:12}}>No payouts recorded yet for this account</div>
              : payouts.map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${G1}`}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:OKB,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>💵</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:OK}}>{fmt(p.amount)}</div>
                    <div style={{fontSize:11,color:G6}}>{fmtDate(p.period_from)} → {fmtDate(p.period_to)}</div>
                    {p.notes&&<div style={{fontSize:11,color:G4}}>{p.notes}</div>}
                  </div>
                  <div style={{fontSize:11,color:G4,textAlign:"right"}}>{fmtDate(p.created_at)}</div>
                </div>
              ))
            }
          </Card>
        </div>
      )}
    </div>
  );
}

// ── THERAPIST PORTAL ──────────────────────────────────────────────────────────
function TherapistPortal({ therapistUser, setTherapistUser, therapistLogout, pricing, services, rooms, pop }) {
  const [tab, setTab] = useState("profile");
  const [data, setData] = useState(therapistUser);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    try {
      const all = await api.getTherapists();
      const me = all.find(t => t.id === therapistUser.id);
      if (me) { setData(me); setTherapistUser(d=>({...d,...me})); try{localStorage.setItem("spa_therapist",JSON.stringify({...therapistUser,...me}));}catch{} }
    } catch {}
  };

  useEffect(()=>{ refresh(); },[]);

  const isMobile = typeof window!=="undefined" && window.innerWidth < 640;
  const avColors = { available:"#34C759", outcall_only:"#FF9500", unavailable:"#FF3B30" };
  const avLabels = { available:"🟢 Available", outcall_only:"🟡 Outcall Only", unavailable:"🔴 Unavailable" };

  return (
    <div style={{minHeight:"100vh",background:G1,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingTop:62}}>
      {/* Header */}
      <div style={{background:BK,height:62,display:"flex",alignItems:"center",padding:"0 18px",justifyContent:"space-between",position:"fixed",top:0,left:0,right:0,zIndex:200,boxShadow:"0 2px 12px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:PL,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:WH,fontWeight:900,fontSize:9,fontFamily:"'Playfair Display',serif",letterSpacing:".02em"}}>MTZ</span>
          </div>
          {!isMobile&&<div style={{color:WH,fontWeight:700,fontSize:14,fontFamily:"'Playfair Display',serif"}}>MASSAGE TZ</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6,color:WH,fontSize:13}}>
            <span style={{fontSize:18}}>💆</span>
            {!isMobile&&<span style={{fontWeight:700}}>{data.name}</span>}
            <span style={{background:avColors[data.availability]+"30",color:avColors[data.availability],padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:700}}>{avLabels[data.availability]||data.availability}</span>
          </div>
          <button onClick={therapistLogout} style={{background:"transparent",color:G4,border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"6px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Logout</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:WH,borderBottom:`1px solid ${G2}`,display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",position:"sticky",top:62,zIndex:100}}>
        {[["profile","My Profile","👤"],["photos","My Photos","📷"],["status","Availability","🟢"],["commission","My Earnings","💵"],["pin","Change PIN","🔑"]].map(([id,label,icon])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"13px 18px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,fontWeight:700,color:tab===id?PL:G6,borderBottom:`3px solid ${tab===id?PL:"transparent"}`,fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 14px 60px"}}>

        {/* ── PROFILE TAB ── */}
        {tab==="profile"&&<TherapistProfileTab data={data} setData={setData} therapistUser={therapistUser} setTherapistUser={setTherapistUser} pop={pop} setSaving={setSaving}/>}

        {/* ── PHOTOS TAB ── */}
        {tab==="photos"&&<TherapistPhotosTab data={data} setData={setData} therapistUser={therapistUser} setTherapistUser={setTherapistUser} pop={pop}/>}

        {/* ── AVAILABILITY TAB ── */}
        {tab==="status"&&<TherapistStatusTab data={data} setData={setData} therapistUser={therapistUser} setTherapistUser={setTherapistUser} pop={pop}/>}

        {/* ── COMMISSION TAB ── */}
        {tab==="commission"&&<TherapistCommissionTab therapistUser={therapistUser} data={data}/>}

        {/* ── PIN TAB ── */}
        {tab==="pin"&&<TherapistPinTab data={data} therapistUser={therapistUser} pop={pop}/>}
      </div>
    </div>
  );
}

function TherapistProfileTab({ data, setData, therapistUser, setTherapistUser, pop }) {
  const [form, setForm] = useState({
    name:        data.name||"",
    phone:       data.phone||"",
    email:       data.email||"",
    bio:         data.bio||"",
    specialties: (data.specialties||[]).join(", "),
    outcall:     data.outcall!==false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const specs = form.specialties.split(",").map(s=>s.trim()).filter(Boolean);
      const payload = { name:form.name, phone:form.phone, email:form.email, bio:form.bio, specialties:specs, outcall:form.outcall };
      const u = await api.updateTherapist(therapistUser.id, payload);
      setData(d=>({...d,...u}));
      const updated = {...therapistUser,...u};
      setTherapistUser(updated);
      try{localStorage.setItem("spa_therapist",JSON.stringify(updated));}catch{}
      pop("Profile updated ✓");
    } catch(e){ pop(e.message||"Failed","err"); }
    setSaving(false);
  };

  return (
    <div>
      {/* Profile card */}
      <div style={{background:WH,borderRadius:14,border:`1px solid ${G2}`,padding:20,marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
        {data.photo||data.photos?.[0]?(
          <img src={data.photo||data.photos[0]} alt={data.name}
            style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",border:`3px solid ${PL}`,flexShrink:0}}/>
        ):(
          <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${PLD},${PL})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:WH,fontFamily:"'Playfair Display',serif",fontWeight:700,flexShrink:0}}>{data.name?.[0]}</div>
        )}
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:BK,marginBottom:4}}>{data.name}</div>
          <div style={{fontSize:12,color:G6}}>{(data.specialties||[]).join(" · ")||"No specialties set"}</div>
          <div style={{fontSize:11,color:data.outcall?PL:G4,marginTop:4,fontWeight:700}}>{data.outcall?"✓ Accepts outcall":"In-house only"}</div>
        </div>
      </div>

      <Card>
        <Inp label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Inp label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+255 7XX…"/>
          <Inp label="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="your@email.com"/>
        </div>
        <Inp label="Specialties (comma separated)" value={form.specialties} onChange={e=>setForm(f=>({...f,specialties:e.target.value}))} placeholder="Swedish Massage, Deep Tissue, Hot Stone…"/>
        <Txa label="Bio / About Me" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={3} placeholder="Tell clients a bit about your experience and approach…"/>
        <div style={{marginBottom:16}}>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14}}>
            <input type="checkbox" checked={form.outcall} onChange={e=>setForm(f=>({...f,outcall:e.target.checked}))}
              style={{width:18,height:18,accentColor:PL}}/>
            <span><strong>I accept outcall requests</strong> <span style={{color:G6,fontWeight:400}}>(home, hotel visits)</span></span>
          </label>
        </div>
        <Btn onClick={save} disabled={saving||!form.name} style={{width:"100%",justifyContent:"center"}}>
          {saving?"Saving…":"Save Profile"}
        </Btn>
      </Card>
    </div>
  );
}

function TherapistPhotosTab({ data, setData, therapistUser, setTherapistUser, pop }) {
  const [photos, setPhotos] = useState(data.photos||[]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const MAX_PHOTOS = 5;

  const addPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (photos.length >= MAX_PHOTOS) return pop(`Max ${MAX_PHOTOS} photos allowed`,"err");
    setUploading(true);
    const b64 = await compressPhoto(file);
    setPhotos(p=>[...p,b64]);
    setUploading(false);
    e.target.value="";
  };

  const removePhoto = (i) => setPhotos(p=>p.filter((_,idx)=>idx!==i));
  const moveUp = (i) => { if(i===0) return; setPhotos(p=>{const n=[...p];[n[i-1],n[i]]=[n[i],n[i-1]];return n;}); };

  const save = async () => {
    setSaving(true);
    try {
      const u = await api.updateTherapist(therapistUser.id, { photos, photo: photos[0]||data.photo||null });
      setData(d=>({...d,...u}));
      const updated = {...therapistUser,...u};
      setTherapistUser(updated);
      try{localStorage.setItem("spa_therapist",JSON.stringify(updated));}catch{}
      pop("Photos saved ✓");
    } catch(e){ pop(e.message||"Failed","err"); }
    setSaving(false);
  };

  return (
    <div>
      <Card>
        <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>📷 My Photos</div>
        <div style={{fontSize:13,color:G6,marginBottom:16}}>Add up to {MAX_PHOTOS} photos. The first photo is your profile picture. Drag to reorder.</div>

        {/* Photo grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:16}}>
          {photos.map((src,i)=>(
            <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",border:`2px solid ${i===0?PL:G2}`}}>
              <div style={{paddingTop:"100%",position:"relative"}}>
                <img src={src} alt={`Photo ${i+1}`} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
              </div>
              {i===0&&<div style={{position:"absolute",top:6,left:6,background:PL,color:WH,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99}}>Main Photo</div>}
              <div style={{position:"absolute",top:6,right:6,display:"flex",flexDirection:"column",gap:4}}>
                {i>0&&<button onClick={()=>moveUp(i)} style={{width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,.6)",color:WH,border:"none",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}} title="Move up">↑</button>}
                <button onClick={()=>removePhoto(i)} style={{width:24,height:24,borderRadius:"50%",background:"rgba(200,0,0,.8)",color:WH,border:"none",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            </div>
          ))}

          {/* Add photo slot */}
          {photos.length < MAX_PHOTOS && (
            <label style={{paddingTop:"100%",position:"relative",borderRadius:10,border:`2px dashed ${G2}`,cursor:"pointer",display:"block"}}>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,color:G4}}>
                {uploading?<div style={{fontSize:11,fontWeight:700}}>Uploading…</div>:<><span style={{fontSize:28}}>+</span><span style={{fontSize:11,fontWeight:700}}>Add Photo</span><span style={{fontSize:10}}>{photos.length}/{MAX_PHOTOS}</span></>}
              </div>
              <input type="file" accept="image/*" onChange={addPhoto} style={{display:"none"}} disabled={uploading}/>
            </label>
          )}
        </div>

        <Btn onClick={save} disabled={saving} style={{width:"100%",justifyContent:"center"}}>
          {saving?"Saving…":"Save Photos"}
        </Btn>
        <div style={{fontSize:12,color:G4,textAlign:"center",marginTop:8}}>Photos appear on the booking page and your public profile</div>
      </Card>
    </div>
  );
}

function TherapistStatusTab({ data, setData, therapistUser, setTherapistUser, pop }) {
  const [availability, setAvailability] = useState(data.availability||"available");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const u = await api.updateTherapist(therapistUser.id, { availability });
      setData(d=>({...d,...u}));
      const updated = {...therapistUser,...u,availability};
      setTherapistUser(updated);
      try{localStorage.setItem("spa_therapist",JSON.stringify(updated));}catch{}
      pop("Status updated ✓");
    } catch(e){ pop(e.message||"Failed","err"); }
    setSaving(false);
  };

  const OPTIONS = [
    { value:"available",    icon:"🟢", label:"Available",      sub:"Accepting both in-house and outcall bookings", color:OK },
    { value:"outcall_only", icon:"🟡", label:"Outcall Only",   sub:"Not at the office — available for home/hotel visits only", color:WA },
    { value:"unavailable",  icon:"🔴", label:"Unavailable",    sub:"Off duty — not accepting any bookings right now", color:ER },
  ];

  return (
    <div>
      <Card>
        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🟢 My Availability Status</div>
        <div style={{fontSize:13,color:G6,marginBottom:20}}>Update your current status so clients and reception know your availability in real time.</div>

        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
          {OPTIONS.map(opt=>(
            <div key={opt.value} onClick={()=>setAvailability(opt.value)}
              style={{border:`2px solid ${availability===opt.value?opt.color:G2}`,background:availability===opt.value?opt.color+"12":WH,borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .15s"}}>
              <span style={{fontSize:28,flexShrink:0}}>{opt.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:availability===opt.value?opt.color:BK}}>{opt.label}</div>
                <div style={{fontSize:13,color:G6,marginTop:2}}>{opt.sub}</div>
              </div>
              <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${availability===opt.value?opt.color:G2}`,background:availability===opt.value?opt.color:"none",flexShrink:0}}/>
            </div>
          ))}
        </div>

        {/* Current status summary */}
        <div style={{background:G1,borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13}}>
          <span style={{color:G6}}>Current status: </span>
          <strong style={{color:OPTIONS.find(o=>o.value===data.availability)?.color||G6}}>{OPTIONS.find(o=>o.value===data.availability)?.label||data.availability}</strong>
          {data.availability!==availability&&<span style={{color:WA}}> → Will change to: <strong>{OPTIONS.find(o=>o.value===availability)?.label}</strong></span>}
        </div>

        <Btn onClick={save} disabled={saving||availability===data.availability} style={{width:"100%",justifyContent:"center",background:OPTIONS.find(o=>o.value===availability)?.color||PL}}>
          {saving?"Saving…":"Update Status"}
        </Btn>
      </Card>
    </div>
  );
}

function TherapistPinTab({ data, therapistUser, pop }) {
  const [form, setForm] = useState({ current:"", newPin:"", confirm:"" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setErr("");
    if (!form.current)            return setErr("Enter your current PIN");
    if (form.newPin.length < 4)   return setErr("New PIN must be at least 4 digits");
    if (!/^\d+$/.test(form.newPin)) return setErr("PIN must be digits only");
    if (form.newPin !== form.confirm) return setErr("PINs do not match");
    setSaving(true);
    try {
      // Verify current PIN via login
      await api.staffLogin({ email: data.email_unique||data.email, pin: form.current });
      // Update PIN
      await api.updateTherapist(therapistUser.id, { pin: form.newPin });
      setForm({ current:"", newPin:"", confirm:"" });
      pop("PIN updated successfully ✓");
    } catch(e){ setErr(e.message||"Incorrect current PIN"); }
    setSaving(false);
  };

  return (
    <Card>
      <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>🔑 Change Login PIN</div>
      <div style={{fontSize:13,color:G6,marginBottom:20}}>Your PIN is used to log into the therapist portal.</div>
      <Inp label="Current PIN" type="password" value={form.current} onChange={e=>setForm(f=>({...f,current:e.target.value}))} placeholder="Enter current PIN" maxLength={6}/>
      <Inp label="New PIN (4–6 digits)" type="password" value={form.newPin} onChange={e=>setForm(f=>({...f,newPin:e.target.value}))} placeholder="New PIN" maxLength={6}/>
      <Inp label="Confirm New PIN" type="password" value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} placeholder="Repeat new PIN" maxLength={6}/>
      {err&&<div style={{background:ERB,color:ER,borderRadius:8,padding:"9px 12px",fontSize:13,marginBottom:12,fontWeight:700}}>{err}</div>}
      <Btn onClick={save} disabled={saving||!form.current||!form.newPin} style={{width:"100%",justifyContent:"center"}}>
        {saving?"Updating…":"Update PIN"}
      </Btn>
    </Card>
  );
}
