/* INQUIRY STANDARD VERSION 1.2
 * 경일 진로·탐구 성장 시스템 — 공통 탐구 기준
 * 원본: gyeongil-growth-hub/inquiry-standard.js
 * 복사본: career-lab / career-exploration-tool / seteuk-guide 저장소 루트
 * 기준을 바꿀 때는 원본을 고친 뒤 세 저장소의 복사본을 같은 파일로 교체하고 VERSION을 함께 올립니다.
 */
(function () {
  'use strict';
  var VERSION = '1.2';

  /* 배포용 GitHub Pages 절대 주소: 저장소 간 이동 시 상대경로 404를 막습니다. */
  var SITES = {
    hub: 'https://mathlhk15-glitch.github.io/gyeongil-growth-hub/',
    lab: 'https://mathlhk15-glitch.github.io/career-lab/',
    explore: 'https://mathlhk15-glitch.github.io/career-exploration-tool/',
    guide: 'https://mathlhk15-glitch.github.io/seteuk-guide/',
    oneQuestion: '' // ONE QUESTION 웹 주소가 정해지면 여기에 넣습니다. 비어 있으면 '준비 중'으로 표시합니다.
  };

  /* 공통 상단 메뉴 */
  var NAV = [
    { id: 'discover', icon: '🌱', label: '나 발견', href: SITES.lab + 'index.html' },
    { id: 'topic', icon: '🧭', label: '주제·탐구', href: SITES.explore + 'index.html' },
    { id: 'help', icon: '🛟', label: '도움', href: SITES.hub + 'index.html#help' },
    { id: 'growth', icon: '🌳', label: '성장', href: SITES.lab + 'roadmap.html' },
    { id: 'notes', icon: '📓', label: '내 노트', href: SITES.hub + 'notes.html' }
  ];

  /* 탐구는 어디서 시작됐나요? */
  var START_FROM = [
    { id: 'class', icon: '📚', label: '수업', hint: '오늘 배운 개념, 이해가 안 된 부분, “왜 그렇지?”라고 생각한 것' },
    { id: 'life', icon: '🏠', label: '생활', hint: '학교·집·동네에서 직접 겪은 불편이나 궁금증' },
    { id: 'career', icon: '🌱', label: '진로', hint: '관심 분야에서 생긴 질문. 진로는 소재로만 가져와요' },
    { id: 'news', icon: '📰', label: '뉴스', hint: '뉴스 속 현상을 교과 개념으로 설명해 보기 (ONE QUESTION)' }
  ];

  /* 질문 수준 4단계: 자동 판정하지 않고 학생이 스스로 고릅니다. 목표는 '지금보다 한 단계 깊게'. */
  var LEVELS = [
    { n: 1, name: '찾기', ask: '무엇인가?', example: '전기차의 장점은 무엇인가?',
      sign: '검색 한 번으로 답이 나와요.', up: '“왜” 또는 “어떻게”를 붙여 원리를 묻는 질문으로 바꿔 보세요.' },
    { n: 2, name: '설명하기', ask: '왜 그런가? 어떻게 작동하나?', example: '전기차는 왜 내연기관차보다 에너지 효율이 높은가?',
      sign: '교과 개념으로 원리를 설명해야 해요.', up: '비교할 대상이나 바꿔 볼 조건을 하나 더해 보세요.' },
    { n: 3, name: '비교·분석하기', ask: '어떤 차이·관계가 있는가?', example: '주행거리에 따라 전기차와 하이브리드의 에너지 비용은 어떻게 달라지는가?',
      sign: '자료 2~3개를 같은 기준으로 비교해야 답할 수 있어요.', up: '어떤 조건에서 결과가 달라지는지, 한계는 무엇인지 물어보세요.' },
    { n: 4, name: '판단·확장하기', ask: '어떤 조건에서 달라지는가? 한계는?', example: '전력 생산 구조까지 고려하면 어떤 조건에서 전기차의 탄소배출 우위가 줄어드는가?',
      sign: '조건·근거·한계를 함께 따져 판단해야 해요.', up: '이번에 해결하지 못한 조건을 다음 탐구 질문으로 이어 가세요.' }
  ];
  var LEVEL_NOTE = '무조건 4단계가 좋은 것은 아니에요. 새 개념을 배우는 중이라면 2단계 질문도 충분히 의미 있어요. 지금 질문보다 한 단계만 깊게 만들어 보세요.';

  /* 탐구 방법 */
  var METHODS = {
    classify:   { name: '자료 조사·분류', out: '분류표, 목록과 기준' },
    compare:    { name: '비교·통계 분석', out: '비교표, 그래프' },
    mechanism:  { name: '원인·원리(기전) 분석', out: '단계 도식, 설명 그림' },
    literature: { name: '문헌·텍스트 비교', out: '근거표, 종합 결론' },
    survey:     { name: '설문·상관 분석', out: '응답 분포표, 관계 그래프' },
    interview:  { name: '면접·인터뷰', out: '응답 정리표, 주제별 분류' },
    experiment: { name: '실험·준실험', out: '조건별 측정표, 그래프' },
    observe:    { name: '관찰 기록', out: '관찰 기준표, 날짜별 기록' },
    model:      { name: '수학적 모델·계산', out: '식, 계산 과정, 모델 비교' },
    casestudy:  { name: '사례 연구', out: '사례 분석표, 시간순 정리' },
    design:     { name: '제작 → 시험 → 수정', out: '제작물, 수정 전후 비교' }
  };

  /* 질문 유형 ↔ 추천 방법. '정답 방법'이 아니라 '먼저 생각할 방법'입니다. */
  var QUESTION_TYPES = [
    { id: 'exist', ask: '무엇이 있는가?', methods: ['classify', 'literature'], care: '목록만 만들고 끝내지 말고, 나눈 기준을 밝혀요.' },
    { id: 'differ', ask: '어떻게 다른가?', methods: ['compare', 'observe', 'experiment'], care: '비교 기준(단위·기간·대상)을 같게 맞춰요.' },
    { id: 'why', ask: '왜 그런가?', methods: ['mechanism', 'literature', 'casestudy', 'experiment'], care: '설문 결과만으로 원인을 단정하지 않아요.' },
    { id: 'related', ask: '관련이 있는가?', methods: ['survey', 'compare'], care: '함께 움직인다고 원인이라고 말하지 않아요.' },
    { id: 'cause', ask: 'A 때문에 B가 변하는가?', methods: ['experiment'], care: '바꾸는 조건 하나 말고는 모두 같게 통제해요.' },
    { id: 'opinion', ask: '사람들은 어떻게 생각하는가?', methods: ['survey', 'interview'], care: '누구에게, 몇 명에게 물었는지 밝혀요.' },
    { id: 'case', ask: '특정 사례에서는 무슨 일이 일어났나?', methods: ['casestudy', 'literature'], care: '한 사례를 전체로 확대 해석하지 않아요.' },
    { id: 'improve', ask: '어떻게 개선할 수 있을까?', methods: ['design', 'experiment'], care: '실제로 써 보고 시험한 뒤 수정 기록을 남겨요.' }
  ];
  var FIELD_NOTE = '같은 “왜?”라도 자연과학은 실험·기전, 사회과학은 통계·사례, 인문은 텍스트·문헌 비교가 어울릴 수 있어요.';

  /* 특히 조심할 조합 */
  var MISMATCH = {
    'cause:survey': '설문조사만으로는 “원인”까지 단정하기 어려워요. “관련이 있다” 정도로 결론을 다듬거나, 원인을 확인하려면 조건을 통제한 실험을 생각해 보세요.',
    'cause:compare': '통계 비교만으로는 원인을 확정하기 어려워요. 다른 원인 후보(시간·환경·대상 차이)를 함께 따져 보세요.',
    'cause:interview': '사람들의 생각은 원인의 근거가 되기 어려워요. 인식을 묻는 질문으로 바꾸는 것도 방법이에요.'
  };

  /* 근거 점검 5문항 */
  var EVIDENCE_CHECKS = [
    { id: 'who', q: '누가 만들었나?', hint: '기관·연구자·기자·개인' },
    { id: 'when', q: '언제 만들었나?', hint: '조사 시기와 발행 시기는 다를 수 있어요' },
    { id: 'target', q: '누구·무엇을 대상으로 했나?', hint: '지역·학년·인원·기간' },
    { id: 'how', q: '어떤 방법과 데이터를 썼나?', hint: '측정 기준, 표본, 질문 문항' },
    { id: 'differs', q: '다른 자료와 결과가 다르다면 왜 그런가?', hint: '시기·대상·정의·기간·이해관계 차이' }
  ];
  var SOURCE_START = [
    '공식 통계·공공기관 자료', '논문·연구 보고서', '전문기관 분석·언론 기사', '책·교과서', '작품 원문·사료(인문·예술)'
  ];
  var SOURCE_NOTE = '이 목록은 좋은 자료의 순위가 아니라 먼저 찾아볼 만한 출발점이에요. 역사에서는 사료가, 문학에서는 작품 원문이 가장 중요한 근거예요.';

  /* 결론 범위 */
  var CONCLUSION = [
    { id: 'sample', title: '표본: 조사한 사람만큼만 말하기',
      bad: '고등학생들은 ○○를 선호한다.', good: '이번 조사에 참여한 우리 학교 2학년 학생들에게서는 ○○ 경향이 나타났다.' },
    { id: 'causal', title: '상관과 인과: 같이 움직인다고 원인은 아니다',
      bad: '스마트폰 때문에 수면시간이 줄었다.', good: '이번 조사에서는 스마트폰 사용시간과 수면시간 사이에 관련성이 나타났다. 이 조사만으로 원인이라고 단정하기는 어렵다.' }
  ];

  var REVISION_CHAIN = ['예상', '실행', '예상과 다름', '이유 추정', '수정', '다시 확인', '판단 변화'];
  var REVISION_ASK = '예상과 달랐을 때 무엇을 바꿨나요?';

  var REFLECTION = {
    bad: ['재미있었다.', '많은 것을 알게 되었다.', '앞으로 더 열심히 해야겠다.'],
    frame: ['처음에는 ___라고 생각했다.', '그런데 ___라는 근거를 확인했다.', '그래서 ___라고 판단하게 되었다.'],
    note: '느낌의 변화가 아니라 판단의 변화를 써요. 예외를 찾거나 적용 범위가 좁아진 것도 변화예요.'
  };

  var NEXT_ASK = '이번 탐구에서 해결하지 못한 것은 무엇인가요? 그 답이 다음 질문이 돼요.';

  var AI = {
    principle: 'AI를 썼다는 사실보다 내가 무엇을 선택·검증·수정했는지가 중요해요.',
    help: ['질문 후보', '자료 검색어', '내용 요약', '설문 문항 점검', '코드 초안', '반론 제시'],
    decide: ['무엇을 골랐나?', '무엇을 뺐나?', '무엇을 직접 확인했나?', '어떤 오류를 찾았나?', '무엇을 고쳤나?']
  };

  var OUTPUTS = ['비교표', '그래프', '통계 분석', '실험 결과', '설문 결과', '설명 그림', '프로그램', '웹페이지', '모델', '영상', '기획안', '정책 제안', '발표자료', '보고서'];

  var STAGES = [
    { id: 'start', label: '시작할 때', short: '시작' },
    { id: 'doing', label: '활동 중', short: '진행' },
    { id: 'done', label: '마친 뒤', short: '완료' }
  ];

  /* 세특 안내서(탐구 도움서)의 문제별 바로가기 */
  var HELP = [
    { id: 'question', label: '질문이 너무 쉬운 것 같아요' },
    { id: 'evidence', label: '이 자료를 믿어도 될지 모르겠어요' },
    { id: 'survey', label: '설문을 하려고 해요' },
    { id: 'causation', label: '상관과 원인이 헷갈려요' },
    { id: 'revision', label: '결과가 예상과 달라요' },
    { id: 'collaboration', label: '모둠 활동에서 내 역할을 정리하고 싶어요' },
    { id: 'ai', label: 'AI를 썼어요' },
    { id: 'reflection', label: '생각의 변화를 쓰고 싶어요' }
  ];

  var SUMMARY_NOTICE = '이 자료는 학생 활동 자기정리 자료이며 학교생활기록부 문장이 아닙니다. 선생님은 직접 관찰한 내용과 결과물 확인을 바탕으로 기록합니다.';

  /* 사이트별 방법 이름 ↔ 공통 방법 */
  var MAP = {
    fromExplore: { experiment: 'experiment', people: 'experiment', survey: 'survey', literature: 'literature', data: 'compare', making: 'design', math: 'model', observe: 'observe', practice: 'design' },
    fromLab: { compare: 'compare', survey: 'survey', data: 'compare', experiment: 'experiment', design: 'design', content: 'literature' },
    toLab: { classify: 'compare', compare: 'compare', mechanism: '', literature: 'content', survey: 'survey', interview: 'survey', experiment: 'experiment', observe: 'experiment', model: 'data', casestudy: '', design: 'design' }
  };

  function methodCheck(typeId, methodId) {
    if (!typeId || !methodId) return null;
    var t = QUESTION_TYPES.filter(function (x) { return x.id === typeId; })[0];
    if (!t) return null;
    var key = typeId + ':' + methodId;
    if (MISMATCH[key]) return { level: 'warn', text: MISMATCH[key] };
    if (t.methods.indexOf(methodId) === 0) return { level: 'good', text: '질문과 잘 맞는 방법이에요. ' + t.care };
    if (t.methods.indexOf(methodId) > 0) return { level: 'good', text: '이 질문에 쓸 수 있는 방법이에요. ' + t.care };
    return { level: 'ok', text: '가능하지만 먼저 생각할 방법은 ' + t.methods.map(function (m) { return METHODS[m].name; }).join(', ') + '이에요. 이 방법을 고른 이유를 노트에 남겨 두세요.' };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  var NAV_CSS = '.kis-nav{background:#13294b;color:#fff;font:500 14px/1.3 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;position:relative;z-index:20}' +
    '.kis-nav .kis-in{max-width:1180px;margin:0 auto;padding:0 12px;display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none}' +
    '.kis-nav .kis-in::-webkit-scrollbar{display:none}' +
    '.kis-nav a{color:#dbe6ff;text-decoration:none;display:inline-flex;align-items:center;gap:5px;min-height:44px;padding:0 10px;white-space:nowrap;border-radius:6px;flex:none}' +
    '.kis-nav a:hover,.kis-nav a:focus-visible{color:#fff;background:rgba(255,255,255,.12);outline:none}' +
    '.kis-nav a[aria-current="page"]{color:#fff;background:rgba(255,255,255,.18);font-weight:700}' +
    '.kis-nav .kis-home{font-weight:700;color:#fff;margin-right:6px}' +
    '.kis-nav .kis-notes{margin-left:auto;background:#fff;color:#13294b;font-weight:700}' +
    '.kis-nav .kis-notes:hover{background:#e7eeff;color:#13294b}' +
    '@media(max-width:520px){.kis-nav .kis-in{padding:0 3px;gap:0;overflow:visible}.kis-nav .kis-home{display:inline-flex;flex:0 0 34px;width:34px;min-width:34px;margin-right:0;padding:0;justify-content:center;font-size:0}.kis-nav .kis-home::before{content:"🏠";font-size:15px}.kis-nav a:not(.kis-home){flex:1 1 0;justify-content:center;gap:2px;padding:0 1px;font-size:10.5px;min-width:0}.kis-nav .kis-notes{margin-left:0}.kis-nav a span{font-size:13px}}' +
    '@media print{.kis-nav{display:none!important}}';

  function navHtml(active) {
    var items = NAV.map(function (n) {
      var cls = n.id === 'notes' ? ' class="kis-notes"' : '';
      return '<a href="' + n.href + '"' + cls + (n.id === active ? ' aria-current="page"' : '') + '><span aria-hidden="true">' + n.icon + '</span>' + esc(n.label) + '</a>';
    }).join('');
    return '<div class="kis-in"><a class="kis-home" href="' + SITES.hub + 'index.html">경일 진로·탐구</a>' + items + '</div>';
  }

  function mountNav(active, before) {
    if (document.querySelector('.kis-nav')) return;
    if (!document.getElementById('kis-nav-css')) {
      var st = document.createElement('style'); st.id = 'kis-nav-css'; st.textContent = NAV_CSS; document.head.appendChild(st);
    }
    var nav = document.createElement('nav');
    nav.className = 'kis-nav no-print'; nav.setAttribute('aria-label', '경일 진로·탐구 성장 시스템');
    nav.innerHTML = navHtml(active);
    var ref = before || document.body.firstChild;
    document.body.insertBefore(nav, ref);
  }

  window.KIS = {
    VERSION: VERSION, SITES: SITES, NAV: NAV, START_FROM: START_FROM, LEVELS: LEVELS, LEVEL_NOTE: LEVEL_NOTE,
    METHODS: METHODS, QUESTION_TYPES: QUESTION_TYPES, FIELD_NOTE: FIELD_NOTE, MISMATCH: MISMATCH,
    EVIDENCE_CHECKS: EVIDENCE_CHECKS, SOURCE_START: SOURCE_START, SOURCE_NOTE: SOURCE_NOTE,
    CONCLUSION: CONCLUSION, REVISION_CHAIN: REVISION_CHAIN, REVISION_ASK: REVISION_ASK,
    REFLECTION: REFLECTION, NEXT_ASK: NEXT_ASK, AI: AI, OUTPUTS: OUTPUTS, STAGES: STAGES, HELP: HELP,
    SUMMARY_NOTICE: SUMMARY_NOTICE, MAP: MAP,
    methodCheck: methodCheck, esc: esc, navHtml: navHtml, mountNav: mountNav
  };
})();
