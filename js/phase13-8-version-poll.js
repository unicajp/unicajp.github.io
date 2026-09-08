import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

(() => {
  'use strict';

  // 新しい投票を始めるときは、CURRENT_POLL を差し替え、終了した投票を PAST_POLLS に移します。
  const CURRENT_POLL = {
    id: 'milk-no-nioi-version-202609',
    song: 'ミルクの匂い',
    title: '今の気持ちに一票',
    startAt: '2026-09-07T00:00:00+09:00',
    endAt: '2026-09-14T23:59:59+09:00',
    choices: [
      { id: 'release', label: 'Release ver.しか勝たん', audio: 'assets/audio/milk_no_nioi_release.mp3' },
      { id: 'acoustic', label: '弾き語り ver.に心奪われた', audio: 'assets/audio/milk_no_nioi_acoustic.mp3' },
      { id: 'depends_on_day', label: '聴きたいver.が日によって変わる' },
      { id: 'unico_voice', label: '結局、うにこの歌声が好き' },
      { id: 'piano_amazing', label: 'いや、ピアノうますぎ' }
    ]
  };
  const PAST_POLLS = [];
  let busy = false;
  let playingAudio = null;
  let playingButton = null;
  let currentChoice = '';
  let changeMode = false;
  const $ = (s, r = document) => r.querySelector(s);

  function memberExists() {
    try {
      return Boolean(JSON.parse(localStorage.getItem('unicaWorldMemberV4') || 'null') || JSON.parse(localStorage.getItem('unicaWorldMemberV3') || 'null'));
    } catch (_) { return false; }
  }
  function pollEnded(poll = CURRENT_POLL) { return Date.now() > new Date(poll.endAt).getTime(); }
  function pollStarted(poll = CURRENT_POLL) { return Date.now() >= new Date(poll.startAt).getTime(); }
  function dateLabel(iso) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  function makeCard() {
    const ended = pollEnded();
    const card = document.createElement('section');
    card.className = 'version-poll-card';
    card.id = 'versionPollCard';
    card.innerHTML = `
      <div class="version-poll-head">
        <div><small>UNIMEN VOTE</small><h2>${ended ? '最新の投票結果' : CURRENT_POLL.title}</h2></div>
        <span>${ended ? '投票終了' : '1人1票'}</span>
      </div>
      <p class="version-poll-song">「${CURRENT_POLL.song}」</p>
      <div class="version-poll-period">${ended ? '投票は終了しました' : `投票期間　${dateLabel(CURRENT_POLL.startAt)}〜${dateLabel(CURRENT_POLL.endAt)}`}</div>
      <div class="version-poll-list">
        ${CURRENT_POLL.choices.map(c => `
          <div class="version-poll-option" data-option="${c.id}">
            <div class="version-poll-option-name"><strong>${c.label}</strong></div>
            ${c.audio ? `<button type="button" class="version-poll-listen" data-audio="${c.audio}" aria-label="${c.label}を試聴">▶ 試聴</button>` : '<span class="version-poll-listen-spacer"></span>'}
            <button type="button" class="version-poll-choice" data-choice="${c.id}" ${ended ? 'disabled' : ''}>${ended ? '終了' : '投票する'}</button>
          </div>`).join('')}
      </div>
      <div class="version-poll-participants">参加者 <b id="versionPollParticipants">0</b>人</div>
      <div class="version-poll-actions" id="versionPollActions" hidden>
        <button type="button" id="versionPollChange">投票を変更</button>
        <button type="button" id="versionPollCancel">投票を取り消す</button>
      </div>
      <div class="version-poll-result" id="versionPollResult" hidden>
        <div id="versionPollResultChoices"></div>
        <p><b id="versionPollTotal">0</b>人が投票しました</p>
      </div>
      <p class="version-poll-note" id="versionPollNote">${ended ? '最終結果を表示しています。' : 'いちばん今の気持ちに近いものを選んでね。'}</p>
      <button type="button" class="version-poll-history" id="versionPollHistory">過去の投票結果を見る ›</button>
    `;
    return card;
  }

  function setChoiceState(myChoice) {
    currentChoice = myChoice || '';
    const ended = pollEnded();
    document.querySelectorAll('#versionPollCard .version-poll-choice').forEach(btn => {
      const selected = btn.dataset.choice === currentChoice;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      if (ended) { btn.textContent = '終了'; btn.disabled = true; return; }
      if (!currentChoice) { btn.textContent = '投票する'; btn.disabled = false; return; }
      if (changeMode) {
        btn.textContent = selected ? '現在の投票 ✓' : 'こちらに変更';
        btn.disabled = selected;
      } else {
        btn.textContent = selected ? '投票済み ✓' : '投票する';
        btn.disabled = true;
      }
    });
    const actions = $('#versionPollActions');
    if (actions) actions.hidden = ended || !currentChoice;
    const change = $('#versionPollChange');
    if (change) change.textContent = changeMode ? '変更をやめる' : '投票を変更';
  }

  async function waitFirebase() {
    if (window.UNICA_FIREBASE?.db && window.UNICA_FIREBASE?.uid) return window.UNICA_FIREBASE;
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = () => { if (!done && window.UNICA_FIREBASE?.db && window.UNICA_FIREBASE?.uid) { done = true; resolve(window.UNICA_FIREBASE); } };
      window.addEventListener('unica:firebase-ready', finish, { once: true });
      const started = Date.now();
      const timer = setInterval(() => {
        finish();
        if (!done && Date.now() - started > 8000) { clearInterval(timer); done = true; reject(new Error('Firebase connection timeout')); }
        if (done) clearInterval(timer);
      }, 150);
    });
  }

  async function countsFor(pollId) {
    const fb = await waitFirebase();
    const snap = await getDocs(collection(fb.db, 'polls', pollId, 'votes'));
    const counts = {};
    snap.forEach(row => { const c = String(row.data().choice || ''); counts[c] = (counts[c] || 0) + 1; });
    return counts;
  }

  async function loadState(showResults = false) {
    const note = $('#versionPollNote');
    try {
      const fb = await waitFirebase();
      const myRef = doc(fb.db, 'polls', CURRENT_POLL.id, 'votes', fb.uid);
      const mySnap = await getDoc(myRef);
      const myChoice = mySnap.exists() ? String(mySnap.data().choice || '') : '';
      setChoiceState(myChoice);
      const counts = await countsFor(CURRENT_POLL.id);
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      const participants = $('#versionPollParticipants');
      if (participants) participants.textContent = String(total);
      const mustShow = pollEnded() || myChoice || showResults;
      if (!mustShow) { $('#versionPollResult').hidden = true; return; }
      const resultChoices = $('#versionPollResultChoices');
      if (resultChoices) {
        resultChoices.innerHTML = CURRENT_POLL.choices.map(c => {
          const n = counts[c.id] || 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          return `<div class="version-poll-result-item"><div class="version-poll-result-row"><span>${c.label}</span><strong>${pct}%</strong></div><div class="version-poll-result-mini-bar"><i style="width:${pct}%"></i></div></div>`;
        }).join('');
      }
      $('#versionPollTotal').textContent = String(total);
      $('#versionPollResult').hidden = false;
      if (note) note.textContent = pollEnded() ? '投票は締め切りました。最新の最終結果です。' : (myChoice ? '投票ありがとうございます。締切までは投票先を変更できます。' : '');
    } catch (error) {
      console.warn('Version poll:', error);
      if (note) note.textContent = '投票結果を読み込めませんでした。時間をおいてお試しください。';
    }
  }

  async function vote(choice) {
    if (busy || pollEnded() || !pollStarted() || !CURRENT_POLL.choices.some(c => c.id === choice)) return;
    const note = $('#versionPollNote');
    busy = true;
    document.querySelectorAll('#versionPollCard .version-poll-choice').forEach(b => b.disabled = true);
    try {
      const fb = await waitFirebase();
      if (!memberExists()) { if (note) note.textContent = '投票は「うにメン」登録後に参加できます。'; return; }
      await setDoc(doc(fb.db, 'polls', CURRENT_POLL.id, 'votes', fb.uid), { uid: fb.uid, choice, updatedAt: serverTimestamp() }, { merge: true });
      changeMode = false;
      setChoiceState(choice);
      await loadState(true);
    } catch (error) {
      console.warn('Version poll vote:', error);
      if (note) note.textContent = error?.code === 'permission-denied' ? '投票権限を確認できませんでした。Firestore Rulesを更新してください。' : '投票に失敗しました。もう一度お試しください。';
    } finally {
      busy = false;
      if (!pollEnded()) setChoiceState(currentChoice);
    }
  }

  function toggleChange() {
    if (busy || pollEnded() || !currentChoice) return;
    changeMode = !changeMode;
    setChoiceState(currentChoice);
    const note = $('#versionPollNote');
    if (note) note.textContent = changeMode ? '変更したい方の「こちらに変更」を押してください。' : '締切までは投票先を変更・取り消しできます。';
  }

  async function cancelVote() {
    if (busy || pollEnded() || !currentChoice) return;
    if (!window.confirm('投票を取り消しますか？')) return;
    const note = $('#versionPollNote');
    busy = true;
    document.querySelectorAll('#versionPollCard .version-poll-choice').forEach(b => b.disabled = true);
    try {
      const fb = await waitFirebase();
      await deleteDoc(doc(fb.db, 'polls', CURRENT_POLL.id, 'votes', fb.uid));
      currentChoice = '';
      changeMode = false;
      setChoiceState('');
      await loadState(true);
      if (note) note.textContent = '投票を取り消しました。もう一度投票できます。';
    } catch (error) {
      console.warn('Version poll cancel:', error);
      if (note) note.textContent = '投票の取り消しに失敗しました。もう一度お試しください。';
    } finally {
      busy = false;
      if (!pollEnded()) setChoiceState(currentChoice);
    }
  }

  function listen(btn) {
    const src = btn.dataset.audio;
    if (playingAudio) { playingAudio.pause(); playingAudio.currentTime = 0; if (playingButton) { playingButton.classList.remove('is-playing'); playingButton.textContent = '▶ 試聴'; } }
    if (playingButton === btn) { btn.textContent = '▶ 試聴'; playingAudio = null; playingButton = null; return; }
    const audio = new Audio(src);
    playingAudio = audio; playingButton = btn; btn.classList.add('is-playing'); btn.textContent = '■ 停止';
    audio.play().catch(() => { btn.classList.remove('is-playing'); btn.textContent = '▶ 試聴'; $('#versionPollNote').textContent = '音源ファイルをアップロードすると試聴できます。'; playingAudio = null; playingButton = null; });
    audio.addEventListener('ended', () => { btn.classList.remove('is-playing'); btn.textContent = '▶ 試聴'; playingAudio = null; playingButton = null; }, { once: true });
  }

  async function openHistory() {
    let modal = $('#versionPollHistoryModal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'versionPollHistoryModal'; modal.className = 'version-poll-history-modal';
      modal.innerHTML = `<div class="version-poll-history-backdrop"></div><section><button type="button" class="version-poll-history-close">← 戻る</button><small>UNIMEN VOTE ARCHIVE</small><h2>過去の投票結果</h2><div id="versionPollHistoryBody"><p class="version-poll-history-empty">読み込み中…</p></div></section>`;
      document.body.append(modal);
      modal.querySelector('.version-poll-history-close').onclick = () => modal.classList.remove('is-open');
      modal.querySelector('.version-poll-history-backdrop').onclick = () => modal.classList.remove('is-open');
    }
    modal.classList.add('is-open');
    const body = $('#versionPollHistoryBody');
    if (!PAST_POLLS.length) { body.innerHTML = '<p class="version-poll-history-empty">まだ過去の投票結果はありません。<br>今回の次の投票が始まると、ここに保存されます。</p>'; return; }
    body.innerHTML = '';
    for (const p of PAST_POLLS) {
      try {
        const counts = await countsFor(p.id); const total = Object.values(counts).reduce((a,b)=>a+b,0);
        const winner = p.choices.slice().sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0))[0];
        const item = document.createElement('article'); item.className = 'version-poll-history-item';
        item.innerHTML = `<small>${p.closedLabel || ''}</small><h3>${p.song}</h3><p>${p.title}</p>${p.choices.map(c=>{const n=counts[c.id]||0;const pct=total?Math.round(n/total*100):0;return `<div><span>${c.label}</span><b>${pct}%</b></div>`}).join('')}<em>${total}人が投票${winner ? ` ／ 1位 ${winner.label}` : ''}</em>`;
        body.append(item);
      } catch (_) {}
    }
  }

  function mount() {
    if ($('#versionPollCard')) return true;
    const root = $('#phase1241Renewal');
    const artist = root?.querySelector('.artist-renewal-zone');
    if (!root || !artist) return false;
    const card = makeCard();
    // 旧「アップデートお知らせ」枠があったトップ先頭位置に直接設置。
    root.insertBefore(card, artist);
    card.querySelectorAll('.version-poll-choice').forEach(btn => btn.addEventListener('click', () => vote(btn.dataset.choice)));
    card.querySelectorAll('.version-poll-listen').forEach(btn => btn.addEventListener('click', () => listen(btn)));
    $('#versionPollChange').addEventListener('click', toggleChange);
    $('#versionPollCancel').addEventListener('click', cancelVote);
    $('#versionPollHistory').addEventListener('click', openHistory);
    loadState(false);
    return true;
  }
  function start() { if (mount()) return; let tries = 0; const timer = setInterval(() => { tries += 1; if (mount() || tries > 50) clearInterval(timer); }, 120); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
