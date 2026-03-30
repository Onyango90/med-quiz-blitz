// src/pages/Stats.js — redesigned
// Drop in to replace existing Stats.js and Stats.css
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../hooks/useStats";
import { ArrowLeft, Flame, Star, Clock, TrendingUp, Award, BookOpen, Zap } from "lucide-react";
import "./Stats.css";

const accuracyColor = (pct) => {
  const n = parseFloat(pct);
  if (n >= 80) return { color: "#059669", bg: "#f0fdf4" };
  if (n >= 60) return { color: "#d97706", bg: "#fffbeb" };
  return             { color: "#dc2626", bg: "#fef2f2" };
};
const formatTime = (s) => {
  if (!s) return "0m";
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
function BarChartIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}
function StatsHeader({ navigate }) {
  return (
    <header className="st-header">
      <button className="st-back" onClick={() => navigate("/home")}><ArrowLeft size={16}/> Back</button>
      <div className="st-header-center">
        <div className="st-header-icon"><BarChartIcon size={20}/></div>
        <div><h1 className="st-title">My Progress</h1><p className="st-subtitle">Your medical study journey</p></div>
      </div>
      <div style={{width:80}}/>
    </header>
  );
}
export default function Stats() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { stats, loading, refreshStats } = useStats();
  useEffect(() => { refreshStats(); }, []);
  if (!currentUser) return (
    <div className="st-page"><div className="st-empty-state">
      <div className="st-empty-icon">🔒</div><h3>Sign in to see your stats</h3>
      <p>Your progress is saved to your account.</p>
      <button className="st-cta-btn" onClick={() => navigate("/signin")}>Sign In</button>
    </div></div>
  );
  if (loading) return (
    <div className="st-page"><div className="st-loading"><div className="st-spinner"/><p>Loading your progress…</p></div></div>
  );
  const basic = stats?.basic || {}, today = stats?.today || {};
  const subjects = stats?.subjects || [], weekly = stats?.weekly || [];
  if (!basic.totalAttempted) return (
    <div className="st-page"><StatsHeader navigate={navigate}/><div className="st-body">
      <div className="st-empty-state">
        <div className="st-empty-icon">📊</div><h3>No stats yet!</h3>
        <p>Complete the Daily Challenge or study some topics to start tracking your progress.</p>
        <div className="st-empty-btns">
          <button className="st-cta-btn" onClick={() => navigate("/daily-challenge")}>⭐ Daily Challenge</button>
          <button className="st-cta-btn st-cta-outline" onClick={() => navigate("/study-dashboard")}>📚 Study Centre</button>
        </div>
      </div>
    </div></div>
  );
  const acc = parseFloat(basic.accuracy||0), ac = accuracyColor(acc);
  const r=36, stroke=8, circ=2*Math.PI*r, filled=(Math.min(acc,100)/100)*circ;
  const weekMax = Math.max(...weekly.map((d)=>d.questions),1);
  return (
    <div className="st-page">
      <StatsHeader navigate={navigate}/>
      <div className="st-body">
        {today.attempted > 0 && (
          <div className="st-today-banner">
            <span className="st-today-label">📅 Today</span>
            <div className="st-today-pills">
              <span>{today.attempted} questions</span><span>·</span>
              <span style={{color:accuracyColor(today.accuracy).color}}>{today.accuracy}% accuracy</span><span>·</span>
              <span style={{color:"#d97706"}}>+{today.xpEarned} XP</span>
            </div>
          </div>
        )}
        <div className="st-hero-row">
          <div className="st-accuracy-card">
            <div className="st-accuracy-ring-wrap">
              <svg width="88" height="88" style={{transform:"rotate(-90deg)"}}>
                <circle cx="44" cy="44" r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke}/>
                <circle cx="44" cy="44" r={r} fill="none" stroke={ac.color} strokeWidth={stroke}
                  strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.8s ease"}}/>
              </svg>
              <div className="st-ring-label">
                <span className="st-ring-value" style={{color:ac.color}}>{basic.accuracy}%</span>
                <span className="st-ring-sub">accuracy</span>
              </div>
            </div>
            <div className="st-accuracy-detail">
              <p className="st-accuracy-headline">{acc>=80?"Excellent work!":acc>=60?"Good progress!":"Keep practising!"}</p>
              <div className="st-accuracy-breakdown">
                <div className="st-ab-row"><span className="st-ab-dot" style={{background:"#10b981"}}/><span>{basic.totalCorrect||0} correct</span></div>
                <div className="st-ab-row"><span className="st-ab-dot" style={{background:"#f87171"}}/><span>{(basic.totalAttempted||0)-(basic.totalCorrect||0)} incorrect</span></div>
                <div className="st-ab-row"><span className="st-ab-dot" style={{background:"#94a3b8"}}/><span>{basic.totalAttempted||0} total</span></div>
              </div>
            </div>
          </div>
          <div className="st-right-cards">
            {[
              {icon:Flame,label:"Day Streak",value:basic.currentStreak||0,color:"#f97316",bg:"#fff7ed"},
              {icon:Star,label:"Total XP",value:(basic.totalXP||0).toLocaleString(),color:"#d97706",bg:"#fefce8"},
              {icon:Clock,label:"Study Time",value:formatTime(basic.totalTimeSpent),color:"#6366f1",bg:"#eef2ff"},
              {icon:Award,label:"Sessions",value:basic.sessionsCompleted||0,color:"#0d9488",bg:"#f0fdfa"},
              {icon:TrendingUp,label:"Best Streak",value:`${basic.longestStreak||0}d`,color:"#7c3aed",bg:"#faf5ff"},
              {icon:BookOpen,label:"Qs Answered",value:(basic.totalAttempted||0).toLocaleString(),color:"#0369a1",bg:"#f0f9ff"},
            ].map((s)=>(
              <div key={s.label} className="st-mini-card">
                <div className="st-mini-icon" style={{background:s.bg,color:s.color}}><s.icon size={15}/></div>
                <div><p className="st-mini-value" style={{color:s.color}}>{s.value}</p><p className="st-mini-label">{s.label}</p></div>
              </div>
            ))}
          </div>
        </div>
        {weekly.some((d)=>d.questions>0) && (
          <div className="st-panel">
            <div className="st-panel-header">
              <h2 className="st-panel-title">This Week</h2>
              <span className="st-panel-sub">{weekly.reduce((a,d)=>a+d.questions,0)} questions total</span>
            </div>
            <div className="st-weekly-chart">
              {weekly.map((day)=>{
                const h=Math.max((day.questions/weekMax)*100,day.questions>0?6:0);
                return (
                  <div key={day.name} className="st-bar-col">
                    <span className="st-bar-val">{day.questions>0?day.questions:""}</span>
                    <div className="st-bar-track"><div className="st-bar-fill" style={{height:`${h}%`}}/></div>
                    <span className="st-bar-label">{day.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {subjects.length > 0 && (
          <div className="st-panel">
            <div className="st-panel-header">
              <h2 className="st-panel-title">By Subject</h2>
              <span className="st-panel-sub">Sorted by accuracy</span>
            </div>
            <div className="st-subjects">
              {subjects.map((s,i)=>{
                const c=accuracyColor(s.accuracy);
                return (
                  <div key={s.name} className="st-subject-row">
                    <span className="st-subject-rank">#{i+1}</span>
                    <span className="st-subject-name">{s.name}</span>
                    <div className="st-subject-track"><div className="st-subject-fill" style={{width:`${s.accuracy}%`,background:c.color}}/></div>
                    <span className="st-subject-pct" style={{color:c.color}}>{s.accuracy}%</span>
                    <span className="st-subject-count">{s.total}q</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {(basic.currentStreak||0)>=3 && (
          <div className="st-motivation">
            <Flame size={20} style={{color:"#f97316",flexShrink:0}}/>
            <span>{basic.currentStreak>=14?`🔥 ${basic.currentStreak} days straight — unstoppable!`:basic.currentStreak>=7?`🔥 ${basic.currentStreak} day streak — you're on fire!`:`🔥 ${basic.currentStreak} days in a row. Consistency is everything!`}</span>
          </div>
        )}
        <div className="st-actions">
          <button className="st-action-btn st-action-primary" onClick={()=>navigate("/daily-challenge")}><Zap size={15}/> Daily Challenge</button>
          <button className="st-action-btn st-action-secondary" onClick={()=>navigate("/study-dashboard")}><BookOpen size={15}/> Study Centre</button>
          <button className="st-action-btn st-action-secondary" onClick={()=>navigate("/home")}><ArrowLeft size={15}/> Dashboard</button>
        </div>
      </div>
    </div>
  );
}
