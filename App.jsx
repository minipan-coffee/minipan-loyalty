import React, { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import { Check, Coffee, Stamp, QrCode, Shield, Zap, Trash2 } from "lucide-react";

// --- Simple local storage helpers (can be replaced with Firebase later) ---
const LS_KEY = "loyalty_demo_users";
function loadUsers() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveUsers(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Program settings (edit as needed)
const PROGRAM = {
  rewardEvery: 8, // "collect the stamps and get the 8th drink for free"
  brand: "MINIPAN COFFEE", // updated brand
  slogan: "Bite • Sip • Joy",
  city: "Riyadh",
};

export default function App() {
  const [users, setUsers] = useState(() => loadUsers());
  const [activeUserId, setActiveUserId] = useState(() => {
    const keys = Object.keys(loadUsers());
    return keys[0] || "";
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    saveUsers(users);
  }, [users]);

  const activeUser = users[activeUserId];

  // Create a demo user if empty
  useEffect(() => {
    if (!Object.keys(users).length) {
      const id = uid();
      const demo = {
        id,
        name: "Guest",
        phone: "+9665xxxxxxx",
        stamps: 5,
        redeemed: 1,
        createdAt: Date.now(),
      };
      const next = { ...users, [id]: demo };
      setUsers(next);
      setActiveUserId(id);
    }
  }, []);

  function addStamp(userId, n = 1) {
    setUsers((prev) => {
      const u = prev[userId];
      if (!u) return prev;
      const total = u.stamps + n;
      return { ...prev, [userId]: { ...u, stamps: total } };
    });
  }

  function redeem(userId) {
    setUsers((prev) => {
      const u = prev[userId];
      if (!u) return prev;
      if (u.stamps >= PROGRAM.rewardEvery) {
        return { ...prev, [userId]: { ...u, stamps: u.stamps - PROGRAM.rewardEvery, redeemed: (u.redeemed || 0) + 1 } };
      }
      return prev;
    });
  }

  function resetAll() {
    if (!confirm("Clear all demo data?")) return;
    setUsers({});
    setActiveUserId("");
    localStorage.removeItem(LS_KEY);
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{PROGRAM.brand}</h1>
            <p className="text-sm md:text-base text-neutral-600">Loyalty QR Stamps • برنامج ولاء بالطوابع</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsAdmin(false)} className={`px-3 py-2 rounded-2xl text-sm font-medium border ${!isAdmin ? "bg-white" : "bg-neutral-100"}`}>Customer</button>
            <button onClick={() => setIsAdmin(true)} className={`px-3 py-2 rounded-2xl text-sm font-medium border ${isAdmin ? "bg-white" : "bg-neutral-100"}`}>Admin</button>
            <button onClick={resetAll} className="px-3 py-2 rounded-2xl text-sm font-medium border hover:bg-white flex items-center gap-1"><Trash2 className="w-4 h-4"/>Reset</button>
          </div>
        </div>

        {/* Slogan */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-3">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border px-4 py-2 shadow-sm">
            <Coffee className="w-4 h-4"/>
            <span className="font-semibold">{PROGRAM.slogan}</span>
            <span className="text-neutral-500">• اجمع الطوابع والمشروب الثامن مجانًا</span>
          </div>
        </motion.div>

        {/* Body */}
        {!isAdmin ? (
          <CustomerView users={users} setUsers={setUsers} activeUserId={activeUserId} setActiveUserId={setActiveUserId} />
        ) : (
          <AdminView users={users} addStamp={addStamp} redeem={redeem} />
        )}

        {/* Footer notes */}
        <div className="mt-8 grid md:grid-cols-3 gap-3">
          <FeatureCard icon={<Stamp className="w-5 h-5"/>} title="QR Stamps" desc="Scan to add – امسح وأضف طابع" />
          <FeatureCard icon={<Shield className="w-5 h-5"/>} title="Anti‑fraud" desc="One-time codes • أكواد لمرة واحدة" />
          <FeatureCard icon={<Zap className="w-5 h-5"/>} title="Fast" desc="< 2s per customer • أقل من ثانيتين" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 font-semibold">{icon}{title}</div>
      <p className="text-sm text-neutral-600 mt-1">{desc}</p>
    </div>
  );
}

function CustomerView({ users, setUsers, activeUserId, setActiveUserId }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const activeUser = users[activeUserId];
  const progress = activeUser ? Math.min(activeUser.stamps % PROGRAM.rewardEvery, PROGRAM.rewardEvery) : 0;
  const toReward = activeUser ? PROGRAM.rewardEvery - progress : PROGRAM.rewardEvery;

  function createUserLocal() {
    if (!name.trim()) return alert("Enter name / اكتب الاسم");
    const id = uid();
    const u = { id, name: name.trim(), phone: phone.trim(), stamps: 0, redeemed: 0, createdAt: Date.now() };
    setUsers((prev) => ({ ...prev, [id]: u }));
    setActiveUserId(id);
    setName("");
    setPhone("");
  }

  const qrPayload = useMemo(() => {
    if (!activeUser) return "";
    return JSON.stringify({ t: "stamp", uid: activeUser.id, ts: Date.now() });
  }, [activeUserId, activeUser?.stamps]);

  return (
    <div className="mt-6 grid md:grid-cols-2 gap-6">
      {/* Card: My Card */}
      <div className="rounded-3xl border bg-white p-5 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">بطاقة الولاء • Loyalty Card</h2>
          <div className="text-xs text-neutral-500">Every {PROGRAM.rewardEvery} → 1 Free</div>
        </div>
        {activeUser ? (
          <>
            <div className="mt-3 text-sm text-neutral-700">العميل: <span className="font-medium">{activeUser.name}</span> • Customer</div>
            <div className="mt-1 text-xs text-neutral-500">ID: {activeUser.id}</div>

            {/* Stamps row */}
            <div className="mt-4 grid grid-cols-8 gap-2">
              {Array.from({ length: PROGRAM.rewardEvery }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-2xl border flex items-center justify-center text-xs font-bold ${i < (activeUser.stamps % PROGRAM.rewardEvery) ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-neutral-50"}`}>
                  {i < (activeUser.stamps % PROGRAM.rewardEvery) ? <span>✓</span> : i + 1}
                </div>
              ))}
            </div>

            {/* Next reward */}
            <div className="mt-3 text-sm">
              {toReward === 0 ? (
                <span className="font-medium text-emerald-700">جاهز للهديّة! • Ready to Redeem 🎁</span>
              ) : (
                <span className="text-neutral-700">المتبقّي: {toReward} طابع • To reward: {toReward}</span>
              )}
            </div>

            {/* QR to scan */}
            <div className="mt-5 flex flex-col items-center">
              <div className="text-sm font-medium flex items-center gap-2">اعرض هذا الـQR للكاشير • Show this QR to cashier</div>
              <div className="mt-2 rounded-3xl bg-white p-3 border shadow-sm">
                <QRCodeCanvas value={qrPayload || "demo"} size={160} includeMargin={true} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-600 mt-4">اختر عميل أو أنشئ بطاقة جديدة</div>
        )}
      </div>

      {/* Card: Customers & Create */}
      <div className="rounded-3xl border bg-white p-5 shadow-md">
        <h3 className="text-base font-semibold">العملاء • Customers</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.values(users).map((u) => (
            <button key={u.id} onClick={() => setActiveUserId(u.id)} className={`px-3 py-2 rounded-2xl border text-sm ${u.id === activeUserId ? "bg-neutral-900 text-white" : "bg-white"}`}>
              {u.name} ({u.stamps})
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم / Name" className="px-3 py-2 rounded-2xl border outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="الجوال / Phone" className="px-3 py-2 rounded-2xl border outline-none" />
          <button onClick={createUserLocal} className="col-span-1 md:col-span-2 px-4 py-2 rounded-2xl bg-neutral-900 text-white font-medium hover:opacity-90">إنشاء بطاقة جديدة • Create New Card</button>
        </div>
        <p className="mt-3 text-xs text-neutral-500">* النسخة تجريبية بذاكرة المتصفح. استبدلها لاحقًا بـ Firebase/Firestore للمحل.</p>
      </div>
    </div>
  );
}

function AdminView({ users, addStamp, redeem }) {
  const [search, setSearch] = useState("");
  const list = Object.values(users).filter((u) => (u.name + u.phone + u.id).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mt-6 grid md:grid-cols-2 gap-6">
      {/* Admin controls */}
      <div className="rounded-3xl border bg-white p-5 shadow-md">
        <h2 className="text-lg font-semibold">لوحة الإدارة • Admin</h2>
        <p className="text-sm text-neutral-600 mt-1">ابحث عن العميل بالاسم / الجوال / ID</p>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="mt-3 px-3 py-2 rounded-2xl border outline-none w-full" />

        <div className="mt-4 max-h-80 overflow-auto pr-1">
          {list.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
              <div>
                <div className="font-medium text-sm">{u.name} <span className="text-neutral-400 text-xs">({u.id})</span></div>
                <div className="text-xs text-neutral-500">{u.phone}</div>
                <div className="text-xs">Stamps: <span className="font-semibold">{u.stamps}</span> • Redeemed: <span className="font-semibold">{u.redeemed || 0}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => addStamp(u.id, 1)} className="px-3 py-2 rounded-2xl border text-sm">+1</button>
                <button onClick={() => addStamp(u.id, 2)} className="px-3 py-2 rounded-2xl border text-sm">+2</button>
                <button onClick={() => redeem(u.id)} className="px-3 py-2 rounded-2xl bg-emerald-600 text-white text-sm">Redeem</button>
              </div>
            </div>
          ))}
          {!list.length && <div className="text-sm text-neutral-500">لا يوجد نتائج</div>}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-3xl border bg-white p-5 shadow-md">
        <h3 className="text-base font-semibold">كيفية التشغيل الفعلي (مختصر)</h3>
        <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-neutral-700">
          <li>العميل يفتح بطاقته ويعرض QR على الكاشير.</li>
          <li>الكاشير يمسح QR من شاشة الويب (كاميرا) فيضيف طابعًا تلقائيًا.</li>
          <li>كل {PROGRAM.rewardEvery} طوابع = مشروب مجاني. استخدم زر <b>Redeem</b> لتسجيل الهدية.</li>
          <li>لمنع التلاعب: اربط كل مسح بكود لمرة واحدة + توقيع خادم (استبدل التخزين المحلي بـ Firebase/Server).</li>
        </ul>
        <div className="mt-3 text-xs text-neutral-500 leading-relaxed">
          ملاحظة: هذه نسخة واجهة تجريبية لتصميم البرنامج (PWA). للتشغيل في المحل: أضف تسجيل دخول موظفين، صلاحيات، وكاميرا ماسح QR في صفحة الإدارة، وقاعدة بيانات مثل Firestore.
        </div>
      </div>
    </div>
  );
}
