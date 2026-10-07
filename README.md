# 경일 진로·탐구 성장 허브 (growth-hub) v1.1

창원경일고 학생에게 세 사이트를 **하나의 진로·탐구 성장 시스템**처럼 보여 주는 통합 입구입니다.
허브는 학생에게 사이트 이름 대신 “지금 무엇이 필요한가요?”를 묻고, 공통 **내 탐구노트**와 공통 **탐구 기준**의 원본을 가지고 있습니다.

## 네 저장소의 역할

| 저장소 | 한 단어 | 하는 일 | 언제 쓰나 |
|---|---|---|---|
| `growth-hub` (이 저장소) | 입구·노트 | 필요에 따라 안내, 내 탐구노트, 활동 요약 | 언제든 |
| `career-lab` | 🌱 발견 | 경험 → 행동 → 관심 → 진로 가설 → 첫 질문 → 설계 → 성장 로드맵 → 제출 | 뭘 할지 모를 때, 활동을 마쳤을 때 |
| `career-exploration-tool` | 🧭 설계 | 분야·주제·과목·질문·방법·자료·사례 | 실제 탐구를 깊게 만들 때 |
| `seteuk-guide` | 🛟 점검 | 질문·근거·설문·상관/인과·수정·협업·AI·성찰 | 탐구하다 막힐 때 |

> 진로 실험실에서 시작하고, 진로 탐구 길잡이에서 깊게 만들고, 막히면 탐구 도움서에서 확인한다. 끝나면 진로 실험실로 돌아와 성장을 정리한다.

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 허브 첫 화면: 필요 5가지, 나의 현재 탐구(이어하기), 진로 실험실 결과, 막힌 곳 8가지 바로가기, 순환 구조 |
| `notes.html` · `notes.js` | 내 탐구노트: 여러 탐구 목록, 시작할 때 / 활동 중 / 마친 뒤 / 활동 요약 |
| `seven-steps.html` | 학생용 「좋은 탐구 7단계」 안내 |
| `inquiry-standard.js` | **공통 탐구 기준 원본** (`INQUIRY STANDARD VERSION 1.1`) |
| `inquiry-notes.js` | **공통 탐구노트 저장소 원본** (`schemaVersion 1`) |
| `hub.css` | 허브 화면 스타일 |

## 공통 탐구노트

- 저장 위치: 브라우저 `localStorage`의 `kyungil.inquiryNotes.v1` (공용 컴퓨터 모드면 `sessionStorage`). 지금 이어 쓰는 노트는 `sessionStorage`의 `kyungil.activeNote`.
- 네 저장소가 모두 `https://mathlhk15-glitch.github.io/` 아래에 있으면 **같은 브라우저 저장 공간을 공유**합니다. 다른 기기로 옮길 때는 “내 탐구노트 저장하기/불러오기”(파일)를 씁니다.
- 노트 하나 = 탐구 하나. 필드: `id, schemaVersion, createdAt, updatedAt, rev, stage, origin, title, start{from,text}, interest, field, subject, concept, topic, grade, question, questionLevel, questionType, method, methodWhy, evidence[{title,who,when,target,how,differs}], role, problem, revision, result, outputs[], limits, scope{sample,causal}, change{before,evidence,after}, next, ai{used,help[],helpText,decision}, links{explore,exploreUrl,lab,guide}`.
- 덮어쓰기 방지: 편집 화면은 불러온 시점의 `rev`를 기억하고, 저장할 때 다른 화면에서 고친 기록이 있으면 저장하지 않고 “최신 내용 불러오기 / 지금 화면 내용으로 저장”을 묻습니다.
- 다른 사이트에서 보내는 내용은 빈 값으로 기존 내용을 지우지 않습니다.
- 진로 실험실에만 있던 질문·설계(`careerLabKeywordV1`·`careerLabInquiryV1`)는 처음 한 번 노트로 옮깁니다.
- 이름·학번·연락처는 받지 않습니다. “활동 요약”은 학생 자기정리 자료이며 학교생활기록부 문장이 아닙니다.

## 공통 기준 바꾸는 법

1. 이 저장소의 `inquiry-standard.js`(또는 `inquiry-notes.js`)를 고치고 첫 줄 버전을 올립니다.
2. 같은 파일을 `career-lab`, `career-exploration-tool`, `seteuk-guide` 루트에 덮어씁니다.
3. `index.html?teacher=1`을 열면 네 저장소의 버전이 같은지 표로 확인할 수 있습니다.

## 배포

1. GitHub에 `growth-hub` 저장소를 public으로 만들고 이 폴더의 파일을 루트에 올립니다.
2. Settings → Pages → Branch `main` / `(root)`.
3. 주소: `https://mathlhk15-glitch.github.io/growth-hub/`
4. 나머지 세 저장소도 같은 계정에서 Pages로 켭니다. 저장소 이름을 바꾸면 `inquiry-standard.js`의 `SITES`를 고칩니다.
5. ONE QUESTION 웹 주소가 생기면 `SITES.oneQuestion`에 넣습니다(비어 있으면 “준비 중”으로 표시).
6. lhk15 포털에는 이 허브 주소 하나만 카드로 걸어도 됩니다.

## 로컬에서 확인

네 폴더를 한 상위 폴더에 나란히 두고 그 상위 폴더에서:

```bash
python -m http.server 8000
```

`http://localhost:8000/growth-hub/`를 엽니다.


## 통합 수정판 1.1
- 다른 탐구노트 덮어쓰기 방지
- 저장 검증 후 공통 노트 반영
- 공용 컴퓨터 안내와 전체 삭제 기능
- 개인정보 입력 최소화
- 탐구 건강검진(점수 없음)
- 빈 탐구노트 중복 생성 방지
