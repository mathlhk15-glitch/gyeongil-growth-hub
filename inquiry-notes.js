/* INQUIRY NOTES VERSION 1.2 (schemaVersion 1)
 * 경일 진로·탐구 성장 시스템 — 공통 탐구노트 저장소
 * 원본: gyeongil-growth-hub/inquiry-notes.js · 복사본: 세 저장소 루트
 * 네 사이트가 같은 github.io 주소(origin)를 쓰므로 같은 브라우저 저장 공간을 공유합니다.
 * 이름·학번·연락처는 저장하지 않습니다.
 */
(function () {
  'use strict';
  var KEY = 'kyungil.inquiryNotes.v1';
  var ACTIVE_KEY = 'kyungil.activeNote';
  var MODE_KEY = 'careerLabStorageModeV1'; // 진로 실험실의 개인/공용 기기 설정을 그대로 따릅니다.
  var SCHEMA = 1;
  var LAB_KEYS = { bridge: 'careerLabBridgeV2', keyword: 'careerLabKeywordV1', inquiry: 'careerLabInquiryV1', roadmap: 'careerLabRoadmapV1' };
  var LAB_ACTIONS = { research: '조사하기', compare: '비교하기', analyze: '분석하기', organize: '정리하기', design: '설계하기', make: '만들기', explain: '설명하기', express: '표현하기', persuade: '설득하기', help: '돕기', coordinate: '조정하기', revise: '수정하기' };
  var LAB_TARGETS = { people: '사람', language: '글과 언어', data: '숫자와 데이터', machine: '기계와 사물', nature: '자연과 생명', society: '사회문제', content: '이미지와 콘텐츠', ideas: '아이디어와 지식' };

  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }
  function mode() {
    return safe(function () { return sessionStorage.getItem(MODE_KEY) || localStorage.getItem(MODE_KEY) || 'private'; }, 'private');
  }
  function setMode(m) {
    safe(function () {
      sessionStorage.setItem(MODE_KEY, m);
      if (m === 'private') localStorage.setItem(MODE_KEY, m); else localStorage.removeItem(MODE_KEY);
    });
  }
  function box() { return mode() === 'public' ? window.sessionStorage : window.localStorage; }
  function now() { return new Date().toISOString(); }
  function uid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function blank() {
    return {
      id: '', schemaVersion: SCHEMA, createdAt: '', updatedAt: '', rev: 0, stage: 'start', origin: 'hub',
      title: '', start: { from: '', text: '' }, interest: '', field: '', subject: '', concept: '', topic: '', grade: '',
      question: '', questionLevel: 0, questionType: '', method: '', methodWhy: '',
      evidence: [], role: '', problem: '', revision: '', result: '', outputs: [], limits: '',
      scope: { sample: false, causal: false },
      change: { before: '', evidence: '', after: '' },
      next: '', ai: { used: false, help: [], helpText: '', decision: '' },
      links: { explore: '', exploreUrl: '', lab: false, guide: false }
    };
  }
  function blankEvidence() { return { title: '', who: '', when: '', target: '', how: '', differs: '' }; }

  function isBlank(n) {
    n = normalize(n || {});
    return !([n.title, n.start.text, n.interest, n.field, n.subject, n.concept, n.topic, n.question, n.methodWhy,
      n.role, n.problem, n.revision, n.result, n.limits, n.change.before, n.change.evidence, n.change.after, n.next,
      n.ai.helpText, n.ai.decision].some(function (v) { return String(v || '').trim(); }) ||
      n.questionLevel || n.questionType || n.method || n.evidence.length || n.outputs.length || n.ai.used);
  }

  /* 빠진 칸을 채우고 옛 형식을 현재 형식으로 바꿉니다(schemaVersion 이동 지점). */
  function normalize(n) {
    var b = blank(), out = {};
    n = n || {};
    Object.keys(b).forEach(function (k) {
      var v = n[k], d = b[k];
      if (Array.isArray(d)) out[k] = Array.isArray(v) ? v.slice() : [];
      else if (d && typeof d === 'object') { out[k] = {}; Object.keys(d).forEach(function (s) { out[k][s] = (v && v[s] != null) ? v[s] : d[s]; }); }
      else out[k] = (v == null) ? d : v;
    });
    out.evidence = out.evidence.map(function (e) { var x = blankEvidence(); Object.keys(x).forEach(function (k) { if (e && e[k] != null) x[k] = String(e[k]); }); return x; });
    out.questionLevel = Number(out.questionLevel) || 0;
    out.rev = Number(out.rev) || 0;
    out.schemaVersion = SCHEMA;
    return out;
  }

  function read() {
    var raw = safe(function () { return box().getItem(KEY); }, null);
    var data = safe(function () { return JSON.parse(raw || 'null'); }, null);
    if (!data || !Array.isArray(data.notes)) data = { schemaVersion: SCHEMA, notes: [], meta: {} };
    data.meta = data.meta || {};
    data.notes = data.notes.map(normalize);
    return data;
  }
  function write(data) {
    data.schemaVersion = SCHEMA;
    var ok = safe(function () { box().setItem(KEY, JSON.stringify(data)); return true; }, false);
    safe(function () { window.dispatchEvent(new CustomEvent('kyungil-notes-change')); });
    return ok;
  }

  function list() {
    return read().notes.sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
  }
  function get(id) { return read().notes.filter(function (n) { return n.id === id; })[0] || null; }
  function findBy(fn) { return read().notes.filter(fn)[0] || null; }

  function create(patch, origin) {
    var data = read();
    var n = normalize(patch || {});
    n.id = uid(); n.createdAt = n.updatedAt = now(); n.rev = 1; n.origin = origin || n.origin || 'hub';
    data.notes.push(n);
    write(data);
    return n;
  }

  /* 편집 화면용 저장: 불러온 뒤 다른 화면에서 고쳐졌으면 덮어쓰지 않고 알려 줍니다. */
  function save(note, expectRev) {
    var data = read();
    var i = -1;
    data.notes.forEach(function (n, k) { if (n.id === note.id) i = k; });
    var fresh = i > -1 ? data.notes[i] : null;
    if (fresh && expectRev != null && fresh.rev !== expectRev) return { conflict: true, latest: fresh };
    var n = normalize(note);
    n.rev = (fresh ? fresh.rev : 0) + 1;
    n.updatedAt = now();
    if (!n.createdAt) n.createdAt = n.updatedAt;
    if (i > -1) data.notes[i] = n; else data.notes.push(n);
    return write(data) ? { ok: true, note: n } : { ok: false };
  }

  /* 다른 사이트에서 보내는 내용: 빈 값은 기존 내용을 지우지 않습니다. 근거는 제목이 겹치지 않게 더합니다. */
  function merge(id, patch) {
    var data = read(), i = -1;
    data.notes.forEach(function (n, k) { if (n.id === id) i = k; });
    if (i < 0) return null;
    var n = data.notes[i];
    Object.keys(patch || {}).forEach(function (k) {
      var v = patch[k];
      if (k === 'evidence' && Array.isArray(v)) {
        v.forEach(function (e) { if (e && e.title && !n.evidence.some(function (x) { return x.title === e.title; })) { var x = blankEvidence(); Object.keys(x).forEach(function (f) { if (e[f]) x[f] = e[f]; }); n.evidence.push(x); } });
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        n[k] = n[k] || {};
        Object.keys(v).forEach(function (s) { if (v[s] !== '' && v[s] != null && v[s] !== false) n[k][s] = v[s]; });
      } else if (Array.isArray(v)) { if (v.length) n[k] = v.slice(); }
      else if (v !== '' && v != null && v !== 0) n[k] = v;
    });
    n.rev += 1; n.updatedAt = now();
    data.notes[i] = normalize(n);
    write(data);
    return data.notes[i];
  }

  function remove(id) {
    var data = read();
    data.notes = data.notes.filter(function (n) { return n.id !== id; });
    write(data);
    if (getActive() === id) setActive('');
  }

  function setActive(id) { safe(function () { if (id) sessionStorage.setItem(ACTIVE_KEY, id); else sessionStorage.removeItem(ACTIVE_KEY); }); }
  function getActive() {
    var id = safe(function () { return sessionStorage.getItem(ACTIVE_KEY); }, '');
    return id && get(id) ? id : '';
  }

  function title(n) {
    if (!n) return '';
    return n.title || n.topic || (n.question ? n.question.slice(0, 34) + (n.question.length > 34 ? '…' : '') : '') || '제목 없는 탐구';
  }
  function stageLabel(id) { var s = (window.KIS ? window.KIS.STAGES : []).filter(function (x) { return x.id === id; })[0]; return s ? s.label : ''; }
  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso); if (isNaN(d)) return '';
    var p = function (x) { return String(x).padStart(2, '0'); };
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* 진로 실험실 저장 자료 읽기 */
  function labRead(key) {
    var stores = mode() === 'public' ? [sessionStorage] : [localStorage, sessionStorage];
    for (var i = 0; i < stores.length; i++) {
      var v = safe(function () { return JSON.parse(stores[i].getItem(key) || 'null'); }, null);
      if (v) return v;
    }
    return null;
  }
  function labBridge() {
    var b = labRead(LAB_KEYS.bridge) || {}, k = labRead(LAB_KEYS.keyword) || {}, q = labRead(LAB_KEYS.inquiry) || {};
    var actions = (b.approvedActions || []).map(function (a) { return LAB_ACTIONS[a] || a; });
    var targets = (b.targets || []).map(function (a) { return LAB_TARGETS[a] || a; });
    var has = !!(b.jobGroup || actions.length || k.question || q.question);
    return { has: has, job: b.jobGroup || '', actions: actions, targets: targets, experiment: b.experiment || '', seed: b.questionSeed || '',
      courses: b.selectedCourses || [], topic: k.topic || '', question: q.question || k.question || '', inquiry: q };
  }
  function interestText(lab) {
    var parts = [];
    if (lab.job) parts.push(lab.job);
    if (lab.targets.length) parts.push(lab.targets.join('·'));
    if (lab.actions.length) parts.push(lab.actions.slice(0, 3).join('·') + ' 행동');
    return parts.join(' / ');
  }

  /* 진로 실험실에만 있던 자료를 탐구노트 하나로 옮깁니다(한 번만). */
  function migrate() {
    var data = read();
    if (data.meta.migratedCareerLab) return null;
    var lab = labBridge();
    data.meta.migratedCareerLab = true;
    write(data);
    if (!(lab.question || lab.seed)) return null;
    var q = lab.inquiry || {};
    var methodMap = window.KIS ? window.KIS.MAP.fromLab : {};
    return create({
      start: { from: 'career', text: lab.experiment ? '진로 미니 실험: ' + lab.experiment : '' },
      interest: interestText(lab), topic: lab.topic,
      question: lab.question || lab.seed,
      method: methodMap[q.method] || '',
      evidence: q.sources ? [{ title: q.sources }] : [],
      role: q.roles || '', limits: q.limits || '',
      stage: q.question ? 'doing' : 'start',
      links: { lab: true }
    }, 'careerLab');
  }

  function exportText() { return JSON.stringify({ app: 'kyungil-inquiry-notes', schemaVersion: SCHEMA, exportedAt: now(), notes: list() }, null, 2); }
  function download() {
    var blob = new Blob([exportText()], { type: 'application/json' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    var d = new Date(), p = function (x) { return String(x).padStart(2, '0'); };
    a.href = url; a.download = '내탐구노트_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }
  function importText(text) {
    var parsed = safe(function () { return JSON.parse(text); }, null);
    if (!parsed || parsed.app !== 'kyungil-inquiry-notes' || !Array.isArray(parsed.notes)) return { error: '내 탐구노트 파일이 아니에요. “내 탐구노트 저장하기”로 만든 파일을 골라 주세요.' };
    if (Number(parsed.schemaVersion || 0) > SCHEMA) return { error: '더 새 버전에서 만든 탐구노트예요. 사이트를 최신 버전으로 연 뒤 다시 불러와 주세요.' };
    var incoming = parsed.notes;
    var data = read(), added = 0, updated = 0, kept = 0;
    incoming.forEach(function (raw) {
      if (!raw || !raw.id) return;
      var n = normalize(raw), i = -1;
      data.notes.forEach(function (x, k) { if (x.id === n.id) i = k; });
      if (i < 0) { data.notes.push(n); added++; }
      else if ((n.updatedAt || '') > (data.notes[i].updatedAt || '')) { n.rev = data.notes[i].rev + 1; data.notes[i] = n; updated++; }
      else kept++;
    });
    write(data);
    return { added: added, updated: updated, kept: kept };
  }

  function clearAll() {
    /* 공통 노트를 비워도 예전 Career Lab 자료를 다시 자동 이관하지 않도록 이관 완료 표시는 남깁니다. */
    var empty = JSON.stringify({ schemaVersion: SCHEMA, notes: [], meta: { migratedCareerLab: true } });
    safe(function () { localStorage.setItem(KEY, empty); sessionStorage.setItem(KEY, empty); sessionStorage.removeItem(ACTIVE_KEY); });
    safe(function () { window.dispatchEvent(new CustomEvent('kyungil-notes-change')); });
    return true;
  }

  function onChange(cb) {
    window.addEventListener('storage', function (e) { if (e.key === KEY) cb('other'); });
    window.addEventListener('kyungil-notes-change', function () { cb('self'); });
  }

  function summary(n) {
    var K = window.KIS || {};
    var lv = n.questionLevel && K.LEVELS ? K.LEVELS[n.questionLevel - 1] : null;
    var qt = (K.QUESTION_TYPES || []).filter(function (x) { return x.id === n.questionType; })[0];
    var m = K.METHODS && K.METHODS[n.method];
    var from = (K.START_FROM || []).filter(function (x) { return x.id === n.start.from; })[0];
    var L = [];
    L.push('[탐구활동 자기평가서] ' + title(n));
    L.push('');
    L.push('1. 활동을 시작한 이유');
    L.push([from ? from.label : '', n.start.text, n.interest ? '관심 분야: ' + n.interest : ''].filter(Boolean).join(' — '));
    L.push('');
    L.push('2. 수업·교과와의 연결');
    L.push([n.subject, n.concept].filter(Boolean).join(' / ') || '(해당하면 작성)');
    L.push('');
    L.push('3. 내가 확인하려고 한 질문');
    L.push(n.question || '(아직 작성하지 않음)');
    if (lv) L.push('질문 수준: ' + lv.n + '단계 ' + lv.name);
    L.push('');
    L.push('4. 내가 사용한 방법과 근거');
    L.push([qt ? qt.ask : '', m ? m.name : '', n.methodWhy].filter(Boolean).join(' · ') || '(아직 작성하지 않음)');
    if (n.evidence.length) n.evidence.forEach(function (e, i) { if (e.title) L.push('근거 ' + (i + 1) + ': ' + e.title); });
    else L.push('근거: (아직 작성하지 않음)');
    L.push('');
    L.push('5. 내가 직접 한 일');
    L.push(n.role || '(아직 작성하지 않음)');
    L.push('');
    L.push('6. 예상과 달랐던 점과 수정');
    L.push('예상과 달랐던 점: ' + (n.problem || '없거나 아직 작성하지 않음'));
    L.push('수정·보완한 점: ' + (n.revision || '없거나 아직 작성하지 않음'));
    L.push('');
    L.push('7. 결과와 결과물');
    L.push([n.result, n.outputs.join(', ')].filter(Boolean).join(' / ') || '(아직 작성하지 않음)');
    if (n.limits) L.push('한계: ' + n.limits);
    L.push('');
    L.push('8. 내 생각의 변화');
    L.push('처음 생각: ' + (n.change.before || '(아직 작성하지 않음)'));
    L.push('확인한 근거: ' + (n.change.evidence || '(아직 작성하지 않음)'));
    L.push('지금 생각: ' + (n.change.after || '(아직 작성하지 않음)'));
    L.push('');
    L.push('9. 다음에 이어갈 질문');
    L.push(n.next || '(아직 작성하지 않음)');
    if (n.ai.used) {
      L.push(''); L.push('10. AI 도움 사용');
      L.push('AI가 도와준 것: ' + [n.ai.help.join(', '), n.ai.helpText].filter(Boolean).join(' / '));
      L.push('내가 직접 판단·검증·수정한 것: ' + (n.ai.decision || '(작성 필요)'));
    }
    L.push('');
    L.push('※ ' + (K.SUMMARY_NOTICE || ''));
    return L.join('\n');
  }

  window.KNotes = {
    SCHEMA: SCHEMA, KEY: KEY, mode: mode, setMode: setMode, list: list, get: get, findBy: findBy, create: create, save: save,
    merge: merge, remove: remove, setActive: setActive, getActive: getActive, title: title, stageLabel: stageLabel, when: when,
    labBridge: labBridge, interestText: interestText, migrate: migrate, exportText: exportText, download: download,
    importText: importText, clearAll: clearAll, isBlank: isBlank, onChange: onChange, summary: summary, blank: blank, blankEvidence: blankEvidence, normalize: normalize
  };
})();
