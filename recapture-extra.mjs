import { chromium } from 'playwright';

const SCREENSHOT_DIR = 'C:/aegis_dx/reference/xpguide/wiki/docs/public/screenshots';
const MENUS = ['BANK0050', 'BANK0070'];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

await page.goto('https://devel.xperp.co.kr/main.do', { waitUntil: 'networkidle', timeout: 30000 });
if (page.url().includes('login')) {
  await page.fill('#loginId', 'xb00015');
  await page.fill('#loginPw', 'b123456789');
  await page.click('a.login_btn');
  await page.waitForTimeout(5000);
}

// 팝업 닫기
for (let i = 0; i < 5; i++) {
  try {
    await page.evaluate(() => {
      document.querySelectorAll('.swal-button--confirm, .swal-button').forEach(b => b.click());
      document.querySelectorAll('.swal-overlay, .swal-modal, [class*="popup"], [class*="banner"], [class*="Banner"]').forEach(el => el.remove());
      document.querySelectorAll('a, button, span').forEach(el => {
        const t = (el.textContent || '').trim();
        if (['닫기','오늘 하루 보지 않기','확인','Close','X','×'].includes(t) && el.offsetParent !== null) {
          try { el.click(); } catch(e) {}
        }
      });
    });
  } catch(e) {}
  await page.waitForTimeout(400);
}

// dummy 메뉴
try {
  await page.evaluate(() => { MenuCall('DANG0010'); });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 3; i++) {
    try { await page.evaluate(() => {
      document.querySelectorAll('.swal-button--confirm, .swal-button').forEach(b => b.click());
      document.querySelectorAll('.swal-overlay, .swal-modal, [class*="popup"], [class*="banner"]').forEach(el => el.remove());
    }); } catch(e) {}
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => { if (typeof closeAllTabPage === 'function') closeAllTabPage(); });
  await page.waitForTimeout(1000);
} catch(e) {}

for (const menuId of MENUS) {
  try {
    await page.evaluate(() => {
      if (typeof closeAllTabPage === 'function') closeAllTabPage();
      document.querySelectorAll('iframe').forEach(f => {
        if (f.src && f.src.includes('MENU_ID')) f.remove();
      });
    });
    await page.waitForTimeout(500);

    const r = await page.evaluate((id) => {
      try { MenuCall(id); return 'ok'; } catch(e) { return 'error:' + e.message; }
    }, menuId);

    if (r !== 'ok') { console.log(`SKIP: ${menuId} - ${r}`); continue; }

    let targetFrame = null;
    for (let wait = 0; wait < 20; wait++) {
      await page.waitForTimeout(500);
      for (const f of page.frames()) {
        if (f.url().includes(menuId) || f.url().includes(encodeURIComponent(menuId))) {
          targetFrame = f;
          break;
        }
      }
      if (targetFrame) break;
    }

    if (!targetFrame) { console.log(`FAIL: ${menuId} - iframe not found`); continue; }

    await page.waitForTimeout(3000);

    // iframe 전체화면
    await page.evaluate((id) => {
      for (const iframe of document.querySelectorAll('iframe')) {
        if (iframe.src && (iframe.src.includes(id) || iframe.src.includes(encodeURIComponent(id)))) {
          iframe.style.position = 'fixed';
          iframe.style.top = '0';
          iframe.style.left = '0';
          iframe.style.width = '100vw';
          iframe.style.height = '100vh';
          iframe.style.zIndex = '999999';
          iframe.style.border = 'none';
        }
      }
    }, menuId);
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/${menuId}.png` });
    console.log(`OK: ${menuId}`);
  } catch(e) {
    console.log(`FAIL: ${menuId} - ${e.message}`);
  }
}

await browser.close();
