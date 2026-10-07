// src/services/communityService.js
// Realtime Database helpers for Community. Everything lives under /community.
// Privacy design:
//  • Well-being check-ins are NOT here — they never leave the device.
//  • Anonymous questions never store the asker's uid beside the question.
//    The inbox item only holds a random reply token; the asker keeps the
//    token in their private outbox and reads the answer from /replies/<token>.
import { getDatabase, ref, get, set, push, update, remove, onValue, serverTimestamp } from "firebase/database";

const rdb = () => getDatabase();
const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");

const toList = (snap) => {
  const out = [];
  snap.forEach((c) => { out.push({ id: c.key, ...c.val() }); });
  return out;
};

export function listen(path, cb) {
  return onValue(ref(rdb(), path), (s) => cb(toList(s)), () => cb([]));
}

// ── Mentors (senior students opt in themselves) ─────────────────────────────
export const saveMentorProfile = (uid, data) =>
  set(ref(rdb(), `community/mentors/${uid}`), { ...data, updatedAt: serverTimestamp() });
export const removeMentorProfile = (uid) => remove(ref(rdb(), `community/mentors/${uid}`));

// ── Lecturers ───────────────────────────────────────────────────────────────
export const applyAsLecturer = (uid, data) =>
  set(ref(rdb(), `community/lecturerApplications/${uid}`), { ...data, createdAt: serverTimestamp() });
export async function getLecturerRecord(uid) {
  const s = await get(ref(rdb(), `community/lecturers/${uid}`));
  return s.exists() ? s.val() : null;
}
export const hasApplied = async (uid) =>
  (await get(ref(rdb(), `community/lecturerApplications/${uid}`))).exists();

export const postResource = (lecturer, data) =>
  push(ref(rdb(), "community/resources"), { ...data, lecturerUid: lecturer.uid, lecturerName: lecturer.name, createdAt: serverTimestamp() });
export const postAnnouncement = (lecturer, text) =>
  push(ref(rdb(), "community/announcements"), { text, lecturerUid: lecturer.uid, lecturerName: lecturer.name, createdAt: serverTimestamp() });
export const deleteItem = (kind, id) => remove(ref(rdb(), `community/${kind}/${id}`));

// ── Questions (seniors + lecturers) ─────────────────────────────────────────
export async function askQuestion({ asker, toUid, toName, toKind, text, anonymous }) {
  const t = token();
  const qRef = push(ref(rdb(), `community/inbox/${toUid}`));
  const qid = qRef.key;
  // 1) reply slot first (tells the rules who may answer), 2) inbox item, 3) asker's private outbox
  await set(ref(rdb(), `community/replies/${t}`), { toUid, createdAt: serverTimestamp() });
  await set(qRef, { text, toKind, askerName: anonymous ? null : asker.name, replyToken: t, createdAt: serverTimestamp() });
  await set(ref(rdb(), `community/outbox/${asker.uid}/${qid}`), { toName, toKind, text, replyToken: t, createdAt: serverTimestamp() });
  return qid;
}
export const answerQuestion = (uid, item, text, byName) => {
  // Root-level multi-path update so the rules are checked per field.
  const base = `community/replies/${item.replyToken}`;
  return update(ref(rdb()), {
    [`${base}/answer`]: text,
    [`${base}/answeredBy`]: byName,
    [`${base}/answeredAt`]: serverTimestamp(),
    [`community/inbox/${uid}/${item.id}/handled`]: true,
  });
};
export const markHandled = (uid, qid) => update(ref(rdb(), `community/inbox/${uid}/${qid}`), { handled: true });
export function watchReply(tokenId, cb) {
  return onValue(ref(rdb(), `community/replies/${tokenId}`), (s) => cb(s.val()), () => cb(null));
}

// ── Study groups ────────────────────────────────────────────────────────────
export const createGroup = (user, data) => {
  const g = push(ref(rdb(), "community/groups"));
  return set(g, { ...data, ownerUid: user.uid, members: { [user.uid]: user.name }, createdAt: serverTimestamp() });
};
export const joinGroup  = (gid, user) => set(ref(rdb(), `community/groups/${gid}/members/${user.uid}`), user.name);
export const leaveGroup = (gid, uid)  => remove(ref(rdb(), `community/groups/${gid}/members/${uid}`));
export const postToGroup = (gid, user, text) =>
  push(ref(rdb(), `community/groupPosts/${gid}`), { uid: user.uid, name: user.name, text, createdAt: serverTimestamp() });

// ── Reports (any signed-in user; only the admin can read) ───────────────────
export const report = (uid, payload) =>
  push(ref(rdb(), "community/reports"), { ...payload, by: uid, createdAt: serverTimestamp() });