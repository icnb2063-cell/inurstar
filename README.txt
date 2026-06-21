우리 반 우주 Cloudflare Pages + Functions + D1 배포용(v2)

포함 파일
- student.html: 학생용 화면. 오른쪽 아래 🔐 관리자 버튼 추가. 비밀번호 6435.
- admin.html: 관리자 화면. 직접 접속해도 비밀번호 6435 입력 후 열림.
- functions/api/data.js: Cloudflare Pages Functions API. /api/data 경로로 D1에 저장.
- schema.sql: D1 수동 초기화용 SQL. v2에서는 data.js가 테이블을 자동 생성하지만, 필요 시 실행 가능.

중요 설정
1. 이 폴더 전체를 GitHub 저장소에 업로드합니다.
2. Cloudflare Pages에서 GitHub 저장소를 연결해 배포합니다.
   - ZIP/HTML 직접 업로드 방식은 Pages Functions가 작동하지 않을 수 있습니다.
3. Cloudflare Pages 프로젝트 > Settings > Functions > D1 database bindings에서
   - Variable name: DB
   - D1 database: 생성한 데이터베이스
   로 반드시 연결합니다.
4. 배포 후 아래 주소가 JSON으로 열리는지 확인합니다.
   https://배포주소.pages.dev/api/data

/api/data에서 오류가 나오면
- "D1 binding DB가 없습니다" → D1 binding 이름을 DB로 설정하지 않은 상태입니다.
- 404 → functions/api/data.js가 배포되지 않았거나 직접 업로드 방식입니다.
- 500 → D1 연결 또는 권한 문제입니다.
