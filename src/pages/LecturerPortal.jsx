// src/pages/LecturerPortal.jsx — lecturer-facing extension of Community.
// Access: a lecturer record at /community/lecturers/<uid> with verified:true,
// which only the TukoZone admin can create (see database.rules.json).
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, Link2, Megaphone, MessageCircleQuestion, ShieldCheck, Trash2, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getLecturerRecord, hasApplied, applyAsLecturer, listen, postResource,
  postAnnouncement, deleteItem, answerQuestion,
} from "../services/communityService";
import "./Community.css";

const TABS = [
  { id: "resources", label: "Resources", Icon: Link2 },
  { id: "news",      label: "Announcements", Icon: Megaphone },
  { id: "questions", label: "Student questions", Icon: MessageCircleQuestion },
];
const isUrl = (s) => /^https?:\/\/\S+\.\S+/i.test(s);

function Apply({ user }) {
  const [f, setF] = useState({ department: "", institution: "" });
  const [done, setDone] = useState(false);
  const submit = async () => {
    if (!f.department.trim() || !f.institution.trim()) return;
    await applyAsLecturer(user.uid, { name: user.name, email: user.email, department: f.department.trim(), institution: f.institution.trim() });
    setDone(true);
  };
  if (done) return <div className="cm-note cm-note--ok" role="status">Application received. We'll verify your details and you'll get access to the portal.</div>;
  return (
    <div className="cm-card">
      <p className="cm-lead" style={{ marginTop: 0 }}>Lecturers are verified before they appear to students. Tell us where you teach.</p>
      <input className="cm-input" placeholder="Department (e.g. Human Anatomy)" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
      <input className="cm-input" placeholder="Institution (e.g. University of Nairobi)" value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} />
      <button className="cm-btn" onClick={submit}>Apply for verification</button>
    </div>
  );
}

function Resources({ lec }) {
  const [items, setItems] = useState([]);
  const [t, setT] = useState(""); const [course, setCourse] = useState(""); const [url, setUrl] = useState(""); const [err, setErr] = useState("");
  useEffect(() => listen("community/resources", (l) => setItems(l.filter((x) => x.lecturerUid === lec.uid).reverse())), [lec.uid]);
  const add = async () => {
    if (!t.trim()) return setErr("Add a title.");
    if (!isUrl(url.trim())) return setErr("Paste a full link starting with https:// (Google Drive, YouTube, etc.).");
    setErr(""); await postResource(lec, { title: t.trim(), course: course.trim(), url: url.trim() });
    setT(""); setCourse(""); setUrl("");
  };
  return (
    <>
      <div className="cm-card">
        <b>Share a resource</b>
        <input className="cm-input" placeholder="Title (e.g. Cardiac cycle slides)" value={t} onChange={(e) => setT(e.target.value)} />
        <input className="cm-input" placeholder="Course or topic (optional)" value={course} onChange={(e) => setCourse(e.target.value)} />
        <input className="cm-input" placeholder="Link to the file (Google Drive, YouTube…)" value={url} onChange={(e) => setUrl(e.target.value)} />
        {err && <p className="cm-err" role="alert">{err}</p>}
        <button className="cm-btn" onClick={add}>Publish to students</button>
        <p className="cm-muted" style={{ marginBottom: 0 }}>Tip: set the file's sharing to "anyone with the link can view" so students can open it.</p>
      </div>
      <h2 className="cm-h2">Your resources</h2>
      {items.length === 0 && <p className="cm-empty">Nothing shared yet.</p>}
      {items.map((r) => (
        <div key={r.id} className="cm-card cm-row"><div><a href={r.url} target="_blank" rel="noopener noreferrer"><b>{r.title}</b></a>{r.course && <div className="cm-muted">{r.course}</div>}</div>
          <button className="cm-icon-btn" aria-label="Delete resource" onClick={() => deleteItem("resources", r.id)}><Trash2 size={14} /></button></div>))}
    </>
  );
}

function News({ lec }) {
  const [items, setItems] = useState([]); const [text, setText] = useState("");
  useEffect(() => listen("community/announcements", (l) => setItems(l.filter((x) => x.lecturerUid === lec.uid).reverse())), [lec.uid]);
  const post = async () => { if (!text.trim()) return; await postAnnouncement(lec, text.trim()); setText(""); };
  return (
    <>
      <div className="cm-card"><b>Post an announcement</b>
        <textarea className="cm-input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write to your students" aria-label="Announcement" />
        <button className="cm-btn" onClick={post}><Megaphone size={14} /> Post</button></div>
      {items.map((n) => (<div key={n.id} className="cm-card cm-row"><p style={{ margin: 0 }}>{n.text}</p>
        <button className="cm-icon-btn" aria-label="Delete announcement" onClick={() => deleteItem("announcements", n.id)}><Trash2 size={14} /></button></div>))}
    </>
  );
}

function Questions({ lec }) {
  const [items, setItems] = useState([]); const [drafts, setDrafts] = useState({});
  useEffect(() => listen(`community/inbox/${lec.uid}`, (l) => setItems(l.reverse())), [lec.uid]);
  const send = async (q) => { const t = (drafts[q.id] || "").trim(); if (!t) return; await answerQuestion(lec.uid, q, t, lec.name); setDrafts({ ...drafts, [q.id]: "" }); };
  if (!items.length) return <p className="cm-empty">No questions yet. They'll appear here when students ask.</p>;
  return items.map((q) => (
    <div key={q.id} className="cm-card">
      <div className="cm-muted">{q.askerName || "Anonymous student"}{q.handled ? " · answered" : ""}</div>
      <p>{q.text}</p>
      {!q.handled && (<div className="cm-row"><input className="cm-input" value={drafts[q.id] || ""} onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })} placeholder="Write a reply" aria-label="Reply" />
        <button className="cm-btn" onClick={() => send(q)} aria-label="Send reply"><Send size={14} /></button></div>)}
    </div>));
}

export default function LecturerPortal() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [state, setState] = useState("loading"); // loading | verified | pending | none
  const [rec, setRec] = useState(null);
  const [tab, setTab] = useState("resources");
  const name = userData?.profile?.name || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Lecturer";

  useEffect(() => {
    if (!currentUser) { navigate("/signin"); return; }
    (async () => {
      try {
        const r = await getLecturerRecord(currentUser.uid);
        if (r?.verified) { setRec(r); return setState("verified"); }
        setState((await hasApplied(currentUser.uid)) ? "pending" : "none");
      } catch { setState("none"); }
    })();
  }, [currentUser, navigate]);

  if (!currentUser) return null;
  const lec = { uid: currentUser.uid, name: rec?.name || name };
  return (
    <div className="cm-page">
      <header className="cm-topbar">
        <button className="cm-back" onClick={() => navigate("/community/lecturers")} aria-label="Back to Community"><ArrowLeft size={16} /></button>
        <div className="cm-title"><GraduationCap size={16} /><span>Lecturer Portal</span></div>
        <div style={{ width: 36 }} />
      </header>
      <div className="cm-scroll">
        {state === "loading" && <p className="cm-empty">Loading…</p>}
        {state === "none" && <Apply user={{ uid: currentUser.uid, name, email: currentUser.email }} />}
        {state === "pending" && <div className="cm-note" role="status">Your application is being verified. Check back soon.</div>}
        {state === "verified" && (<>
          <div className="cm-flow"><ShieldCheck size={14} /> <b>{lec.name}</b> · Verified lecturer</div>
          <nav className="cm-tabs" aria-label="Portal sections">
            {TABS.map(({ id, label, Icon }) => (<button key={id} className={`cm-tab ${tab === id ? "cm-tab--on" : ""}`} onClick={() => setTab(id)}><Icon size={14} /> {label}</button>))}
          </nav>
          {tab === "resources" && <Resources lec={lec} />}
          {tab === "news" && <News lec={lec} />}
          {tab === "questions" && <Questions lec={lec} />}
        </>)}
      </div>
    </div>
  );
}