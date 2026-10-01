# new-busan-parking V5.0 - PWA 적용

## V5.0 목표
기존 웹서비스를 휴대폰 홈 화면에 설치하여 앱처럼 실행할 수 있게 한다.

## 새로 추가된 파일
- manifest.webmanifest
- service-worker.js
- icon-192.png
- icon-512.png

## 수정된 파일
- index.html
  - manifest 연결
  - theme-color / apple-touch-icon 추가
  - 앱 설치 버튼 및 안내문 추가
  - Service Worker 등록 코드 추가
- style.css
  - PWA 설치 안내 영역 스타일 추가

## 중요한 설계 원칙
실시간 주차정보 `/api/parking`은 Service Worker에서 캐시하지 않는다.
따라서 PWA로 설치해도 주차 가능 대수는 항상 네트워크에서 최신값을 가져온다.

정적 파일(HTML/CSS/JS/아이콘)은 캐시한다.

## 사용자 설치 흐름
1. Cloudflare Pages 주소 접속
2. 지원 브라우저에서는 [앱처럼 설치하기] 버튼 표시
3. 설치하면 홈 화면에서 앱처럼 실행
4. iPhone에서는 Safari의 공유 메뉴 → 홈 화면에 추가 사용

## 테스트
- Chrome/Edge: 앱 설치 가능 여부
- Android: 홈 화면 아이콘 생성 여부
- iPhone Safari: 홈 화면 추가 여부
- 설치 후 standalone 형태로 실행되는지
- `/api/parking` 최신정보가 계속 정상 갱신되는지

## 권장 커밋 메시지
feat: PWA 설치 기능과 오프라인 정적 캐시 추가
