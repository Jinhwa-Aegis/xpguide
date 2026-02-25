import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// 로그인 페이지 접속
await page.goto('https://devel.xperp.co.kr/login.do', { waitUntil: 'networkidle', timeout: 30000 });
console.log('=== 로그인 페이지 도달 ===');

// 로그인 폼 입력
await page.fill('#loginId', 'xb00015');
await page.fill('#loginPw', 'b123456789');

// 로그인 버튼 클릭 (a.login_btn)
await page.click('a.login_btn');

// 로그인 후 페이지 로딩 대기
await page.waitForTimeout(5000);
console.log('=== 로그인 후 ===');
console.log('URL:', page.url());

// 스크린샷 저장
await page.screenshot({ path: 'C:/aegis_dx/reference/xpguide/screenshots/after-login.png', fullPage: true });
console.log('메인 스크린샷 저장 완료');

// 타이틀 확인
const title = await page.title();
console.log('Title:', title);

// 현재 페이지 텍스트 일부 확인
const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
console.log('Body:', bodyText);

// MENU_JSON 추출
try {
  const menuJson = await page.evaluate(() => {
    if (typeof MENU_JSON !== 'undefined') return JSON.stringify(MENU_JSON);
    return null;
  });
  if (menuJson) {
    fs.writeFileSync('C:/aegis_dx/reference/xpguide/menu_live.json', menuJson);
    console.log('MENU_JSON 추출 완료, 항목수:', JSON.parse(menuJson).length);
  } else {
    console.log('MENU_JSON 변수 없음 (프레임 확인 필요)');
  }
} catch (e) {
  console.log('MENU_JSON 추출 실패:', e.message);
}

// MENU_INFO 추출
try {
  const menuInfo = await page.evaluate(() => {
    if (typeof MENU_INFO !== 'undefined') return JSON.stringify(MENU_INFO);
    return null;
  });
  if (menuInfo) {
    fs.writeFileSync('C:/aegis_dx/reference/xpguide/menu_info.json', menuInfo);
    console.log('MENU_INFO 추출 완료');
  }
} catch (e) {
  console.log('MENU_INFO:', e.message);
}

// 프레임 확인
const frames = page.frames();
console.log('프레임 수:', frames.length);
for (const f of frames) {
  console.log('  프레임:', f.name(), f.url().substring(0, 80));
}

await browser.close();
