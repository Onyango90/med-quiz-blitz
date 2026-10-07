// src/pages/Community.jsx — Learn → Connect → Get Support
// One page, four sections (/community/:section). Reuses the app's standalone
// page pattern (topbar + back button, as in Leaderboard).
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, GraduationCap, MessageCircleQuestion, HeartHandshake, Send,
  Flag, Phone, Link2, Megaphone, Plus, ShieldCheck, Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listen, askQuestion, watchReply, saveMentorProfile, removeMentorProfile,
  createGroup, joinGroup, leaveGroup, postToGroup, report, getLecturerRecord,
} from "../services/communityService";
import { useWellbeingCheckin } from "../hooks/useWellbeingCheckin";
import { SUPPORT_RESOURCES, EMERGENCY, MOODS } from "../data/supportResources";
import "./Community.css";

const SECTIONS = [
  { id: "senior",    label: "Ask a Senior",   Icon: MessageCircleQuestion },
  { id: "lecturers", label: "Lecturers",      Icon: GraduationCap },
  { id: "groups",    label: "Study Groups",   Icon: Users },
  { id: "support",   label: "Support & Well-being", Icon: HeartHandshake },
];

const when = (t) => (t ? new Date(t).toLocaleDateString([], { day: "numeric", month: "short" }) : "");
const Empty = ({ children }) => <p className="cm-empty">{children}</p>;

/* ───────── Ask panel (shared by seniors + lecturers) ───────── */
function AskPanel({ target, asker, onDone, onCancel }) {
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const send = async () => {
    if (text.trim().length < 5) return setErr("Add a little more detail so they can help.");
    setBusy(true); setErr("");
    try {
      await askQuestion({ asker, toUid: target.id, toName: target.name, toKind: target.kind, text: text.trim(), anonymous: anon });
      onDone();
    } catch { setErr("Couldn't send. Please try again."); setBusy(false); }
  };
  return (
    <div className="cm-card cm-ask">
      <b>Ask {target.name}</b>
      <textarea className="cm-input" rows={4} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="What would you like advice or help with?" aria-label="Your question" />
      <label className="cm-check"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
        Ask anonymously <span className="cm-muted">(they won't see your name)</span></label>
      {err && <p className="cm-err" role="alert">{err}</p>}
      <div className="cm-row">
        <button className="cm-btn" onClick={send} disabled={busy}><Send size={14} /> {busy ? "Sending…" : "Send"}</button>
        <button className="cm-btn cm-btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function QuestionRow({ q }) {
  const [reply, setReply] = useState(null);
  useEffect(() => watchReply(q.replyToken, setReply), [q.replyToken]);
  return (
    <div className="cm-card cm-q">
      <div className="cm-muted">To {q.toName} · {when(q.createdAt)}</div>
      <p>{q.text}</p>
      {reply?.answer
        ? <div className="cm-answer"><b>{reply.answeredBy || "Reply"}:</b> {reply.answer}</div>
        : <div className="cm-muted">Waiting for a reply…</div>}
    </div>
  );
}

function MyQuestions({ uid, kind }) {
  const [items, setItems] = useState([]);
  useEffect(() => listen(`community/outbox/${uid}`, (l) => setItems(l.filter((x) => x.toKind === kind).reverse())), [uid, kind]);
  if (!items.length) return null;
  return <><h2 className="cm-h2">Your questions</h2>{items.map((q) => <QuestionRow key={q.id} q={q} />)}</>;
}

/* ───────── Ask a Senior ───────── */
function SeniorSection({ user, year }) {
  const [mentors, setMentors] = useState([]);
  const [target, setTarget] = useState(null);
  const [sent, setSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState("");
  const [focus, setFocus] = useState("");
  useEffect(() => listen("community/mentors", setMentors), []);
  const mine = mentors.find((m) => m.id === user.uid);
  const others = mentors.filter((m) => m.id !== user.uid && m.open !== false);
  const canMentor = parseInt(year, 10) >= 5;

  const saveMine = async () => {
    await saveMentorProfile(user.uid, { name: user.name, year: parseInt(year, 10), headline: headline.trim(), focus: focus.trim(), open: true });
    setEditing(false);
  };
  return (
    <>
      <p className="cm-lead">Advice from students a few steps ahead of you: study strategy, clinical rotations, exam prep, and encouragement.</p>
      {sent && <div className="cm-note cm-note--ok" role="status">Sent. You'll see their reply under "Your questions".</div>}
      {target && <AskPanel target={{ ...target, kind: "senior" }} asker={user} onDone={() => { setTarget(null); setSent(true); }} onCancel={() => setTarget(null)} />}
      {others.length === 0 && <Empty>No seniors are listed yet. Year 5–6 students can add themselves below.</Empty>}
      {others.map((m) => (
        <div key={m.id} className="cm-card cm-row">
          <div className="cm-person">
            <div className="cm-avatar">{(m.name || "?")[0].toUpperCase()}</div>
            <div><b>{m.name}</b> <span className="cm-chip">Year {m.year}</span>
              {m.headline && <div className="cm-muted">{m.headline}</div>}
              {m.focus && <div className="cm-muted">Can help with: {m.focus}</div>}</div>
          </div>
          <div className="cm-row">
            <button className="cm-btn" onClick={() => { setSent(false); setTarget(m); }}>Ask</button>
            <button className="cm-icon-btn" title="Report" aria-label={`Report ${m.name}`} onClick={() => report(user.uid, { kind: "mentor", id: m.id })}><Flag size={14} /></button>
          </div>
        </div>
      ))}
      <MyQuestions uid={user.uid} kind="senior" />
      {canMentor && (
        <div className="cm-card">
          {mine && !editing ? (
            <div className="cm-row"><span>You're listed as a senior mentor.</span>
              <button className="cm-btn cm-btn--ghost" onClick={() => removeMentorProfile(user.uid)}>Remove my listing</button></div>
          ) : editing ? (
            <>
              <input className="cm-input" placeholder="One line about you (e.g. Year 6, loves surgery)" value={headline} onChange={(e) => setHeadline(e.target.value)} />
              <input className="cm-input" placeholder="What can you help with? (e.g. pharmacology, OSCEs)" value={focus} onChange={(e) => setFocus(e.target.value)} />
              <div className="cm-row"><button className="cm-btn" onClick={saveMine}>Save</button>
                <button className="cm-btn cm-btn--ghost" onClick={() => setEditing(false)}>Cancel</button></div>
            </>
          ) : (
            <div className="cm-row"><span>Year {year}? Help the students coming behind you.</span>
              <button className="cm-btn cm-btn--ghost" onClick={() => setEditing(true)}><Plus size={14} /> Become a senior mentor</button></div>
          )}
        </div>
      )}
    </>
  );
}

/* ───────── Lecturers ───────── */
function LecturerSection({ user }) {
  const navigate = useNavigate();
  const [lecturers, setLecturers] = useState([]);
  const [resources, setResources] = useState([]);
  const [news, setNews] = useState([]);
  const [target, setTarget] = useState(null);
  const [sent, setSent] = useState(false);
  const [isLecturer, setIsLecturer] = useState(false);
  useEffect(() => {
    const a = listen("community/lecturers", (l) => setLecturers(l.filter((x) => x.verified)));
    const b = listen("community/resources", (l) => setResources(l.reverse()));
    const c = listen("community/announcements", (l) => setNews(l.reverse().slice(0, 4)));
    getLecturerRecord(user.uid).then((r) => setIsLecturer(!!r?.verified)).catch(() => {});
    return () => { a(); b(); c(); };
  }, [user.uid]);

  return (
    <>
      <p className="cm-lead">Verified lecturers, their learning resources, and a private way to ask questions or request mentorship.</p>
      {sent && <div className="cm-note cm-note--ok" role="status">Sent. You'll see their reply under "Your questions".</div>}
      {target && <AskPanel target={{ ...target, kind: "lecturer" }} asker={user} onDone={() => { setTarget(null); setSent(true); }} onCancel={() => setTarget(null)} />}
      {news.length > 0 && (<><h2 className="cm-h2"><Megaphone size={15} /> Announcements</h2>
        {news.map((n) => <div key={n.id} className="cm-card"><div className="cm-muted">{n.lecturerName} · {when(n.createdAt)}</div><p>{n.text}</p></div>)}</>)}
      <h2 className="cm-h2">Lecturers</h2>
      {lecturers.length === 0 && <Empty>No lecturers have joined yet.</Empty>}
      {lecturers.map((l) => {
        const rs = resources.filter((r) => r.lecturerUid === l.id);
        return (
          <div key={l.id} className="cm-card">
            <div className="cm-row">
              <div className="cm-person"><div className="cm-avatar">{(l.name || "?")[0].toUpperCase()}</div>
                <div><b>{l.name}</b> <span className="cm-chip cm-chip--ok"><ShieldCheck size={11} /> Verified</span>
                  <div className="cm-muted">{[l.department, l.institution].filter(Boolean).join(" · ")}</div></div></div>
              <button className="cm-btn" onClick={() => { setSent(false); setTarget({ id: l.id, name: l.name }); }}>Ask a question</button>
            </div>
            {rs.length > 0 && <ul className="cm-res">{rs.slice(0, 5).map((r) => (
              <li key={r.id}><Link2 size={13} /> <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>{r.course && <span className="cm-muted"> · {r.course}</span>}</li>))}</ul>}
          </div>
        );
      })}
      <MyQuestions uid={user.uid} kind="lecturer" />
      <div className="cm-card cm-row">
        <span>{isLecturer ? "You're a verified lecturer." : "Are you a lecturer? Join TukoZone to share resources and mentor students."}</span>
        <button className="cm-btn cm-btn--ghost" onClick={() => navigate("/lecturer")}>{isLecturer ? "Open Lecturer Portal" : "Apply"}</button>
      </div>
    </>
  );
}

/* ───────── Study Groups ───────── */
function GroupThread({ gid, user }) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  useEffect(() => listen(`community/groupPosts/${gid}`, setPosts), [gid]);
  const send = async () => { const t = text.trim(); if (!t) return; setText(""); await postToGroup(gid, user, t); };
  return (
    <div className="cm-thread">
      {posts.length === 0 && <Empty>No messages yet. Start the discussion.</Empty>}
      {posts.map((p) => (
        <div key={p.id} className="cm-post"><b>{p.name}</b> <span className="cm-muted">{when(p.createdAt)}</span>
          <button className="cm-icon-btn" title="Report" aria-label="Report message" onClick={() => report(user.uid, { kind: "post", gid, id: p.id })}><Flag size={12} /></button>
          <p>{p.text}</p></div>))}
      <div className="cm-row"><input className="cm-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a message" aria-label="Message" />
        <button className="cm-btn" onClick={send} aria-label="Send"><Send size={14} /></button></div>
    </div>
  );
}

function GroupSection({ user }) {
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  useEffect(() => listen("community/groups", (l) => setGroups(l.reverse())), []);
  const make = async () => {
    if (name.trim().length < 3) return;
    await createGroup(user, { name: name.trim(), topic: topic.trim() });
    setName(""); setTopic(""); setCreating(false);
  };
  return (
    <>
      <p className="cm-lead">Learn with others. Join a group, ask questions, and keep each other going.</p>
      {groups.length === 0 && <Empty>No groups yet. Be the first to start one.</Empty>}
      {groups.map((g) => {
        const members = g.members || {};
        const joined = !!members[user.uid];
        return (
          <div key={g.id} className="cm-card">
            <div className="cm-row">
              <div><b>{g.name}</b><div className="cm-muted">{g.topic ? `${g.topic} · ` : ""}{Object.keys(members).length} members</div></div>
              <div className="cm-row">
                {joined && <button className="cm-btn cm-btn--ghost" onClick={() => setOpen(open === g.id ? null : g.id)}>{open === g.id ? "Close" : "Open"}</button>}
                <button className={`cm-btn ${joined ? "cm-btn--ghost" : ""}`} onClick={() => (joined ? leaveGroup(g.id, user.uid) : joinGroup(g.id, user))}>{joined ? "Leave" : "Join"}</button>
              </div>
            </div>
            {joined && open === g.id && <GroupThread gid={g.id} user={user} />}
          </div>
        );
      })}
      {creating ? (
        <div className="cm-card">
          <input className="cm-input" placeholder="Group name (e.g. Cardiology Crammers)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="cm-input" placeholder="Topic or unit (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <div className="cm-row"><button className="cm-btn" onClick={make}>Create group</button>
            <button className="cm-btn cm-btn--ghost" onClick={() => setCreating(false)}>Cancel</button></div>
        </div>
      ) : <button className="cm-btn cm-btn--ghost" onClick={() => setCreating(true)}><Plus size={14} /> Start a group</button>}
    </>
  );
}

/* ───────── Support & Well-being ───────── */
function SupportSection({ go }) {
  const { current, record, clear, persistent, hasHistory } = useWellbeingCheckin();
  const proRef = useRef(null);
  const tough = current === "struggling" || current === "really";
  const scrollToPro = () => proRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <>
      <p className="cm-lead">Medicine is demanding. This space is here whenever you want it. Nothing here is required.</p>
      <div className="cm-card">
        <b>How are you feeling about your studies?</b>
        <div className="cm-moods" role="group" aria-label="Well-being check-in">
          {MOODS.map((m) => (
            <button key={m.id} className={`cm-mood ${current === m.id ? "cm-mood--on" : ""}`} aria-pressed={current === m.id} onClick={() => record(m.id)}>
              <span aria-hidden="true">{m.emoji}</span>{m.label}
            </button>))}
        </div>
        <div className="cm-note"><Lock size={13} /> Optional and private. Your answer stays on this device only. It isn't sent to TukoZone, and nobody, including admins, can see it. It isn't a diagnosis. It's just a moment to notice how you're doing.</div>
        {hasHistory && <button className="cm-link" onClick={clear}>Clear my check-ins from this device</button>}
      </div>

      {current === "well" && <div className="cm-card">Good to hear. Keeping steady habits helps. Study with others in a <button className="cm-link" onClick={() => go("groups")}>study group</button>.</div>}
      {current === "okay" && <div className="cm-card">Steady is fine. If you'd like a boost, a senior student can share how they got through this stage.</div>}

      {tough && (
        <>
          <h2 className="cm-h2">Who would you like to talk to?</h2>
          <div className="cm-opts">
            <button className="cm-opt" onClick={() => go("senior")}><b>A Senior Student</b><span>Someone who has been where you are</span></button>
            <button className="cm-opt" onClick={() => go("lecturers")}><b>A Lecturer / Mentor</b><span>Academic guidance and support</span></button>
            <button className="cm-opt" onClick={() => go("groups")}><b>A Friend / Study Partner</b><span>Study together, stay connected</span></button>
            <button className="cm-opt" onClick={scrollToPro}><b>Professional Support</b><span>Counselling and helplines</span></button>
          </div>
        </>
      )}
      {(current === "really" || persistent) && (
        <div className="cm-note cm-note--warm" role="status">
          {persistent && current !== "really" && <>Things have felt heavy for a little while now. </>}
          You don't have to carry this alone. Talking to a counsellor can really help, and reaching out is a sign of good judgement. {EMERGENCY.label}: <a href={`tel:${EMERGENCY.tel}`}><b>{EMERGENCY.contact}</b></a>.
        </div>)}

      <h2 className="cm-h2" ref={proRef}>Professional support</h2>
      <div className="cm-card">
        <p className="cm-muted" style={{ marginTop: 0 }}>If stress is lasting more than a couple of weeks, or getting in the way of daily life, professional support can help. These services are confidential.</p>
        {SUPPORT_RESOURCES.map((r) => (
          <div key={r.id} className="cm-pro"><b>{r.label}</b><div className="cm-muted">{r.detail}</div>
            {r.contact && <a className="cm-btn cm-btn--ghost" href={`tel:${r.tel}`}><Phone size={13} /> {r.contact}</a>}</div>))}
        <div className="cm-pro"><b>{EMERGENCY.label}</b> <a className="cm-btn cm-btn--ghost" href={`tel:${EMERGENCY.tel}`}><Phone size={13} /> {EMERGENCY.contact}</a></div>
      </div>
      <div className="cm-card cm-encourage">Struggling with a rotation or an exam says nothing about the doctor you'll become. Small steps count, and you're not behind.</div>
    </>
  );
}

/* ───────── Page ───────── */
export default function Community() {
  const navigate = useNavigate();
  const { section = "senior" } = useParams();
  const { currentUser, userData } = useAuth();
  const user = useMemo(() => currentUser && ({
    uid: currentUser.uid,
    name: userData?.profile?.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Student",
  }), [currentUser, userData]);
  const year = userData?.profile?.year || localStorage.getItem("userYear") || 1;
  const active = SECTIONS.find((s) => s.id === section) ? section : "senior";
  const go = (id) => navigate(`/community/${id}`);

  useEffect(() => { if (!currentUser) navigate("/signin"); }, [currentUser, navigate]);
  if (!user) return null;

  return (
    <div className="cm-page">
      <header className="cm-topbar">
        <button className="cm-back" onClick={() => navigate("/home")} aria-label="Back to home"><ArrowLeft size={16} /></button>
        <div className="cm-title"><Users size={16} /><span>Community</span></div>
        <div style={{ width: 36 }} />
      </header>
      <div className="cm-scroll">
        <div className="cm-flow" aria-label="Learn, Connect, Get Support"><span>Learn</span> → <b>Connect</b> → <span>Get Support</span></div>
        <nav className="cm-tabs" aria-label="Community sections">
          {SECTIONS.map(({ id, label, Icon }) => (
            <button key={id} className={`cm-tab ${active === id ? "cm-tab--on" : ""}`} aria-current={active === id ? "page" : undefined} onClick={() => go(id)}>
              <Icon size={14} /> {label}</button>))}
        </nav>
        {active === "senior"    && <SeniorSection   user={user} year={year} />}
        {active === "lecturers" && <LecturerSection user={user} />}
        {active === "groups"    && <GroupSection    user={user} />}
        {active === "support"   && <SupportSection  go={go} />}
      </div>
    </div>
  );
}