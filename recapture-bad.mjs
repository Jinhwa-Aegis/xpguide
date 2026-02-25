import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = 'C:/aegis_dx/reference/xpguide/wiki/docs/public/screenshots';

// 고지서출력환경등록으로 잘못 캡처된 44개 메뉴
const BAD_MENUS = [
  'ACCT6011','APTI0001','APTI0002','APTI0003','APTI0005','APTI0006','APTI0007','APTI0008',
  'BANK0010','BANK0020','BANK0030','BANK0040','BANK0060','BANK0080','BANK0090',
  'BANK1010','BANK1030','BANK1050','BANK1070','BANK1080','BANK1090','BANK1100','BANK1200',
  'BANK2010','BANK2020',
  'IMPO3040',
  'JOBM1100','JOBM1200','JOBM1300','JOBM2100','JOBM2200','JOBM2300',
  'OCCP49880',
  'PAY1030','PAY3010','PAY3160','PAY4041','PAY4050','PAY4052','PAY4060','PAY5010','PAY5020','PAY5040','PAY5050'
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

async function aggressiveClosePopups() {
  for (let i = 0; i < 5; i++) {
    try {
      await page.evaluate(() => {
        document.querySelectorAll('.swal-button--confirm, .swal-button').forEach(b => b.click());
        document.querySelectorAll('.swal-overlay, .swal-modal').forEach(el => el.remove());
        document.querySelectorAll('a, button, span, input[type="button"], div').forEach(el => {
          const t = (el.textContent || el.value || '').trim();
          if ((t === '닫기' || t === '오늘 하루 보지 않기' || t === '확인' || t === 'Close' || t === 'X' || t === '×') && el.offsetParent !== null) {
            try { el.click(); } catch(e) {}
          }
        });
        // 팝업/배너/오버레이 DOM에서 완전 제거
        document.querySelectorAll('.swal-overlay, .modal-backdrop, .modal, [class*="popup"], [class*="Popup"], [class*="layer_pop"], [class*="banner"], [class*="Banner"], [class*="float_"], [id*="floatBanner"], [class*="bnr"], .dimmed, .dim, [class*="overlay"]').forEach(el => el.remove());
      });
    } catch(e) {}
    await page.waitForTimeout(300);
  }
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      await frame.evaluate(() => {
        document.querySelectorAll('.swal-button--confirm, .swal-button').forEach(b => b.click());
        document.querySelectorAll('.swal-overlay, .swal-modal').forEach(el => el.remove());
      });
    } catch(e) {}
  }
}

async function loginFresh() {
  await page.goto('https://devel.xperp.co.kr/main.do', { waitUntil: 'networkidle', timeout: 30000 });
  if (page.url().includes('login')) {
    await page.fill('#loginId', 'xb00015');
    await page.fill('#loginPw', 'b123456789');
    await page.click('a.login_btn');
    await page.waitForTimeout(5000);
  } else {
    await page.waitForTimeout(2000);
  }
  await aggressiveClosePopups();

  // dummy 메뉴로 초기 팝업 트리거
  try {
    await page.evaluate(() => { MenuCall('DANG0010'); });
    await page.waitForTimeout(3000);
    await aggressiveClosePopups();
    await page.evaluate(() => { if (typeof closeAllTabPage === 'function') closeAllTabPage(); });
    await page.waitForTimeout(1000);
  } catch(e) {}
  await aggressiveClosePopups();
}

await loginFresh();
console.log('로그인 완료');

let ok = 0, fail = 0;

for (let i = 0; i < BAD_MENUS.length; i++) {
  const menuId = BAD_MENUS[i];

  // 매 4개마다 완전 새로고침 (iframe 누적 방지 강화)
  if (i > 0 && i % 4 === 0) {
    console.log(`--- 리프레시 (${i}/${BAD_MENUS.length}) ---`);
    await loginFresh();
  }

  try {
    // 기존 탭 모두 닫기
    await page.evaluate(() => {
      if (typeof closeAllTabPage === 'function') closeAllTabPage();
      // 모든 iframe 강제 제거
      document.querySelectorAll('iframe').forEach(f => {
        if (f.src && (f.src.includes('MENU_ID') || f.src.includes('menu'))) {
          f.remove();
        }
      });
    });
    await page.waitForTimeout(500);

    // 메뉴 호출
    const callResult = await page.evaluate((id) => {
      try { MenuCall(id); return 'ok'; } catch(e) { return 'error:' + e.message; }
    }, menuId);

    if (callResult !== 'ok') {
      console.log(`SKIP: ${menuId} - ${callResult}`);
      fail++;
      continue;
    }

    // iframe 찾기
    let targetFrame = null;
    for (let wait = 0; wait < 20; wait++) {
      await page.waitForTimeout(500);
      for (const f of page.frames()) {
        const url = f.url();
        if (url.includes(menuId) || url.includes(encodeURIComponent(menuId))) {
          targetFrame = f;
          break;
        }
      }
      if (targetFrame) break;
    }

    if (!targetFrame) {
      console.log(`FAIL: ${menuId} - iframe not found`);
      fail++;
      continue;
    }

    // 컨텐츠 로딩 대기
    await page.waitForTimeout(3000);
    await aggressiveClosePopups();

    // iframe 내 팝업 닫기
    try {
      await targetFrame.evaluate(() => {
        document.querySelectorAll('.swal-button--confirm, .swal-button').forEach(b => b.click());
        document.querySelectorAll('.swal-overlay, .swal-modal, [class*="popup"], [class*="layer_pop"]').forEach(el => el.remove());
      });
    } catch(e) {}

    // 조회 버튼 클릭
    try {
      const clicked = await targetFrame.evaluate(() => {
        const all = document.querySelectorAll('a, button, input[type="button"], span, img');
        for (const el of all) {
          const t = (el.textContent || el.value || el.alt || '').trim();
          if (t === '조회' && el.offsetParent !== null) { el.click(); return true; }
        }
        const titled = document.querySelector('[title="조회"], [alt="조회"]');
        if (titled && titled.offsetParent !== null) { titled.click(); return true; }
        return false;
      });
      if (clicked) {
        await page.waitForTimeout(2000);
        try {
          await targetFrame.evaluate(() => {
            document.querySelectorAll('.swal-button--confirm, .swal-button').forEach(b => b.click());
            document.querySelectorAll('.swal-overlay, .swal-modal').forEach(el => el.remove());
          });
        } catch(e) {}
      }
    } catch(e) {}

    await aggressiveClosePopups();
    await page.waitForTimeout(500);

    // 핵심 변경: iframe의 element handle을 찾아서 해당 요소만 스크린샷
    const iframeElement = await page.evaluate((id) => {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        if (iframe.src && (iframe.src.includes(id) || iframe.src.includes(encodeURIComponent(id)))) {
          // iframe을 화면 전체로 확장
          iframe.style.position = 'fixed';
          iframe.style.top = '0';
          iframe.style.left = '0';
          iframe.style.width = '100vw';
          iframe.style.height = '100vh';
          iframe.style.zIndex = '999999';
          iframe.style.border = 'none';
          return true;
        }
      }
      return false;
    }, menuId);

    if (iframeElement) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${menuId}.png` });
      console.log(`OK: ${menuId}`);
      ok++;
    } else {
      // fallback: 일반 스크린샷
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${menuId}.png` });
      console.log(`OK(fallback): ${menuId}`);
      ok++;
    }

    // iframe 스타일 원복 및 탭 닫기
    try {
      await page.evaluate(() => {
        document.querySelectorAll('iframe').forEach(f => {
          f.style.position = '';
          f.style.top = '';
          f.style.left = '';
          f.style.width = '';
          f.style.height = '';
          f.style.zIndex = '';
        });
        if (typeof closeAllTabPage === 'function') closeAllTabPage();
      });
    } catch(e) {}
    await page.waitForTimeout(300);

  } catch(e) {
    console.log(`FAIL: ${menuId} - ${e.message}`);
    fail++;
  }
}

await browser.close();
console.log(`\n=== 재캡처 완료: 성공 ${ok}, 실패 ${fail} / 총 ${BAD_MENUS.length} ===`);
