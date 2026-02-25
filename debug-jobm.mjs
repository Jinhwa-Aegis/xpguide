import { chromium } from 'playwright';

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
      document.querySelectorAll('.swal-overlay, .swal-modal').forEach(el => el.remove());
      document.querySelectorAll('a, button, span').forEach(el => {
        const t = (el.textContent || '').trim();
        if ((t === '닫기' || t === '오늘 하루 보지 않기' || t === '확인') && el.offsetParent !== null) {
          try { el.click(); } catch(e) {}
        }
      });
    });
  } catch(e) {}
  await page.waitForTimeout(400);
}

// JOBM1100 호출
const r = await page.evaluate(() => {
  try { MenuCall('JOBM1100'); return 'ok'; } catch(e) { return 'error: ' + e.message; }
});
console.log('MenuCall result:', r);
await page.waitForTimeout(5000);

// 모든 프레임 URL 출력
for (const f of page.frames()) {
  console.log('Frame URL:', f.url());
}

// 모든 iframe src 속성 출력
const iframeSrcs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('iframe')).map(f => ({
    src: f.src,
    id: f.id,
    name: f.name,
    display: f.style.display,
    visible: f.offsetParent !== null
  }));
});
console.log('Iframes:', JSON.stringify(iframeSrcs, null, 2));

await browser.close();
