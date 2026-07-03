공연 일정표 배포 안내 - 우주선 프로젝트와 같은 기본 구조

1. 이 압축 파일을 풉니다.
2. 아래 파일들이 GitHub 저장소 맨 위에 바로 보이도록 업로드합니다.

   index.html
   functions/api/shows.js
   schema.sql
   README.txt

   주의: musical_schedule_spaceship_style 폴더째 넣지 말고, 폴더 안의 파일들을 저장소 최상단에 올립니다.

3. Cloudflare의 Workers 및 Pages에서 GitHub 저장소를 연결해 배포합니다.
4. D1 SQLite 데이터베이스를 만듭니다. 예: muscheddb
5. 프로젝트의 바인딩에서 D1 데이터베이스를 연결합니다.

   변수 이름: DB
   D1 데이터베이스: muscheddb

6. D1의 콘솔 또는 데이터 탐색에서 schema.sql 내용을 실행합니다.
   단, functions/api/shows.js에도 테이블 자동 생성 코드가 있어서 첫 접속 시 자동 생성될 수 있습니다.

7. 다시 배포한 뒤 /api/shows 주소가 JSON을 반환하면 연결 성공입니다.

테스트 방법
- 사이트 주소 접속
- 공연 추가
- 새로고침
- 다른 기기 또는 시크릿 창에서 같은 주소 접속
- 같은 공연 목록이 보이면 성공입니다.
