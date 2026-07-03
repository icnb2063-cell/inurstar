inurstar 안정화 버전

업로드 파일:
- index.html
- admin.html
- functions/api/data.js
- schema.sql

주요 수정:
1. 학생 화면(index.html)은 학생 1명 데이터만 updateStudent 방식으로 저장합니다.
2. 관리자 화면(admin.html)은 학생별 수정은 학생 1명만 저장하고, 학생 추가/삭제/설정 변경만 전체 저장합니다.
3. functions/api/data.js는 updateStudent와 saveState를 구분하여 처리합니다.
4. 저장 요청이 겹칠 때 이전 데이터가 최신 조각 수를 덮어쓰는 문제를 줄였습니다.

배포 방법:
GitHub 저장소의 기존 파일을 같은 경로로 덮어쓴 뒤 Commit 하면 Cloudflare Pages가 자동 배포합니다.
D1 binding 이름은 기존처럼 DB여야 합니다.
