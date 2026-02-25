# XpERP 가이드 (xpguide)

아파트 관리사무소 경리·회계·사무 담당자를 위한 **XpERP 시스템 사용 가이드** 위키입니다.

메뉴별 설명뿐 아니라, **실제 업무를 어떻게 처리하는지** 단계별로 따라 할 수 있는 시나리오 가이드를 제공합니다.

## 주요 기능

- **업무 시나리오 가이드** — 검침, 부과, 수납, 마감 등 10대 핵심 업무의 전체 프로세스를 단계별로 안내
- **14개 모듈 매뉴얼** — XpERP의 모든 메뉴에 대한 상세 사용법과 스크린샷
- **용어 사전** — 회계·아파트 관리 용어 84개를 쉬운 말로 설명
- **월간 업무 흐름** — 주차별 업무 사이클과 연간 업무 캘린더
- **전문 검색** — VitePress 내장 한국어 전문 검색

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | [VitePress](https://vitepress.dev/) 1.6.3 |
| 빌드 도구 | [Vite](https://vitejs.dev/) |
| 콘텐츠 | Markdown (`.md`) |
| 언어 | 한국어 (`ko-KR`) |
| 검색 | VitePress Local Search |
| 배포 | 정적 사이트 (HTML/CSS/JS) |

## 프로젝트 구조

```
xpguide/
├── wiki/
│   ├── docs/
│   │   ├── .vitepress/
│   │   │   └── config.ts          # 사이트 설정 (네비게이션, 사이드바, 검색)
│   │   ├── public/
│   │   │   ├── hero-image.svg     # 홈 히어로 이미지
│   │   │   ├── logo.svg           # 사이트 로고
│   │   │   └── screenshots/       # UI 스크린샷 (150+)
│   │   ├── index.md               # 홈페이지
│   │   ├── guide/                 # 가이드
│   │   │   ├── getting-started.md # 시작하기
│   │   │   ├── workflow.md        # 월간 업무 흐름
│   │   │   ├── glossary.md        # 용어 사전 (84개)
│   │   │   └── scenarios/         # ★ 업무 시나리오 가이드 (10개)
│   │   │       ├── index.md
│   │   │       ├── meter-reading.md    # 검침 처리
│   │   │       ├── billing.md          # 관리비 부과
│   │   │       ├── collection.md       # 수납 처리
│   │   │       ├── overdue.md          # 미수금 관리
│   │   │       ├── month-closing.md    # 월말 마감
│   │   │       ├── expense-voucher.md  # 지출 전표 입력
│   │   │       ├── bank-reconciliation.md # 통장 대사
│   │   │       ├── year-end.md         # 연말 결산
│   │   │       ├── move-in-out.md      # 전출입 처리
│   │   │       └── payroll.md          # 급여 처리
│   │   ├── appr/       # 1. Xp전자결재
│   │   ├── docs-menu/  # 2. Xp문서함
│   │   ├── dang/       # 3. 단지관리
│   │   ├── occp/       # 4. 입주자
│   │   ├── insp/       # 5. 검침
│   │   ├── impo/       # 6. 부과
│   │   ├── recp/       # 7. 수납
│   │   ├── acct/       # 8. 회계
│   │   ├── pay/        # 9. 인사/급여
│   │   ├── afms/       # 10. 장기수선계획
│   │   ├── premium/    # 11. 프리미엄
│   │   ├── jobm/       # 12. 민원
│   │   ├── bank/       # 13. 아파트뱅크
│   │   └── apti/       # 14. 아파트아이
│   ├── package.json
│   └── package-lock.json
├── docs/
│   └── xpguide_improvement_proposal.md  # 개선 방안 보고서
└── xperp-sitemap.md                     # 사이트맵
```

## 시작하기

### 사전 요구사항

- [Node.js](https://nodejs.org/) 18 이상
- npm (Node.js에 포함)

### 설치

```bash
git clone https://github.com/Jinhwa-Aegis/xpguide.git
cd xpguide/wiki
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

> 같은 네트워크의 다른 기기에서도 접속 가능합니다 (`--host 0.0.0.0`이 기본 설정).

### 빌드

```bash
npm run build
```

정적 파일이 `docs/.vitepress/dist/` 에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

## 콘텐츠 구조

### 14개 XpERP 모듈

| # | 모듈 | 경로 | 문서 수 | 설명 |
|---|------|------|---------|------|
| 1 | Xp전자결재 | `/appr/` | 1 | 전자결재 문서 작성·승인 |
| 2 | Xp문서함 | `/docs-menu/` | 1 | 문서 보관·관리 |
| 3 | 단지관리 | `/dang/` | 4 | 단지정보, 환경설정, 조견표 |
| 4 | 입주자 | `/occp/` | 6 | 입주/전출, 차량, 개인정보 |
| 5 | 검침 | `/insp/` | 9 | 전기, 수도, 온수, 가스, 난방 검침 |
| 6 | 부과 | `/impo/` | 5 | 관리비 부과 처리 |
| 7 | 수납 | `/recp/` | 5 | 수납, 미납, 자동이체 |
| 8 | 회계 | `/acct/` | 6 | 전표, 장부, 결산, 예산 |
| 9 | 인사/급여 | `/pay/` | 6 | 인사, 급여, 연말정산, 퇴직 |
| 10 | 장기수선계획 | `/afms/` | 1 | 장기수선충당금 관리 |
| 11 | 프리미엄 | `/premium/` | 1 | 프리미엄 부가서비스 |
| 12 | 민원 | `/jobm/` | 3 | 민원 접수·처리·조회 |
| 13 | 아파트뱅크 | `/bank/` | 5 | 은행거래, 증빙, 이체 |
| 14 | 아파트아이 | `/apti/` | 1 | 입주민 모바일 앱 |

### 업무 시나리오 가이드

실제 업무 흐름에 맞춘 단계별 가이드입니다. 각 시나리오에는 전체 흐름도, 단계별 절차, 체크리스트, 자주 발생하는 문제와 해결법이 포함됩니다.

| 시나리오 | 파일 | 소요 시간 | 난이도 |
|----------|------|-----------|--------|
| 검침 처리 | `meter-reading.md` | 1~2시간 | ★★☆ |
| 관리비 부과 | `billing.md` | 30분 | ★★★ |
| 수납 처리 | `collection.md` | 20분 | ★★☆ |
| 미수금 관리 | `overdue.md` | 15분 | ★★☆ |
| 월말 마감 | `month-closing.md` | 40분 | ★★★ |
| 지출 전표 입력 | `expense-voucher.md` | 건당 5분 | ★★☆ |
| 통장 대사 | `bank-reconciliation.md` | 20분 | ★★★ |
| 연말 결산 | `year-end.md` | 2시간 | ★★★ |
| 전출입 처리 | `move-in-out.md` | 건당 15분 | ★★☆ |
| 급여 처리 | `payroll.md` | 30분 | ★★★ |

### 매월 핵심 업무 사이클

```
검침 (1~2주차) → 부과 (3주차) → 수납 (4주차~) → 회계처리 (익월 1~2주차)
```

## 콘텐츠 작성 가이드

### 새 문서 추가

1. 해당 모듈 디렉토리에 `.md` 파일 생성
2. `docs/.vitepress/config.ts`의 `sidebar`에 항목 추가
3. 필요 시 `nav`에도 추가

### 스크린샷 추가

1. `docs/public/screenshots/` 에 PNG 파일 저장
2. 파일명 규칙: `화면코드.png` (예: `IMPO2020.png`)
3. 마크다운에서 참조: `![설명](/screenshots/IMPO2020.png)`

### 마크다운 스타일 가이드

```markdown
# 페이지 제목

> **메뉴 경로**: 부과 > 부과처리

## 섹션 제목

### 하위 섹션

::: tip 팁
유용한 정보
:::

::: warning 주의
주의할 사항
:::

::: danger 위험
되돌릴 수 없는 작업 등
:::
```

### 시나리오 가이드 작성 템플릿

새 시나리오를 추가할 때 아래 구조를 따릅니다:

```markdown
# 시나리오 제목

> **소요 시간**: 약 ○○분 | **난이도**: ★★☆ | **주기**: 매월/수시

간략한 설명.

## 전체 흐름

(단계별 플로우 다이어그램)

## 1단계: ○○ (○분)

> **메뉴 경로**: 모듈 > 메뉴 (화면코드)

### 절차
### 체크리스트

## 자주 발생하는 문제

### 문제 제목
**원인**: ...
**해결**: ...

## 관련 메뉴
```

## 설정 파일

### config.ts 주요 설정

| 설정 | 값 | 설명 |
|------|-----|------|
| `title` | XpERP 가이드 | 사이트 제목 |
| `lang` | ko-KR | 한국어 |
| `lastUpdated` | true | 최종 수정일 표시 |
| `search.provider` | local | 로컬 전문 검색 |
| `outline.level` | [2, 3] | 목차에 H2, H3 표시 |
| `themeConfig.logo` | /logo.svg | 사이트 로고 |

## 배포

VitePress 정적 사이트이므로 다양한 환경에 배포할 수 있습니다:

- **GitHub Pages**: `npm run build` 후 `dist/` 디렉토리를 GitHub Pages로 배포
- **Netlify / Vercel**: 빌드 명령 `npm run build`, 출력 디렉토리 `docs/.vitepress/dist`
- **자체 웹서버**: 빌드 결과물을 Nginx/Apache 등으로 서빙

## 개선 로드맵

자세한 내용은 [`docs/xpguide_improvement_proposal.md`](docs/xpguide_improvement_proposal.md)를 참고하세요.

### Phase 1: Quick Wins (완료)

- [x] 업무 시나리오 가이드 10개 작성
- [x] 용어 사전 확장 (25개 → 84개)
- [x] 홈페이지·시작하기 페이지에 시나리오 연결
- [x] 네비게이션 재구성

### Phase 2: 중기 개선 (예정)

- [ ] Vue 커스텀 컴포넌트 (체크리스트, 프로세스 플로우, 툴팁)
- [ ] AI 챗봇 위젯 통합 (Claude API + RAG)
- [ ] 인터랙티브 튜토리얼 및 샌드박스 모드
- [ ] 비디오 튜토리얼 라이브러리

### Phase 3: 장기 고도화 (예정)

- [ ] AI 개인화 학습 추천
- [ ] 커뮤니티 Q&A 플랫폼
- [ ] 실시간 코칭 (AI + 화면 공유)
- [ ] 학습 경로 및 게임화 시스템

## 라이선스

(c) 2026 XpERP. All rights reserved.
