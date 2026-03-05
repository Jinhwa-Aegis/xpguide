import { defineConfig } from 'vitepress'
import sidebarData from './sidebar.json'

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

    sidebar: sidebarData,

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
      copyright: '© 2026 AegisEnterprise'
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
