import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

/* ─── BRAND ─────────────────────────────────────────────── */
const M = "#6B1B2A", MD = "#4A1019", ML = "#8B2D3E", MF = "#F9F0F2";
const BK = "#111", WH = "#FFF", G1 = "#F5F5F5", G2 = "#E8E8E8";
const G4 = "#AAAAAA", G6 = "#666", G8 = "#333", GOLD = "#C9A84C";
const OK = "#2E7D32", OKB = "#E8F5E9", WA = "#B76E00", WAB = "#FFF3E0";
const ER = "#C62828", ERB = "#FFEBEE", IN = "#1565C0", INB = "#E3F2FD";

const fmt = n => "TZS " + Number(n || 0).toLocaleString();
const uid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const td  = () => new Date().toISOString().split("T")[0];
const dd  = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
const sC = s => ({ available: OK, occupied: M, maintenance: WA, confirmed: IN, checkedIn: M, checkedOut: G6, pending: WA, cancelled: ER }[s] || G6);
const sB = s => ({ available: OKB, occupied: MF, maintenance: WAB, confirmed: INB, checkedIn: MF, checkedOut: G1, pending: WAB, cancelled: ERB }[s] || G1);

/* map DB snake_case → app camelCase */
const mapBook = b => b ? ({
  id: b.id, roomId: b.room_id, locId: b.location_id,
  gName: b.guest_name, gPhone: b.guest_phone, gEmail: b.guest_email, gNat: b.guest_nationality,
  ci: b.check_in?.split?.("T")[0] || b.check_in,
  co: b.check_out?.split?.("T")[0] || b.check_out,
  nights: b.nights, base: Number(b.base_amount), disc: Number(b.discount),
  discT: b.discount_type, total: Number(b.total_amount), paid: Number(b.paid_amount),
  status: b.status, method: b.payment_method, notes: b.notes, created: b.created_at,
}) : null;

const mapRoom = r => r ? ({
  id: r.id, locId: r.location_id, name: r.name, type: r.type,
  beds: r.beds, guests: r.max_guests, price: Number(r.price_per_night),
  status: r.status, amen: r.amenities || [],
}) : null;

const mapLoc = l => l ? ({
  id: l.id, name: l.name, city: l.city, addr: l.address,
  icon: l.icon, desc: l.description,
}) : null;

const mapStaff = s => s ? ({
  id: s.id, name: s.name, email: s.email, phone: s.phone,
  role: s.role, locId: s.location_id, active: s.active, created: s.created_at?.split?.("T")[0],
}) : null;

const mapExp = e => e ? ({
  id: e.id, locId: e.location_id, cat: e.category,
  desc: e.description, amt: Number(e.amount), date: e.expense_date?.split?.("T")[0] || e.expense_date,
}) : null;

const Badge = ({ s, label }) => (
  <span style={{ background: sB(s), color: sC(s), padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>
    {label || s}
  </span>
);
const Card = ({ children, style }) => (
  <div style={{ background: WH, border: `1px solid ${G2}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);
const KPI = ({ label, value, sub, color, icon }) => (
  <div style={{ background: WH, border: `1px solid ${G2}`, borderRadius: 12, padding: "16px 18px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: G6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || BK, fontFamily: "'Playfair Display',serif" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: G6, marginTop: 3 }}>{sub}</div>}
  </div>
);
const Inp = ({ label, ...p }) => (
  <div style={{ marginBottom: 13 }}>
    {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G8, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</label>}
    <input {...p} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${G2}`, borderRadius: 8, fontSize: 14, color: BK, outline: "none", boxSizing: "border-box", fontFamily: "inherit", ...p.style }} />
  </div>
);
const Sel = ({ label, children, ...p }) => (
  <div style={{ marginBottom: 13 }}>
    {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: G8, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</label>}
    <select {...p} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${G2}`, borderRadius: 8, fontSize: 14, color: BK, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: WH }}>{children}</select>
  </div>
);
const Btn = ({ children, onClick, v = "pri", style, disabled }) => {
  const VS = { pri: { background: M, color: WH, border: `1px solid ${M}` }, out: { background: "transparent", color: M, border: `1px solid ${M}` }, ghost: { background: "transparent", color: G6, border: `1px solid ${G2}` }, ok: { background: OK, color: WH, border: `1px solid ${OK}` }, danger: { background: ER, color: WH, border: `1px solid ${ER}` } };
  return <button onClick={onClick} disabled={disabled} style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "opacity .15s", ...VS[v], ...style }}>{children}</button>;
};
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: WH, borderRadius: 16, width: "100%", maxWidth: wide ? 740 : 500, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.22)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${G2}`, position: "sticky", top: 0, background: WH, zIndex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: G4, lineHeight: 1, padding: 0 }}>×</button>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  </div>
);
const Tbl = ({ hdr, rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead><tr style={{ borderBottom: `2px solid ${G2}` }}>{hdr.map((h, i) => <th key={i} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: G6, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${G1}` }}>{r.map((c, j) => <td key={j} style={{ padding: "10px 10px", verticalAlign: "middle" }}>{c}</td>)}</tr>) : <tr><td colSpan={hdr.length} style={{ padding: 28, textAlign: "center", color: G4 }}>No records</td></tr>}</tbody>
    </table>
  </div>
);
const SecTitle = ({ children }) => <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, margin: "0 0 13px", borderLeft: `4px solid ${M}`, paddingLeft: 11, color: BK }}>{children}</h3>;



/* ─── LOADING SPINNER ───────────────────────────────────── */
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: G4, fontSize: 14 }}>
    <div style={{ width: 28, height: 28, border: `3px solid ${G2}`, borderTopColor: M, borderRadius: "50%", animation: "spin .7s linear infinite", marginRight: 12 }} />
    Loading…
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ─── MAIN APP ───────────────────────────────────────────── */
export default function App() {
  const [locs, setLocs]   = useState([]);
  const [rooms, setRooms] = useState([]);
  const [books, setBooks] = useState([]);
  const [exps, setExps]   = useState([]);
  const [staff, setStaff] = useState([]);
  const [user, setUser]   = useState(null);
  const [view, setView]   = useState("land");
  const [aTab, setATab]   = useState("dash");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // booking wizard state
  const [bStep, setBStep] = useState(1);
  const [bD, setBD] = useState({ locId:"", roomId:"", ci:"", co:"", nights:1, name:"", phone:"", email:"", nat:"", guests:1, notes:"", disc:0, discT:"pct", method:"Cash" });
  const [loginF, setLoginF] = useState({ email:"", pin:"" });
  const [loginErr, setLoginErr] = useState("");

  const pop = (msg, t="ok") => { setToast({msg,t}); setTimeout(()=>setToast(null),3200); };

  /* ── LOAD DATA ── */
  const loadAll = useCallback(async (u) => {
    if (!u) return;
    setLoading(true);
    try {
      const locId = u.role === "Admin" ? undefined : u.locId;
      const [l, r, b, e, s] = await Promise.all([
        api.getLocations(),
        api.getRooms(locId),
        api.getBookings(locId),
        api.getExpenses(locId),
        u.role === "Admin" ? api.getStaff() : Promise.resolve([]),
      ]);
      setLocs(l.map(mapLoc));
      setRooms(r.map(mapRoom));
      setBooks(b.map(mapBook));
      setExps(e.map(mapExp));
      setStaff(s.map(mapStaff));
    } catch (err) {
      pop("Failed to load data: " + err.message, "err");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load public data (locations + rooms) for booking portal
  const loadPublic = useCallback(async () => {
    try {
      const [l, r] = await Promise.all([api.getLocations(), api.getRooms()]);
      setLocs(l.map(mapLoc));
      setRooms(r.map(mapRoom));
    } catch (err) {
      pop("Could not load locations. Check your connection.", "err");
    }
  }, []);

  useEffect(() => { loadPublic(); }, [loadPublic]);

  /* ── AUTH ── */
  const doLogin = async () => {
    setLoginErr("");
    try {
      const u = await api.login(loginF.email, loginF.pin);
      setUser(u);
      setView("admin");
      setATab("dash");
      setModal(null);
      await loadAll(u);
    } catch {
      setLoginErr("Invalid email or PIN");
    }
  };

  /* ── BOOKING HELPERS ── */
  const selRoom = rooms.find(r => r.id === bD.roomId);
  const bBase = selRoom ? selRoom.price * bD.nights : 0;
  const bDiscAmt = bD.discT === "pct" ? bBase * bD.disc / 100 : Number(bD.disc);
  const bTotal = bBase - bDiscAmt;

  const confirmBook = async () => {
    try {
      const created = await api.createBooking({
        room_id: bD.roomId, location_id: bD.locId,
        guest_name: bD.name, guest_phone: bD.phone, guest_email: bD.email, guest_nationality: bD.nat,
        check_in: bD.ci, check_out: bD.co, nights: bD.nights,
        base_amount: bBase, discount: bD.disc, discount_type: bD.discT,
        total_amount: bTotal, payment_method: bD.method, notes: bD.notes,
      });
      setBooks(p => [...p, mapBook(created)]);
      pop("Booking confirmed! ID: " + created.id);
      setBStep(5);
    } catch (err) {
      pop("Booking failed: " + err.message, "err");
    }
  };

  /* ── ADMIN ACTIONS ── */
  const updBook = async (id, status) => {
    try {
      const updated = await api.updateBooking(id, { status });
      setBooks(p => p.map(b => b.id === id ? mapBook(updated) : b));
      // Also refresh room status
      const b = books.find(b => b.id === id);
      if (b) {
        if (status === "checkedIn") setRooms(p => p.map(r => r.id === b.roomId ? { ...r, status: "occupied" } : r));
        if (status === "checkedOut" || status === "cancelled") setRooms(p => p.map(r => r.id === b.roomId ? { ...r, status: "available" } : r));
      }
      pop("Status updated");
    } catch (err) { pop(err.message, "err"); }
  };

  const recPay = async (id, amount) => {
    try {
      const updated = await api.recordPayment(id, Number(amount));
      setBooks(p => p.map(b => b.id === id ? mapBook(updated) : b));
      pop("Payment recorded");
    } catch (err) { pop(err.message, "err"); }
  };

  const saveRoom = async (form, isEdit, statusOverride) => {
    try {
      const amen = typeof form.amen === "string" ? form.amen.split(",").map(a=>a.trim()).filter(Boolean) : form.amen;
      const payload = {
        location_id: form.locId, name: form.name, type: form.type,
        beds: Number(form.beds), max_guests: Number(form.guests),
        price_per_night: Number(form.price),
        status: statusOverride || form.status,
        amenities: amen,
      };
      if (isEdit) {
        const updated = await api.updateRoom(form.id, payload);
        setRooms(p => p.map(r => r.id === form.id ? mapRoom(updated) : r));
        pop(statusOverride ? "Status updated" : "Room updated");
      } else {
        const created = await api.createRoom(payload);
        setRooms(p => [...p, mapRoom(created)]);
        pop("Room created");
      }
    } catch (err) { pop(err.message, "err"); }
  };

  const saveExp = async (form) => {
    try {
      const created = await api.createExpense({
        location_id: form.locId, category: form.cat,
        description: form.desc, amount: Number(form.amt), expense_date: form.date,
        staff_id: user?.id,
      });
      setExps(p => [...p, mapExp(created)]);
      pop("Expense recorded");
    } catch (err) { pop(err.message, "err"); }
  };

  const saveStaff = async (form, isEdit) => {
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role, location_id: form.locId || null, pin: form.pin };
      if (isEdit) {
        const updated = await api.updateStaff(form.id, payload);
        setStaff(p => p.map(s => s.id === form.id ? mapStaff(updated) : s));
        pop("Staff updated");
      } else {
        const created = await api.createStaff(payload);
        setStaff(p => [...p, mapStaff(created)]);
        pop("Account created");
      }
    } catch (err) { pop(err.message, "err"); }
  };

  const toggleStaff = async (s) => {
    try {
      const updated = await api.updateStaff(s.id, { active: !s.active });
      setStaff(p => p.map(st => st.id === s.id ? mapStaff(updated) : st));
      pop(!s.active ? "Activated" : "Deactivated");
    } catch (err) { pop(err.message, "err"); }
  };

  const saveLoc = async (form, isEdit) => {
    try {
      if (isEdit) {
        const updated = await api.updateLocation(form.id, { name: form.name, city: form.city, address: form.addr, icon: form.icon, description: form.desc });
        setLocs(p => p.map(l => l.id === form.id ? mapLoc(updated) : l));
        pop("Location updated");
      } else {
        const created = await api.createLocation({ name: form.name, city: form.city, address: form.addr, icon: form.icon, description: form.desc });
        setLocs(p => [...p, mapLoc(created)]);
        pop("Location added");
      }
    } catch (err) { pop(err.message, "err"); }
  };

  const createNewBooking = async (form, base, da, total) => {
    try {
      const created = await api.createBooking({
        room_id: form.roomId, location_id: form.locId,
        guest_name: form.name, guest_phone: form.phone, guest_email: form.email,
        guest_nationality: form.nat, check_in: form.ci, check_out: form.co, nights: form.nights,
        base_amount: base, discount: form.disc, discount_type: form.discT,
        total_amount: total, paid_amount: Number(form.paid),
        payment_method: form.method, notes: form.notes, staff_id: user?.id,
      });
      setBooks(p => [...p, mapBook(created)]);
      setModal(null);
      pop("Booking created: " + created.id);
    } catch (err) { pop(err.message, "err"); }
  };

  const ATABS = [
    { id:"dash",label:"Dashboard",icon:"📊" }, { id:"books",label:"Bookings",icon:"📋" },
    { id:"rooms",label:"Rooms",icon:"🛏️" }, { id:"pays",label:"Payments",icon:"💳" },
    { id:"exps",label:"Expenses",icon:"📤" }, { id:"reports",label:"Reports",icon:"📈" },
    ...(user?.role === "Admin" ? [{ id:"locs",label:"Locations",icon:"📍" }, { id:"staff",label:"Staff",icon:"👥" }] : []),
  ];

  const NavBar = () => (
    <nav style={{ background: BK, height: 62, display:"flex", alignItems:"center", padding:"0 28px", justifyContent:"space-between", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>setView("land")}>
        <div style={{ width:36, height:36, background:M, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:WH, fontWeight:900, fontSize:12, fontFamily:"'Playfair Display',serif" }}>BNC</span>
        </div>
        <div>
          <div style={{ color:WH, fontWeight:700, fontSize:15, fontFamily:"'Playfair Display',serif", lineHeight:1.2 }}>BNC Apartment</div>
          <div style={{ color:G4, fontSize:10, letterSpacing:".12em", textTransform:"uppercase" }}>Lodge & Stays</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {view !== "book" && <button onClick={()=>{setView("book");setBStep(1);}} style={{ background:"transparent", color:WH, border:"1px solid rgba(255,255,255,.25)", borderRadius:8, padding:"7px 14px", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Book a Room</button>}
        {user
          ? <button onClick={()=>{setUser(null);setView("land");}} style={{ background:M, color:WH, border:"none", borderRadius:8, padding:"7px 14px", fontSize:13, cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>Logout</button>
          : <button onClick={()=>setModal("login")} style={{ background:M, color:WH, border:"none", borderRadius:8, padding:"7px 14px", fontSize:13, cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>Staff Login</button>}
      </div>
    </nav>
  );

  const LoginMod = () => (
    <Modal title="Staff Login" onClose={()=>{setModal(null);setLoginErr("");}}>
      <div style={{ background:MF, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:M }}>
        <strong>Login with your staff email and PIN</strong>
      </div>
      <Inp label="Email" type="email" value={loginF.email} onChange={e=>setLoginF(f=>({...f,email:e.target.value}))} placeholder="your@email.com"/>
      <Inp label="PIN" type="password" value={loginF.pin} onChange={e=>setLoginF(f=>({...f,pin:e.target.value}))} placeholder="••••" maxLength={6}/>
      {loginErr && <div style={{ color:ER, fontSize:13, marginBottom:12 }}>{loginErr}</div>}
      <Btn onClick={doLogin} style={{ width:"100%", justifyContent:"center" }}>Login to Dashboard</Btn>
    </Modal>
  );

  /* ── LANDING ── */
  if (view === "land") return (
    <div style={{ minHeight:"100vh", background:WH, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <NavBar/>
      <div style={{ background:`linear-gradient(135deg,${BK} 0%,${MD} 50%,${M} 100%)`, padding:"80px 28px", textAlign:"center" }}>
        <div style={{ color:GOLD, fontSize:12, letterSpacing:".2em", textTransform:"uppercase", marginBottom:14 }}>✦ Premium Lodge & Serviced Apartments ✦</div>
        <h1 style={{ color:WH, fontSize:52, fontWeight:900, margin:"0 0 14px", fontFamily:"'Playfair Display',serif", lineHeight:1.15 }}>
          Your Home<br/><span style={{ color:GOLD }}>Away From Home</span>
        </h1>
        <p style={{ color:"rgba(255,255,255,.7)", fontSize:17, maxWidth:480, margin:"0 auto 32px", lineHeight:1.7 }}>
          Luxury serviced apartments across Tanzania. Book direct for the best rates.
        </p>
        <button onClick={()=>setView("book")} style={{ background:M, color:WH, border:`2px solid ${GOLD}`, borderRadius:10, padding:"13px 34px", fontSize:16, cursor:"pointer", fontWeight:700, fontFamily:"'Playfair Display',serif" }}>
          Explore & Book →
        </button>
      </div>
      <div style={{ padding:"56px 28px", maxWidth:1060, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ color:M, fontSize:12, letterSpacing:".18em", textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>Our Properties</div>
          <h2 style={{ fontSize:34, fontWeight:700, color:BK, fontFamily:"'Playfair Display',serif", margin:0 }}>Choose Your Location</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:22 }}>
          {locs.map(loc => {
            const avail = rooms.filter(r=>r.locId===loc.id&&r.status==="available").length;
            return (
              <div key={loc.id}
                onClick={()=>{setBD(d=>({...d,locId:loc.id}));setView("book");setBStep(2);}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.boxShadow=`0 14px 36px rgba(107,27,42,.16)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}
                style={{ background:WH, border:`1px solid ${G2}`, borderRadius:16, overflow:"hidden", cursor:"pointer", transition:"transform .2s,box-shadow .2s" }}>
                <div style={{ background:`linear-gradient(135deg,${MD},${M})`, height:140, display:"flex", alignItems:"center", justifyContent:"center", fontSize:56 }}>{loc.icon}</div>
                <div style={{ padding:20 }}>
                  <div style={{ fontSize:11, color:M, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>{loc.city}</div>
                  <h3 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:BK, fontFamily:"'Playfair Display',serif" }}>{loc.name}</h3>
                  <p style={{ margin:"0 0 14px", fontSize:14, color:G6, lineHeight:1.6 }}>{loc.desc}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:avail>0?OK:ER, fontWeight:700 }}>{avail>0?`✓ ${avail} rooms available`:"No availability"}</span>
                    <span style={{ fontSize:12, color:M, fontWeight:700 }}>View →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {modal==="login" && <LoginMod/>}
    </div>
  );

  if (view === "book") return (
    <div style={{ minHeight: "100vh", background: G1, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <NavBar />
      {/* Step progress */}
      {bStep < 5 && (
        <div style={{ background: WH, borderBottom: `1px solid ${G2}` }}>
          <div style={{ display: "flex", maxWidth: 780, margin: "0 auto" }}>
            {["Location", "Room", "Dates", "Details", "Confirm"].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: "13px 0", textAlign: "center", borderBottom: `3px solid ${bStep === i + 1 ? M : bStep > i + 1 ? OK : "transparent"}`, color: bStep === i + 1 ? M : bStep > i + 1 ? OK : G4, fontSize: 12, fontWeight: 700 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: bStep > i + 1 ? OK : bStep === i + 1 ? M : G2, color: bStep >= i + 1 ? WH : G4, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    {bStep > i + 1 ? "✓" : i + 1}
                  </span>{s}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 16px" }}>
        {/* Step 1 */}
        {bStep === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, marginBottom: 22, color: BK }}>Choose a Location</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              {locs.map(loc => {
                const avail = rooms.filter(r => r.locId === loc.id && r.status === "available").length;
                return (
                  <div key={loc.id} onClick={() => { setBD(d => ({ ...d, locId: loc.id })); setBStep(2); }}
                    style={{ background: WH, borderRadius: 12, overflow: "hidden", cursor: "pointer", border: `2px solid ${bD.locId === loc.id ? M : G2}`, transition: "border-color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = M}
                    onMouseLeave={e => e.currentTarget.style.borderColor = bD.locId === loc.id ? M : G2}>
                    <div style={{ background: `linear-gradient(135deg,${MD},${M})`, height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{loc.icon}</div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontSize: 11, color: M, fontWeight: 700, marginBottom: 4 }}>{loc.city}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: BK, fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>{loc.name}</div>
                      <div style={{ fontSize: 12, color: avail > 0 ? OK : ER, fontWeight: 700 }}>{avail} rooms available</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Step 2 */}
        {bStep === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, marginBottom: 6, color: BK }}>Select a Room</h2>
            <p style={{ color: G6, marginBottom: 20, fontSize: 13 }}>{locs.find(l => l.id === bD.locId)?.name}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rooms.filter(r => r.locId === bD.locId).map(rm => (
                <div key={rm.id}
                  onClick={() => rm.status === "available" && setBD(d => ({ ...d, roomId: rm.id }))}
                  style={{ background: WH, borderRadius: 12, padding: 18, border: `2px solid ${bD.roomId === rm.id ? M : G2}`, cursor: rm.status !== "available" ? "not-allowed" : "pointer", opacity: rm.status !== "available" ? .55 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, transition: "border-color .15s" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: BK, fontFamily: "'Playfair Display',serif" }}>{rm.name}</span>
                      <Badge s={rm.status} />
                    </div>
                    <div style={{ fontSize: 12, color: G6, marginBottom: 7 }}>{rm.type} · {rm.beds} bed · up to {rm.guests} guests</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{rm.amen.map((a, i) => <span key={i} style={{ background: G1, fontSize: 11, padding: "2px 8px", borderRadius: 99, color: G6 }}>{a}</span>)}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: M, fontFamily: "'Playfair Display',serif" }}>{fmt(rm.price)}</div>
                    <div style={{ fontSize: 11, color: G4 }}>per night</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn v="ghost" onClick={() => setBStep(1)}>← Back</Btn>
              <Btn onClick={() => setBStep(3)} disabled={!bD.roomId}>Continue →</Btn>
            </div>
          </div>
        )}
        {/* Step 3 */}
        {bStep === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, marginBottom: 20, color: BK }}>Select Dates</h2>
            <Card>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Inp label="Check-in Date" type="date" value={bD.ci} min={td()}
                  onChange={e => { const ci = e.target.value; const n = bD.co ? dd(ci, bD.co) : 1; setBD(d => ({ ...d, ci, nights: n })); }} />
                <Inp label="Check-out Date" type="date" value={bD.co} min={bD.ci || td()}
                  onChange={e => { const co = e.target.value; const n = bD.ci ? dd(bD.ci, co) : 1; setBD(d => ({ ...d, co, nights: n })); }} />
              </div>
              {bD.ci && bD.co && (
                <div style={{ background: MF, borderRadius: 8, padding: 13, marginTop: 4, fontSize: 14, color: M, fontWeight: 700 }}>
                  {bD.nights} night{bD.nights > 1 ? "s" : ""} · {fmt(selRoom?.price * bD.nights)}
                </div>
              )}
            </Card>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Btn v="ghost" onClick={() => setBStep(2)}>← Back</Btn>
              <Btn onClick={() => setBStep(4)} disabled={!bD.ci || !bD.co}>Continue →</Btn>
            </div>
          </div>
        )}
        {/* Step 4 */}
        {bStep === 4 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, marginBottom: 20, color: BK }}>Your Details</h2>
            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Guest Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                <Inp label="Full Name *" value={bD.name} onChange={e => setBD(d => ({ ...d, name: e.target.value }))} placeholder="John Doe" />
                <Inp label="Phone *" value={bD.phone} onChange={e => setBD(d => ({ ...d, phone: e.target.value }))} placeholder="+255 7XX XXX XXX" />
                <Inp label="Email" type="email" value={bD.email} onChange={e => setBD(d => ({ ...d, email: e.target.value }))} placeholder="your@email.com" />
                <Inp label="Nationality" value={bD.nat} onChange={e => setBD(d => ({ ...d, nat: e.target.value }))} placeholder="Tanzanian" />
                <Sel label="Guests" value={bD.guests} onChange={e => setBD(d => ({ ...d, guests: e.target.value }))}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}</Sel>
                <Sel label="Payment Method" value={bD.method} onChange={e => setBD(d => ({ ...d, method: e.target.value }))}>
                  <option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option>
                </Sel>
              </div>
              <Inp label="Special Requests" value={bD.notes} onChange={e => setBD(d => ({ ...d, notes: e.target.value }))} placeholder="Early check-in, extra towels…" />
            </Card>
            {/* Summary */}
            <Card style={{ background: BK, border: "none" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: GOLD, fontFamily: "'Playfair Display',serif", marginBottom: 12 }}>Booking Summary</div>
              {[[selRoom?.name, "Room"], [locs.find(l => l.id === bD.locId)?.name, "Location"], [bD.ci, "Check-in"], [bD.co, "Check-out"], [bD.nights + " nights", "Duration"], [fmt(selRoom?.price), "Rate/Night"], [fmt(bBase), "Base Total"], bDiscAmt > 0 && [`- ${fmt(bDiscAmt)}`, "Discount"]].filter(Boolean).map(([v, k], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,.65)", padding: "4px 0" }}>
                  <span>{k}</span><span style={{ color: WH, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,.15)", paddingTop: 10, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>Total</span>
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 18, fontFamily: "'Playfair Display',serif" }}>{fmt(bTotal)}</span>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Btn v="ghost" onClick={() => setBStep(3)}>← Back</Btn>
              <Btn onClick={confirmBook} disabled={!bD.name || !bD.phone}>Confirm Booking →</Btn>
            </div>
          </div>
        )}
        {/* Step 5 confirmed */}
        {bStep === 5 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 62, marginBottom: 18 }}>🎉</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: BK, marginBottom: 12 }}>Booking Confirmed!</h2>
            <p style={{ color: G6, fontSize: 15, maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Thank you, <strong>{bD.name}</strong>! Your booking is confirmed. Our team will contact you shortly.
            </p>
            <Card style={{ maxWidth: 380, margin: "0 auto 28px", background: MF, border: `1px solid ${M}30`, textAlign: "left" }}>
              {[[selRoom?.name, "Room"], [locs.find(l => l.id === bD.locId)?.name, "Location"], [bD.ci, "Check-in"], [bD.co, "Check-out"], [fmt(bTotal), "Total"], [bD.method, "Payment"]].map(([v, k]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${M}15` }}>
                  <span style={{ color: G6 }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </Card>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn v="out" onClick={() => { setView("land"); setBStep(1); setBD({ locId: "", roomId: "", ci: "", co: "", nights: 1, name: "", phone: "", email: "", nat: "", guests: 1, notes: "", disc: 0, discT: "pct", method: "Cash" }); }}>← Back to Home</Btn>
              <Btn onClick={() => setModal("login")}>Staff Login</Btn>
            </div>
          </div>
        )}
      </div>
      {modal === "login" && <LoginMod />}
    </div>
  );

  /* ── ADMIN DASHBOARD ── */
  const totRev = books.filter(b=>b.status!=="cancelled").reduce((s,b)=>s+b.paid,0);
  const totExp = exps.reduce((s,e)=>s+e.amt,0);
  const netPro = totRev - totExp;
  const pending = books.reduce((s,b)=>s+(b.total-b.paid),0);
  const occPct = rooms.length ? Math.round(rooms.filter(r=>r.status==="occupied").length/rooms.length*100) : 0;

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:G1, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <NavBar/>
      <div style={{ background:WH, borderBottom:`1px solid ${G2}`, display:"flex", overflowX:"auto", flexShrink:0 }}>
        {ATABS.map(t=>(
          <button key={t.id} onClick={()=>setATab(t.id)} style={{ padding:"12px 16px", border:"none", background:"transparent", cursor:"pointer", fontSize:13, fontWeight:700, color:aTab===t.id?M:G6, borderBottom:`3px solid ${aTab===t.id?M:"transparent"}`, display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", fontFamily:"inherit" }}>
            {t.icon} {t.label}
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 14px", gap:8 }}>
          <button onClick={()=>loadAll(user)} style={{ background:"none", border:`1px solid ${G2}`, borderRadius:7, padding:"6px 12px", fontSize:12, cursor:"pointer", color:G6, fontFamily:"inherit" }}>↻ Refresh</button>
          <Btn onClick={()=>setModal("newBook")} style={{ fontSize:12, padding:"7px 13px" }}>+ New Booking</Btn>
        </div>
      </div>
      <div style={{ flex:1, overflow:"auto", padding:22 }}>
        {loading && <Spinner/>}
        {!loading && aTab==="dash"    && <DashTab books={books} rooms={rooms} exps={exps} locs={locs} allRooms={rooms} totRev={totRev} totExp={totExp} netPro={netPro} pending={pending} occPct={occPct} setATab={setATab}/>}
        {!loading && aTab==="books"   && <BooksTab books={books} rooms={rooms} locs={locs} updBook={updBook} recPay={recPay} onNew={()=>setModal("newBook")} pop={pop}/>}
        {!loading && aTab==="rooms"   && <RoomsTab rooms={rooms} locs={locs} saveRoom={saveRoom} pop={pop}/>}
        {!loading && aTab==="pays"    && <PaysTab books={books} rooms={rooms} recPay={recPay}/>}
        {!loading && aTab==="exps"    && <ExpsTab exps={exps} locs={locs} user={user} saveExp={saveExp} pop={pop}/>}
        {!loading && aTab==="reports" && <ReportsTab books={books} exps={exps} rooms={rooms} locs={locs} allRooms={rooms} user={user}/>}
        {!loading && aTab==="locs"    && user?.role==="Admin" && <LocsTab locs={locs} saveLoc={saveLoc} rooms={rooms} books={books} pop={pop}/>}
        {!loading && aTab==="staff"   && user?.role==="Admin" && <StaffTab staff={staff} saveStaff={saveStaff} toggleStaff={toggleStaff} locs={locs} pop={pop}/>}
      </div>
      {modal==="newBook" && <NewBookModal rooms={rooms} locs={locs} user={user} onClose={()=>setModal(null)} onSave={createNewBooking}/>}
      {modal==="login"   && <LoginMod/>}
      {toast && <div style={{ position:"fixed", bottom:22, right:22, background:toast.t==="ok"?OK:ER, color:WH, padding:"11px 18px", borderRadius:10, fontSize:14, fontWeight:700, zIndex:2000, boxShadow:"0 8px 24px rgba(0,0,0,.2)" }}>{toast.t==="ok"?"✓ ":"✗ "}{toast.msg}</div>}
    </div>
  );
}

function DashTab({ books, rooms, exps, locs, allRooms, totRev, totExp, netPro, pending, occPct, setATab }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: "0 0 18px" }}>Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 13, marginBottom: 22 }}>
        <KPI label="Total Revenue" value={fmt(totRev)} icon="💰" color={M} />
        <KPI label="Net Profit" value={fmt(netPro)} icon="📈" color={netPro >= 0 ? OK : ER} sub={netPro >= 0 ? "Profitable" : "Loss"} />
        <KPI label="Occupancy" value={occPct + "%"} icon="🛏️" sub={`${rooms.filter(r => r.status === "occupied").length}/${rooms.length} rooms`} />
        <KPI label="Outstanding" value={fmt(pending)} icon="⏳" color={WA} sub="Pending payments" />
        <KPI label="Active Stays" value={books.filter(b => ["confirmed", "checkedIn"].includes(b.status)).length} icon="📋" />
        <KPI label="Total Expenses" value={fmt(totExp)} icon="📤" color={ER} />
      </div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <SecTitle>Recent Bookings</SecTitle>
          <button onClick={() => setATab("books")} style={{ background: "none", border: "none", color: M, fontSize: 13, cursor: "pointer", fontWeight: 700 }}>View all →</button>
        </div>
        <Tbl hdr={["ID", "Guest", "Room", "Check-in", "Check-out", "Amount", "Status"]}
          rows={books.slice(-5).reverse().map(b => {
            const rm = allRooms.find(r => r.id === b.roomId);
            return [<span style={{ color: M, fontWeight: 700, fontSize: 12 }}>{b.id}</span>, b.gName, rm?.name || "-", b.ci, b.co, fmt(b.total), <Badge s={b.status} />];
          })} />
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {locs.map(loc => {
          const lr = allRooms.filter(r => r.locId === loc.id);
          const lb = books.filter(b => b.locId === loc.id);
          const lrev = lb.reduce((s, b) => s + b.paid, 0);
          const lexp = exps.filter(e => e.locId === loc.id).reduce((s, e) => s + e.amt, 0);
          return (
            <Card key={loc.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                <span style={{ fontSize: 22 }}>{loc.icon}</span>
                <div><div style={{ fontWeight: 700, fontFamily: "'Playfair Display',serif", fontSize: 14 }}>{loc.name}</div><div style={{ fontSize: 11, color: G6 }}>{loc.city}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["Revenue", fmt(lrev), M], ["Expenses", fmt(lexp), ER], ["Rooms", `${lr.filter(r => r.status === "available").length}/${lr.length} avail`, OK], ["Bookings", lb.length, IN]].map(([k, v, c], i) => (
                  <div key={i} style={{ background: G1, borderRadius: 8, padding: "9px 11px" }}>
                    <div style={{ fontSize: 11, color: G6 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─── BOOKINGS TAB ───────────────────────────────────────── */
function BooksTab({ books, rooms, locs, updBook, recPay, onNew, pop, setBooks }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [payAmt, setPayAmt] = useState("");
  const filtered = books.filter(b => (filter === "all" || b.status === filter) && (!search || b.gName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => b.id.localeCompare(a.id));
  const selB = books.find(b => b.id === sel);
  const selR = rooms.find(r => r.id === selB?.roomId);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: 0 }}>Bookings</h2>
        <Btn onClick={onNew}>+ New Booking</Btn>
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["all", "pending", "confirmed", "checkedIn", "checkedOut", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 700, border: `1px solid ${filter === s ? M : G2}`, background: filter === s ? M : WH, color: filter === s ? WH : G6, cursor: "pointer", fontFamily: "inherit" }}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guest or ID…" style={{ marginLeft: "auto", padding: "6px 11px", border: `1px solid ${G2}`, borderRadius: 8, fontSize: 13, outline: "none", minWidth: 190, fontFamily: "inherit" }} />
      </div>
      <Card>
        <Tbl hdr={["ID", "Guest", "Location / Room", "Dates", "Amount", "Paid", "Status", "Actions"]}
          rows={filtered.map(b => {
            const rm = rooms.find(r => r.id === b.roomId);
            const loc = locs.find(l => l.id === b.locId);
            const bal = b.total - b.paid;
            return [
              <span style={{ color: M, fontWeight: 700, fontSize: 12, cursor: "pointer" }} onClick={() => setSel(b.id)}>{b.id}</span>,
              <div><div style={{ fontWeight: 700 }}>{b.gName}</div><div style={{ fontSize: 11, color: G6 }}>{b.gPhone}</div></div>,
              <div><div style={{ fontSize: 12 }}>{loc?.name}</div><div style={{ fontSize: 11, color: G6 }}>{rm?.name}</div></div>,
              <div style={{ fontSize: 12 }}><div>{b.ci}</div><div style={{ color: G6 }}>{b.co} ({b.nights}n)</div></div>,
              <div><div style={{ fontWeight: 700 }}>{fmt(b.total)}</div>{b.disc > 0 && <div style={{ fontSize: 11, color: OK }}>Disc: {b.discT === "pct" ? b.disc + "%" : fmt(b.disc)}</div>}</div>,
              <div><div style={{ color: bal > 0 ? ER : OK, fontWeight: 700 }}>{fmt(b.paid)}</div>{bal > 0 && <div style={{ fontSize: 11, color: ER }}>Bal: {fmt(bal)}</div>}</div>,
              <Badge s={b.status} />,
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {b.status === "pending" && <button onClick={() => updBook(b.id, "confirmed")} style={{ padding: "3px 7px", fontSize: 11, borderRadius: 6, border: `1px solid ${OK}`, color: OK, background: "none", cursor: "pointer", fontWeight: 700 }}>Confirm</button>}
                {b.status === "confirmed" && <button onClick={() => updBook(b.id, "checkedIn")} style={{ padding: "3px 7px", fontSize: 11, borderRadius: 6, border: `1px solid ${M}`, color: M, background: "none", cursor: "pointer", fontWeight: 700 }}>Check In</button>}
                {b.status === "checkedIn" && <button onClick={() => updBook(b.id, "checkedOut")} style={{ padding: "3px 7px", fontSize: 11, borderRadius: 6, border: `1px solid ${G6}`, color: G6, background: "none", cursor: "pointer", fontWeight: 700 }}>Check Out</button>}
                {bal > 0 && <button onClick={() => setSel(b.id)} style={{ padding: "3px 7px", fontSize: 11, borderRadius: 6, border: `1px solid ${IN}`, color: IN, background: "none", cursor: "pointer", fontWeight: 700 }}>Pay</button>}
                {!["cancelled", "checkedOut"].includes(b.status) && <button onClick={() => updBook(b.id, "cancelled")} style={{ padding: "3px 7px", fontSize: 11, borderRadius: 6, border: `1px solid ${ER}`, color: ER, background: "none", cursor: "pointer", fontWeight: 700 }}>Cancel</button>}
              </div>
            ];
          })} />
      </Card>
      {sel && selB && (
        <Modal title={`Booking ${selB.id}`} onClose={() => { setSel(null); setPayAmt(""); }} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: G6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Guest Info</div>
              {[["Name", selB.gName], ["Phone", selB.gPhone], ["Email", selB.gEmail], ["Nationality", selB.gNat]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${G1}`, fontSize: 13 }}>
                  <span style={{ color: G6 }}>{k}</span><span style={{ fontWeight: 700 }}>{v || "—"}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: G6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Stay Details</div>
              {[["Room", selR?.name], ["Check-in", selB.ci], ["Check-out", selB.co], ["Nights", selB.nights], ["Base Amount", fmt(selB.base)], ["Discount", selB.disc > 0 ? (selB.discT === "pct" ? selB.disc + "%" : fmt(selB.disc)) : "None"], ["Total", fmt(selB.total)], ["Paid", fmt(selB.paid)], ["Balance", fmt(selB.total - selB.paid)]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${G1}`, fontSize: 13 }}>
                  <span style={{ color: G6 }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {(selB.total - selB.paid) > 0 && (
            <div style={{ marginTop: 18, padding: 14, background: G1, borderRadius: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Record Payment</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <Inp label={`Amount (max ${fmt(selB.total - selB.paid)})`} type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} style={{ marginBottom: 0 }} />
                <Btn v="ok" onClick={() => { recPay(selB.id, payAmt); setPayAmt(""); setSel(null); }}>Record</Btn>
              </div>
            </div>
          )}
          {selB.notes && <div style={{ marginTop: 14, fontSize: 13, color: G6 }}>📝 {selB.notes}</div>}
          <div style={{ marginTop: 12 }}><Badge s={selB.status} /></div>
        </Modal>
      )}
    </div>
  );
}

/* ─── ROOMS TAB ──────────────────────────────────────────── */
function RoomsTab({ rooms, locs, saveRoom, pop }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ id: null, locId: "", name: "", type: "Standard", beds: 1, guests: 2, price: 100000, status: "available", amen: "" });
  const openNew = () => { setForm({ id: null, locId: locs[0]?.id || "", name: "", type: "Standard", beds: 1, guests: 2, price: 100000, status: "available", amen: "" }); setModal("f"); };
  const openEdit = r => { setForm({ ...r, amen: r.amen.join(", ") }); setModal("f"); };
  const save = () => { saveRoom(form, !!form.id); setModal(null); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: 0 }}>Rooms & Units</h2>
        <Btn onClick={openNew}>+ Add Room</Btn>
      </div>
      {locs.map(loc => {
        const lr = rooms.filter(r => r.locId === loc.id);
        return (
          <div key={loc.id} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: M, fontFamily: "'Playfair Display',serif" }}>{loc.icon} {loc.name}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 11 }}>
              {lr.map(rm => (
                <Card key={rm.id} style={{ borderLeft: `4px solid ${sC(rm.status)}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Playfair Display',serif" }}>{rm.name}</div>
                      <div style={{ fontSize: 12, color: G6 }}>{rm.type} · {rm.beds} bed · {rm.guests} guests max</div>
                    </div>
                    <Badge s={rm.status} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: M, fontFamily: "'Playfair Display',serif", marginBottom: 7 }}>{fmt(rm.price)}<span style={{ fontSize: 11, color: G4, fontWeight: 400 }}>/night</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 11 }}>{rm.amen.map((a, i) => <span key={i} style={{ background: G1, fontSize: 11, padding: "2px 7px", borderRadius: 99, color: G6 }}>{a}</span>)}</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => openEdit(rm)} style={{ flex: 1, padding: "6px", fontSize: 12, borderRadius: 6, border: `1px solid ${G2}`, background: "none", cursor: "pointer", color: G6, fontFamily: "inherit" }}>Edit</button>
                    <select value={rm.status} onChange={e => { saveRoom({...rm, amen: rm.amen.join(", ")}, true, e.target.value); }} style={{ flex: 1, padding: "6px", fontSize: 12, borderRadius: 6, border: `1px solid ${G2}`, background: "none", cursor: "pointer", color: sC(rm.status), fontFamily: "inherit" }}>
                      <option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </Card>
              ))}
              {lr.length === 0 && <div style={{ color: G4, fontSize: 14, padding: 16 }}>No rooms at this location</div>}
            </div>
          </div>
        );
      })}
      {modal === "f" && (
        <Modal title={form.id ? "Edit Room" : "Add Room"} onClose={() => setModal(null)}>
          <Sel label="Location" value={form.locId} onChange={e => setForm(f => ({ ...f, locId: e.target.value }))}>{locs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Sel>
          <Inp label="Room Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Deluxe Suite" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <Sel label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{["Standard", "Deluxe", "Suite", "Apartment", "Studio", "Cottage", "Penthouse"].map(t => <option key={t}>{t}</option>)}</Sel>
            <Sel label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="available">Available</option><option value="maintenance">Maintenance</option></Sel>
            <Inp label="Beds" type="number" value={form.beds} onChange={e => setForm(f => ({ ...f, beds: e.target.value }))} min={1} />
            <Inp label="Max Guests" type="number" value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))} min={1} />
          </div>
          <Inp label="Price per Night (TZS)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <Inp label="Amenities (comma separated)" value={form.amen} onChange={e => setForm(f => ({ ...f, amen: e.target.value }))} placeholder="WiFi, AC, Kitchen" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn v="ghost" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
            <Btn onClick={save} style={{ flex: 1, justifyContent: "center" }}>Save Room</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── PAYMENTS TAB ───────────────────────────────────────── */
function PaysTab({ books, rooms, recPay }) {
  const [sel, setSel] = useState(null);
  const [amt, setAmt] = useState("");
  const selB = books.find(b => b.id === sel);
  const totColl = books.reduce((s, b) => s + b.paid, 0);
  const totPend = books.reduce((s, b) => s + (b.total - b.paid), 0);
  const totDisc = books.reduce((s, b) => s + (b.base - b.total), 0);
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: "0 0 18px" }}>Payments</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 13, marginBottom: 20 }}>
        <KPI label="Total Collected" value={fmt(totColl)} color={OK} icon="✅" />
        <KPI label="Outstanding" value={fmt(totPend)} color={ER} icon="⚠️" />
        <KPI label="Discounts Given" value={fmt(totDisc)} color={WA} icon="🏷️" />
        <KPI label="Total Bookings" value={books.length} icon="📋" />
      </div>
      <Card>
        <Tbl hdr={["Booking", "Guest", "Total", "Paid", "Balance", "Method", "Action"]}
          rows={books.sort((a, b) => b.id.localeCompare(a.id)).map(b => {
            const bal = b.total - b.paid;
            return [
              <span style={{ color: M, fontWeight: 700, fontSize: 12 }}>{b.id}</span>, b.gName, fmt(b.total),
              <span style={{ color: OK, fontWeight: 700 }}>{fmt(b.paid)}</span>,
              <span style={{ color: bal > 0 ? ER : OK, fontWeight: 700 }}>{fmt(bal)}</span>,
              b.method,
              bal > 0
                ? <button onClick={() => { setSel(b.id); setAmt(""); }} style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, background: M, color: WH, border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Record</button>
                : <span style={{ color: OK, fontSize: 12, fontWeight: 700 }}>✓ Settled</span>
            ];
          })} />
      </Card>
      {sel && selB && (
        <Modal title={`Payment — ${selB.id}`} onClose={() => setSel(null)}>
          <div style={{ marginBottom: 14, padding: 13, background: G1, borderRadius: 8, fontSize: 13 }}>
            {[["Guest", selB.gName], ["Total Due", fmt(selB.total)], ["Paid", fmt(selB.paid)], ["Balance", fmt(selB.total - selB.paid)]].map(([k, v], i) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span>{k}</span><strong style={{ color: i === 3 ? ER : BK }}>{v}</strong>
              </div>
            ))}
          </div>
          <Inp label="Payment Amount (TZS)" type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="Enter amount" />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn v="ghost" onClick={() => setSel(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
            <Btn v="ok" onClick={() => { recPay(selB.id, amt); setSel(null); }} disabled={!amt} style={{ flex: 1, justifyContent: "center" }}>Confirm</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── EXPENSES TAB ───────────────────────────────────────── */
function ExpsTab({ exps, locs, user, saveExp, pop }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ locId: locs[0]?.id || "", cat: "Utilities", desc: "", amt: "", date: td() });
  const save = () => { saveExp(form); setModal(false); setForm(f => ({ ...f, desc: "", amt: "" })); };
  const byCat = exps.reduce((a, e) => { a[e.cat] = (a[e.cat] || 0) + e.amt; return a; }, {});
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: 0 }}>Expenses</h2>
        <Btn onClick={() => setModal(true)}>+ Add Expense</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 11, marginBottom: 14 }}>
        {Object.entries(byCat).map(([cat, amt]) => <KPI key={cat} label={cat} value={fmt(amt)} />)}
      </div>
      <KPI label="Total Expenses" value={fmt(exps.reduce((s, e) => s + e.amt, 0))} color={ER} icon="📤" />
      <Card style={{ marginTop: 14 }}>
        <Tbl hdr={["Date", "Location", "Category", "Description", "Amount"]}
          rows={exps.sort((a, b) => b.date.localeCompare(a.date)).map(e => [
            e.date, locs.find(l => l.id === e.locId)?.name || "-",
            <span style={{ background: G1, padding: "2px 8px", borderRadius: 99, fontSize: 11, color: G6 }}>{e.cat}</span>,
            e.desc, <span style={{ fontWeight: 700, color: ER }}>{fmt(e.amt)}</span>
          ])} />
      </Card>
      {modal && (
        <Modal title="Add Expense" onClose={() => setModal(false)}>
          {user?.role === "Admin" && <Sel label="Location" value={form.locId} onChange={e => setForm(f => ({ ...f, locId: e.target.value }))}>{locs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Sel>}
          <Sel label="Category" value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>{["Utilities", "Maintenance", "Supplies", "Staff", "Marketing", "Rent", "Other"].map(c => <option key={c}>{c}</option>)}</Sel>
          <Inp label="Description" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Electricity bill" />
          <Inp label="Amount (TZS)" type="number" value={form.amt} onChange={e => setForm(f => ({ ...f, amt: e.target.value }))} />
          <Inp label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn v="ghost" onClick={() => setModal(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.desc || !form.amt} style={{ flex: 1, justifyContent: "center" }}>Save</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── REPORTS TAB ────────────────────────────────────────── */
function ReportsTab({ books, exps, rooms, locs, allRooms }) {
  const [rt, setRt] = useState("financial");
  const totRev = books.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.paid, 0);
  const totExp = exps.reduce((s, e) => s + e.amt, 0);
  const net = totRev - totExp;
  const totDisc = books.reduce((s, b) => s + (b.base - b.total), 0);
  const pending = books.reduce((s, b) => s + (b.total - b.paid), 0);
  const margin = totRev > 0 ? Math.round(net / totRev * 100) : 0;
  const occ = rooms.length ? Math.round(rooms.filter(r => r.status === "occupied").length / rooms.length * 100) : 0;
  const avgRate = rooms.length ? Math.round(rooms.reduce((s, r) => s + r.price, 0) / rooms.length) : 0;
  const byLoc = locs.map(loc => ({
    ...loc,
    rev: books.filter(b => b.locId === loc.id && b.status !== "cancelled").reduce((s, b) => s + b.paid, 0),
    exp: exps.filter(e => e.locId === loc.id).reduce((s, e) => s + e.amt, 0),
    cnt: books.filter(b => b.locId === loc.id).length,
  }));
  const byCat = exps.reduce((a, e) => { a[e.cat] = (a[e.cat] || 0) + e.amt; return a; }, {});
  const byMethod = books.reduce((a, b) => { a[b.method] = (a[b.method] || 0) + b.paid; return a; }, {});
  const byStat = books.reduce((a, b) => { a[b.status] = (a[b.status] || 0) + 1; return a; }, {});

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: "0 0 16px" }}>Reports & Analytics</h2>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${G2}` }}>
        {["financial", "occupancy", "location", "expenses", "bookings"].map(t => (
          <button key={t} onClick={() => setRt(t)} style={{ padding: "10px 15px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 700, color: rt === t ? M : G6, borderBottom: `3px solid ${rt === t ? M : "transparent"}`, textTransform: "capitalize", fontFamily: "inherit" }}>{t}</button>
        ))}
      </div>

      {rt === "financial" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 13, marginBottom: 20 }}>
            <KPI label="Gross Revenue" value={fmt(totRev)} color={M} icon="💰" />
            <KPI label="Total Expenses" value={fmt(totExp)} color={ER} icon="📤" />
            <KPI label="Net Profit" value={fmt(net)} color={net >= 0 ? OK : ER} icon="📈" sub={net >= 0 ? "Profitable" : "Loss"} />
            <KPI label="Pending Revenue" value={fmt(pending)} color={WA} icon="⏳" />
            <KPI label="Discounts Given" value={fmt(totDisc)} color={IN} icon="🏷️" />
            <KPI label="Profit Margin" value={margin + "%"} color={net >= 0 ? OK : ER} icon="%" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <SecTitle>Revenue vs Expenses by Location</SecTitle>
              {byLoc.map(loc => (
                <div key={loc.id} style={{ marginBottom: 15 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 13 }}>
                    <strong>{loc.name}</strong>
                    <span style={{ color: loc.rev - loc.exp >= 0 ? OK : ER, fontWeight: 700 }}>Net: {fmt(loc.rev - loc.exp)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: G6, marginBottom: 5 }}>Rev: {fmt(loc.rev)} · Exp: {fmt(loc.exp)}</div>
                  <div style={{ height: 6, background: G1, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: totRev > 0 ? Math.round(loc.rev / totRev * 100) + "%" : "0%", background: M, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <SecTitle>Payment Methods</SecTitle>
              {Object.entries(byMethod).map(([m, a]) => (
                <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${G1}`, fontSize: 13 }}>
                  <span style={{ color: G6 }}>{m}</span><span style={{ fontWeight: 700 }}>{fmt(a)}</span>
                </div>
              ))}
              <div style={{ marginTop: 11, padding: "9px 0", borderTop: `2px solid ${G2}`, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                <span>Total</span><span style={{ color: M }}>{fmt(totRev)}</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {rt === "occupancy" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 13, marginBottom: 20 }}>
            <KPI label="Overall Occupancy" value={occ + "%"} icon="🛏️" />
            <KPI label="Occupied Rooms" value={rooms.filter(r => r.status === "occupied").length} color={M} sub={`of ${rooms.length} total`} />
            <KPI label="Available Rooms" value={rooms.filter(r => r.status === "available").length} color={OK} />
            <KPI label="Maintenance" value={rooms.filter(r => r.status === "maintenance").length} color={WA} />
            <KPI label="Avg Nightly Rate" value={fmt(avgRate)} color={M} />
            <KPI label="Total Rooms" value={rooms.length} />
          </div>
          <Card>
            <SecTitle>Occupancy by Location</SecTitle>
            {locs.map(loc => {
              const lr = allRooms.filter(r => r.locId === loc.id);
              const o = lr.filter(r => r.status === "occupied").length;
              const pct = lr.length ? Math.round(o / lr.length * 100) : 0;
              return (
                <div key={loc.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 14 }}>
                    <strong style={{ fontFamily: "'Playfair Display',serif" }}>{loc.name}</strong>
                    <span style={{ color: M, fontWeight: 700 }}>{pct}% ({o}/{lr.length})</span>
                  </div>
                  <div style={{ height: 10, background: G1, borderRadius: 99, overflow: "hidden", marginBottom: 5 }}>
                    <div style={{ height: "100%", width: pct + "%", background: `linear-gradient(90deg,${M},${ML})`, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                    {["available", "occupied", "maintenance"].map(s => <span key={s} style={{ color: sC(s) }}>{lr.filter(r => r.status === s).length} {s}</span>)}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {rt === "location" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {byLoc.map(loc => {
            const lb = books.filter(b => b.locId === loc.id);
            const act = lb.filter(b => ["confirmed", "checkedIn"].includes(b.status)).length;
            const done = lb.filter(b => b.status === "checkedOut").length;
            return (
              <Card key={loc.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${G1}` }}>
                  <span style={{ fontSize: 26 }}>{loc.icon}</span>
                  <div><div style={{ fontWeight: 700, fontFamily: "'Playfair Display',serif", fontSize: 15 }}>{loc.name}</div><div style={{ fontSize: 11, color: G6 }}>{loc.city}</div></div>
                </div>
                {[["Total Revenue", fmt(loc.rev), OK], ["Total Expenses", fmt(loc.exp), ER], ["Net Profit", fmt(loc.rev - loc.exp), loc.rev - loc.exp >= 0 ? OK : ER], ["Total Bookings", loc.cnt, BK], ["Active Stays", act, M], ["Completed Stays", done, G6]].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${G1}` }}>
                    <span style={{ color: G6 }}>{k}</span><span style={{ fontWeight: 700, color: c }}>{v}</span>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {rt === "expenses" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 11, marginBottom: 16 }}>
            {Object.entries(byCat).map(([c, a]) => <KPI key={c} label={c} value={fmt(a)} />)}
          </div>
          <Card><SecTitle>All Expenses</SecTitle>
            <Tbl hdr={["Date", "Location", "Category", "Description", "Amount"]}
              rows={exps.sort((a, b) => b.date.localeCompare(a.date)).map(e => [
                e.date, locs.find(l => l.id === e.locId)?.name || "-", e.cat, e.desc, <span style={{ fontWeight: 700, color: ER }}>{fmt(e.amt)}</span>
              ])} />
          </Card>
        </div>
      )}

      {rt === "bookings" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 11, marginBottom: 18 }}>
            {Object.entries(byStat).map(([s, c]) => (
              <div key={s} style={{ background: sB(s), border: `1px solid ${sC(s)}30`, borderRadius: 12, padding: "13px 15px" }}>
                <div style={{ fontSize: 11, color: sC(s), fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>{s}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: sC(s), fontFamily: "'Playfair Display',serif" }}>{c}</div>
              </div>
            ))}
          </div>
          <Card><SecTitle>Booking Revenue Analysis</SecTitle>
            <Tbl hdr={["Booking", "Guest", "Base", "Discount", "Total", "Paid", "Balance", "Status"]}
              rows={books.sort((a, b) => b.id.localeCompare(a.id)).map(b => {
                const bal = b.total - b.paid;
                return [
                  <span style={{ color: M, fontWeight: 700, fontSize: 11 }}>{b.id}</span>, b.gName, fmt(b.base),
                  b.disc > 0 ? <span style={{ color: OK, fontSize: 12 }}>{b.discT === "pct" ? b.disc + "%" : fmt(b.disc)}</span> : "—",
                  fmt(b.total), <span style={{ color: OK }}>{fmt(b.paid)}</span>,
                  <span style={{ color: bal > 0 ? ER : OK }}>{fmt(bal)}</span>, <Badge s={b.status} />
                ];
              })} />
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─── LOCATIONS TAB ──────────────────────────────────────── */
function LocsTab({ locs, saveLoc, rooms, books, pop }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", city: "", addr: "", icon: "🏙️", desc: "" });
  const save = () => { saveLoc(form, !!form.id); setModal(false); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: 0 }}>Locations</h2>
        <Btn onClick={() => { setForm({ id: null, name: "", city: "", addr: "", icon: "🏙️", desc: "" }); setModal(true); }}>+ Add Location</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {locs.map(loc => {
          const lr = rooms.filter(r => r.locId === loc.id);
          const lb = books.filter(b => b.locId === loc.id);
          const rev = lb.reduce((s, b) => s + b.paid, 0);
          return (
            <Card key={loc.id}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{loc.icon}</span>
                  <div><div style={{ fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{loc.name}</div><div style={{ fontSize: 12, color: G6 }}>{loc.city}</div></div>
                </div>
                <button onClick={() => { setForm({ ...loc }); setModal(true); }} style={{ background: "none", border: `1px solid ${G2}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: G6, fontFamily: "inherit" }}>Edit</button>
              </div>
              <div style={{ fontSize: 12, color: G6, marginBottom: 8 }}>{loc.addr}</div>
              <div style={{ fontSize: 12, color: G6, marginBottom: 12, fontStyle: "italic" }}>{loc.desc}</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <span style={{ background: G1, padding: "3px 10px", borderRadius: 8, fontSize: 12 }}>{lr.length} rooms</span>
                <span style={{ background: MF, color: M, padding: "3px 10px", borderRadius: 8, fontSize: 12 }}>{lb.length} bookings</span>
                <span style={{ background: OKB, color: OK, padding: "3px 10px", borderRadius: 8, fontSize: 12 }}>{fmt(rev)}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {modal && (
        <Modal title={form.id ? "Edit Location" : "Add Location"} onClose={() => setModal(false)}>
          <Inp label="Location Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="BNC Masaki" />
          <Inp label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Dar es Salaam" />
          <Inp label="Address" value={form.addr} onChange={e => setForm(f => ({ ...f, addr: e.target.value }))} placeholder="Masaki, DSM" />
          <Sel label="Icon" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>{["🏙️", "🌿", "🏛️", "🏖️", "🏔️", "🌊", "🌴", "🏡"].map(i => <option key={i} value={i}>{i}</option>)}</Sel>
          <Inp label="Description" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Short description…" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn v="ghost" onClick={() => setModal(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name || !form.city} style={{ flex: 1, justifyContent: "center" }}>Save Location</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── STAFF TAB ──────────────────────────────────────────── */
function StaffTab({ staff, saveStaff, toggleStaff, locs, pop }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", email: "", phone: "", role: "Receptionist", locId: "", pin: "", active: true });
  const save = () => { if(!form.name||!form.email||!form.pin)return; saveStaff(form,!!form.id); setModal(false); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, margin: 0 }}>Staff Accounts</h2>
        <Btn onClick={() => { setForm({ id: null, name: "", email: "", phone: "", role: "Receptionist", locId: locs[0]?.id || "", pin: "", active: true }); setModal(true); }}>+ Create Account</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 13 }}>
        {staff.map(s => (
          <Card key={s.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 13 }}>
              <div style={{ width: 42, height: 42, background: `linear-gradient(135deg,${M},${ML})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: WH, fontWeight: 700, fontSize: 15, fontFamily: "'Playfair Display',serif", flexShrink: 0 }}>
                {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Playfair Display',serif" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: M, fontWeight: 700 }}>{s.role}</div>
              </div>
              <span style={{ background: s.active ? OKB : G1, color: s.active ? OK : G6, padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{s.active ? "Active" : "Inactive"}</span>
            </div>
            {[["Email", s.email], ["Phone", s.phone], ["Location", locs.find(l => l.id === s.locId)?.name || "All Locations"], ["Joined", s.created]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${G1}`, fontSize: 12 }}>
                <span style={{ color: G6 }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
              <button onClick={() => { setForm({ ...s }); setModal(true); }} style={{ flex: 1, padding: "7px", fontSize: 12, borderRadius: 7, border: `1px solid ${G2}`, background: "none", cursor: "pointer", color: G6, fontWeight: 700, fontFamily: "inherit" }}>Edit</button>
              <button onClick={() => toggleStaff(s)} style={{ flex: 1, padding: "7px", fontSize: 12, borderRadius: 7, border: `1px solid ${s.active ? ER : OK}`, background: "none", cursor: "pointer", color: s.active ? ER : OK, fontWeight: 700, fontFamily: "inherit" }}>
                {s.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </Card>
        ))}
      </div>
      {modal && (
        <Modal title={form.id ? "Edit Staff" : "Create Staff Account"} onClose={() => setModal(false)}>
          <Inp label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Mwangi" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <Inp label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@bnc.co.tz" />
            <Inp label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+255 7XX…" />
            <Sel label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option>Manager</option><option>Receptionist</option><option>Housekeeping</option><option>Accountant</option></Sel>
            <Sel label="Assigned Location" value={form.locId} onChange={e => setForm(f => ({ ...f, locId: e.target.value }))}><option value="">All Locations</option>{locs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Sel>
          </div>
          <Inp label="Login PIN (4–6 digits)" type="password" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} placeholder="••••" maxLength={6} />
          <div style={{ background: MF, borderRadius: 8, padding: "9px 13px", fontSize: 12, color: M, marginBottom: 13 }}>
            Staff log in with their <strong>email</strong> and this <strong>PIN</strong>.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn v="ghost" onClick={() => setModal(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
            <Btn onClick={save} disabled={!form.name || !form.email || !form.pin} style={{ flex: 1, justifyContent: "center" }}>Save Account</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── NEW BOOKING MODAL ──────────────────────────────────── */
function NewBookModal({ rooms, locs, user, onClose, onSave }) {
  const [form, setForm] = useState({ locId: locs[0]?.id || "", roomId: "", name: "", phone: "", email: "", nat: "", ci: td(), co: "", nights: 1, disc: 0, discT: "pct", method: "Cash", notes: "", paid: 0 });
  const lr = rooms.filter(r => r.locId === form.locId && r.status === "available");
  const sr = rooms.find(r => r.id === form.roomId);
  const base = sr ? sr.price * form.nights : 0;
  const da = form.discT === "pct" ? base * form.disc / 100 : Number(form.disc);
  const total = base - da;
  useEffect(() => {
    if (form.ci && form.co) { const n = dd(form.ci, form.co); if (n > 0) setForm(f => ({ ...f, nights: n })); }
  }, [form.ci, form.co]);
  const save = () => {
    if (!form.roomId || !form.name || !form.phone || !form.ci || !form.co) return;
    onSave(form, base, da, total);
  };
  return (
    <Modal title="New Booking" onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Sel label="Location" value={form.locId} onChange={e => setForm(f => ({ ...f, locId: e.target.value, roomId: "" }))}>{locs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Sel>
        <Sel label="Room" value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}><option value="">Select room…</option>{lr.map(r => <option key={r.id} value={r.id}>{r.name} — {fmt(r.price)}/night</option>)}</Sel>
        <Inp label="Check-in" type="date" value={form.ci} min={td()} onChange={e => setForm(f => ({ ...f, ci: e.target.value }))} />
        <Inp label="Check-out" type="date" value={form.co} min={form.ci} onChange={e => setForm(f => ({ ...f, co: e.target.value }))} />
        <Inp label="Guest Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
        <Inp label="Phone *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+255 7XX…" />
        <Inp label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <Inp label="Nationality" value={form.nat} onChange={e => setForm(f => ({ ...f, nat: e.target.value }))} />
        <Sel label="Discount Type" value={form.discT} onChange={e => setForm(f => ({ ...f, discT: e.target.value }))}><option value="pct">Percentage (%)</option><option value="fix">Fixed Amount (TZS)</option></Sel>
        <Inp label={form.discT === "pct" ? "Discount %" : "Discount (TZS)"} type="number" value={form.disc} onChange={e => setForm(f => ({ ...f, disc: e.target.value }))} min={0} />
        <Sel label="Payment Method" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option></Sel>
        <Inp label="Initial Payment (TZS)" type="number" value={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.value }))} placeholder="0" />
      </div>
      <Inp label="Notes / Special Requests" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special requests…" />
      {sr && form.nights > 0 && (
        <div style={{ background: BK, borderRadius: 10, padding: 13, marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["Nights × Rate", `${form.nights} × ${fmt(sr.price)}`], ["Discount", da > 0 ? `- ${fmt(da)}` : "None"], ["TOTAL", fmt(total)]].map(([k, v], i) => (
            <div key={i} style={{ textAlign: i === 2 ? "right" : "left" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: i === 2 ? 17 : 13, fontWeight: 700, color: i === 2 ? GOLD : WH, fontFamily: i === 2 ? "'Playfair Display',serif" : "inherit" }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Btn v="ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
        <Btn onClick={save} disabled={!form.roomId || !form.name || !form.phone || !form.ci || !form.co} style={{ flex: 1, justifyContent: "center" }}>Create Booking</Btn>
      </div>
    </Modal>
  );
}
