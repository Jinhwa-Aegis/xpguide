import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = 'C:/aegis_dx/reference/xpguide/wiki/docs/public/screenshots';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

async function aggressiveClosePopups() {
  for (let i = 0; i < 8; i++) {
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
        document.querySelectorAll('.swal-overlay, .modal-backdrop, .modal, [class*="popup"], [class*="Popup"], [class*="layer_pop"], [class*="banner"], [class*="Banner"], [class*="float_"], [id*="floatBanner"], [class*="bnr"], .dimmed, .dim, [class*="overlay"]').forEach(el => {
          el.style.setProperty('display', 'none', 'important');
        });
      });
    } catch(e) {}
    await page.waitForTimeout(400);
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

async function hideBanners() {
  try {
    await page.evaluate(() => {
      document.querySelectorAll('[class*="banner"], [class*="Banner"], [class*="float_"], [id*="floatBanner"], [class*="bnr"], .layer_pop, [class*="popup"], [class*="overlay"], .dimmed').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    });
  } catch(e) {}
}

// 로그인 + 초기 팝업 제거 (새로고침으로도 사용)
async function loginAndClean() {
  await page.goto('https://devel.xperp.co.kr/main.do', { waitUntil: 'networkidle', timeout: 30000 });

  // 로그인 페이지로 리다이렉트된 경우
  if (page.url().includes('login')) {
    await page.fill('#loginId', 'xb00015');
    await page.fill('#loginPw', 'b123456789');
    await page.click('a.login_btn');
    await page.waitForTimeout(5000);
  } else {
    await page.waitForTimeout(2000);
  }

  await aggressiveClosePopups();
  await hideBanners();

  // dummy 메뉴 호출 후 닫기 (팝업 트리거)
  try {
    await page.evaluate(() => { MenuCall('DANG0010'); });
    await page.waitForTimeout(3000);
    await aggressiveClosePopups();
    await hideBanners();
    // 전체 탭 닫기
    await page.evaluate(() => {
      if (typeof closeAllTabPage === 'function') closeAllTabPage();
    });
    await page.waitForTimeout(1000);
  } catch(e) {}

  await aggressiveClosePopups();
  await hideBanners();
}

// 로그인
await loginAndClean();
console.log('로그인 완료:', page.url());

// 메인 스크린샷
await page.screenshot({ path: `${SCREENSHOT_DIR}/main.png` });
console.log('메인 화면 캡처 완료');

async function captureMenu(menuId, description) {
  try {
    const callResult = await page.evaluate((id) => {
      try { MenuCall(id); return 'ok'; } catch(e) { return 'error:' + e.message; }
    }, menuId);

    if (callResult !== 'ok') {
      console.log(`SKIP: ${menuId} ${description} - ${callResult}`);
      return false;
    }

    // iframe 대기
    let targetFrame = null;
    for (let wait = 0; wait < 15; wait++) {
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
      console.log(`FAIL: ${menuId} ${description} - iframe not found`);
      return false;
    }

    await page.waitForTimeout(2000);
    await aggressiveClosePopups();
    await hideBanners();

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
    await hideBanners();
    await page.waitForTimeout(300);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/${menuId}.png` });
    console.log(`OK: ${menuId} ${description}`);
    return true;
  } catch (e) {
    console.log(`FAIL: ${menuId} ${description}: ${e.message}`);
    return false;
  }
}

// 전체 소메뉴 목록
const menuData = JSON.parse(fs.readFileSync('C:/aegis_dx/reference/xpguide/menu_live.json', 'utf8'));
const subMenus = menuData.filter(m =>
  m.LVL === '3' &&
  !m.MENU_ID.includes('MANUAL') &&
  !m.MENU_NM.includes('매뉴얼') &&
  !['TEST', 'SYST', 'VOTE', 'DESK', 'PAYS'].some(p => m.MENU_ID.startsWith(p))
);

console.log(`\n=== 총 ${subMenus.length}개 소메뉴 캡처 시작 ===\n`);

let ok = 0, fail = 0;
for (const m of subMenus) {
  const result = await captureMenu(m.MENU_ID, m.MENU_NM);
  if (result) ok++; else fail++;

  // 매 8개마다 페이지 새로고침 (iframe 누적 방지)
  if ((ok + fail) % 8 === 0) {
    console.log(`--- 진행: ${ok + fail}/${subMenus.length} (성공: ${ok}, 실패: ${fail}) - 리프레시 ---`);
    await loginAndClean();
  }
}

await browser.close();
console.log(`\n=== 캡처 완료: 성공 ${ok}, 실패 ${fail} / 총 ${subMenus.length} ===`);
