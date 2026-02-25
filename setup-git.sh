#!/bin/bash
cd "$(dirname "$0")"

echo "=== 1. Git init ==="
git init

echo "=== 2. Add remote ==="
git remote add origin https://github.com/Jinhwa-Aegis/xpguide.git

echo "=== 3. Create .gitignore ==="
cat > .gitignore << 'GITIGNORE'
node_modules/
wiki/docs/.vitepress/dist/
wiki/docs/.vitepress/cache/
.DS_Store
*.log
setup-git.sh
GITIGNORE

echo "=== 4. Stage all files ==="
git add .

echo "=== 5. Commit ==="
git commit -m "$(cat <<'EOF'
feat: 업무 시나리오 가이드 10개 추가 및 용어 사전 확장

- 업무 시나리오 가이드 10개 신규 작성 (guide/scenarios/)
  - 검침 처리, 관리비 부과, 수납 처리, 미수금 관리, 월말 마감
  - 지출 전표 입력, 통장 대사, 연말 결산, 전출입 처리, 급여 처리
- 용어 사전 대폭 확장 (25개 → 84개) 및 차변/대변 설명 추가
- 홈페이지에 시나리오 가이드 테이블 및 CTA 버튼 추가
- 시작하기 페이지에 시나리오 가이드 안내 추가
- config.ts 네비게이션에 업무 시나리오 섹션 추가

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"

echo "=== 6. Push ==="
git branch -M main
git push -u origin main

echo "=== Done ==="
