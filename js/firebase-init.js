import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js';
import { getAuth, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, linkWithPopup, signInWithPopup } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp,
  collection, query, where, onSnapshot, writeBatch, runTransaction, getDocs
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDbd5CZCWKd-CYlvwAvR7AyY3G94_CdkgU',
  authDomain: 'unica-world.firebaseapp.com',
  projectId: 'unica-world',
  storageBucket: 'unica-world.firebasestorage.app',
  messagingSenderId: '640407918994',
  appId: '1:640407918994:web:64e30aa04e3496da46094b'
};

const app = initializeApp(firebaseConfig);

// Firebase App Check: UNICA WORLD の正規Webアプリからのリクエストを識別します。
// reCAPTCHA Enterprise のサイトキーは公開用キーのため、ブラウザコードに含めて問題ありません。
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    '6LdfbXEtAAAAAK_75BRfPmWxsx_dRxKjIAsAYGgA'
  ),
  isTokenAutoRefreshEnabled: true
});

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
const MEMBER_KEY = 'unicaWorldMemberV4';
const LEGACY_MEMBER_KEYS = ['unicaWorldMemberV3', 'unicaWorldMemberV2', 'unicaWorldMemberV1'];
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
let uid = null;
let presenceTimer = null;
let resolveAuthReady;
const authReady = new Promise(resolve => { resolveAuthReady = resolve; });

function setStatus(state, text) {
  const badge = document.getElementById('firebaseStatus');
  if (!badge) return;
  badge.dataset.state = state;
  badge.textContent = text;
}

function localMember() {
  try {
    const current = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
    if (current) return current;
    for (const key of LEGACY_MEMBER_KEYS) {
      const legacy = JSON.parse(localStorage.getItem(key) || 'null');
      if (legacy) return legacy;
    }
    return null;
  } catch (_) {
    return null;
  }
}

async function saveMember(member) {
  if (!uid || !member) return;
  await setDoc(doc(db, 'users', uid), {
    ...member,
    uid,
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    prefecturePublic: member.prefecturePublic !== false,
    birthdayPublic: member.birthdayPublic !== false
  }, { merge: true });
}

async function removeMember() {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  const counterRef = doc(db, 'system', 'memberCounterV3');
  await runTransaction(db, async transaction => {
    const [userSnap, counterSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(counterRef)
    ]);
    const releasedNumber = userSnap.exists() ? Number(userSnap.data().number || 0) : 0;
    const counter = counterSnap.exists() ? counterSnap.data() : {};
    const availableNumbers = Array.isArray(counter.availableNumbers)
      ? counter.availableNumbers.map(Number).filter(n => Number.isInteger(n) && n > 0)
      : [];
    if (releasedNumber > 0 && !availableNumbers.includes(releasedNumber)) {
      availableNumbers.push(releasedNumber);
      availableNumbers.sort((a, b) => a - b);
    }
    transaction.set(counterRef, {
      lastNumber: Number(counter.lastNumber || 0),
      availableNumbers,
      updatedAt: serverTimestamp()
    }, { merge: true });
    transaction.delete(userRef);
  });
}

async function restoreMember() {
  if (!uid) return;
  const deletedSnap = await getDoc(doc(db, 'deletedMembers', uid));
  if (deletedSnap.exists()) {
    localStorage.removeItem(MEMBER_KEY);
    LEGACY_MEMBER_KEYS.forEach(key => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('unica:firebase-member-deleted'));
    return;
  }
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    const remote = snap.data();
    const existing = localMember();
    if (!existing || Number(remote.updatedAt?.seconds || 0) >= Number(existing.firebaseUpdatedAt || 0)) {
      const clean = { ...remote, firebaseUpdatedAt: Number(remote.updatedAt?.seconds || 0) };
      delete clean.updatedAt;
      delete clean.lastSeenAt;
      delete clean.uid;
      localStorage.setItem(MEMBER_KEY, JSON.stringify(clean));
      window.dispatchEvent(new CustomEvent('unica:firebase-member-restored', { detail: clean }));
    }
  } else {
    const member = localMember();
    if (member) await saveMember(member);
  }
}

async function ensureMemberNumber(profile = null) {
  await authReady;
  if (!uid) throw new Error('Firebase認証が完了していません。');

  const userRef = doc(db, 'users', uid);
  const counterRef = doc(db, 'system', 'memberCounterV3');

  const assigned = await runTransaction(db, async transaction => {
    const [userSnap, counterSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(counterRef)
    ]);
    const userData = userSnap.exists() ? userSnap.data() : {};

    // 連番方式V3で発行済みなら同じ番号を永久に保持する。旧ランダム番号は再採番する。
    if (userData.memberNumberVersion === 3 && Number(userData.number) > 0) {
      return Number(userData.number);
    }

    const counter = counterSnap.exists() ? counterSnap.data() : {};
    const lastNumber = Number(counter.lastNumber || 0);
    const availableNumbers = Array.isArray(counter.availableNumbers)
      ? [...new Set(counter.availableNumbers.map(Number).filter(n => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
      : [];
    const nextNumber = availableNumbers.length ? availableNumbers.shift() : lastNumber + 1;
    transaction.set(counterRef, {
      lastNumber: Math.max(lastNumber, nextNumber),
      availableNumbers,
      updatedAt: serverTimestamp()
    }, { merge: true });
    transaction.set(userRef, {
      ...(profile || {}),
      uid,
      number: nextNumber,
      memberNumberVersion: 3,
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    }, { merge: true });
    return nextNumber;
  });

  const member = { ...(localMember() || profile || {}), number: assigned, memberNumberVersion: 3 };
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  window.dispatchEvent(new CustomEvent('unica:firebase-member-restored', { detail: member }));
  return assigned;
}

async function migrateLegacyMemberNumber() {
  const member = localMember();
  if (!member) return;
  if (member.memberNumberVersion === 3 && Number(member.number) > 0) return;
  await ensureMemberNumber(member);
}

async function heartbeat() {
  if (!uid) return;
  await setDoc(doc(db, 'presence', uid), {
    uid,
    lastSeenAt: serverTimestamp(),
    visible: document.visibilityState === 'visible'
  }, { merge: true });
}

function listenOnlineCount() {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const q = query(collection(db, 'presence'), where('lastSeenAt', '>=', cutoff));
  return onSnapshot(q, snap => {
    const count = snap.docs.filter(d => d.data().visible !== false).length;
    document.querySelectorAll('[data-online-count], #onlineCount, #communityOnlinePeople').forEach(el => {
      el.textContent = String(count);
    });
    window.dispatchEvent(new CustomEvent('unica:online-count', { detail: { count } }));
  }, error => console.warn('Online count listener:', error));
}

async function syncCommunityRows(rows = []) {
  if (!uid) return;
  const batch = writeBatch(db);
  rows.filter(row => row && !String(row.id || '').startsWith('demo-')).forEach(row => {
    batch.set(doc(db, 'supportComments', String(row.id)), {
      ...row,
      ownerUid: row.ownerUid || uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
}

async function syncCheer(data) {
  if (!uid || !data) return;
  const today = data.date || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  await setDoc(doc(db, 'dailyCheers', `${today}_${uid}`), {
    uid,
    date: today,
    member: localMember()?.name || '',
    createdAt: serverTimestamp()
  }, { merge: true });
}


async function saveMilkMatchProgress(progress) {
  await authReady;
  if (!uid || !progress) return;
  await setDoc(doc(db, 'users', uid), {
    milkMatch: {
      date: String(progress.date || ''),
      playsUsed: Math.max(0, Number(progress.playsUsed || 0)),
      fragments: Math.max(0, Number(progress.fragments || 0)),
      unlockedChapters: Array.isArray(progress.unlockedChapters) ? progress.unlockedChapters.map(Number).filter(Number.isInteger) : [],
      storyStage: Math.max(0, Number(progress.storyStage || 0)),
      stageStars: Array.isArray(progress.stageStars)
        ? progress.stageStars.map(value => Math.max(0, Math.min(3, Number(value || 0))))
        : [],
      updatedAtMs: Date.now()
    },
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function loadMilkMatchProgress() {
  await authReady;
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data().milkMatch || null) : null;
}

async function submitMilkMatchLeaderboard(result) {
  await authReady;
  const member = localMember();
  if (!uid || !member || !Number(member.number || 0) || !result) {
    return { eligible: false };
  }
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const jstNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const monday = new Date(jstNow);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  const weekKey = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
  const ref = doc(db, 'milkMatchLeaderboard', uid);
  const score = Math.max(0, Number(result.score || 0));
  const combo = Math.max(0, Number(result.bestCombo || 0));
  const matched = Math.max(0, Number(result.matched || 0));
  await runTransaction(db, async transaction => {
    const snap = await transaction.get(ref);
    const old = snap.exists() ? snap.data() : {};
    transaction.set(ref, {
      uid,
      name: String(member.name || 'うにメン'),
      number: Number(member.number || 0),
      allScore: Math.max(Number(old.allScore || 0), score),
      allCombo: Math.max(Number(old.allCombo || 0), combo),
      totalMatched: Number(old.totalMatched || 0) + matched,
      dailyDate: today,
      dailyScore: old.dailyDate === today ? Math.max(Number(old.dailyScore || 0), score) : score,
      weekKey,
      weeklyScore: old.weekKey === weekKey ? Math.max(Number(old.weeklyScore || 0), score) : score,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
  return { eligible: true };
}

async function loadMilkMatchLeaderboard(period = 'all') {
  await authReady;
  const snap = await getDocs(collection(db, 'milkMatchLeaderboard'));
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const jstNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const monday = new Date(jstNow);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  const weekKey = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
  return snap.docs.map(d => d.data()).filter(row => {
    if (period === 'today') return row.dailyDate === today;
    if (period === 'week') return row.weekKey === weekKey;
    return true;
  }).map(row => ({
    uid: row.uid || '', name: row.name || 'うにメン', number: Number(row.number || 0),
    score: period === 'today' ? Number(row.dailyScore || 0) : period === 'week' ? Number(row.weeklyScore || 0) : Number(row.allScore || 0),
    combo: Number(row.allCombo || 0)
  })).sort((a,b) => b.score - a.score || b.combo - a.combo || a.number - b.number).slice(0, 20);
}

function authInfo() {
  const user = auth.currentUser;
  const google = user?.providerData?.find(provider => provider.providerId === 'google.com');
  return {
    signedIn: Boolean(user),
    anonymous: Boolean(user?.isAnonymous),
    googleLinked: Boolean(google),
    email: google?.email || ''
  };
}

async function linkGoogleAccount() {
  await authReady;
  const user = auth.currentUser;
  if (!user) throw new Error('Firebase認証が完了していません。');
  if (user.providerData.some(provider => provider.providerId === 'google.com')) return authInfo();

  // 匿名ユーザーへGoogle認証をリンクするため、UIDと会員データを維持できます。
  const result = await linkWithPopup(user, googleProvider);
  window.dispatchEvent(new CustomEvent('unica:auth-provider-changed', { detail: authInfo() }));
  return { ...authInfo(), user: result.user };
}

async function signInGoogleAccount() {
  const result = await signInWithPopup(auth, googleProvider);
  window.dispatchEvent(new CustomEvent('unica:auth-provider-changed', { detail: authInfo() }));
  return { ...authInfo(), user: result.user };
}

window.UNICA_FIREBASE = {
  app, appCheck, auth, db,
  get uid() { return uid; },
  saveMember: member => saveMember(member).catch(console.error),
  ensureMemberNumber,
  removeMember: () => removeMember().catch(console.error),
  syncCommunityRows: rows => syncCommunityRows(rows).catch(console.error),
  syncCheer: data => syncCheer(data).catch(console.error),
  saveMilkMatchProgress,
  loadMilkMatchProgress,
  submitMilkMatchLeaderboard,
  loadMilkMatchLeaderboard,
  heartbeat: () => heartbeat().catch(console.error),
  authInfo,
  linkGoogleAccount,
  signInGoogleAccount
};

setStatus('connecting', 'Firebase 接続中');

onAuthStateChanged(auth, async user => {
  if (!user) {
    try { await signInAnonymously(auth); }
    catch (error) {
      console.error(error);
      setStatus('error', 'Firebase設定を確認');
    }
    return;
  }

  uid = user.uid;
  resolveAuthReady?.(uid);
  window.dispatchEvent(new CustomEvent('unica:auth-provider-changed', { detail: authInfo() }));
  try {
    await restoreMember();
    await migrateLegacyMemberNumber();
    await heartbeat();
    listenOnlineCount();
    presenceTimer = window.setInterval(heartbeat, 60_000);
    setStatus('online', 'Firebase 接続済み');
    window.dispatchEvent(new CustomEvent('unica:firebase-ready', { detail: { uid } }));
  } catch (error) {
    console.error(error);
    setStatus('error', 'Firestore設定を確認');
  }
});

document.addEventListener('visibilitychange', heartbeat);
window.addEventListener('beforeunload', () => {
  if (presenceTimer) clearInterval(presenceTimer);
});
