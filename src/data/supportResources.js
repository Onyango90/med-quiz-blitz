// src/data/supportResources.js
// Professional support contacts shown in Community → Support & Well-being.
// ⚠ VERIFY every number/URL before launch, and add your own university's
// counselling service (UoN etc.) — those details belong here, in one place.
export const SUPPORT_RESOURCES = [
  { id: "uni",      label: "Your university counselling service", detail: "Ask your student affairs / dean of students office how to book a confidential session.", contact: null },
  { id: "redcross", label: "Kenya Red Cross counselling line",    detail: "Free, confidential support by phone.", contact: "1199", tel: "1199" },
  { id: "befrienders", label: "Befrienders Kenya",                detail: "Emotional support by phone, any time you need to talk.", contact: "+254 722 178 177", tel: "+254722178177" },
];
export const EMERGENCY = { label: "If you or someone else is in immediate danger", contact: "999 or 112", tel: "999" };

// Check-in options. Stored on this device only — see useWellbeingCheckin.
export const MOODS = [
  { id: "well",   emoji: "😊", label: "Doing well" },
  { id: "okay",   emoji: "😐", label: "Okay" },
  { id: "struggling", emoji: "😟", label: "Struggling" },
  { id: "really", emoji: "😔", label: "Really struggling" },
];