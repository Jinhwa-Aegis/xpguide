import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'XpERP 가이드',
  description: '아파트 관리사무소를 위한 XpERP 사용 가이드',
  lang: 'ko-KR',
  lastUpdated: true,

  head: [
    ['meta', { name: 'theme-color', content: '#3578e5' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'XpERP 가이드',

    nav: [
      { text: '홈', link: '/' },
      { text: '시작하기', link: '/guide/getting-started' },
      { text: '업무 시나리오', link: '/guide/scenarios/' },
      {
        text: '주요 업무',
        items: [
          { text: '검침', link: '/insp/' },
          { text: '부과', link: '/impo/' },
          { text: '수납', link: '/recp/' },
          { text: '회계', link: '/acct/' },
        ]
      },
      {
        text: '관리',
        items: [
          { text: '단지관리', link: '/dang/' },
          { text: '입주자', link: '/occp/' },
          { text: '인사/급여', link: '/pay/' },
          { text: '민원', link: '/jobm/' },
        ]
      },
    ],

    sidebar: [
      {
        text: '가이드',
        collapsed: true,
        items: [
          { text: '시작하기', link: '/guide/getting-started' },
          { text: '월간 업무 흐름', link: '/guide/workflow' },
          { text: '용어 사전', link: '/guide/glossary' },
        ]
      },
      {
        text: '업무 시나리오',
        collapsed: false,
        items: [
          { text: '시나리오 안내', link: '/guide/scenarios/' },
          { text: '검침 처리', link: '/guide/scenarios/meter-reading' },
          { text: '관리비 부과', link: '/guide/scenarios/billing' },
          { text: '수납 처리', link: '/guide/scenarios/collection' },
          { text: '미수금 관리', link: '/guide/scenarios/overdue' },
          { text: '월말 마감', link: '/guide/scenarios/month-closing' },
          { text: '지출 전표 입력', link: '/guide/scenarios/expense-voucher' },
          { text: '통장 대사', link: '/guide/scenarios/bank-reconciliation' },
          { text: '연말 결산', link: '/guide/scenarios/year-end' },
          { text: '전출입 처리', link: '/guide/scenarios/move-in-out' },
          { text: '급여 처리', link: '/guide/scenarios/payroll' },
        ]
      },
      {
        text: '1. Xp전자결재',
        collapsed: true,
        items: [
          { text: '개요', link: '/appr/' },
        ]
      },
      {
        text: '2. Xp문서함',
        collapsed: true,
        items: [
          { text: '개요', link: '/docs-menu/' },
        ]
      },
      {
        text: '3. 단지관리',
        collapsed: true,
        items: [
          { text: '개요', link: '/dang/' },
          { text: '단지정보', link: '/dang/dang-info' },
          { text: '환경설정', link: '/dang/dang-env' },
          { text: '조견표', link: '/dang/dang-table' },
        ]
      },
      {
        text: '4. 입주자',
        collapsed: true,
        items: [
          { text: '개요', link: '/occp/' },
          { text: '입주처리', link: '/occp/move-in' },
          { text: '전출처리', link: '/occp/move-out' },
          { text: '차량관리', link: '/occp/vehicle' },
          { text: '조회관리', link: '/occp/inquiry' },
          { text: '개인정보', link: '/occp/privacy' },
        ]
      },
      {
        text: '5. 검침',
        collapsed: true,
        items: [
          { text: '개요', link: '/insp/' },
          { text: '전기검침', link: '/insp/electric' },
          { text: '수도검침', link: '/insp/water' },
          { text: '온수검침', link: '/insp/hot-water' },
          { text: '정수검침', link: '/insp/purified' },
          { text: '가스검침', link: '/insp/gas' },
          { text: '난방검침', link: '/insp/heating' },
          { text: '공통검침', link: '/insp/common' },
          { text: '분리검침', link: '/insp/separate' },
        ]
      },
      {
        text: '6. 부과',
        collapsed: true,
        items: [
          { text: '개요', link: '/impo/' },
          { text: '기초정보', link: '/impo/basic' },
          { text: '부과처리', link: '/impo/process' },
          { text: '관리비부과조회', link: '/impo/inquiry' },
          { text: '부과마감', link: '/impo/closing' },
        ]
      },
      {
        text: '7. 수납',
        collapsed: true,
        items: [
          { text: '개요', link: '/recp/' },
          { text: '수납처리', link: '/recp/process' },
          { text: '수납조회', link: '/recp/inquiry' },
          { text: '미납조회', link: '/recp/overdue' },
          { text: '자동이체수납', link: '/recp/auto-transfer' },
        ]
      },
      {
        text: '8. 회계',
        collapsed: true,
        items: [
          { text: '개요', link: '/acct/' },
          { text: '기초정보', link: '/acct/basic' },
          { text: '전표관리', link: '/acct/voucher' },
          { text: '장부관리', link: '/acct/ledger' },
          { text: '결산관리', link: '/acct/settlement' },
          { text: '예산관리', link: '/acct/budget' },
        ]
      },
      {
        text: '9. 인사/급여',
        collapsed: true,
        items: [
          { text: '개요', link: '/pay/' },
          { text: '공통정보관리', link: '/pay/common' },
          { text: '인사관리/조회', link: '/pay/hr' },
          { text: '급여관리/조회', link: '/pay/salary' },
          { text: '연말정산', link: '/pay/year-end' },
          { text: '퇴직정산', link: '/pay/retirement' },
        ]
      },
      {
        text: '10. 장기수선계획',
        collapsed: true,
        items: [
          { text: '개요', link: '/afms/' },
        ]
      },
      {
        text: '11. 프리미엄',
        collapsed: true,
        items: [
          { text: '개요', link: '/premium/' },
        ]
      },
      {
        text: '12. 민원',
        collapsed: true,
        items: [
          { text: '개요', link: '/jobm/' },
          { text: '민원관리', link: '/jobm/manage' },
          { text: '민원조회', link: '/jobm/inquiry' },
        ]
      },
      {
        text: '13. 아파트뱅크',
        collapsed: true,
        items: [
          { text: '개요', link: '/bank/' },
          { text: '은행거래내역', link: '/bank/transaction' },
          { text: '증빙내역', link: '/bank/evidence' },
          { text: '이체', link: '/bank/transfer' },
          { text: '설정', link: '/bank/settings' },
        ]
      },
      {
        text: '14. 아파트아이',
        collapsed: true,
        items: [
          { text: '개요', link: '/apti/' },
        ]
      },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '검색', buttonAriaLabel: '검색' },
          modal: {
            noResultsText: '검색 결과가 없습니다',
            resetButtonTitle: '초기화',
            footer: { selectText: '선택', navigateText: '이동', closeText: '닫기' }
          }
        }
      }
    },

    footer: {
      message: 'XpERP 아파트 관리사무소 가이드',
      copyright: '© 2026 XpERP'
    },

    outline: {
      label: '목차',
      level: [2, 3]
    },

    lastUpdated: {
      text: '최종 수정일'
    },

    docFooter: {
      prev: '이전',
      next: '다음'
    },

    darkModeSwitchLabel: '테마',
    returnToTopLabel: '맨 위로',
    sidebarMenuLabel: '메뉴',
  }
})
