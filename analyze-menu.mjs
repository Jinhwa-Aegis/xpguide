import fs from 'fs';
const data = JSON.parse(fs.readFileSync('C:/aegis_dx/reference/xpguide/menu_live.json', 'utf8'));

console.log('총 메뉴:', data.length, '개');

// 트리 구조로 출력
function printTree(parentId, depth) {
  const children = data.filter(m => m.HRANK_MENU_ID === parentId).sort((a,b) => a.MENU_ORD - b.MENU_ORD);
  for (const c of children) {
    const indent = '  '.repeat(depth);
    const url = c.URL_PATH || '';
    const leaf = c.ISLEAF ? '*' : '';
    console.log(`${indent}${c.MENU_ID} | ${c.MENU_NM}${leaf} | ${url}`);
    printTree(c.MENU_ID, depth + 1);
  }
}

// 대메뉴 목록
const topMenus = data.filter(m => m.LVL === '1').sort((a,b) => a.MENU_ORD - b.MENU_ORD);
for (const top of topMenus) {
  console.log(`\n=== ${top.MENU_NM} (${top.MENU_ID}) ===`);
  printTree(top.MENU_ID, 1);
}
