/* 내 탐구노트 편집 화면 v1.2 — gyeongil-growth-hub */
(function () {
  'use strict';
  var K = window.KIS, N = window.KNotes, esc = K.esc, S = K.SITES;
  var ed = document.getElementById('editor');
  var st = { note: null, rev: null, tab: 'start', timer: null, conflict: null, delArmed: false, wantedTab: '' };

  K.mountNav('notes');
  N.migrate();

  /* ---------- 경로 도우미 ---------- */
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(); var t = ks.reduce(function (a, k) { return a[k]; }, o); t[last] = v; }

  /* ---------- 목록 ---------- */
  function renderList() {
    var list = N.list(), cur = st.note && st.note.id;
    document.getElementById('nlist').innerHTML = list.length ? list.map(function (n) {
      return '<li><button type="button" data-open="' + esc(n.id) + '" aria-current="' + (n.id === cur) + '"><span class="t">' + esc(N.title(n)) + '</span>' +
        '<span class="m"><span class="chip ' + n.stage + '">' + esc(N.stageLabel(n.stage)) + '</span>' + esc(N.when(n.updatedAt)) + '</span></button></li>';
    }).join('') : '<li class="small muted">아직 탐구노트가 없어요.</li>';
  }
  document.getElementById('nlist').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]'); if (!b) return;
    flush(); open(b.getAttribute('data-open'));
  });

  /* ---------- 열기 ---------- */
  function open(id) {
    var n = N.get(id);
    if (!n) { renderEmpty(); return; }
    st.note = n; st.rev = n.rev; st.conflict = null; st.delArmed = false;
    st.tab = st.wantedTab || (n.stage === 'start' ? 'start' : n.stage === 'doing' ? 'doing' : 'done'); st.wantedTab = '';
    N.setActive(n.id);
    if (location.hash.slice(1) !== n.id) history.replaceState(null, '', 'notes.html#' + encodeURIComponent(n.id));
    renderList(); renderEditor();
  }
  function renderEmpty() {
    st.note = null;
    renderList();
    ed.innerHTML = '<div class="empty"><h2>탐구 하나에 노트 하나</h2><p class="muted">질문, 방법, 근거, 수정, 생각의 변화를 한곳에 모아요. 진로 실험실과 탐구 길잡이에서 담은 내용도 여기로 와요.</p><a class="btn" href="?new=1">새 탐구노트 만들기</a></div>';
  }

  /* ---------- 저장 ---------- */
  function setStatus(t) { var s = document.getElementById('status'); if (s) s.textContent = t; }
  function schedule() { clearTimeout(st.timer); setStatus('저장 중…'); st.timer = setTimeout(saveNow, 500); }
  function flush() { if (st.timer) { clearTimeout(st.timer); st.timer = null; saveNow(); } }
  function saveNow(force) {
    st.timer = null;
    if (!st.note) return;
    var r = N.save(st.note, force ? null : st.rev);
    if (r.conflict) { st.conflict = r.latest; renderConflict(); setStatus('저장하지 않았어요: 다른 화면에서 고친 내용이 있어요'); return; }
    if (!r.ok) { setStatus('저장하지 못했어요. 브라우저 저장 공간이 꽉 찼거나 막혀 있어요. "내 탐구노트 저장하기"로 파일을 만들어 두세요.'); return; }
    st.note = r.note; st.rev = r.note.rev; st.conflict = null;
    var c = document.getElementById('conflict'); if (c) c.hidden = true;
    setStatus('저장됨 · ' + N.when(r.note.updatedAt));
    renderList();
  }
  function renderConflict() {
    var c = document.getElementById('conflict'); if (!c) return;
    c.hidden = false;
    c.innerHTML = '<b>다른 화면에서 이 탐구가 수정되었어요.</b><p class="small">다른 탭이나 다른 사이트(진로 실험실·탐구 길잡이·도움서)에서 이 노트를 고쳤어요. 어느 쪽을 남길지 골라 주세요.</p>' +
      '<div class="row"><button class="btn" type="button" data-act="takeLatest">최신 내용 불러오기</button><button class="btn quiet" type="button" data-act="keepMine">지금 화면 내용으로 저장</button></div>';
  }
  N.onChange(function (who) {
    if (who !== 'other') return;
    renderList();
    if (!st.note) return;
    var latest = N.get(st.note.id);
    if (!latest) { renderEmpty(); return; }
    if (latest.rev === st.rev) return;
    var editing = ed.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (st.timer || editing) { st.conflict = latest; renderConflict(); }
    else { st.note = latest; st.rev = latest.rev; renderEditor(); setStatus('다른 화면에서 고친 최신 내용을 불러왔어요'); }
  });
  window.addEventListener('pagehide', flush);

  /* ---------- 편집 화면 ---------- */
  function field(path, label, hint, multi, ph) {
    var v = getPath(st.note, path) || '';
    var id = 'f-' + path.replace(/\./g, '-');
    return '<div class="f"><label for="' + id + '">' + label + (hint ? ' <span class="hint">' + hint + '</span>' : '') + '</label>' +
      (multi ? '<textarea id="' + id + '" data-f="' + path + '" placeholder="' + esc(ph || '') + '">' + esc(v) + '</textarea>'
             : '<input type="text" id="' + id + '" data-f="' + path + '" value="' + esc(v) + '" placeholder="' + esc(ph || '') + '">') + '</div>';
  }
  function choices(act, items, cur, multi) {
    return '<div class="choices">' + items.map(function (it) {
      var on = multi ? cur.indexOf(it.id) > -1 : cur === it.id;
      return '<button type="button" data-act="' + act + '" data-v="' + esc(it.id) + '" aria-pressed="' + on + '">' + it.html + '</button>';
    }).join('') + '</div>';
  }
  function helpLinks(ids) {
    return '<p class="links">' + ids.map(function (id) {
      var h = K.HELP.filter(function (x) { return x.id === id; })[0];
      return '<a href="' + S.guide + '?note=' + encodeURIComponent(st.note.id) + '#' + id + '">🛟 ' + esc(h ? h.label : id) + '</a>';
    }).join('') + '</p>';
  }

  function questionCoach(n) {
    var q = String(n.question || '').trim(), tips = [];
    if (!q) return '<div class="notice"><b>💡 탐구 코치</b><p class="small">질문을 한 문장 적으면 바로 다음 행동을 안내해 드려요.</p></div>';
    if (q.length < 10) tips.push('질문을 조금만 더 구체적으로 써 보세요. 대상과 비교 기준을 하나 넣으면 좋아요.');
    if (/무엇인가|뜻은|장점은|종류는/.test(q)) tips.push('검색으로 바로 끝날 수 있어요. “왜?”, “어떻게?”, “무엇과 어떻게 다른가?” 중 하나로 한 단계 깊게 바꿔 보세요.');
    if (/바람직한가|옳은가|좋은가|나쁜가/.test(q)) tips.push('좋다·나쁘다보다 확인 가능한 질문이 좋아요. “어떻게 달라지는가?” 또는 “왜 차이가 나는가?”처럼 바꿔 보세요.');
    if (/청소년|사람들|모든 학생|학생들은/.test(q)) tips.push('범위가 너무 넓을 수 있어요. “우리 반”, “우리 학교 2학년”, “이번에 조사한 대상”처럼 실제 확인 가능한 범위로 좁혀 보세요.');
    var chk = K.methodCheck(n.questionType, n.method); if (chk && chk.level === 'warn') tips.push(chk.text);
    if (!tips.length && n.questionType && n.method) tips.push('선택한 질문 유형과 방법에는 큰 충돌이 없어요. 이제 실제 근거를 하나 남겨 확인해 보세요.');
    if (!tips.length) tips.push('좋아요. “무엇을 직접 확인할지” 방법 하나를 고르면 탐구가 시작됩니다.');
    return '<div class="notice"><b>💡 탐구 코치</b><p class="small">' + esc(tips[0]) + '</p></div>';
  }

  function coachingReport(n) {
    var good=[], improve=[];
    var ev = (n.evidence || []).filter(function(e){ return e && String(e.title || '').trim(); });
    var combined = [n.result, n.role, n.change && n.change.evidence, n.change && n.change.after].join(' ');
    var hasNum = /\d/.test(combined);
    var repeated = /(3회|세 번|반복|평균|여러 번|2회|두 번)/.test(combined);
    var method = n.method || '';

    /* 학생 내용에 직접 반응하는 칭찬을 먼저 보여 줍니다. */
    if (hasNum) good.push('개수·시간·수치처럼 확인 가능한 내용을 사용해서 차이를 더 분명하게 보여 줬어요.');
    if (repeated) good.push('한 번만 보지 않고 여러 번 확인하거나 평균을 내어 우연의 영향을 줄이려 했어요.');
    if (n.revision) good.push('예상과 달랐을 때 그냥 넘기지 않고 방법이나 생각을 수정한 과정을 남겼어요.');
    if (ev.length) good.push('자료·관찰 기록을 근거로 남겼어요. 출처와 실제 확인 내용이 서로 맞는지 마지막으로 확인해 보세요.');
    if (n.role) good.push('내가 직접 한 행동을 따로 적어서 탐구 과정이 무엇이었는지 알 수 있어요.');
    if (n.change && n.change.after) good.push('활동 후의 판단을 자기 말로 정리했어요. 처음 생각과 근거가 잘 이어지는지 확인해 보세요.');
    if (n.question && n.method) good.push('탐구 질문과 확인 방법을 정했어요.');

    if (!ev.length) improve.push('자료 이름·관찰 시점·표·그래프 중 하나라도 실제 근거를 남겨 보세요.');
    if (!n.role) improve.push('“조사했다”보다 내가 직접 비교·계산·관찰·수정한 행동을 한 문장 적어 보세요.');
    if ((method === 'observe' || method === 'compare' || method === 'survey') && !hasNum) improve.push('“많았다·적었다”보다 개수·시간·비율처럼 확인 가능한 수치를 넣을 수 있는지 살펴보세요.');
    if (method === 'observe' && !repeated) improve.push('한두 번 관찰한 결과라면 다른 날이나 다른 시간에 한 번 더 확인하면 근거가 더 단단해져요.');
    if (method === 'literature' && ev.length && !/(20\d{2}|년|월|일|http|www\.|기사|보고서|통계|교과서)/i.test(ev.map(function(e){return e.title;}).join(' '))) improve.push('자료의 날짜·작성 기관·링크나 쪽수 중 하나를 더 적으면 나중에 다시 확인하기 쉬워요.');
    if (!(n.change && n.change.after)) improve.push('처음 예상과 비교해 지금 판단이 유지·수정·보류되었는지 근거와 함께 적어 보세요.');
    if (!n.next) improve.push('이번에 확인하지 못한 점을 다음 질문으로 한 가지 남겨 보세요.');

    var fallbackImprove = method === 'observe' ? '예상과 비슷한 결과가 나왔더라도 다른 날·시간·장소에서 한 번 더 확인하면 판단이 더 단단해져요.' : method === 'literature' ? '결론이 잘 정리됐다면 성격이 다른 자료 하나를 더 찾아 같은 결론이 나오는지 확인해 보세요.' : '결론이 잘 정리됐다면 비교 기준이나 조건 하나를 더해 같은 판단이 유지되는지 확인해 보세요.';
    if (n.limits && /판단을 확정하기 어려움/.test(n.limits)) fallbackImprove = '판단을 보류한 것은 괜찮아요. 무엇을 한 번 더 확인하면 판단할 수 있을지 다음 행동을 구체적으로 정해 보세요.';
    var next = improve[0] || fallbackImprove;
    var levelUp = method === 'observe' ? '다음에는 관찰 횟수나 조건을 하나 늘려 🌿 기본 탐구로 이어가 보세요.' : method === 'literature' ? '다음에는 서로 다른 성격의 자료를 하나 더 비교해 🌿 기본 탐구로 이어가 보세요.' : '다음에는 조건이나 비교 기준을 하나 더해 🌿 기본 탐구로 이어가 보세요.';
    return '<div class="card"><h3>🧭 탐구 코칭 리포트</h3><p class="small muted">점수나 합격 가능성을 매기는 것이 아니라, 입력한 내용에서 확인되는 부분만 보고 다음 행동을 제안합니다.</p>'+ 
      '<p><b>잘한 점</b></p><ul>'+ (good.length?good.slice(0,3):['탐구를 시작하고 끝까지 정리하려고 한 점이 좋습니다.']).map(function(x){return '<li>'+esc(x)+'</li>';}).join('') +'</ul>'+ 
      '<p><b>보완하면 좋은 점</b></p><ul>'+ (improve.length?improve.slice(0,2):[fallbackImprove]).map(function(x){return '<li>'+esc(x)+'</li>';}).join('') +'</ul>'+ 
      '<p><b>지금 할 일 1개</b><br>'+esc(next)+'</p><p><b>다음 단계</b><br>'+esc(levelUp)+'</p></div>';
  }

  function paneStart() {
    var n = st.note, from = K.START_FROM.filter(function (x) { return x.id === n.start.from; })[0];
    var lab = N.labBridge();
    var lv = n.questionLevel ? K.LEVELS[n.questionLevel - 1] : null;
    var qt = K.QUESTION_TYPES.filter(function (x) { return x.id === n.questionType; })[0];
    var common = ['compare', 'literature', 'survey', 'experiment'];
    var firstMethods = qt ? qt.methods.slice(0, 3) : common.slice();
    if (n.method && firstMethods.indexOf(n.method) < 0) firstMethods.unshift(n.method);
    firstMethods = firstMethods.filter(function (m, i, a) { return m && a.indexOf(m) === i; });
    var moreMethods = Object.keys(K.METHODS).filter(function (m) { return firstMethods.indexOf(m) < 0; });
    var chk = K.methodCheck(n.questionType, n.method);
    var news = '';
    if (n.start.from === 'news') news = S.oneQuestion ? '<a href="' + S.oneQuestion + '">📰 ONE QUESTION에서 뉴스 질문 고르기 →</a>' : '<p class="small muted">📰 ONE QUESTION 연결은 준비 중이에요.</p>';
    return '' +
      field('question', '탐구 질문', '가장 먼저 이것만 써도 됩니다.', true, '예: 전압 변화에 따라 모터의 회전속도는 어떻게 달라질까?') + '<div id="liveCoach">' + questionCoach(n) + '</div>' +
      '<div class="f"><span class="lab">무엇이 알고 싶나요?</span><p class="hint">하나를 고르면 질문에 어울리는 방법을 앞에 보여 줘요.</p>' +
        choices('qtype', K.QUESTION_TYPES.map(function (x) { return { id: x.id, html: esc(x.ask) }; }), n.questionType) + '</div>' +
      '<div class="f"><span class="lab">어떤 방법으로 확인할까요?</span>' +
        choices('method', firstMethods.map(function (m) { return { id: m, html: esc(K.METHODS[m].name) + (qt && qt.methods.indexOf(m) > -1 ? ' <span class="rec">추천</span>' : '') }; }), n.method) +
        (moreMethods.length ? '<details data-keep="more-methods"><summary>다른 방법 보기</summary><div style="margin-top:8px">' + choices('method', moreMethods.map(function (m) { return { id: m, html: esc(K.METHODS[m].name) }; }), n.method) + '</div></details>' : '') +
        (chk ? '<div class="notice ' + (chk.level === 'warn' ? 'warn' : chk.level === 'good' ? 'good' : '') + '">' + esc(chk.text) + '</div>' : '') + '</div>' +
      '<details data-keep="more-info"><summary><b>더 적기</b> · 질문 수준, 출발점, 과목, 주제 등을 남기고 싶다면</summary><div style="margin-top:12px;display:flex;flex-direction:column;gap:16px">' +
        '<div class="f"><span class="lab">질문 수준 <span class="hint">지금보다 한 단계만 깊게</span></span>' +
          '<div class="levels">' + K.LEVELS.map(function (L) {
            return '<button type="button" data-act="level" data-v="' + L.n + '" aria-pressed="' + (n.questionLevel === L.n) + '"><b>' + L.n + '단계 ' + esc(L.name) + '</b><span class="small">' + esc(L.ask) + '</span></button>';
          }).join('') + '</div>' +
          (lv ? '<div class="notice"><b>' + esc(lv.sign) + '</b><br>한 단계 깊게: ' + esc(lv.up) + '</div>' : '') + '</div>' +
        '<div class="f"><span class="lab">탐구는 어디서 시작됐나요?</span>' + choices('from', K.START_FROM.map(function (x) { return { id: x.id, html: x.icon + ' ' + esc(x.label) }; }), n.start.from) + (from ? '<p class="hint">' + esc(from.hint) + '</p>' : '') + news + '</div>' +
        field('start.text', '출발점', '', true, '예: 물리학 시간에 배운 전기에너지와 전력') +
        '<div class="two">' + field('subject', '과목', '', false, '예: 물리학') + field('concept', '교과 개념', '', false, '예: 전력 = 전압 × 전류') + '</div>' +
        '<p class="links"><a href="' + S.explore + 'index.html">🧭 관심 분야에 맞는 과목·주제 찾기</a></p>' +
        '<div class="f">' + field('interest', '관심 분야', '', false, '예: 기계공학, 에너지 효율').replace(/^<div class="f">|<\/div>$/g, '') +
          (lab.has ? '<div class="row"><button class="btn quiet" type="button" data-act="labImport">진로 실험실 결과 가져오기</button></div>' : '') + '</div>' +
        field('topic', '주제', '', false, '예: DC 모터의 효율') +
        field('methodWhy', '이 방법을 고른 이유', '', false, '예: 조건을 하나만 바꿔 직접 측정할 수 있어서') +
        helpLinks(['question', 'survey', 'causation']) +
      '</div></details>';
  }

  function paneDoing() {
    var n = st.note;
    var evs = n.evidence.map(function (e, i) {
      return '<div class="evi"><div class="row" style="justify-content:space-between"><b>근거 ' + (i + 1) + '</b><button class="btn quiet" type="button" data-act="delEv" data-v="' + i + '">이 근거 지우기</button></div>' +
        '<label>자료 이름·주소<input type="text" data-ev="' + i + '.title" value="' + esc(e.title) + '" placeholder="예: 한국전력 전력통계, 직접 측정한 전압·회전수 표"></label>' +
        '<details data-keep="evidence-' + i + '"><summary>이 자료 점검하기</summary><div class="grid" style="margin-top:8px">' + K.EVIDENCE_CHECKS.map(function (c) {
          return '<label>' + esc(c.q) + '<input type="text" data-ev="' + i + '.' + c.id + '" value="' + esc(e[c.id]) + '" placeholder="' + esc(c.hint) + '"></label>';
        }).join('') + '</div></details></div>';
    }).join('');
    return '' +
      '<div class="f"><span class="lab">근거 <span class="hint">무엇을 보고 그렇게 생각했나요? 자료마다 다섯 가지를 확인해요.</span></span>' +
        (evs || '<p class="muted small">아직 근거가 없어요.</p>') +
        '<div class="row"><button class="btn quiet" type="button" data-act="addEv">근거 추가</button></div>' +
        '<details class="ai"><summary>어디서부터 찾아볼까요?</summary><ul>' + K.SOURCE_START.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul><p class="small muted">' + esc(K.SOURCE_NOTE) + '</p></details></div>' +
      field('role', '내가 직접 한 일', '맡은 일, 내가 제안하거나 바꾼 것, 받아들인 친구 의견, 의견 차이를 푼 방법', true, '예: 측정 조건표를 만들고 전압별 회전수를 3번씩 측정함') +
      helpLinks(['evidence', 'collaboration', 'survey']);
  }

  function paneDone() {
    var n = st.note;
    var aiHelp = K.AI.help.map(function (h) { return { id: h, html: esc(h) }; });
    return '' +
      '<div class="f"><span class="lab">예상과 다른 점, 그리고 수정</span><div class="chain">' + K.REVISION_CHAIN.map(function (c) { return '<span' + (c === '수정' ? ' class="hl"' : '') + '>' + esc(c) + '</span>'; }).join('') + '</div></div>' +
      field('problem', '예상과 달랐던 점', '', true, '예: 모터 온도가 올라갈수록 같은 전압에서도 회전수가 달라짐') +
      field('revision', '무엇을 바꿨나요?', K.REVISION_ASK, true, '예: 측정 사이 냉각 시간을 2분으로 통일하고 다시 측정함') +
      field('result', '결과', '무엇을 알아냈거나 만들었나요?', true) +
      '<div class="f"><span class="lab">결과물 <span class="hint">다른 사람이 확인할 수 있는 형태</span></span>' +
        choices('output', K.OUTPUTS.map(function (o) { return { id: o, html: esc(o) }; }), n.outputs, true) + '</div>' +
      field('limits', '한계', '이번 탐구로는 말할 수 없는 것', false) +
      '<div class="f"><span class="lab">결론을 너무 크게 말하지 않았나요?</span><div class="scope">' + K.CONCLUSION.map(function (c) {
        return '<div class="card"><b>' + esc(c.title) + '</b><p class="bad">' + esc(c.bad) + '</p><p class="good">' + esc(c.good) + '</p>' +
          '<label class="check"><input type="checkbox" data-f="scope.' + c.id + '"' + (n.scope[c.id] ? ' checked' : '') + '> 내 결론을 이렇게 점검했어요</label></div>';
      }).join('') + '</div></div>' +
      '<div class="f"><span class="lab">판단의 변화 <span class="hint">' + esc(K.REFLECTION.note) + '</span></span><div class="frame">' +
        '<span>처음에는</span><input type="text" data-f="change.before" value="' + esc(n.change.before) + '" aria-label="처음 생각" placeholder="전압만 회전수를 정한다고 생각했다">' +
        '<span>그런데</span><input type="text" data-f="change.evidence" value="' + esc(n.change.evidence) + '" aria-label="확인한 근거" placeholder="온도별 측정값이 다르게 나왔다">' +
        '<span>그래서</span><input type="text" data-f="change.after" value="' + esc(n.change.after) + '" aria-label="바뀐 판단" placeholder="온도도 결과에 영향을 준다고 판단했다">' +
        '</div><p class="hint">✕ ' + K.REFLECTION.bad.map(esc).join(' · ') + '</p></div>' +
      field('next', '다음 질문', K.NEXT_ASK, true, '예: 부하의 크기를 바꾸면 효율은 어떻게 달라질까?') +
      '<details class="ai"' + (n.ai.used ? ' open' : '') + '><summary>AI를 사용했다면</summary><div class="f">' +
        '<label class="check"><input type="checkbox" data-f="ai.used"' + (n.ai.used ? ' checked' : '') + '> 이 탐구에서 AI를 사용했어요</label>' +
        (n.ai.used ? '<span class="lab">AI가 도와준 것</span>' + choices('aihelp', aiHelp, n.ai.help, true) +
          field('ai.helpText', '그 밖에 도움받은 것', '', false) +
          field('ai.decision', '내가 판단·검증·수정한 것', K.AI.decide.join(' '), true, '예: 질문 후보 10개 중 교과 개념과 맞지 않는 7개를 빼고, 답변 출처를 원문과 대조해 틀린 수치 1개를 고침') : '') +
        '<p class="hint">' + esc(K.AI.principle) + '</p></div></details>' +
      helpLinks(['revision', 'reflection', 'ai', 'causation']);
  }

  function health(n) {
    var items = [];
    items.push([!!n.question, '질문']);
    items.push([!!n.method, '방법']);
    items.push([n.evidence.some(function (e) { return e.title; }), '근거']);
    items.push([!!n.role, '내가 한 일']);
    items.push([!!(n.revision || (!n.problem && n.result)), '수정·점검']);
    items.push([!!n.change.after, '생각의 변화']);
    items.push([!!n.next, '다음 질문']);
    var missing = items.filter(function (x) { return !x[0]; }).map(function (x) { return x[1]; });
    return missing.length ? '<div class="notice"><b>한 번만 더 확인해요</b><p class="small">아직 비어 있는 부분: ' + esc(missing.join(', ')) + '</p></div>' : '<div class="notice good"><b>탐구 흐름이 잘 이어졌어요.</b><p class="small">점수나 등급이 아니라, 빠진 부분이 없는지 확인하는 안내예요.</p></div>';
  }

  function paneSummary() {
    return '<div class="notice"><b>📄 제출용 자기평가서</b><p class="small">' + esc(K.SUMMARY_NOTICE) + '</p></div>' +
      coachingReport(st.note) +
      '<pre class="sum" id="sumText">' + esc(N.summary(st.note)) + '</pre>' +
      '<div class="row no-print"><button class="btn" type="button" data-act="copySum">자기평가서 복사</button><button class="btn quiet" type="button" data-act="downloadSum">TXT 저장</button><button class="btn quiet" type="button" data-act="print">인쇄 / PDF 저장</button>' +
      '<button class="btn quiet" type="button" data-act="followup">다음 질문으로 새 탐구 시작</button></div>' +
      '<p class="small muted" id="copyMsg" role="status"></p>' +
      '<div class="row no-print" style="margin-top:24px"><button class="btn danger" type="button" data-act="del">' + (st.delArmed ? '한 번 더 누르면 이 노트를 지워요' : '이 탐구노트 지우기') + '</button></div>';
  }

  function renderEditor() {
    var n = st.note;
    var tabs = [['start', '시작할 때'], ['doing', '활동 중'], ['done', '마친 뒤'], ['summary', '자기평가서']];
    var body = st.tab === 'start' ? paneStart() : st.tab === 'doing' ? paneDoing() : st.tab === 'done' ? paneDone() : paneSummary();
    ed.innerHTML = '<div class="ehead">' +
      '<input class="title" type="text" data-f="title" value="' + esc(n.title) + '" placeholder="' + esc(N.title(n)) + '" aria-label="탐구 제목">' +
      '<div class="row"><span class="small muted">이 탐구는 지금</span>' + choices('stage', K.STAGES.map(function (s) { return { id: s.id, html: esc(s.label) }; }), n.stage) + '</div>' +
      '<p class="status" id="status" role="status">저장됨 · ' + esc(N.when(n.updatedAt)) + '</p>' +
      '<div id="healthBox">' + health(n) + '</div><div class="conflict" id="conflict" hidden></div></div>' +
      '<div class="tabs no-print" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-act="tab" data-v="' + t[0] + '" aria-selected="' + (st.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="pane" role="tabpanel">' + body + '</div>';
    if (st.conflict) renderConflict();
  }
  function openDetailKeys() {
    return Array.from(ed.querySelectorAll('details[data-keep][open]')).map(function (d) { return d.getAttribute('data-keep'); });
  }
  function restoreDetailKeys(keys) {
    (keys || []).forEach(function (k) { var d = ed.querySelector('details[data-keep="' + k + '"]'); if (d) d.open = true; });
  }
  function refreshCoach() {
    var old = document.getElementById('liveCoach');
    if (old && st.note) old.outerHTML = '<div id="liveCoach">' + questionCoach(st.note) + '</div>';
  }
  function refreshHealth() {
    var box = document.getElementById('healthBox');
    if (box && st.note) box.innerHTML = health(st.note);
  }
  function rerender() {
    var y = window.scrollY, a = document.activeElement, key = a && (a.getAttribute('data-act') + '|' + a.getAttribute('data-v'));
    var opened = openDetailKeys();
    renderEditor();
    restoreDetailKeys(opened);
    window.scrollTo(0, y);
    if (key) { var b = ed.querySelector('[data-act="' + (a.getAttribute('data-act') || '') + '"][data-v="' + (a.getAttribute('data-v') || '') + '"]'); if (b) b.focus({ preventScroll: true }); }
  }

  ed.addEventListener('input', function (e) {
    var t = e.target, n = st.note; if (!n) return;
    if (t.hasAttribute('data-f')) {
      setPath(n, t.getAttribute('data-f'), t.type === 'checkbox' ? t.checked : t.value);
      if (t.getAttribute('data-f') === 'ai.used') { schedule(); rerender(); return; }
      schedule(); refreshHealth(); if (t.getAttribute('data-f') === 'question') refreshCoach();
    } else if (t.hasAttribute('data-ev')) {
      var p = t.getAttribute('data-ev').split('.'); n.evidence[+p[0]][p[1]] = t.value; schedule(); refreshHealth();
    }
  });
  ed.addEventListener('change', function (e) { if (e.target.type === 'checkbox') e.target.dispatchEvent(new Event('input', { bubbles: true })); });

  ed.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || !st.note) return;
    var a = b.getAttribute('data-act'), v = b.getAttribute('data-v'), n = st.note;
    function toggle(arr, x) { var i = arr.indexOf(x); if (i > -1) arr.splice(i, 1); else arr.push(x); }
    switch (a) {
      case 'tab': flush(); st.tab = v; rerender(); return;
      case 'stage': n.stage = v; break;
      case 'from': n.start.from = n.start.from === v ? '' : v; break;
      case 'level': n.questionLevel = n.questionLevel === +v ? 0 : +v; break;
      case 'qtype': n.questionType = n.questionType === v ? '' : v; break;
      case 'method': n.method = n.method === v ? '' : v; break;
      case 'output': toggle(n.outputs, v); break;
      case 'aihelp': toggle(n.ai.help, v); break;
      case 'addEv': n.evidence.push(N.blankEvidence()); break;
      case 'delEv': n.evidence.splice(+v, 1); break;
      case 'labImport':
        var lab = N.labBridge();
        n.interest = N.interestText(lab) || n.interest;
        if (!n.question && (lab.question || lab.seed)) n.question = lab.question || lab.seed;
        if (!n.topic && lab.topic) n.topic = lab.topic;
        n.links.lab = true; break;
      case 'takeLatest': st.note = N.get(n.id); st.rev = st.note.rev; st.conflict = null; clearTimeout(st.timer); st.timer = null; rerender(); setStatus('최신 내용을 불러왔어요'); return;
      case 'keepMine': saveNow(true); return;
      case 'copySum': copy(N.summary(n)); return;
      case 'downloadSum': downloadSummary(n); return;
      case 'followup':
        if (!n.next) { var cm=document.getElementById('copyMsg'); if(cm) cm.textContent='먼저 “다음 질문”을 한 가지 적어 주세요.'; return; }
        var nn=N.create({title:'후속 탐구 · '+n.next.slice(0,40),start:{from:n.start.from,text:'이전 탐구에서 남은 질문에서 이어짐'},interest:n.interest,field:n.field,subject:n.subject,concept:n.concept,topic:n.topic,question:n.next,stage:'start'},'followup'); N.setActive(nn.id); location.href='notes.html#'+encodeURIComponent(nn.id); return;
      case 'print': window.print(); return;
      case 'del':
        if (!st.delArmed) { st.delArmed = true; rerender(); setTimeout(function () { if (st.delArmed) { st.delArmed = false; if (st.tab === 'summary') rerender(); } }, 4000); return; }
        clearTimeout(st.timer); st.timer = null; N.remove(n.id); history.replaceState(null, '', 'notes.html');
        var rest = N.list(); if (rest.length) open(rest[0].id); else renderEmpty(); return;
      default: return;
    }
    schedule(); rerender();
  });

  function downloadSummary(n) {
    var blob = new Blob([N.summary(n)], {type:'text/plain;charset=utf-8'}), url = URL.createObjectURL(blob), a = document.createElement('a');
    var d = new Date(), p = function(x){return String(x).padStart(2,'0');};
    a.href = url; a.download = '탐구활동_자기평가서_' + d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + '.txt';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},500);
    var msg=document.getElementById('copyMsg'); if(msg) msg.textContent='자기평가서 TXT 파일을 저장했어요.';
  }

  function copy(text) {
    var msg = document.getElementById('copyMsg');
    function fb() { var pre = document.getElementById('sumText'); var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); if (msg) msg.textContent = '자기평가서를 선택해 두었어요. 복사(Ctrl+C)하세요.'; }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { if (msg) msg.textContent = '복사했어요.'; }, fb); else fb();
  }

  /* ---------- 파일 저장·불러오기, 기기 모드 ---------- */
  document.getElementById('exportBtn').addEventListener('click', function () { flush(); N.download(); document.getElementById('ioMsg').textContent = '파일을 만들었어요. 다른 기기에서 "내 탐구노트 불러오기"로 열면 이어 쓸 수 있어요.'; });
  document.getElementById('importFile').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var r = N.importText(String(rd.result)), m = document.getElementById('ioMsg');
      m.textContent = r.error ? r.error : '새 노트 ' + r.added + '개, 최신으로 바뀐 노트 ' + r.updated + '개' + (r.kept ? ', 이 기기 내용이 더 최신이라 그대로 둔 노트 ' + r.kept + '개' : '') + '를 불러왔어요.';
      renderList(); if (!st.note) { var l = N.list(); if (l.length) open(l[0].id); }
      e.target.value = '';
    };
    rd.readAsText(f, 'utf-8');
  });
  function renderMode() {
    var pub = N.mode() === 'public';
    document.getElementById('modeBtn').textContent = pub ? '개인 기기 모드로 바꾸기' : '공용 컴퓨터예요';
    document.getElementById('modeText').textContent = pub ? '공용 컴퓨터 모드: 같은 탭에서 이동하세요. 창을 닫으면 노트가 사라져요.' : '개인 기기 모드: 이 브라우저에 계속 남아요.';
  }
  document.getElementById('modeBtn').addEventListener('click', function () { flush(); N.setMode(N.mode() === 'public' ? 'private' : 'public'); renderMode(); start(); });
  document.getElementById('clearAllBtn').addEventListener('click', function () {
    if (!confirm('이 기기의 공통 탐구노트를 모두 지울까요? 되돌릴 수 없습니다.')) return;
    clearTimeout(st.timer); st.timer = null; N.clearAll(); history.replaceState(null, '', 'notes.html'); renderEmpty();
    document.getElementById('ioMsg').textContent = '이 기기의 공통 탐구노트를 모두 지웠어요.';
  });

  /* ---------- 시작 ---------- */
  function start() {
    var q = new URLSearchParams(location.search); st.wantedTab = q.get('tab') === 'summary' ? 'summary' : '';
    if (q.get('new') === '1') {
      var existing = N.list().filter(function (x) { return N.isBlank(x); })[0];
      var n = existing || N.create({}, 'hub');
      history.replaceState(null, '', 'notes.html#' + encodeURIComponent(n.id));
      open(n.id); return;
    }
    var id = decodeURIComponent(location.hash.slice(1)) || N.getActive();
    if (id && N.get(id)) { open(id); return; }
    var l = N.list(); if (l.length) open(l[0].id); else renderEmpty();
  }
  window.addEventListener('hashchange', function () { var id = decodeURIComponent(location.hash.slice(1)); if (id && (!st.note || st.note.id !== id)) { flush(); open(id); } });
  renderMode();
  start();
})();
