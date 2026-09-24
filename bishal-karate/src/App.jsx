import React, { useState, useEffect, useMemo } from "react";
import {
  Home, Users, CalendarCheck, Wallet, Award, GraduationCap, Trophy,
  FileText, Bell, Settings, Search, Plus, Check, X, ChevronDown,
  LogOut, Menu, ShieldCheck, ArrowLeft, User, Phone, Mail, MapPin,
  Building2, Clock, ChevronRight, CircleCheck, CircleX, TimerReset,
  MessageCircle, Youtube, Instagram, Facebook, Link as LinkIcon,
  BookOpen, Pencil, Trash2, HardDrive, Music, Image as ImageIcon,
  Video, Upload, QrCode, MoreVertical,
} from "lucide-react";
import {
  adminLoginStep1, adminLoginStep2, staffOrStudentLogin, logout as supabaseLogout,
} from "./auth";

/* ============================== DESIGN TOKENS ==============================
   Palette: dojo charcoal + washi white + a single crimson accent (the obi/belt
   red). The signature motif is the "belt bar" — a literal stripe of every
   rank's color — used as a progress/identity device throughout the app,
   because in karate the belt *is* the status indicator.
================================================================================ */
const BELT_COLORS = {
  "9th Kyu (Yellow)": "#F2C245",
  "8th Kyu (Orange)": "#E8792B",
  "7th Kyu (Green)": "#3E8E4F",
  "6th Kyu (Blue)": "#2C6FB0",
  "5th Kyu (Maroon)": "#7B2D3E",
  "4th Kyu (Brown IV)": "#8B5E3C",
  "3rd Kyu (Brown III)": "#7A4F30",
  "2nd Kyu (Brown II)": "#6B4426",
  "1st Kyu (Brown I)": "#5C3A20",
  "Brown Black": "#3D2B1F",
  "Black Belt (Pro)": "#1A1A1A",
  "Black Belt 1st Dan": "#0D0D0D",
};
const BELT_ORDER = [
  "9th Kyu (Yellow)",
  "8th Kyu (Orange)",
  "7th Kyu (Green)",
  "6th Kyu (Blue)",
  "5th Kyu (Maroon)",
  "4th Kyu (Brown IV)",
  "3rd Kyu (Brown III)",
  "2nd Kyu (Brown II)",
  "1st Kyu (Brown I)",
  "Brown Black",
  "Black Belt (Pro)",
  "Black Belt 1st Dan",
];

const STORAGE_KEY = "karate-club-data-v2"; // bumped: multi-academy structure (v1 predates academy scoping)
const FEE_MONTHS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

// UI role labels (used throughout the app / session state) <-> the short
// role codes stored in Supabase's `profiles` table.
const ROLE_DB_TO_UI = { Admin: "Admin", Coach: "Teacher / Coach", SeniorStudent: "Senior Student", Student: "Student" };
const ROLE_UI_TO_DB = { Admin: "Admin", "Teacher / Coach": "Coach", "Senior Student": "SeniorStudent", Student: "Student" };

/* ============================== DEMO DATA ============================== */
const seedData = () => ({
  association: { name: "Bishal Karate Association", feeAmount: 500, officeMobile: "6000259414", email: "bishalkarateassociation@gmail.com", upiId: "beeshalgpay@okaxis" },
  // Custom passwords set via signup/forgot-password. Anyone not listed here
  // uses DEFAULT_PASSWORD — shown to the person in the login screen.
  accounts: {},
  dojos: [
    { id: "DOJO-001", name: "Assam Karate Academy", address: "Uzan Bazar, Guwahati, Assam", contact: "9864000001", headCoach: "COACH-001" },
    { id: "DOJO-002", name: "Jagiroad Karate Academy", address: "Jagiroad, Morigaon, Assam", contact: "9864000002", headCoach: "COACH-002" },
    { id: "DOJO-003", name: "Nagaon Karate Academy", address: "Nagaon, Assam", contact: "9864000003", headCoach: "COACH-003" },
  ],
  coaches: [
    { id: "COACH-001", name: "Coach Rahul Sharma", mobile: "9864000001", email: "rahul.sharma@bishalkarate.in", dojo: "DOJO-001" },
    { id: "COACH-002", name: "Coach Amit Das", mobile: "9864000002", email: "amit.das@bishalkarate.in", dojo: "DOJO-002" },
    { id: "COACH-003", name: "Coach Bishal Kalita", mobile: "9864000003", email: "bishal.kalita@bishalkarate.in", dojo: "DOJO-003" },
  ],
  // Senior students: limited-permission role (view their batch, mark
  // attendance, view announcements) — Admin decides who holds this role.
  seniorStudents: [
    { id: "SENIOR-001", name: "Priya Das", mobile: "9864111003", batch: "BATCH-B", dojo: "DOJO-001", permissions: { markAttendance: true, viewStudents: true } },
  ],
  batches: [
    { id: "BATCH-A", name: "Beginner Kids", dojo: "DOJO-001", coach: "COACH-001", days: "Mon / Wed / Fri", start: "17:00", end: "18:00", ageGroup: "6-10 yrs", level: "Beginner", maxStudents: 30 },
    { id: "BATCH-B", name: "Junior Advanced", dojo: "DOJO-001", coach: "COACH-001", days: "Tue / Thu / Sat", start: "18:00", end: "19:00", ageGroup: "11-15 yrs", level: "Intermediate", maxStudents: 25 },
    { id: "BATCH-C", name: "Adult Fitness Karate", dojo: "DOJO-002", coach: "COACH-002", days: "Mon / Wed / Fri", start: "19:00", end: "20:00", ageGroup: "16+ yrs", level: "All levels", maxStudents: 20 },
  ],
  belts: BELT_ORDER.map((name, i) => ({ id: "BELT-" + (i + 1), name, order: i + 1 })),
  students: [
    { id: "KRT-000001", name: "Rahul Das", dob: "2014-03-11", gender: "Male", mobile: "9864111001", email: "", address: "Uzan Bazar, Guwahati", guardian: "Mr. Das", emergency: "9864111099", dojo: "DOJO-001", batch: "BATCH-A", coach: "COACH-001", joined: "2024-01-10", belt: "9th Kyu (Yellow)", status: "Active", addedBy: "Admin" },
    { id: "KRT-000002", name: "Aman Roy", dob: "2013-07-22", gender: "Male", mobile: "9864111002", email: "", address: "Fancy Bazar, Guwahati", guardian: "Mrs. Roy", emergency: "9864111098", dojo: "DOJO-001", batch: "BATCH-A", coach: "COACH-001", joined: "2024-02-15", belt: "9th Kyu (Yellow)", status: "Active", addedBy: "Admin" },
    { id: "KRT-000003", name: "Priya Das", dob: "2012-11-02", gender: "Female", mobile: "9864111003", email: "", address: "Ganeshguri, Guwahati", guardian: "Mr. Das", emergency: "9864111097", dojo: "DOJO-001", batch: "BATCH-B", coach: "COACH-001", joined: "2023-08-01", belt: "7th Kyu (Green)", status: "Active", addedBy: "Admin" },
    { id: "KRT-000004", name: "Rohit Das", dob: "2011-05-18", gender: "Male", mobile: "9864111004", email: "", address: "Six Mile, Guwahati", guardian: "Mrs. Das", emergency: "9864111096", dojo: "DOJO-002", batch: "BATCH-C", coach: "COACH-002", joined: "2023-05-20", belt: "6th Kyu (Blue)", status: "Active", addedBy: "Coach Amit Das" },
    { id: "KRT-000005", name: "Ananya Sharma", dob: "2015-01-09", gender: "Female", mobile: "9864111005", email: "", address: "Zoo Road, Guwahati", guardian: "Mr. Sharma", emergency: "9864111095", dojo: "DOJO-001", batch: "BATCH-A", coach: "COACH-001", joined: "2024-06-01", belt: "9th Kyu (Yellow)", status: "Active", addedBy: "Coach Rahul Sharma" },
    { id: "KRT-000006", name: "Aarav Bora", dob: "2010-09-30", gender: "Male", mobile: "9864111006", email: "", address: "Beltola, Guwahati", guardian: "Mr. Bora", emergency: "9864111094", dojo: "DOJO-002", batch: "BATCH-C", coach: "COACH-002", joined: "2022-03-12", belt: "4th Kyu (Brown IV)", status: "Active", addedBy: "Coach Amit Das" },
  ],
  payments: [
    { id: "PAY-1", studentId: "KRT-000001", month: "2026-06", amount: 500, date: "2026-06-05", mode: "Cash", remarks: "" },
    { id: "PAY-2", studentId: "KRT-000001", month: "2026-07", amount: 500, date: "2026-07-04", mode: "UPI", remarks: "" },
    { id: "PAY-3", studentId: "KRT-000003", month: "2026-08", amount: 500, date: "2026-08-03", mode: "Cash", remarks: "" },
    { id: "PAY-4", studentId: "KRT-000004", month: "2026-07", amount: 500, date: "2026-07-06", mode: "Bank", remarks: "" },
  ],
  paymentRequests: [
    { id: "REQ-1", studentId: "KRT-000002", month: "2026-08", amount: 500, status: "Pending", requestedAt: "2026-08-30T10:15:00" },
  ],
  attendance: {
    // key: `${date}__${batchId}` -> { studentId: status }
    "2026-08-24__BATCH-A": { "KRT-000001": "Present", "KRT-000002": "Absent", "KRT-000005": "Present" },
    "2026-08-26__BATCH-A": { "KRT-000001": "Present", "KRT-000002": "Present", "KRT-000005": "Late" },
  },
  beltHistory: [
    { studentId: "KRT-000001", from: "White", to: "Yellow", date: "2025-12-14", examiner: "Coach Rahul Sharma", result: "Pass", remarks: "Good kihon" },
    { studentId: "KRT-000003", from: "Yellow", to: "Orange", date: "2024-11-02", examiner: "Coach Rahul Sharma", result: "Pass", remarks: "" },
    { studentId: "KRT-000003", from: "Orange", to: "Green", date: "2025-10-18", examiner: "Coach Rahul Sharma", result: "Pass", remarks: "" },
  ],
  certificates: [
    { id: "CERT-1", certificateNo: "BKA-CERT-0001", studentId: "KRT-000001", belt: "9th Kyu (Yellow)", session: "Winter 2025 Grading", issueDate: "2025-12-20", examiner: "Coach Rahul Sharma", remarks: "" },
    { id: "CERT-2", certificateNo: "BKA-CERT-0002", studentId: "KRT-000003", belt: "7th Kyu (Green)", session: "Autumn 2025 Grading", issueDate: "2025-10-25", examiner: "Coach Rahul Sharma", remarks: "" },
  ],
  announcements: [
    { id: "AN-1", audience: "Everyone", title: "Autumn grading exam — Sept 20", body: "All batches: grading exam registration opens this week. Talk to your coach.", date: "2026-08-25" },
    { id: "AN-2", audience: "Batch A", title: "No class on Aug 28 (holiday)", body: "Beginner Kids batch is off for the local holiday. Regular schedule resumes Aug 31.", date: "2026-08-22" },
  ],
  resources: [
    { id: "RES-1", title: "Bishal Karate Association — YouTube", url: "https://youtube.com/@bishalkarateassociation", type: "YouTube", addedBy: "Admin" },
    { id: "RES-2", title: "Bishal Karate Association — Instagram", url: "https://instagram.com/bishalkarateassociation", type: "Instagram", addedBy: "Admin" },
    { id: "RES-3", title: "Beginner Kids — Kata Syllabus (PDF)", url: "https://example.com/syllabus-beginner.pdf", type: "Syllabus", addedBy: "Coach Rahul Sharma" },
    { id: "RES-4", title: "This week's training notes", url: "https://example.com/notes-week35.pdf", type: "Notes", addedBy: "Coach Rahul Sharma" },
    { id: "RES-5", title: "Full Kata Video Library (Drive folder)", url: "https://drive.google.com/drive/folders/example-kata-library", type: "Google Drive", addedBy: "Coach Rahul Sharma" },
    { id: "RES-6", title: "Kihon drills — training clip", url: "https://example.com/videos/kihon-drills.mp4", type: "Video", addedBy: "Coach Rahul Sharma" },
    { id: "RES-7", title: "Dojo kiai count-along track", url: "https://example.com/audio/kiai-count.mp3", type: "Music", addedBy: "Coach Amit Das" },
    { id: "RES-8", title: "Belt grading — group photo", url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=200&h=200&fit=crop", type: "Picture", addedBy: "Coach Rahul Sharma" },
  ],
});

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}
// Sums every payment a student made for a given month (supports partial /
// multiple installments) and derives Paid / Partial / Pending status.
function getFeeStatus(payments, studentId, month, feeAmount) {
  const records = payments.filter((p) => p.studentId === studentId && p.month === month);
  const paidAmount = records.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = Math.max(0, feeAmount - paidAmount);
  const status = paidAmount <= 0 ? "Unpaid" : pendingAmount > 0 ? "Partial" : "Paid";
  const lastRecord = records.sort((a, b) => (a.date || "").localeCompare(b.date || ""))[records.length - 1];
  return { records, paidAmount, pendingAmount, status, lastRecord };
}
// Supports partial payments: sums every payment record a student has made
// for a given month and compares it against the fee amount due, so the
// same "paid so far" / "still pending" figures show correctly everywhere
// (Admin, Teacher, Student) instead of a simple yes/no Paid flag.
function feeStatusFor(data, studentId, month, feeAmount) {
  const records = (data.payments || []).filter((p) => p.studentId === studentId && p.month === month);
  const paidAmount = records.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = Math.max(0, feeAmount - paidAmount);
  const status = paidAmount <= 0 ? "Pending" : pendingAmount > 0 ? "Partial" : "Paid";
  const lastRecord = records.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).pop();
  return { paidAmount, pendingAmount, status, records, lastRecord };
}
function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
// Collision-safe id generator: every record (payment, request, certificate,
// resource, announcement) gets its own unique id, so records always stay
// tied to the correct student and never overwrite one another.
let __idCounter = 0;
function uid(prefix) {
  __idCounter += 1;
  return `${prefix}-${Date.now()}-${__idCounter}`;
}

// When Admin renames a Student/Coach/Senior ID, every record that points to
// the old ID (fees, attendance, belt history, certificates, login account)
// gets migrated to the new ID so nothing becomes orphaned.
function renameEntityId(data, entityType, oldId, newId) {
  if (oldId === newId) return data;
  const next = { ...data };
  if (entityType === "student") {
    next.students = data.students.map((s) => (s.id === oldId ? { ...s, id: newId } : s));
    next.payments = data.payments.map((p) => (p.studentId === oldId ? { ...p, studentId: newId } : p));
    next.beltHistory = data.beltHistory.map((b) => (b.studentId === oldId ? { ...b, studentId: newId } : b));
    next.certificates = (data.certificates || []).map((c) => (c.studentId === oldId ? { ...c, studentId: newId } : c));
    next.paymentRequests = (data.paymentRequests || []).map((r) => (r.studentId === oldId ? { ...r, studentId: newId } : r));
    next.attendance = {};
    for (const [key, statuses] of Object.entries(data.attendance)) {
      const s = { ...statuses };
      if (Object.prototype.hasOwnProperty.call(s, oldId)) { s[newId] = s[oldId]; delete s[oldId]; }
      next.attendance[key] = s;
    }
  } else if (entityType === "coach") {
    next.coaches = data.coaches.map((c) => (c.id === oldId ? { ...c, id: newId } : c));
    next.batches = data.batches.map((b) => (b.coach === oldId ? { ...b, coach: newId } : b));
    next.dojos = data.dojos.map((d) => (d.headCoach === oldId ? { ...d, headCoach: newId } : d));
  } else if (entityType === "senior") {
    next.seniorStudents = (data.seniorStudents || []).map((s) => (s.id === oldId ? { ...s, id: newId } : s));
  }
  if (data.accounts && Object.prototype.hasOwnProperty.call(data.accounts, oldId)) {
    const accounts = { ...data.accounts };
    accounts[newId] = accounts[oldId];
    delete accounts[oldId];
    next.accounts = accounts;
  }
  return next;
}

/* Who counts as "Sensei" for the currently logged-in (non-admin) person:
   - Student  -> their own assigned coach
   - Teacher  -> their dojo's head coach (or the association office if they
                 themselves are the head coach) */
function getSenseiContact(role, user, data) {
  if (role === "Student") {
    const student = data.students.find((s) => s.id === user.id) || user;
    const coach = data.coaches.find((c) => c.id === student.coach);
    if (coach) return { name: coach.name, mobile: coach.mobile };
  }
  if (role === "Senior Student") {
    const senior = (data.seniorStudents || []).find((s) => s.id === user.id) || user;
    const batch = data.batches.find((b) => b.id === senior.batch);
    const coach = data.coaches.find((c) => c.id === batch?.coach);
    if (coach) return { name: coach.name, mobile: coach.mobile };
  }
  if (role === "Teacher / Coach") {
    const dojo = data.dojos.find((d) => d.headCoach && data.batches.some((b) => b.coach === user.id && b.dojo === d.id));
    if (dojo && dojo.headCoach && dojo.headCoach !== user.id) {
      const head = data.coaches.find((c) => c.id === dojo.headCoach);
      if (head) return { name: head.name, mobile: head.mobile };
    }
    return { name: "Association Office", mobile: data.association.officeMobile };
  }
  return null;
}

function SenseiContact({ sensei, compact }) {
  const [open, setOpen] = useState(false);
  if (!sensei) return null;
  const tel = `tel:${sensei.mobile}`;
  const wa = `https://wa.me/91${sensei.mobile}`;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-red-300 hover:bg-red-50"
          title={`Contact Sensei ${sensei.name}`}
        >
          <Phone size={15} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">Sensei {sensei.name}</p>
              <a href={tel} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Phone size={15} className="text-gray-500" /> Call
              </a>
              <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <MessageCircle size={15} className="text-green-600" /> WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left hover:border-red-300 hover:bg-red-50"
      >
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-gray-800">Sensei {sensei.name}</span>
          <span className="text-[11px] text-gray-400">Tap to contact</span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600">
          <Phone size={15} />
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <a href={tel} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Phone size={15} className="text-gray-500" /> Call
            </a>
            <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <MessageCircle size={15} className="text-green-600" /> WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================== SMALL UI PARTS ============================== */
function BeltBar({ activeBelt, size = "sm" }) {
  const h = size === "lg" ? "h-3" : "h-1.5";
  const activeIdx = BELT_ORDER.indexOf(activeBelt);
  return (
    <div className={`flex w-full ${h} rounded-full overflow-hidden border border-gray-200`}>
      {BELT_ORDER.map((b, i) => (
        <div
          key={b}
          className="flex-1"
          style={{
            background: BELT_COLORS[b],
            opacity: activeBelt ? (i <= activeIdx ? 1 : 0.18) : 1,
          }}
        />
      ))}
    </div>
  );
}

function BeltChip({ belt }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-300" style={{ background: BELT_COLORS[belt] || "#ccc" }} />
      {belt}
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    Present: "bg-green-50 text-green-700 border-green-200",
    Absent: "bg-red-50 text-red-700 border-red-200",
    Late: "bg-amber-50 text-amber-700 border-amber-200",
    Leave: "bg-gray-100 text-gray-600 border-gray-200",
    Paid: "bg-green-50 text-green-700 border-green-200",
    Partial: "bg-blue-50 text-blue-700 border-blue-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Active: "bg-green-50 text-green-700 border-green-200",
  };
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{status}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white ${className}`}>{children}</div>;
}

function StatCard({ label, value, tone = "default", onClick }) {
  const toneMap = {
    default: "text-gray-900",
    good: "text-green-700",
    warn: "text-amber-700",
    accent: "text-red-700",
  };
  const content = (
    <>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneMap[tone]}`}>{value}</div>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-red-300 hover:bg-red-50">
        {content}
      </button>
    );
  }
  return <Card className="p-4">{content}</Card>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className={`w-full ${wide ? "sm:max-w-lg" : "sm:max-w-sm"} rounded-t-2xl sm:rounded-2xl bg-white p-5 max-h-[90vh] overflow-y-auto`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
      {message}
    </div>
  );
}

/* ============================== LOGIN ============================== */
// Finds the matching account for a role + identifier (ID, mobile, or name)
function LoginScreen({ onLogin, data }) {
  const [role, setRole] = useState(null);
  const [step, setStep] = useState("form"); // "form" | "otpVerify"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Admin is intentionally not listed as a visible role card — it's a
  // higher-privilege login reached via the "⋮" menu, not something anyone
  // browsing the login page can just tap into.
  const roles = [
    { id: "Teacher / Coach", icon: GraduationCap },
    { id: "Senior Student", icon: ShieldCheck },
    { id: "Student", icon: User },
  ];

  const resetTransient = () => {
    setStep("form"); setIdentifier(""); setPassword(""); setOtp("");
    setError(""); setPendingEmail(null); setBusy(false);
  };
  const chooseRole = (r) => { resetTransient(); setRole(r); };
  const backToRoles = () => { resetTransient(); setRole(null); };

  const submitLogin = async () => {
    setError(""); setBusy(true);
    try {
      if (role === "Admin") {
        const { email } = await adminLoginStep1({ identifier, password });
        setPendingEmail(email);
        setStep("otpVerify");
      } else {
        const { profile } = await staffOrStudentLogin({
          identifier, password, expectedRole: ROLE_UI_TO_DB[role],
        });
        onLogin(role, { id: profile.ref_id, name: profile.name || profile.username || profile.ref_id });
      }
    } catch (e) {
      setError(e.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtpLogin = async () => {
    setError(""); setBusy(true);
    try {
      const { profile } = await adminLoginStep2({ email: pendingEmail, code: otp });
      onLogin("Admin", { id: profile.ref_id, name: profile.name || "Association Admin" });
    } catch (e) {
      setError(e.message || "Invalid or expired code.");
    } finally {
      setBusy(false);
    }
  };

  const activeIcon = roles.find((r) => r.id === role)?.icon || ShieldCheck;

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="relative mb-6 text-center">
          <button
            onClick={() => setShowMoreMenu((v) => !v)}
            className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="More options"
          >
            <MoreVertical size={18} />
          </button>
          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
              <div className="absolute right-0 top-9 z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-lg">
                <button
                  onClick={() => { setShowMoreMenu(false); chooseRole("Admin"); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ShieldCheck size={15} className="text-gray-500" /> Continue as Admin
                </button>
              </div>
            </>
          )}
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white text-2xl">
            🥋
          </div>
          <h1 className="text-lg font-bold text-gray-900">Welcome to {data.association.name} 🥋</h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>

        <Card className="p-5">
          {!role && (
            <div className="space-y-2">
              <p className="mb-3 text-xs font-medium text-gray-500">Continue as</p>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => chooseRole(r.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:border-red-300 hover:bg-red-50"
                >
                  <span className="flex items-center gap-2">
                    <r.icon size={18} className="text-gray-500" />
                    {r.id}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {role && step === "otpVerify" && (
            <div>
              <button onClick={() => setStep("form")} className="mb-3 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800">
                <ArrowLeft size={14} /> Back
              </button>
              <h3 className="mb-1 text-sm font-bold text-gray-900">Verify OTP</h3>
              <p className="mb-3 text-xs text-gray-500">A 6-digit code was emailed to {pendingEmail}.</p>
              <Field label="Enter OTP"><input className={inputCls} value={otp} onChange={(e) => setOtp(e.target.value)} /></Field>
              {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
              <button disabled={busy} onClick={verifyOtpLogin} className="mt-3 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {busy ? "Verifying…" : "Verify & Login"}
              </button>
            </div>
          )}

          {role && step === "form" && (
            <div>
              <button onClick={backToRoles} className="mb-3 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800">
                <ArrowLeft size={14} /> Back
              </button>
              <div className="mb-4 flex items-center gap-2">
                {React.createElement(activeIcon, { size: 18, className: "text-gray-500" })}
                <h3 className="text-sm font-bold text-gray-900">{role} Login</h3>
              </div>

              <div className="space-y-3">
                <Field label={role === "Student" ? "Student ID, mobile, or email" : role === "Admin" ? "Username, mobile, or email" : "ID, username, mobile, or email"}>
                  <input className={inputCls} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={role === "Student" ? "e.g. KRT-000001" : role === "Admin" ? "admin" : "e.g. COACH-001"} />
                </Field>
                <Field label="Password"><input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <button disabled={busy} onClick={submitLogin} className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {busy ? "Signing in…" : role === "Admin" ? "Continue" : "Login"}
                </button>
              </div>

              <p className="mt-4 text-center text-[11px] text-gray-400">
                Forgot your password? Ask your Admin to reset it for you.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const RESOURCE_TYPES = ["YouTube", "Instagram", "Facebook", "Google Drive", "Syllabus", "Notes", "Picture", "Music", "Video", "Other"];
const UPLOADABLE_TYPES = ["Picture", "Music", "Video"];
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // ~3MB — safe limit for text/JSON-based storage

function resourceIcon(type) {
  switch (type) {
    case "YouTube": return { Icon: Youtube, cls: "text-red-600 border-red-200 bg-red-50" };
    case "Instagram": return { Icon: Instagram, cls: "text-pink-600 border-pink-200 bg-pink-50" };
    case "Facebook": return { Icon: Facebook, cls: "text-blue-600 border-blue-200 bg-blue-50" };
    case "Google Drive": return { Icon: HardDrive, cls: "text-green-700 border-green-200 bg-green-50" };
    case "Syllabus": return { Icon: BookOpen, cls: "text-amber-700 border-amber-200 bg-amber-50" };
    case "Notes": return { Icon: FileText, cls: "text-gray-700 border-gray-200 bg-gray-100" };
    case "Picture": return { Icon: ImageIcon, cls: "text-purple-600 border-purple-200 bg-purple-50" };
    case "Music": return { Icon: Music, cls: "text-indigo-600 border-indigo-200 bg-indigo-50" };
    case "Video": return { Icon: Video, cls: "text-rose-600 border-rose-200 bg-rose-50" };
    default: return { Icon: LinkIcon, cls: "text-gray-700 border-gray-200 bg-gray-100" };
  }
}

function ResourceLink({ res }) {
  const { Icon, cls } = resourceIcon(res.type);
  const showThumb = res.type === "Picture" && res.url;
  return (
    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
      {showThumb ? (
        <img src={res.url} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 object-cover" />
      ) : (
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${cls}`}><Icon size={16} /></span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">{res.title}</span>
        <span className="text-xs text-gray-400">{res.type} · added by {res.addedBy}{res.isUpload ? " · uploaded file" : ""}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-gray-300" />
    </a>
  );
}

function ResourceForm({ initial, addedBy, onCancel, onSave }) {
  const [form, setForm] = useState(initial || { title: "", url: "", type: "YouTube", isUpload: false });
  const [fileError, setFileError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canUpload = UPLOADABLE_TYPES.includes(form.type);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB — please keep uploads under 3MB, or paste a link instead (e.g. Google Drive/YouTube) for larger files.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, url: reader.result, isUpload: true, title: f.title || file.name }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <Field label="Type">
        <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
          {RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Title"><input className={inputCls} placeholder="e.g. Green Belt Kata Syllabus" value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>

      <Field label={form.type === "Google Drive" ? "Google Drive link" : "Link (URL)"}>
        <input
          className={inputCls}
          placeholder="https://..."
          value={form.isUpload ? "" : form.url}
          disabled={form.isUpload}
          onChange={(e) => set("url", e.target.value)}
        />
      </Field>

      {canUpload && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3">
          {!form.isUpload ? (
            <label className="flex cursor-pointer items-center justify-center gap-2 text-sm font-medium text-gray-600">
              <Upload size={16} />
              Or upload a {form.type.toLowerCase()} file
              <input type="file" className="hidden" accept={form.type === "Picture" ? "image/*" : form.type === "Music" ? "audio/*" : "video/*"} onChange={handleFile} />
            </label>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-green-700">File attached ✓</span>
              <button onClick={() => setForm((f) => ({ ...f, isUpload: false, url: "" }))} className="text-xs font-semibold text-red-600">Remove</button>
            </div>
          )}
          {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
          {!fileError && <p className="mt-2 text-center text-[11px] text-gray-400">Keep uploads under 3MB. For larger videos, paste a Google Drive or YouTube link above instead.</p>}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
        <button
          onClick={() => {
            if (!form.title.trim() || !form.url.trim()) return;
            onSave(initial ? form : { ...form, id: uid("RES"), addedBy });
          }}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ResourcesManager({ data, setData, notify, addedBy, embedded }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const save = (res) => {
    setData((d) => {
      const list = d.resources || [];
      return {
        ...d,
        resources: editing ? list.map((r) => (r.id === editing.id ? { ...r, ...res } : r)) : [...list, res],
      };
    });
    notify(editing ? "Link updated" : "Link added for students");
    setShowAdd(false);
    setEditing(null);
  };
  const remove = (id) => {
    setData((d) => ({ ...d, resources: (d.resources || []).filter((r) => r.id !== id) }));
    notify("Link removed");
  };

  return (
    <div className={embedded ? "" : "space-y-4"}>
      {!embedded && <h1 className="text-xl font-bold text-gray-900">Resources & Links</h1>}
      <div className="flex items-center justify-between">
        {embedded && <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Resources & links for students</p>}
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <Plus size={16} /> Add Link
        </button>
      </div>
      <Card className="divide-y divide-gray-100">
        {(!data.resources || data.resources.length === 0) && <div className="p-6 text-center text-sm text-gray-400">No links added yet.</div>}
        {(data.resources || []).map((r) => (
          <div key={r.id} className="flex items-center">
            <div className="flex-1"><ResourceLink res={r} /></div>
            <div className="flex shrink-0 gap-1 pr-3">
              <button onClick={() => setEditing(r)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
              <button onClick={() => remove(r.id)} className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </Card>

      {(showAdd || editing) && (
        <Modal title={editing ? "Edit Link" : "Add Link"} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <ResourceForm initial={editing} addedBy={addedBy} onCancel={() => { setShowAdd(false); setEditing(null); }} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

const NAV = {
  Admin: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "dojos", label: "Dojos", icon: Building2 },
    { id: "students", label: "Students", icon: Users },
    { id: "coaches", label: "Teachers / Coach", icon: GraduationCap },
    { id: "seniors", label: "Senior Students", icon: ShieldCheck },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "fees", label: "Monthly Fees", icon: Wallet },
    { id: "belts", label: "Belt / Rank", icon: Award },
    { id: "certificates", label: "Certificates", icon: FileText },
    { id: "resources", label: "Resources", icon: LinkIcon },
    { id: "announcements", label: "Announcements", icon: Bell },
  ],
  "Teacher / Coach": [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "students", label: "My Students", icon: Users },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "fees", label: "Fees", icon: Wallet },
    { id: "certificates", label: "Certificates", icon: FileText },
    { id: "resources", label: "Resources", icon: LinkIcon },
    { id: "announcements", label: "Announcements", icon: Bell },
  ],
  Student: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "fees", label: "Fees", icon: Wallet },
    { id: "belts", label: "My Belt", icon: Award },
    { id: "announcements", label: "Announcements", icon: Bell },
  ],
  "Senior Student": [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "students", label: "My Batch", icon: Users },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "announcements", label: "Announcements", icon: Bell },
  ],
};

function Shell({ role, user, screen, setScreen, onLogout, sensei, academyName, onSwitchAcademy, children }) {
  const items = NAV[role];
  return (
    <div className="flex min-h-full flex-col bg-gray-50 sm:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white p-4 sm:flex sm:flex-col">
        <div className="mb-4 flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white"><ShieldCheck size={18} /></div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">Bishal Karate<br/>Association</div>
          </div>
        </div>
        {academyName && (
          <button onClick={onSwitchAcademy} className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left hover:border-red-300 hover:bg-red-50">
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Managing</span>
              <span className="block truncate text-xs font-bold text-gray-800">{academyName}</span>
            </span>
            <ChevronDown size={14} className="shrink-0 text-gray-400" />
          </button>
        )}
        <nav className="flex-1 space-y-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setScreen(it.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${screen === it.id ? "bg-red-50 text-red-700" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <it.icon size={17} /> {it.label}
            </button>
          ))}
        </nav>
        {sensei && <div className="mb-3"><SenseiContact sensei={sensei} /></div>}
        <div className="mt-1 border-t border-gray-100 pt-4">
          <div className="mb-2 px-1 text-xs text-gray-500">{user.name} · {role}</div>
          <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white"><ShieldCheck size={16} /></div>
          <div>
            <span className="block text-sm font-bold text-gray-900 leading-tight">Bishal Karate</span>
            {academyName && (
              <button onClick={onSwitchAcademy} className="block truncate text-[11px] font-medium text-gray-400">{academyName} ▾</button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sensei && <SenseiContact sensei={sensei} compact />}
          <button onClick={onLogout} className="text-gray-500"><LogOut size={18} /></button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-20 sm:pb-8">
        <div className="mx-auto max-w-5xl p-4 sm:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white sm:hidden">
        {items.slice(0, 5).map((it) => (
          <button
            key={it.id}
            onClick={() => setScreen(it.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${screen === it.id ? "text-red-700" : "text-gray-500"}`}
          >
            <it.icon size={19} />
            {it.label.split(" ")[0]}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ============================== ADMIN: ACADEMY SELECT ============================== */
function DojoForm({ initial, coaches, onCancel, onSave, nextId }) {
  const [form, setForm] = useState(
    initial || { name: "", address: "", contact: "", headCoach: "" }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <Field label="Academy / Club name"><input className={inputCls} placeholder="e.g. Dispur Karate Academy" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Address"><input className={inputCls} placeholder="e.g. Dispur, Guwahati, Assam" value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
      <Field label="Contact number"><input className={inputCls} value={form.contact} onChange={(e) => set("contact", e.target.value)} /></Field>
      <Field label="Head coach">
        <select className={inputCls} value={form.headCoach} onChange={(e) => set("headCoach", e.target.value)}>
          <option value="">— None assigned —</option>
          {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
        <button
          onClick={() => {
            if (!form.name.trim()) return;
            onSave(initial ? form : { ...form, id: nextId });
          }}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function DojosScreen({ data, setData, notify, adminAcademy, onSelect, onViewAll }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const nextId = "DOJO-" + String(data.dojos.length + 1).padStart(3, "0");

  const save = (dojo) => {
    setData((d) => ({
      ...d,
      dojos: editing ? d.dojos.map((x) => (x.id === editing.id ? { ...x, ...dojo } : x)) : [...d.dojos, dojo],
    }));
    notify(editing ? "Academy updated" : `${dojo.name} added`);
    setShowAdd(false);
    setEditing(null);
  };
  const remove = (id) => {
    setData((d) => ({ ...d, dojos: d.dojos.filter((x) => x.id !== id) }));
    notify("Academy removed");
  };

  const currentDojo = adminAcademy ? data.dojos.find((d) => d.id === adminAcademy) : null;

  // A specific academy is currently selected → show only ITS details, not the full list.
  if (currentDojo) {
    const count = data.students.filter((s) => s.dojo === currentDojo.id).length;
    const coachCount = data.coaches.filter((c) => c.dojo === currentDojo.id).length;
    const batchCount = data.batches.filter((b) => b.dojo === currentDojo.id).length;
    const headCoach = data.coaches.find((c) => c.id === currentDojo.headCoach);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Dojo / Academy Details</h1>
          <button onClick={() => setEditing(currentDojo)} className="flex items-center gap-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-red-300 hover:bg-red-50">
            <Pencil size={14} /> Edit
          </button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white"><Building2 size={26} /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentDojo.name}</h2>
              <p className="text-xs text-gray-500">{currentDojo.id}</p>
              <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">Managing</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Students" value={count} />
          <StatCard label="Coaches" value={coachCount} />
          <StatCard label="Batches" value={batchCount} />
        </div>

        <Card className="p-4 space-y-2 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Details</p>
          <div className="flex items-center gap-2 text-gray-700"><MapPin size={14} className="text-gray-400" /> {currentDojo.address || "—"}</div>
          <div className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400" /> {currentDojo.contact || "—"}</div>
          <div className="text-gray-700">Head coach: {headCoach?.name || "— None assigned —"}</div>
        </Card>

        <button onClick={onViewAll} className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-red-300 hover:bg-red-50">
          <span>
            <div className="text-sm font-semibold text-gray-900">View all academies</div>
            <div className="text-xs text-gray-500">See every academy in the association, tagged</div>
          </span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        {editing && (
          <Modal title="Edit Academy" onClose={() => setEditing(null)}>
            <DojoForm initial={editing} coaches={data.coaches} nextId={nextId} onCancel={() => setEditing(null)} onSave={save} />
          </Modal>
        )}
      </div>
    );
  }

  // No specific academy selected ("All Academies" / just tapped "View all academies") → show the full list.
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dojos / Academies</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <Plus size={16} /> Add Academy
        </button>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        Currently managing: All Academies (association-wide)
      </div>

      <Card className="divide-y divide-gray-100">
        {data.dojos.map((d) => {
          const count = data.students.filter((s) => s.dojo === d.id).length;
          const coachCount = data.coaches.filter((c) => c.dojo === d.id).length;
          return (
            <div key={d.id} className="flex items-center">
              <button
                onClick={() => onSelect(d.id)}
                className="flex flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Building2 size={17} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{d.name}</div>
                  <div className="text-xs text-gray-500">{d.address} · {count} student{count === 1 ? "" : "s"} · {coachCount} coach{coachCount === 1 ? "" : "es"}</div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
              <div className="flex shrink-0 gap-1 pr-3">
                <button onClick={() => setEditing(d)} title="Edit academy details" className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                <button onClick={() => remove(d.id)} title="Remove academy" className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </Card>

      <p className="text-[11px] leading-relaxed text-gray-400">
        Tap an academy to manage it — students, coaches, and senior students inside it stay linked only to that academy. "Total Students" and "Total Coaches" on the dashboard always show everyone across every academy, tagged by academy.
      </p>

      {(showAdd || editing) && (
        <Modal title={editing ? "Edit Academy" : "Add New Academy / Club"} onClose={() => { setShowAdd(false); setEditing(null); }}>
          <DojoForm initial={editing} coaches={data.coaches} nextId={nextId} onCancel={() => { setShowAdd(false); setEditing(null); }} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

/* ============================== ADMIN: DASHBOARD ============================== */
function AdminDashboard({ data, setScreen, academyId, academyName, onManageAcademies }) {
  const scopeLabel = academyId ? academyName : "All Academies";
  const scopedStudents = academyId ? data.students.filter((s) => s.dojo === academyId) : data.students;
  const totalStudents = data.students.length; // grand total across every academy — always shown here
  const totalCoaches = data.coaches.length; // grand total across every academy
  const totalSeniors = (data.seniorStudents || []).length; // grand total across every academy
  const totalAcademies = data.dojos.length;
  const today = "2026-08-31";
  const todaysAttendance = Object.entries(data.attendance).filter(([k]) => {
    if (!k.startsWith(today)) return false;
    const batchId = k.split("__")[1];
    return data.batches.some((b) => b.id === batchId && (!academyId || b.dojo === academyId));
  }).length;
  const ym = "2026-08";
  const paidIds = new Set(data.payments.filter((p) => p.month === ym).map((p) => p.studentId));
  const paidCount = scopedStudents.filter((s) => paidIds.has(s.id)).length;
  const unpaidCount = scopedStudents.length - paidCount;
  const scopedBelts = data.belts.length; // belt ranks are association-wide, not per-academy

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">{data.association.name} — {scopeLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Students (all academies)" value={totalStudents} onClick={() => setScreen("all-students")} />
        <StatCard label={`Today's Attendance — ${scopeLabel}`} value={todaysAttendance} onClick={() => setScreen("attendance")} />
        <StatCard label={`Paid — Aug 2026 (${scopeLabel})`} value={paidCount} tone="good" onClick={() => setScreen("fees")} />
        <StatCard label={`Pending — Aug 2026 (${scopeLabel})`} value={unpaidCount} tone="warn" onClick={() => setScreen("fees")} />
        <StatCard label="Total Coaches (all academies)" value={totalCoaches} onClick={() => setScreen("all-coaches")} />
        <StatCard label="Total Senior Students (all academies)" value={totalSeniors} onClick={() => setScreen("all-seniors")} />
        <StatCard label="Belt Ranks" value={scopedBelts} onClick={() => setScreen("belts")} />
        <StatCard label="Dojos / Academies" value={totalAcademies} onClick={onManageAcademies} />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Quick actions — {scopeLabel}</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["students", "Students"],
            ["coaches", "Teachers / Coach"],
            ["seniors", "Senior Students"],
            ["attendance", "Attendance"],
            ["fees", "Monthly Fees"],
            ["belts", "Belt / Rank"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setScreen(id)} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50">
              {label}
            </button>
          ))}
          <button onClick={onManageAcademies} className="flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50">
            <Building2 size={14} /> Dojos / Manage Academies
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Recent activity</p>
        <Card className="divide-y divide-gray-100">
          {[
            "Payment received — Priya Das (Aug 2026)",
            "Attendance marked — Beginner Kids (26 Aug)",
            "New student added — Ananya Sharma",
            "Belt promoted — Rahul Das → Yellow Belt",
          ].map((line, i) => (
            <div key={i} className="px-4 py-3 text-sm text-gray-700">{line}</div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ============================== STUDENTS ============================== */
function StudentForm({ initial, dojos, batches, onSave, onCancel, nextId, idError }) {
  const [form, setForm] = useState(
    initial || {
      id: nextId, name: "", dob: "", gender: "Male", mobile: "", email: "", address: "",
      guardian: "", emergency: "", dojo: dojos[0]?.id || "", batch: batches[0]?.id || "",
      belt: BELT_ORDER[0], status: "Active",
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div>
        <Field label="Student ID">
          <input className={inputCls} value={form.id} onChange={(e) => set("id", e.target.value.trim())} placeholder={nextId} />
        </Field>
        {idError && <p className="mt-1 text-xs font-medium text-red-600">{idError}</p>}
        <p className="mt-1 text-[11px] text-gray-400">Admin can set a custom ID here — must be unique.</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Personal information</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Full name"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field></div>
          <Field label="Date of birth"><input type="date" className={inputCls} value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Mobile"><input className={inputCls} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
          <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <div className="col-span-2"><Field label="Address"><input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field></div>
          <Field label="Guardian name"><input className={inputCls} value={form.guardian} onChange={(e) => set("guardian", e.target.value)} /></Field>
          <Field label="Emergency contact"><input className={inputCls} value={form.emergency} onChange={(e) => set("emergency", e.target.value)} /></Field>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Karate information</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dojo">
            <select className={inputCls} value={form.dojo} onChange={(e) => set("dojo", e.target.value)}>
              {dojos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Batch">
            <select className={inputCls} value={form.batch} onChange={(e) => set("batch", e.target.value)}>
              {batches.filter((b) => b.dojo === form.dojo).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Belt">
            <select className={inputCls} value={form.belt} onChange={(e) => set("belt", e.target.value)}>
              {BELT_ORDER.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option>Active</option><option>Suspended</option>
            </select>
          </Field>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
        <button
          onClick={() => {
            if (!form.name.trim() || !form.id.trim()) return;
            onSave(initial ? form : { ...form, joined: "2026-08-31", coach: batches.find((b) => b.id === form.batch)?.coach || "" });
          }}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ============================== TEACHERS / COACHES ============================== */
function CoachForm({ initial, dojos, onCancel, onSave, nextId, idError }) {
  const [form, setForm] = useState(initial || { id: nextId, name: "", mobile: "", email: "", dojo: dojos[0]?.id || "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <Field label="Coach ID"><input className={inputCls} value={form.id} onChange={(e) => set("id", e.target.value.trim())} placeholder={nextId} /></Field>
      {idError && <p className="text-xs font-medium text-red-600">{idError}</p>}
      <Field label="Full name"><input className={inputCls} placeholder="e.g. Coach Priya Nair" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Mobile"><input className={inputCls} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
      <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <Field label="Primary dojo">
        <select className={inputCls} value={form.dojo} onChange={(e) => set("dojo", e.target.value)}>
          {dojos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
        <button
          onClick={() => {
            if (!form.name.trim() || !form.id.trim()) return;
            onSave(form);
          }}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function CoachesScreen({ data, setData, notify, filterDojoIds, showAcademyTag, canAdd = true }) {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [formError, setFormError] = useState("");

  const pool = data.coaches.filter((c) => !filterDojoIds || filterDojoIds.includes(c.dojo));
  const filtered = pool.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.id.toLowerCase().includes(q.toLowerCase()));
  const nextId = "COACH-" + String(data.coaches.length + 1).padStart(3, "0");

  const save = (coach) => {
    setFormError("");
    const dupe = data.coaches.some((c) => c.id === coach.id && (!editing || c.id !== editing.id));
    if (dupe) { setFormError(`Coach ID "${coach.id}" is already in use.`); return; }
    if (!editing) {
      setData((d) => ({ ...d, coaches: [...d.coaches, coach] }));
      notify(`${coach.name} added as ${coach.id}`);
    } else {
      let next = data;
      if (editing.id !== coach.id) next = renameEntityId(next, "coach", editing.id, coach.id);
      next = { ...next, coaches: next.coaches.map((c) => (c.id === coach.id ? { ...c, ...coach } : c)) };
      setData(next);
      notify("Coach updated");
    }
    setShowAdd(false);
    setEditing(null);
  };
  const remove = (id) => {
    setData((d) => ({ ...d, coaches: d.coaches.filter((c) => c.id !== id) }));
    notify("Coach removed");
  };

  if (viewing) {
    const coach = data.coaches.find((c) => c.id === viewing.id) || viewing;
    const myBatches = data.batches.filter((b) => b.coach === coach.id);
    const myStudents = data.students.filter((s) => myBatches.some((b) => b.id === s.batch));
    const dojo = data.dojos.find((d) => d.id === coach.dojo) || data.dojos.find((d) => myBatches.some((b) => b.dojo === d.id));
    return (
      <div className="space-y-4">
        <button onClick={() => setViewing(null)} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Teachers / Coaches
        </button>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-lg font-bold text-white">{initials(coach.name)}</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{coach.name}</h2>
              <p className="text-xs text-gray-500">{coach.id}</p>
            </div>
          </div>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4 space-y-2 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Contact</p>
            <div className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400" /> {coach.mobile || "—"}</div>
            <div className="flex items-center gap-2 text-gray-700"><Mail size={14} className="text-gray-400" /> {coach.email || "—"}</div>
            {dojo && <div className="flex items-center gap-2 text-gray-700"><Building2 size={14} className="text-gray-400" /> {dojo.name}</div>}
          </Card>
          <Card className="p-4 space-y-2 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Teaching load</p>
            <div className="text-gray-700">Batches: {myBatches.length}</div>
            <div className="text-gray-700">Students: {myStudents.length}</div>
          </Card>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Batches</p>
          <Card className="divide-y divide-gray-100">
            {myBatches.length === 0 && <div className="p-4 text-sm text-gray-400">No batches assigned yet.</div>}
            {myBatches.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold text-gray-900">{b.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} /> {b.days} · {b.start}–{b.end}</div>
                </div>
                <span className="text-xs text-gray-500">{data.students.filter((s) => s.batch === b.id).length} students</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Teachers / Coaches</h1>
        {canAdd && (
          <button onClick={() => { setFormError(""); setShowAdd(true); }} className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Plus size={16} /> Add Coach
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className={`${inputCls} pl-8`} placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="divide-y divide-gray-100">
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No coaches match your search.</div>}
        {filtered.map((c) => {
          const myBatches = data.batches.filter((b) => b.coach === c.id);
          return (
            <div key={c.id} className="flex items-center">
              <button onClick={() => setViewing(c)} className="flex flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">{initials(c.name)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">
                    {c.id} · {myBatches.length} batch{myBatches.length === 1 ? "" : "es"}
                    {showAcademyTag && <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{data.dojos.find((d) => d.id === c.dojo)?.name || c.dojo}</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
              {canAdd && (
                <div className="flex shrink-0 gap-1 pr-3">
                  <button onClick={() => setEditing(c)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                  <button onClick={() => remove(c.id)} className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {(showAdd || editing) && (
        <Modal title={editing ? "Edit Coach" : "Add Coach"} onClose={() => { setShowAdd(false); setEditing(null); setFormError(""); }}>
          <CoachForm initial={editing} dojos={filterDojoIds ? data.dojos.filter((d) => filterDojoIds.includes(d.id)) : data.dojos} nextId={nextId} idError={formError} onCancel={() => { setShowAdd(false); setEditing(null); setFormError(""); }} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

/* ============================== SENIOR STUDENTS ============================== */
function SeniorStudentForm({ initial, dojos, batches, onCancel, onSave, nextId, idError }) {
  const [form, setForm] = useState(
    initial || {
      id: nextId,
      name: "",
      mobile: "",
      dojo: dojos[0]?.id || "",
      batch: batches.find((b) => b.dojo === (dojos[0]?.id || ""))?.id || "",
      permissions: { markAttendance: true, viewStudents: true },
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setDojo = (dojoId) => {
    const firstBatch = batches.find((b) => b.dojo === dojoId)?.id || "";
    setForm((f) => ({ ...f, dojo: dojoId, batch: firstBatch }));
  };
  const dojoBatches = batches.filter((b) => b.dojo === form.dojo);
  return (
    <div className="space-y-3">
      <Field label="Senior Student ID"><input className={inputCls} value={form.id} onChange={(e) => set("id", e.target.value.trim())} placeholder={nextId} /></Field>
      {idError && <p className="text-xs font-medium text-red-600">{idError}</p>}
      <Field label="Full name"><input className={inputCls} placeholder="e.g. Priya Das" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Mobile"><input className={inputCls} value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
      <Field label="Academy / Dojo">
        <select className={inputCls} value={form.dojo} onChange={(e) => setDojo(e.target.value)}>
          {dojos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <Field label="Batch">
        <select className={inputCls} value={form.batch} onChange={(e) => set("batch", e.target.value)}>
          {dojoBatches.length === 0 && <option value="">No batches in this academy</option>}
          {dojoBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </Field>
      <Field label="Permissions">
        <div className="space-y-2 rounded-lg border border-gray-200 p-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.permissions?.markAttendance} onChange={(e) => set("permissions", { ...form.permissions, markAttendance: e.target.checked })} />
            Can mark attendance for their batch
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.permissions?.viewStudents} onChange={(e) => set("permissions", { ...form.permissions, viewStudents: e.target.checked })} />
            Can view students in their batch
          </label>
        </div>
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
        <button
          onClick={() => {
            if (!form.name.trim() || !form.id.trim()) return;
            onSave(form);
          }}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function SeniorStudentsScreen({ data, setData, notify, filterDojoIds, showAcademyTag, canAdd = true }) {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");

  const all = data.seniorStudents || [];
  const pool = all.filter((s) => !filterDojoIds || filterDojoIds.includes(s.dojo));
  const filtered = pool.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()));
  const nextId = "SENIOR-" + String(all.length + 1).padStart(3, "0");
  const scopedDojos = filterDojoIds ? data.dojos.filter((d) => filterDojoIds.includes(d.id)) : data.dojos;

  const save = (senior) => {
    setFormError("");
    const dupe = all.some((s) => s.id === senior.id && (!editing || s.id !== editing.id));
    if (dupe) { setFormError(`Senior Student ID "${senior.id}" is already in use.`); return; }
    if (!editing) {
      setData((d) => ({ ...d, seniorStudents: [...(d.seniorStudents || []), senior] }));
      notify(`${senior.name} added as ${senior.id}`);
    } else {
      let next = data;
      if (editing.id !== senior.id) next = renameEntityId(next, "senior", editing.id, senior.id);
      next = { ...next, seniorStudents: (next.seniorStudents || []).map((s) => (s.id === senior.id ? { ...s, ...senior } : s)) };
      setData(next);
      notify("Senior student updated");
    }
    setShowAdd(false);
    setEditing(null);
  };
  const remove = (id) => {
    setData((d) => ({ ...d, seniorStudents: (d.seniorStudents || []).filter((s) => s.id !== id) }));
    notify("Senior student removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Senior Students</h1>
        {canAdd && (
          <button onClick={() => { setFormError(""); setShowAdd(true); }} className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Plus size={16} /> Add Senior Student
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className={`${inputCls} pl-8`} placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="divide-y divide-gray-100">
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No senior students match your search.</div>}
        {filtered.map((s) => {
          const batch = data.batches.find((b) => b.id === s.batch);
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-1 items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">{initials(s.name)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.id} · {batch?.name || "No batch"}
                    {showAcademyTag && <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{data.dojos.find((d) => d.id === s.dojo)?.name || s.dojo}</span>}
                  </div>
                </div>
              </div>
              {canAdd && (
                <div className="flex shrink-0 gap-1 pr-3">
                  <button onClick={() => { setFormError(""); setEditing(s); }} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                  <button onClick={() => remove(s.id)} className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {(showAdd || editing) && (
        <Modal title={editing ? "Edit Senior Student" : "Add Senior Student"} onClose={() => { setShowAdd(false); setEditing(null); setFormError(""); }}>
          <SeniorStudentForm initial={editing} dojos={scopedDojos} batches={data.batches} nextId={nextId} idError={formError} onCancel={() => { setShowAdd(false); setEditing(null); setFormError(""); }} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

/* ============================== STUDENTS ============================== */
function StudentsScreen({ data, setData, notify, filterBatchIds, filterDojoIds, showAcademyTag, addedBy, canAdd = true }) {
  const [q, setQ] = useState("");
  const [beltFilter, setBeltFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [formError, setFormError] = useState("");

  const pool = data.students.filter((s) => {
    if (filterBatchIds && !filterBatchIds.includes(s.batch)) return false;
    if (filterDojoIds && !filterDojoIds.includes(s.dojo)) return false;
    return true;
  });
  const filtered = pool.filter((s) => {
    if (q && !(s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))) return false;
    if (beltFilter !== "All" && s.belt !== beltFilter) return false;
    if (batchFilter !== "All" && s.batch !== batchFilter) return false;
    return true;
  });

  const ym = "2026-08";
  const paidIds = new Set(data.payments.filter((p) => p.month === ym).map((p) => p.studentId));

  const nextId = "KRT-" + String(data.students.length + 1).padStart(6, "0");

  const saveStudent = (student, isNew) => {
    setFormError("");
    const dupe = data.students.some((s) => s.id === student.id && (isNew || s.id !== editing.id));
    if (dupe) { setFormError(`Student ID "${student.id}" is already in use.`); return; }
    if (isNew) {
      setData((d) => ({ ...d, students: [...d.students, { ...student, addedBy: addedBy || "Admin" }] }));
      notify(`${student.name} added as ${student.id}`);
      setShowAdd(false);
    } else {
      let next = data;
      if (editing.id !== student.id) next = renameEntityId(next, "student", editing.id, student.id);
      next = { ...next, students: next.students.map((s) => (s.id === student.id ? { ...s, ...student } : s)) };
      setData(next);
      notify("Student details updated");
      setEditing(null);
    }
  };

  const removeStudent = (s) => {
    setData((d) => ({ ...d, students: d.students.filter((x) => x.id !== s.id) }));
    notify(`${s.name} removed`);
  };

  if (viewing) {
    return <StudentProfile student={data.students.find((s) => s.id === viewing.id) || viewing} data={data} setData={setData} notify={notify} onBack={() => setViewing(null)} onEdit={() => { setEditing(data.students.find((s) => s.id === viewing.id) || viewing); setViewing(null); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Students</h1>
        {canAdd && (
          <button onClick={() => { setFormError(""); setShowAdd(true); }} className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Plus size={16} /> Add Student
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputCls} pl-8`} placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} w-auto`} value={beltFilter} onChange={(e) => setBeltFilter(e.target.value)}>
          <option>All</option>
          {BELT_ORDER.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select className={`${inputCls} w-auto`} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="All">All batches</option>
          {data.batches.filter((b) => !filterDojoIds || filterDojoIds.includes(b.dojo)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <Card className="divide-y divide-gray-100">
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No students match your filters.</div>}
        {filtered.map((s) => (
          <div key={s.id} className="flex items-center">
            <button onClick={() => setViewing(s)} className="flex flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">{initials(s.name)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900">{s.name}</span>
                  <BeltChip belt={s.belt} />
                </div>
                <div className="text-xs text-gray-500">
                  {s.id} · {data.batches.find((b) => b.id === s.batch)?.name}
                  {showAcademyTag && <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{data.dojos.find((d) => d.id === s.dojo)?.name || s.dojo}</span>}
                </div>
              </div>
              <StatusPill status={paidIds.has(s.id) ? "Paid" : "Pending"} />
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            {canAdd && (
              <div className="flex shrink-0 gap-1 pr-3">
                <button onClick={() => { setFormError(""); setEditing(s); }} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                <button onClick={() => removeStudent(s)} className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
              </div>
            )}
          </div>
        ))}
      </Card>

      {(showAdd || editing) && (
        <Modal title={editing ? "Edit Student" : "Add Student"} onClose={() => { setShowAdd(false); setEditing(null); }} wide>
          <StudentForm
            initial={editing}
            dojos={filterDojoIds ? data.dojos.filter((d) => filterDojoIds.includes(d.id)) : data.dojos}
            batches={filterDojoIds ? data.batches.filter((b) => filterDojoIds.includes(b.dojo)) : data.batches}
            nextId={nextId}
            idError={formError}
            onCancel={() => { setShowAdd(false); setEditing(null); setFormError(""); }}
            onSave={(student) => saveStudent(student, !editing)}
          />
        </Modal>
      )}
    </div>
  );
}

function SetBeltModal({ currentBelt, onClose, onSave }) {
  const [belt, setBelt] = useState(currentBelt);
  const [remarks, setRemarks] = useState("");
  return (
    <Modal title="Correct / Set Belt" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-gray-500">Use this to directly set any belt (correcting a mistake, manual override) — separate from the normal step-by-step Promote flow. This is also logged to belt history.</p>
        <Field label="Belt">
          <select className={inputCls} value={belt} onChange={(e) => setBelt(e.target.value)}>
            {BELT_ORDER.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Reason / remarks"><input className={inputCls} placeholder="e.g. Data entry correction" value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
          <button onClick={() => onSave(belt, remarks)} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function StudentProfile({ student, data, setData, notify, onBack, onEdit }) {
  const [tab, setTab] = useState("info");
  const [payFor, setPayFor] = useState(null);
  const [showSetBelt, setShowSetBelt] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const history = data.payments.filter((p) => p.studentId === student.id).sort((a, b) => a.month.localeCompare(b.month));
  const belts = data.beltHistory.filter((b) => b.studentId === student.id);
  const dojo = data.dojos.find((d) => d.id === student.dojo);
  const batch = data.batches.find((b) => b.id === student.batch);
  const coach = data.coaches.find((c) => c.id === student.coach);

  const savePayment = (month, form) => {
    const record = {
      id: uid("PAY"),
      studentId: student.id,
      month,
      amount: Number(form.amount),
      date: form.date,
      mode: form.mode,
      remarks: form.remarks,
    };
    setData((d) => ({ ...d, payments: [...d.payments, record] }));
    setPayFor(null);
    notify("Payment saved successfully.");
  };

  const setBeltDirectly = (toBelt, remarks) => {
    setData((d) => ({
      ...d,
      students: d.students.map((s) => (s.id === student.id ? { ...s, belt: toBelt } : s)),
      beltHistory: [...d.beltHistory, { studentId: student.id, from: student.belt, to: toBelt, date: "2026-08-31", examiner: "Admin (manual correction)", result: "Corrected", remarks }],
    }));
    setShowSetBelt(false);
    notify(`Belt set to ${toBelt} for ${student.name}`);
  };

  const updatePayment = (id, form) => {
    setData((d) => ({
      ...d,
      payments: d.payments.map((p) => (p.id === id ? { ...p, amount: Number(form.amount), date: form.date, mode: form.mode, remarks: form.remarks } : p)),
    }));
    setEditingPayment(null);
    notify("Payment record updated");
  };
  const deletePayment = (id) => {
    setData((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== id) }));
    notify("Payment record deleted");
  };

  const attRecords = Object.entries(data.attendance).flatMap(([key, statuses]) => {
    const [date] = key.split("__");
    return statuses[student.id] ? [{ date, status: statuses[student.id] }] : [];
  }).sort((a, b) => b.date.localeCompare(a.date));
  const presentCount = attRecords.filter((r) => r.status === "Present").length;
  const pct = attRecords.length ? Math.round((presentCount / attRecords.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Back to students
      </button>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-lg font-bold text-white">{initials(student.name)}</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{student.name}</h2>
              <p className="text-xs text-gray-500">{student.id}</p>
              <div className="mt-1"><BeltChip belt={student.belt} /></div>
            </div>
          </div>
          {onEdit && (
            <button onClick={onEdit} className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:bg-red-50">
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
        <div className="mt-4"><BeltBar activeBelt={student.belt} size="lg" /></div>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 text-sm">
        {[["info", "Info"], ["attendance", "Attendance"], ["fees", "Fees"], ["belt", "Belt History"], ["certificates", "Certificates"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-1.5 font-medium ${tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4 space-y-2 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Personal</p>
            <div className="flex items-center gap-2 text-gray-700"><User size={14} className="text-gray-400" /> DOB: {fmtDate(student.dob)}</div>
            <div className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400" /> {student.mobile || "—"}</div>
            <div className="flex items-center gap-2 text-gray-700"><Mail size={14} className="text-gray-400" /> {student.email || "—"}</div>
            <div className="flex items-center gap-2 text-gray-700"><MapPin size={14} className="text-gray-400" /> {student.address || "—"}</div>
            <div className="text-gray-700">Guardian: {student.guardian || "—"}</div>
            <div className="text-gray-700">Emergency: {student.emergency || "—"}</div>
          </Card>
          <Card className="p-4 space-y-2 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Karate info</p>
            <div className="flex items-center gap-2 text-gray-700"><Building2 size={14} className="text-gray-400" /> {dojo?.name}</div>
            <div className="text-gray-700">Batch: {batch?.name}</div>
            <div className="text-gray-700">Coach: {coach?.name}</div>
            <div className="text-gray-700">Current belt: <BeltChip belt={student.belt} /></div>
            <div className="text-gray-700">Joined: {fmtDate(student.joined)}</div>
            <div className="text-gray-700">Status: <StatusPill status={student.status} /></div>
            <div className="text-gray-700">Record added by: <span className="font-medium text-gray-900">{student.addedBy || "Admin"}</span></div>
          </Card>
        </div>
      )}

      {tab === "attendance" && (
        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold text-gray-800">Overall attendance: {pct}% ({presentCount}/{attRecords.length})</div>
          <div className="divide-y divide-gray-100">
            {attRecords.length === 0 && <p className="py-4 text-sm text-gray-400">No attendance recorded yet.</p>}
            {attRecords.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{fmtDate(r.date)}</span>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "fees" && (() => {
        const feeAmount = data.association.feeAmount;
        const rows = FEE_MONTHS.map((m) => ({ m, st: getFeeStatus(data.payments, student.id, m, feeAmount) }));
        const paidMonthsCount = rows.filter((r) => r.st.status === "Paid").length;
        const partialMonthsCount = rows.filter((r) => r.st.status === "Partial").length;
        const pendingMonthsCount = rows.filter((r) => r.st.status === "Unpaid").length;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Months Paid" value={paidMonthsCount} tone="good" />
              <StatCard label="Partially Paid" value={partialMonthsCount} tone="accent" />
              <StatCard label="Months Pending" value={pendingMonthsCount} tone="warn" />
            </div>
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <tr><th className="px-4 py-2">Month</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Paid</th><th className="px-4 py-2">Pending</th><th className="px-4 py-2">Last payment</th><th className="px-4 py-2"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(({ m, st }) => (
                    <tr key={m}>
                      <td className="px-4 py-2 font-medium text-gray-800">{monthLabel(m)}</td>
                      <td className="px-4 py-2"><StatusPill status={st.status === "Paid" ? "Paid" : st.status === "Partial" ? "Partial" : "Pending"} /></td>
                      <td className="px-4 py-2 text-gray-700">₹{st.paidAmount}</td>
                      <td className="px-4 py-2 text-gray-700">{st.pendingAmount > 0 ? `₹${st.pendingAmount}` : "—"}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {st.lastRecord ? (
                          <span className="inline-flex items-center gap-1">
                            {fmtDate(st.lastRecord.date)} · {st.lastRecord.mode}
                            <button onClick={() => setEditingPayment(st.lastRecord)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={12} /></button>
                            <button onClick={() => deletePayment(st.lastRecord.id)} className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={12} /></button>
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {st.pendingAmount > 0 && (
                          <button onClick={() => setPayFor({ month: m, due: st.pendingAmount, already: st.paidAmount })} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">
                            {st.status === "Partial" ? `Collect ₹${st.pendingAmount}` : "Mark as Paid"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        );
      })()}

      {tab === "belt" && (
        <div className="space-y-3">
          <Card className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-gray-500">Current belt</p>
              <div className="mt-1"><BeltChip belt={student.belt} /></div>
            </div>
            <button onClick={() => setShowSetBelt(true)} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:bg-red-50">
              Correct / Set Belt
            </button>
          </Card>
          <Card className="p-4">
            {belts.length === 0 && <p className="text-sm text-gray-400">No promotions recorded yet — still {student.belt} Belt.</p>}
            <div className="space-y-3">
              {belts.map((b, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <BeltChip belt={b.from} /> <ChevronRight size={14} className="text-gray-300" /> <BeltChip belt={b.to} />
                  <span className="ml-auto text-xs text-gray-500">{fmtDate(b.date)}{b.remarks ? ` · ${b.remarks}` : ""}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "certificates" && (
        <Card className="divide-y divide-gray-100">
          {(!data.certificates || data.certificates.filter((c) => c.studentId === student.id).length === 0) && (
            <div className="p-4 text-sm text-gray-400">No certificates issued yet.</div>
          )}
          {(data.certificates || []).filter((c) => c.studentId === student.id).map((c) => (
            <CertificateCard key={c.id} cert={c} />
          ))}
        </Card>
      )}

      {payFor && (
        <Modal title="Mark as Paid" onClose={() => setPayFor(null)}>
          <MarkPaidForm
            student={student}
            month={payFor.month}
            feeAmount={data.association.feeAmount}
            dueAmount={payFor.due}
            alreadyPaid={payFor.already}
            onCancel={() => setPayFor(null)}
            onSave={(form) => savePayment(payFor.month, form)}
          />
        </Modal>
      )}

      {showSetBelt && (
        <SetBeltModal currentBelt={student.belt} onClose={() => setShowSetBelt(false)} onSave={setBeltDirectly} />
      )}

      {editingPayment && (
        <Modal title="Edit Payment Record" onClose={() => setEditingPayment(null)}>
          <MarkPaidForm
            student={student}
            month={editingPayment.month}
            feeAmount={editingPayment.amount}
            dueAmount={0}
            alreadyPaid={0}
            initial={editingPayment}
            onCancel={() => setEditingPayment(null)}
            onSave={(form) => updatePayment(editingPayment.id, form)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ============================== MONTHLY FEES ============================== */
function PayThroughQrModal({ student, month, amount, upiId, associationName, myRequest, onClose, onNotifyPaid }) {
  const note = `${associationName} - ${student.id} - ${monthLabel(month)}`;
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(associationName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}`;

  return (
    <Modal title="Scan to Pay" onClose={onClose}>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{monthLabel(month)} fee</p>
        <img src={qrImg} alt="UPI payment QR code" className="mx-auto my-3 h-48 w-48 rounded-lg border border-gray-200" />
        <p className="text-lg font-bold text-gray-900">₹{amount}</p>
        <p className="mt-1 text-xs text-gray-500">Pay via any UPI app to <span className="font-medium text-gray-800">{upiId}</span></p>
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">Scan with Google Pay, PhonePe, Paytm or any UPI app, then confirm below.</p>

        <div className="mt-4 border-t border-gray-100 pt-4">
          {(!myRequest || myRequest.status === "Rejected") && (
            <>
              <button onClick={onNotifyPaid} className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700">
                {myRequest?.status === "Rejected" ? "Resubmit — I've Paid" : "I've Paid — Notify Admin/Teacher"}
              </button>
              {myRequest?.status === "Rejected" && (
                <p className="mt-2 text-xs text-red-600">Your last request wasn't approved. Please recheck the payment and resubmit, or contact your Sensei.</p>
              )}
            </>
          )}
          {myRequest?.status === "Pending" && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-700">
              <TimerReset size={16} /> Approval pending — sent {new Date(myRequest.requestedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function FeesScreen({ data, setData, notify, studentOnly, actorName, filterBatchIds, filterDojoIds }) {
  const [month, setMonth] = useState("2026-08");
  const [payFor, setPayFor] = useState(null);
  const [showQr, setShowQr] = useState(false);

  const pool = data.students.filter((s) => {
    if (filterBatchIds && !filterBatchIds.includes(s.batch)) return false;
    if (filterDojoIds && !filterDojoIds.includes(s.dojo)) return false;
    return true;
  });
  const students = studentOnly ? data.students.filter((s) => s.id === studentOnly.id) : pool;
  const feeAmount = data.association.feeAmount;

  // Per-student fee status for this month (handles partial payments)
  const statusFor = (s) => getFeeStatus(data.payments, s.id, month, feeAmount);
  const fullyPaid = students.filter((s) => statusFor(s).status === "Paid");
  const partiallyPaid = students.filter((s) => statusFor(s).status === "Partial");
  const notPaid = students.filter((s) => statusFor(s).status === "Unpaid");
  const stillOwing = students.filter((s) => statusFor(s).pendingAmount > 0); // Partial + Unpaid — used for student-side QR/status

  const totalCollected = students.reduce((sum, s) => sum + statusFor(s).paidAmount, 0);
  const totalPending = students.reduce((sum, s) => sum + statusFor(s).pendingAmount, 0);

  const requests = data.paymentRequests || [];
  const scopeIds = new Set(students.map((s) => s.id));
  const pendingRequests = requests.filter((r) => r.month === month && r.status === "Pending" && scopeIds.has(r.studentId));

  const savePayment = (student, form) => {
    const record = {
      id: uid("PAY"),
      studentId: student.id,
      month,
      amount: Number(form.amount),
      date: form.date,
      mode: form.mode,
      remarks: form.remarks,
    };
    setData((d) => ({ ...d, payments: [...d.payments, record] }));
    setPayFor(null);
    notify("Payment saved successfully.");
  };

  const sendPaymentRequest = () => {
    const due = statusFor(studentOnly).pendingAmount;
    setData((d) => ({
      ...d,
      paymentRequests: [
        ...(d.paymentRequests || []),
        { id: uid("REQ"), studentId: studentOnly.id, month, amount: due, status: "Pending", requestedAt: new Date().toISOString() },
      ],
    }));
    notify("Payment request sent — waiting for Admin/Teacher approval.");
  };

  const approveRequest = (req) => {
    const student = data.students.find((s) => s.id === req.studentId);
    const record = { id: uid("PAY"), studentId: req.studentId, month: req.month, amount: req.amount, date: "2026-08-31", mode: "UPI", remarks: `Approved by ${actorName || "Admin"} (student QR request)` };
    setData((d) => ({
      ...d,
      payments: [...d.payments, record],
      paymentRequests: (d.paymentRequests || []).map((r) => (r.id === req.id ? { ...r, status: "Approved" } : r)),
    }));
    notify(`Payment approved for ${student?.name || req.studentId}`);
  };

  const rejectRequest = (req) => {
    setData((d) => ({
      ...d,
      paymentRequests: (d.paymentRequests || []).map((r) => (r.id === req.id ? { ...r, status: "Rejected" } : r)),
    }));
    notify("Request rejected — student can resubmit.");
  };

  // The student's own latest request for this month (if any)
  const myRequest = studentOnly
    ? requests.filter((r) => r.studentId === studentOnly.id && r.month === month).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0]
    : null;
  const myStatus = studentOnly ? statusFor(studentOnly) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Monthly Fees</h1>
        <select className={`${inputCls} w-auto`} value={month} onChange={(e) => setMonth(e.target.value)}>
          {FEE_MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={`Total Collected — ${monthLabel(month)}`} value={`₹${totalCollected}`} tone="good" />
        <StatCard label={`Total Pending — ${monthLabel(month)}`} value={`₹${totalPending}`} tone="warn" />
      </div>

      {studentOnly && myStatus.pendingAmount > 0 && (
        <div className="space-y-2">
          <Card className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-gray-500">
                {myStatus.status === "Partial" ? `₹${myStatus.paidAmount} paid · balance due` : "Due"} for {monthLabel(month)}
              </p>
              <p className="text-lg font-bold text-gray-900">₹{myStatus.pendingAmount}</p>
            </div>
            <button onClick={() => setShowQr(true)} className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
              <QrCode size={16} /> Pay through QR
            </button>
          </Card>
          {myRequest?.status === "Pending" && (
            <Card className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-amber-700">
              <TimerReset size={16} /> Approval pending — sent {new Date(myRequest.requestedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </Card>
          )}
        </div>
      )}
      {studentOnly && myStatus.pendingAmount === 0 && (
        <Card className="p-4 text-center text-sm font-medium text-green-700">✅ You're all paid up for {monthLabel(month)}! (₹{myStatus.paidAmount})</Card>
      )}

      {showQr && studentOnly && (
        <PayThroughQrModal
          student={studentOnly}
          month={month}
          amount={myStatus.pendingAmount}
          upiId={data.association.upiId}
          associationName={data.association.name}
          myRequest={myRequest}
          onClose={() => setShowQr(false)}
          onNotifyPaid={() => { sendPaymentRequest(); setShowQr(false); }}
        />
      )}

      {!studentOnly && pendingRequests.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700"><TimerReset size={16} /> Payment Approval Requests — {monthLabel(month)}</p>
          <Card className="divide-y divide-gray-100">
            {pendingRequests.map((r) => {
              const s = data.students.find((s) => s.id === r.studentId);
              return (
                <div key={r.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">{s?.name || r.studentId}</div>
                    <div className="text-xs text-gray-500">{r.studentId} · ₹{r.amount} · claims paid via QR</div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => rejectRequest(r)} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Reject</button>
                    <button onClick={() => approveRequest(r)} className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Approve</button>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-green-700"><CircleCheck size={16} /> Paid — {monthLabel(month)}</p>
        <Card className="divide-y divide-gray-100">
          {fullyPaid.length === 0 && <div className="p-4 text-sm text-gray-400">No one has fully paid yet this month.</div>}
          {fullyPaid.map((s) => {
            const st = statusFor(s);
            return (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.id} · Paid {fmtDate(st.lastRecord?.date)} · {st.lastRecord?.mode}</div>
                </div>
                <div className="font-semibold text-gray-800">₹{st.paidAmount}</div>
              </div>
            );
          })}
        </Card>
      </div>

      {!studentOnly && partiallyPaid.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-blue-700"><Wallet size={16} /> Partially Paid — {monthLabel(month)}</p>
          <Card className="divide-y divide-gray-100">
            {partiallyPaid.map((s) => {
              const st = statusFor(s);
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.id} · ₹{st.paidAmount} paid · <span className="font-medium text-amber-700">₹{st.pendingAmount} pending</span></div>
                  </div>
                  <button onClick={() => setPayFor(s)} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                    Collect ₹{st.pendingAmount}
                  </button>
                </div>
              );
            })}
          </Card>
        </div>
      )}
      {studentOnly && myStatus.status === "Partial" && (
        <Card className="p-4 text-sm">
          <p className="font-semibold text-gray-900">Partial payment recorded</p>
          <p className="mt-1 text-gray-600">₹{myStatus.paidAmount} paid so far · <span className="font-medium text-amber-700">₹{myStatus.pendingAmount} still pending</span> for {monthLabel(month)}.</p>
        </Card>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700"><CircleX size={16} /> Unpaid — {monthLabel(month)}</p>
        <Card className="divide-y divide-gray-100">
          {notPaid.length === 0 && <div className="p-4 text-sm text-gray-400">Everyone has paid something this month 🎉</div>}
          {notPaid.map((s) => {
            const req = requests.filter((r) => r.studentId === s.id && r.month === month).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
            return (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.id} · ₹{feeAmount}{req?.status === "Pending" ? " · approval requested" : ""}</div>
                </div>
                {!studentOnly && (
                  <button onClick={() => setPayFor(s)} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                    Mark as Paid
                  </button>
                )}
                {studentOnly && <StatusPill status="Pending" />}
              </div>
            );
          })}
        </Card>
      </div>

      {payFor && (() => {
        const st = statusFor(payFor);
        return (
          <Modal title="Mark as Paid" onClose={() => setPayFor(null)}>
            <MarkPaidForm
              student={payFor}
              month={month}
              feeAmount={feeAmount}
              dueAmount={st.pendingAmount}
              alreadyPaid={st.paidAmount}
              onCancel={() => setPayFor(null)}
              onSave={(form) => savePayment(payFor, form)}
            />
          </Modal>
        );
      })()}
    </div>
  );
}

function MarkPaidForm({ student, month, feeAmount, dueAmount, alreadyPaid, initial, onCancel, onSave }) {
  const [form, setForm] = useState(
    initial
      ? { amount: initial.amount, date: initial.date, mode: initial.mode, remarks: initial.remarks || "" }
      : { amount: dueAmount != null ? dueAmount : feeAmount, date: "2026-08-31", mode: "Cash", remarks: "" }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const willTotal = Number(form.amount || 0) + (alreadyPaid || 0);
  const stillPending = Math.max(0, feeAmount - willTotal);
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gray-50 p-3 text-sm">
        <div className="font-semibold text-gray-900">{student.name}</div>
        <div className="text-xs text-gray-500">{student.id} · {monthLabel(month)}{!initial && ` · Fee due: ₹${feeAmount}`}</div>
        {!initial && alreadyPaid > 0 && <div className="mt-1 text-xs text-blue-700">Already paid this month: ₹{alreadyPaid}</div>}
      </div>
      <Field label={initial ? "Amount (₹)" : "Amount received now (₹)"}><input type="number" className={inputCls} value={form.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
      {!initial && (
        <p className="text-[11px] text-gray-400">
          You can enter less than the full fee for a partial payment — the remaining ₹{stillPending} will keep showing as pending for {monthLabel(month)}.
        </p>
      )}
      <Field label="Payment date"><input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Payment mode">
        <select className={inputCls} value={form.mode} onChange={(e) => set("mode", e.target.value)}>
          <option>Cash</option><option>UPI</option><option>Bank</option><option>Other</option>
        </select>
      </Field>
      <Field label="Remarks (optional)"><input className={inputCls} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
        <button onClick={() => onSave(form)} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">{initial ? "Save Changes" : "Save Payment"}</button>
      </div>
    </div>
  );
}

/* ============================== ATTENDANCE ============================== */
function AttendanceScreen({ data, setData, notify, coachBatchIds, filterDojoIds }) {
  const [tab, setTab] = useState("mark"); // "mark" | "report"

  // Which academies this screen is allowed to see (coach → their own; admin scoped → that one; admin unscoped → every academy)
  const availableDojos = coachBatchIds
    ? data.dojos.filter((d) => data.batches.some((b) => coachBatchIds.includes(b.id) && b.dojo === d.id))
    : filterDojoIds
      ? data.dojos.filter((d) => filterDojoIds.includes(d.id))
      : data.dojos;

  const [clubId, setClubId] = useState(availableDojos[0]?.id || "");
  const clubBatches = (
    coachBatchIds ? data.batches.filter((b) => coachBatchIds.includes(b.id))
    : filterDojoIds ? data.batches.filter((b) => filterDojoIds.includes(b.dojo))
    : data.batches
  ).filter((b) => !clubId || b.dojo === clubId);

  const selectClub = (id) => {
    setClubId(id);
    const firstBatch = data.batches.find((b) => b.dojo === id && (!coachBatchIds || coachBatchIds.includes(b.id)));
    setBatchId(firstBatch?.id || "");
  };

  const [batchId, setBatchId] = useState(clubBatches[0]?.id || "");
  const [date, setDate] = useState("2026-08-31");
  const [beltFilter, setBeltFilter] = useState("All");
  const key = `${date}__${batchId}`;
  const dayRecord = data.attendance[key] || {};
  const roster = data.students.filter((s) => s.batch === batchId && (beltFilter === "All" || s.belt === beltFilter));

  const setStatus = (studentId, status) => {
    setData((d) => ({
      ...d,
      attendance: { ...d.attendance, [key]: { ...(d.attendance[key] || {}), [studentId]: status } },
    }));
  };
  const markAllPresent = () => {
    const all = { ...dayRecord };
    roster.forEach((s) => (all[s.id] = "Present"));
    setData((d) => ({ ...d, attendance: { ...d.attendance, [key]: all } }));
    notify("All marked Present. Attendance saved.");
  };

  const statuses = ["Present", "Absent", "Late", "Leave"];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Attendance</h1>

      <div className="flex gap-1 rounded-full bg-gray-100 p-1 text-sm w-fit">
        {[["mark", "Mark Attendance"], ["report", "Attendance Report"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 font-medium ${tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "mark" && (
        <>
          <div className="flex flex-wrap gap-2">
            {availableDojos.length > 1 && (
              <select className={`${inputCls} w-auto`} value={clubId} onChange={(e) => selectClub(e.target.value)}>
                {availableDojos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            <select className={`${inputCls} w-auto`} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {clubBatches.length === 0 && <option value="">No batches</option>}
              {clubBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className={`${inputCls} w-auto`} value={beltFilter} onChange={(e) => setBeltFilter(e.target.value)}>
              <option value="All">All belts</option>
              {BELT_ORDER.map((b) => <option key={b}>{b}</option>)}
            </select>
            <input type="date" className={`${inputCls} w-auto`} value={date} onChange={(e) => setDate(e.target.value)} />
            <button onClick={markAllPresent} className="ml-auto rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50">
              Mark All Present
            </button>
          </div>

          <Card className="divide-y divide-gray-100">
            {roster.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No students match this batch / belt filter.</div>}
            {roster.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">{s.name} <BeltChip belt={s.belt} /></div>
                  <div className="text-xs text-gray-500">{s.id}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((st) => (
                    <button
                      key={st}
                      onClick={() => { setStatus(s.id, st); notify(`${s.name}: ${st}`); }}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        dayRecord[s.id] === st
                          ? st === "Present" ? "border-green-600 bg-green-600 text-white"
                          : st === "Absent" ? "border-red-600 bg-red-600 text-white"
                          : st === "Late" ? "border-amber-500 bg-amber-500 text-white"
                          : "border-gray-500 bg-gray-500 text-white"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {tab === "report" && (
        <AttendanceReport
          data={data}
          availableDojos={availableDojos}
          allowedBatchIds={coachBatchIds || (filterDojoIds ? data.batches.filter((b) => filterDojoIds.includes(b.dojo)).map((b) => b.id) : null)}
        />
      )}
    </div>
  );
}

function AttendanceReport({ data, availableDojos, allowedBatchIds }) {
  const [clubId, setClubId] = useState(availableDojos.length === 1 ? availableDojos[0].id : "All");
  const [batchId, setBatchId] = useState("All");
  const [beltFilter, setBeltFilter] = useState("All");
  const [month, setMonth] = useState("2026-08");

  const scopedBatches = data.batches.filter((b) => (!allowedBatchIds || allowedBatchIds.includes(b.id)) && (clubId === "All" || b.dojo === clubId));
  const scopedBatchIds = new Set((batchId === "All" ? scopedBatches : scopedBatches.filter((b) => b.id === batchId)).map((b) => b.id));

  const students = data.students.filter((s) => scopedBatchIds.has(s.batch) && (beltFilter === "All" || s.belt === beltFilter));

  const rows = students.map((s) => {
    let present = 0, absent = 0, late = 0, leave = 0, total = 0;
    for (const [k, statuses] of Object.entries(data.attendance)) {
      const [d, bId] = k.split("__");
      if (!d.startsWith(month) || bId !== s.batch) continue;
      const st = statuses[s.id];
      if (!st) continue;
      total++;
      if (st === "Present") present++;
      else if (st === "Absent") absent++;
      else if (st === "Late") late++;
      else if (st === "Leave") leave++;
    }
    const pct = total ? Math.round((present / total) * 100) : 0;
    return { student: s, present, absent, late, leave, total, pct };
  }).sort((a, b) => a.student.name.localeCompare(b.student.name));

  const avgPct = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.pct, 0) / rows.length) : 0;
  const totalSessions = new Set(Object.keys(data.attendance).filter((k) => k.startsWith(month + "-") && scopedBatchIds.has(k.split("__")[1]))).size;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availableDojos.length > 1 && (
          <select className={`${inputCls} w-auto`} value={clubId} onChange={(e) => { setClubId(e.target.value); setBatchId("All"); }}>
            <option value="All">All academies</option>
            {availableDojos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <select className={`${inputCls} w-auto`} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="All">All batches</option>
          {scopedBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={`${inputCls} w-auto`} value={beltFilter} onChange={(e) => setBeltFilter(e.target.value)}>
          <option value="All">All belts</option>
          {BELT_ORDER.map((b) => <option key={b}>{b}</option>)}
        </select>
        <input type="month" className={`${inputCls} w-auto`} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={`Students in scope`} value={students.length} />
        <StatCard label={`Sessions marked — ${monthLabel(month)}`} value={totalSessions} />
        <StatCard label={`Average attendance`} value={`${avgPct}%`} tone={avgPct >= 75 ? "good" : avgPct >= 50 ? "accent" : "warn"} />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Batch</th>
              <th className="px-4 py-2">Belt</th>
              <th className="px-4 py-2">Present</th>
              <th className="px-4 py-2">Absent</th>
              <th className="px-4 py-2">Late</th>
              <th className="px-4 py-2">Leave</th>
              <th className="px-4 py-2">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">No students match this filter.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.student.id}>
                <td className="px-4 py-2 font-medium text-gray-800">{r.student.name}<div className="text-[11px] text-gray-400">{r.student.id}</div></td>
                <td className="px-4 py-2 text-gray-700">{data.batches.find((b) => b.id === r.student.batch)?.name}</td>
                <td className="px-4 py-2"><BeltChip belt={r.student.belt} /></td>
                <td className="px-4 py-2 text-green-700">{r.present}</td>
                <td className="px-4 py-2 text-red-700">{r.absent}</td>
                <td className="px-4 py-2 text-amber-700">{r.late}</td>
                <td className="px-4 py-2 text-gray-600">{r.leave}</td>
                <td className="px-4 py-2 font-semibold text-gray-900">{r.total ? `${r.pct}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================== BELT / RANK ============================== */
function BeltsScreen({ data, setData, notify, studentOnly, filterDojoIds }) {
  const [promoting, setPromoting] = useState(null);

  const scopedStudents = filterDojoIds ? data.students.filter((s) => filterDojoIds.includes(s.dojo)) : data.students;
  const counts = BELT_ORDER.map((name) => ({
    name,
    count: scopedStudents.filter((s) => s.belt === name).length,
  }));

  const promote = (student, toBelt, form) => {
    setData((d) => ({
      ...d,
      students: d.students.map((s) => (s.id === student.id ? { ...s, belt: toBelt } : s)),
      beltHistory: [...d.beltHistory, { studentId: student.id, from: student.belt, to: toBelt, date: form.date, examiner: form.examiner, result: "Pass", remarks: form.remarks }],
    }));
    setPromoting(null);
    notify(`${student.name} promoted to ${toBelt} Belt`);
  };

  if (studentOnly) {
    const belts = data.beltHistory.filter((b) => b.studentId === studentOnly.id);
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900">My Belt</h1>
        <Card className="p-5">
          <BeltChip belt={studentOnly.belt} />
          <div className="mt-3"><BeltBar activeBelt={studentOnly.belt} size="lg" /></div>
        </Card>
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Promotion history</p>
          {belts.length === 0 && <p className="text-sm text-gray-400">No promotions yet.</p>}
          <div className="space-y-3">
            {belts.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <BeltChip belt={b.from} /> <ChevronRight size={14} className="text-gray-300" /> <BeltChip belt={b.to} />
                <span className="ml-auto text-xs text-gray-500">{fmtDate(b.date)}</span>
              </div>
            ))}
          </div>
        </Card>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">My certificates</p>
          <Card className="divide-y divide-gray-100">
            {(!data.certificates || data.certificates.filter((c) => c.studentId === studentOnly.id).length === 0) && (
              <div className="p-4 text-sm text-gray-400">No certificates issued yet.</div>
            )}
            {(data.certificates || []).filter((c) => c.studentId === studentOnly.id).map((c) => (
              <CertificateCard key={c.id} cert={c} />
            ))}
          </Card>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Resources & links from your Sensei</p>
          <Card className="divide-y divide-gray-100">
            {(!data.resources || data.resources.length === 0) && <div className="p-4 text-sm text-gray-400">Nothing shared yet.</div>}
            {(data.resources || []).map((r) => <ResourceLink key={r.id} res={r} />)}
          </Card>
          {data.resources && data.resources.length > 0 && (
            <p className="mt-2 text-[11px] text-gray-400">{data.resources.length} link{data.resources.length === 1 ? "" : "s"} shared by your coaches — tap any to open.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Belt / Rank Management</h1>
      <Card className="p-4 space-y-3">
        {counts.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full border border-gray-300" style={{ background: BELT_COLORS[c.name] }} />
            <span className="w-20 text-sm font-medium text-gray-800">{c.name}</span>
            <div className="h-2 flex-1 rounded-full bg-gray-100">
              <div className="h-2 rounded-full" style={{ width: `${(c.count / Math.max(1, scopedStudents.length)) * 100}%`, background: BELT_COLORS[c.name] === "#1A1A1A" ? "#1A1A1A" : BELT_COLORS[c.name] }} />
            </div>
            <span className="w-24 text-right text-sm text-gray-600">{c.count} Students</span>
          </div>
        ))}
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Promote a student</p>
        <Card className="divide-y divide-gray-100">
          {scopedStudents.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">{initials(s.name)}</div>
                <div>
                  <div className="font-semibold text-gray-900">{s.name}</div>
                  <BeltChip belt={s.belt} />
                </div>
              </div>
              <button
                disabled={BELT_ORDER.indexOf(s.belt) === BELT_ORDER.length - 1}
                onClick={() => setPromoting(s)}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:bg-red-50 disabled:opacity-30"
              >
                Promote
              </button>
            </div>
          ))}
        </Card>
      </div>

      {promoting && (
        <PromoteModal
          student={promoting}
          onClose={() => setPromoting(null)}
          onSave={(toBelt, form) => promote(promoting, toBelt, form)}
        />
      )}
    </div>
  );
}

function PromoteModal({ student, onClose, onSave }) {
  const idx = BELT_ORDER.indexOf(student.belt);
  const nextBelt = BELT_ORDER[idx + 1];
  const [form, setForm] = useState({ date: "2026-08-31", examiner: "Coach Rahul Sharma", remarks: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title="Promote Belt" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <BeltChip belt={student.belt} /> <ChevronRight size={14} className="text-gray-400" /> <BeltChip belt={nextBelt} />
        </div>
        <Field label="Exam / promotion date"><input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Examiner"><input className={inputCls} value={form.examiner} onChange={(e) => set("examiner", e.target.value)} /></Field>
        <Field label="Remarks (optional)"><input className={inputCls} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
          <button onClick={() => onSave(nextBelt, form)} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Confirm Promotion</button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== ANNOUNCEMENTS ============================== */
function AnnouncementsScreen({ data, setData, notify, canPost }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ audience: "Everyone", title: "", body: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
        {canPost && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Plus size={16} /> New
          </button>
        )}
      </div>
      <Card className="divide-y divide-gray-100">
        {data.announcements.slice().reverse().map((a) => (
          <div key={a.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">{a.title}</span>
              <span className="text-xs text-gray-400">{fmtDate(a.date)}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{a.body}</p>
            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">{a.audience}</span>
          </div>
        ))}
      </Card>

      {showAdd && (
        <Modal title="New Announcement" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <Field label="Audience">
              <select className={inputCls} value={form.audience} onChange={(e) => set("audience", e.target.value)}>
                <option>Everyone</option><option>Batch A</option><option>Batch B</option><option>Batch C</option><option>Teachers</option>
              </select>
            </Field>
            <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Message"><textarea className={inputCls} rows={3} value={form.body} onChange={(e) => set("body", e.target.value)} /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
              <button
                onClick={() => {
                  if (!form.title.trim()) return;
                  setData((d) => ({ ...d, announcements: [...d.announcements, { id: uid("AN"), ...form, date: "2026-08-31" }] }));
                  setShowAdd(false);
                  notify("Announcement posted");
                }}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Post
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================== CERTIFICATES ============================== */
function CertificateForm({ initial, students, addedBy, onCancel, onSave, nextCertNo }) {
  const [form, setForm] = useState(
    initial || {
      certificateNo: nextCertNo,
      studentId: students[0]?.id || "",
      belt: students[0]?.belt || "White",
      session: "",
      issueDate: "2026-08-31",
      examiner: addedBy,
      remarks: "",
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <Field label="Certificate number"><input className={inputCls} value={form.certificateNo} onChange={(e) => set("certificateNo", e.target.value)} /></Field>
      <Field label="Student">
        <select className={inputCls} value={form.studentId} onChange={(e) => set("studentId", e.target.value)}>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.id}</option>)}
        </select>
      </Field>
      <Field label="Belt / rank name">
        <select className={inputCls} value={form.belt} onChange={(e) => set("belt", e.target.value)}>
          {BELT_ORDER.map((b) => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="Session"><input className={inputCls} placeholder="e.g. Autumn 2026 Grading" value={form.session} onChange={(e) => set("session", e.target.value)} /></Field>
      <Field label="Issue date"><input type="date" className={inputCls} value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} /></Field>
      <Field label="Examiner"><input className={inputCls} value={form.examiner} onChange={(e) => set("examiner", e.target.value)} /></Field>
      <Field label="Remarks (optional)"><input className={inputCls} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
        <button
          onClick={() => {
            if (!form.certificateNo.trim() || !form.studentId || !form.session.trim()) return;
            onSave(initial ? form : { ...form, id: uid("CERT") });
          }}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function CertificateCard({ cert, studentName }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
        <Award size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-900">{cert.certificateNo}</div>
        <div className="text-xs text-gray-500">
          {studentName ? `${studentName} · ` : ""}<BeltChip belt={cert.belt} /> · {cert.session}
        </div>
        <div className="mt-0.5 text-[11px] text-gray-400">Issued {fmtDate(cert.issueDate)} · Examiner: {cert.examiner}</div>
      </div>
    </div>
  );
}

function CertificatesScreen({ data, setData, notify, addedBy, studentOnly, filterDojoIds }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  const scopedStudentIds = new Set((filterDojoIds ? data.students.filter((s) => filterDojoIds.includes(s.dojo)) : data.students).map((s) => s.id));
  const certs = (data.certificates || []).filter((c) => scopedStudentIds.has(c.studentId));
  const nextCertNo = "BKA-CERT-" + String((data.certificates || []).length + 1).padStart(4, "0");

  if (studentOnly) {
    const mine = certs.filter((c) => c.studentId === studentOnly.id);
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">My certificates</p>
        <Card className="divide-y divide-gray-100">
          {mine.length === 0 && <div className="p-4 text-sm text-gray-400">No certificates issued yet.</div>}
          {mine.map((c) => <CertificateCard key={c.id} cert={c} />)}
        </Card>
      </div>
    );
  }

  const filtered = certs.filter((c) => {
    if (!q) return true;
    const s = data.students.find((s) => s.id === c.studentId);
    return c.certificateNo.toLowerCase().includes(q.toLowerCase()) || s?.name.toLowerCase().includes(q.toLowerCase());
  });

  const remove = (id) => {
    setData((d) => ({ ...d, certificates: (d.certificates || []).filter((c) => c.id !== id) }));
    notify("Certificate removed");
  };
  const save = (cert) => {
    setData((d) => {
      const list = d.certificates || [];
      return { ...d, certificates: editing ? list.map((c) => (c.id === editing.id ? { ...c, ...cert } : c)) : [...list, cert] };
    });
    notify(editing ? "Certificate updated" : `Certificate ${cert.certificateNo} issued`);
    setShowAdd(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Certificates</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <Plus size={16} /> Issue Certificate
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className={`${inputCls} pl-8`} placeholder="Search certificate no. or student" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="divide-y divide-gray-100">
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No certificates yet.</div>}
        {filtered.map((c) => {
          const s = data.students.find((s) => s.id === c.studentId);
          return (
            <div key={c.id} className="flex items-center">
              <div className="flex-1"><CertificateCard cert={c} studentName={s?.name} /></div>
              <div className="flex shrink-0 gap-1 pr-3">
                <button onClick={() => setEditing(c)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                <button onClick={() => remove(c.id)} className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </Card>

      {(showAdd || editing) && (
        <Modal title={editing ? "Edit Certificate" : "Issue Certificate"} onClose={() => { setShowAdd(false); setEditing(null); }} wide>
          <CertificateForm
            initial={editing}
            students={filterDojoIds ? data.students.filter((s) => filterDojoIds.includes(s.dojo)) : data.students}
            addedBy={addedBy}
            nextCertNo={nextCertNo}
            onCancel={() => { setShowAdd(false); setEditing(null); }}
            onSave={save}
          />
        </Modal>
      )}
    </div>
  );
}

/* ============================== STUDENT DASHBOARD ============================== */
function StudentDashboard({ student, data, setScreen }) {
  const ym = "2026-08";
  const feeStatus = getFeeStatus(data.payments, student.id, ym, data.association.feeAmount);
  const attRecords = Object.entries(data.attendance).flatMap(([key, statuses]) => statuses[student.id] ? [statuses[student.id]] : []);
  const pct = attRecords.length ? Math.round((attRecords.filter((s) => s === "Present").length / attRecords.length) * 100) : 0;
  const batch = data.batches.find((b) => b.id === student.batch);
  const sensei = getSenseiContact("Student", student, data);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome, {student.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-gray-500">{student.id}</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Current belt</p>
            <div className="mt-1"><BeltChip belt={student.belt} /></div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Attendance</p>
            <p className="text-2xl font-bold text-gray-900">{pct}%</p>
          </div>
        </div>
        <div className="mt-4"><BeltBar activeBelt={student.belt} /></div>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-gray-500">Next class</p>
        <p className="text-sm font-semibold text-gray-900">{batch?.name} · {batch?.days} · {batch?.start}</p>
      </Card>

      {sensei && <SenseiContact sensei={sensei} />}

      <div className="grid grid-cols-3 gap-3">
        {[["fees", Wallet, "Fees", feeStatus.status === "Paid" ? "Paid" : feeStatus.status === "Partial" ? `₹${feeStatus.pendingAmount} due` : "Pending"], ["belts", Award, "My Belt", student.belt], ["announcements", Bell, "Notices", null]].map(([id, Icon, label, sub]) => (
          <button key={id} onClick={() => setScreen(id)} className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white py-4 hover:border-red-300 hover:bg-red-50">
            <Icon size={20} className="text-gray-600" />
            <span className="text-xs font-semibold text-gray-800">{label}</span>
            {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================== TEACHER DASHBOARD ============================== */
function TeacherDashboard({ coach, data, setScreen }) {
  const myBatches = data.batches.filter((b) => b.coach === coach.id);
  const myStudents = data.students.filter((s) => myBatches.some((b) => b.id === s.batch));
  const today = "2026-08-31";
  const todaysAttendance = Object.entries(data.attendance).filter(([k]) => k.startsWith(today) && myBatches.some((b) => k.endsWith(b.id))).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome, {coach.name}</h1>
        <p className="text-sm text-gray-500">Coach dashboard</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="My Batches" value={myBatches.length} />
        <StatCard label="Total Students" value={myStudents.length} />
        <StatCard label="Today's Classes" value={myBatches.length} />
        <StatCard label="Attendance Marked" value={todaysAttendance} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">My batches</p>
        <Card className="divide-y divide-gray-100">
          {myBatches.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="font-semibold text-gray-900">{b.name}</div>
                <div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} /> {b.days} · {b.start}–{b.end}</div>
              </div>
              <span className="text-xs text-gray-500">{data.students.filter((s) => s.batch === b.id).length} students</span>
            </div>
          ))}
        </Card>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setScreen("attendance")} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Mark Attendance</button>
        <button onClick={() => setScreen("students")} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">My Students</button>
      </div>
    </div>
  );
}

/* ============================== SENIOR STUDENT DASHBOARD ============================== */
function SeniorDashboard({ senior, data, setScreen }) {
  const batch = data.batches.find((b) => b.id === senior.batch);
  const batchmates = data.students.filter((s) => s.batch === senior.batch);
  const today = "2026-08-31";
  const todaysAttendanceMarked = Object.keys(data.attendance).some((k) => k.startsWith(today) && k.endsWith(senior.batch));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome, {senior.name.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500">Senior Student — {batch?.name}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="My Batch" value={batch?.name || "—"} />
        <StatCard label="Junior Students" value={batchmates.length} />
      </div>
      <Card className="p-4">
        <p className="text-xs text-gray-500">Class schedule</p>
        <p className="text-sm font-semibold text-gray-900">{batch?.days} · {batch?.start}–{batch?.end}</p>
        <p className="mt-2 text-xs text-gray-500">{todaysAttendanceMarked ? "Today's attendance already marked ✓" : "Today's attendance not marked yet"}</p>
      </Card>
      <div className="flex gap-2">
        <button onClick={() => setScreen("attendance")} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Mark Attendance</button>
        <button onClick={() => setScreen("students")} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">My Batch</button>
      </div>
      <p className="text-[11px] leading-relaxed text-gray-400">Your Admin controls exactly what a Senior Student can do here — currently: viewing your batch and marking attendance.</p>
    </div>
  );
}

/* ============================== APP ROOT ============================== */
export default function App() {
  const [data, setData] = useState(seedData());
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState(null); // { role, user }
  const [screen, setScreen] = useState("dashboard");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${data.association.name} 🥋`;
    }
  }, [data.association.name]);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          const fresh = seedData();
          // Merge saved data over a fresh seed so any fields added in later
          // app updates are never missing. For resources specifically, union
          // by id so newly-added demo/sample links show up alongside
          // anything the person already added, without losing their data.
          const savedResources = saved.resources || [];
          const savedIds = new Set(savedResources.map((r) => r.id));
          const mergedResources = [...savedResources, ...fresh.resources.filter((r) => !savedIds.has(r.id))];
          const savedCerts = saved.certificates || [];
          const savedCertIds = new Set(savedCerts.map((c) => c.id));
          const mergedCerts = [...savedCerts, ...fresh.certificates.filter((c) => !savedCertIds.has(c.id))];
          const mergedRequests = saved.paymentRequests || fresh.paymentRequests || [];
          const mergedAccounts = { ...(fresh.accounts || {}), ...(saved.accounts || {}) };
          const mergedSeniors = saved.seniorStudents || fresh.seniorStudents || [];
          setData({ ...fresh, ...saved, resources: mergedResources, certificates: mergedCerts, paymentRequests: mergedRequests, accounts: mergedAccounts, seniorStudents: mergedSeniors });
        }
      } catch (e) {
        /* no saved data yet — keep seed */
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      setToast("Couldn't save — data may be too large. Try a smaller file or use a link instead.");
      setTimeout(() => setToast(""), 3500);
    }
  }, [data, loaded]);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const [adminAcademy, setAdminAcademy] = useState(null);

  const handleLogin = (role, user) => {
    setSession({ role, user });
    setScreen("dashboard");
    setAdminAcademy(null);
  };
  const handleLogout = () => {
    supabaseLogout();
    setSession(null);
    setAdminAcademy(null);
  };

  if (!session) {
    return <LoginScreen data={data} onLogin={handleLogin} />;
  }

  const { role, user } = session;

  const sensei = role !== "Admin" ? getSenseiContact(role, user, data) : null;
  const academyName = role === "Admin" ? data.dojos.find((d) => d.id === adminAcademy)?.name : null;

  let content = null;
  let coachBatchIds = null;
  let studentOnly = null;

  if (role === "Admin") {
    const scope = adminAcademy ? [adminAcademy] : undefined;
    if (screen === "dashboard") content = <AdminDashboard data={data} setScreen={setScreen} academyId={adminAcademy} academyName={academyName} onManageAcademies={() => setScreen("dojos")} />;
    if (screen === "dojos") content = <DojosScreen data={data} setData={setData} notify={notify} adminAcademy={adminAcademy} onSelect={(id) => { setAdminAcademy(id); setScreen("dashboard"); }} onViewAll={() => setAdminAcademy(null)} />;
    if (screen === "students") content = <StudentsScreen data={data} setData={setData} notify={notify} filterDojoIds={scope} showAcademyTag={!adminAcademy} addedBy="Admin" />;
    if (screen === "all-students") content = <StudentsScreen data={data} setData={setData} notify={notify} showAcademyTag canAdd={false} />;
    if (screen === "coaches") content = <CoachesScreen data={data} setData={setData} notify={notify} filterDojoIds={scope} showAcademyTag={!adminAcademy} />;
    if (screen === "all-coaches") content = <CoachesScreen data={data} setData={setData} notify={notify} showAcademyTag canAdd={false} />;
    if (screen === "seniors") content = <SeniorStudentsScreen data={data} setData={setData} notify={notify} filterDojoIds={scope} showAcademyTag={!adminAcademy} />;
    if (screen === "all-seniors") content = <SeniorStudentsScreen data={data} setData={setData} notify={notify} showAcademyTag canAdd={false} />;
    if (screen === "attendance") content = <AttendanceScreen data={data} setData={setData} notify={notify} filterDojoIds={scope} />;
    if (screen === "fees") content = <FeesScreen data={data} setData={setData} notify={notify} filterDojoIds={scope} actorName="Admin" />;
    if (screen === "belts") content = <BeltsScreen data={data} setData={setData} notify={notify} filterDojoIds={scope} />;
    if (screen === "certificates") content = <CertificatesScreen data={data} setData={setData} notify={notify} filterDojoIds={scope} addedBy="Admin" />;
    if (screen === "resources") content = <ResourcesManager data={data} setData={setData} notify={notify} addedBy="Admin" />;
    if (screen === "announcements") content = <AnnouncementsScreen data={data} setData={setData} notify={notify} canPost />;
  } else if (role === "Teacher / Coach") {
    const myBatches = data.batches.filter((b) => b.coach === user.id).map((b) => b.id);
    coachBatchIds = myBatches;
    if (screen === "dashboard") content = <TeacherDashboard coach={user} data={data} setScreen={setScreen} />;
    if (screen === "students") content = <StudentsScreen data={data} setData={setData} notify={notify} filterBatchIds={myBatches} addedBy={user.name} />;
    if (screen === "attendance") content = <AttendanceScreen data={data} setData={setData} notify={notify} coachBatchIds={myBatches} />;
    if (screen === "fees") content = <FeesScreen data={data} setData={setData} notify={notify} filterBatchIds={myBatches} actorName={user.name} />;
    if (screen === "certificates") content = <CertificatesScreen data={data} setData={setData} notify={notify} addedBy={user.name} />;
    if (screen === "resources") content = <ResourcesManager data={data} setData={setData} notify={notify} addedBy={user.name} />;
    if (screen === "announcements") content = <AnnouncementsScreen data={data} setData={setData} notify={notify} canPost={false} />;
  } else if (role === "Student") {
    const liveStudent = data.students.find((s) => s.id === user.id) || user;
    studentOnly = liveStudent;
    if (screen === "dashboard") content = <StudentDashboard student={liveStudent} data={data} setScreen={setScreen} />;
    if (screen === "fees") content = <FeesScreen data={data} setData={setData} notify={notify} studentOnly={liveStudent} />;
    if (screen === "belts") content = <BeltsScreen data={data} setData={setData} notify={notify} studentOnly={liveStudent} />;
    if (screen === "announcements") content = <AnnouncementsScreen data={data} setData={setData} notify={notify} canPost={false} />;
  } else if (role === "Senior Student") {
    const senior = (data.seniorStudents || []).find((s) => s.id === user.id) || user;
    const myBatchIds = senior.batch ? [senior.batch] : [];
    if (screen === "dashboard") content = <SeniorDashboard senior={senior} data={data} setScreen={setScreen} />;
    if (screen === "students") content = <StudentsScreen data={data} setData={setData} notify={notify} filterBatchIds={myBatchIds} canAdd={false} />;
    if (screen === "attendance") content = <AttendanceScreen data={data} setData={setData} notify={notify} coachBatchIds={myBatchIds} />;
    if (screen === "announcements") content = <AnnouncementsScreen data={data} setData={setData} notify={notify} canPost={false} />;
  }

  return (
    <Shell
      role={role}
      user={user}
      screen={screen}
      setScreen={setScreen}
      onLogout={handleLogout}
      sensei={sensei}
      academyName={role === "Admin" ? (academyName || "All Academies") : null}
      onSwitchAcademy={() => setScreen("dojos")}
    >
      {content}
      <Toast message={toast} />
    </Shell>
  );
}
