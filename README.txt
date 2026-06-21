Cloudflare Pages + Functions + D1 배포용 파일입니다.

구성
- student.html: 학생용 화면
- admin.html: 관리자용 화면
- functions/api/data.js: /api/data 저장·조회 API
- schema.sql: D1 데이터베이스 테이블 생성 SQL

배포 요약
1. Cloudflare D1 데이터베이스를 만듭니다.
2. D1 콘솔에서 schema.sql 내용을 실행합니다.
3. Cloudflare Pages 프로젝트에 이 폴더를 업로드하거나 GitHub로 연결합니다.
4. Pages 설정 > Functions > D1 bindings에서 binding name을 반드시 DB로 지정합니다.
5. 배포 후 /student.html, /admin.html로 접속합니다.

주의
- HTML만 올리면 작동하지 않습니다. functions/api/data.js와 D1 binding이 함께 있어야 여러 기기 데이터가 공유됩니다.
- 관리자 비밀번호 기능은 아직 넣지 않았습니다. 실제 배포 전에는 admin.html 접근 보호를 Cloudflare Access 또는 별도 로그인으로 설정하는 것을 권장합니다.
