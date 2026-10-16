# V6.3-2 - AI 입력창 실제 연결

## 이번 단계의 목표

이미 화면에 있는 `AI에게 주차장 찾기 요청` 입력창을
실제 Gemini API와 `/api/parking`에 연결합니다.

이번 단계에서는 Remote MCP를 사용하지 않습니다.

실제 서비스 흐름:

```text
사용자
↓
PWA AI 입력창
↓
/api/ai-parking
↓
Gemini API가 자연어 의미 이해
↓
Cloudflare Function이 검색 방식 결정
↓
기존 /api/parking 조회
↓
AI 설명 + 기존 주차장 카드 표시
```

MCP는 별도의 학습/실습 구조로 그대로 유지합니다.

```text
MCP Inspector
↓
MCP Server
↓
Tool 3개
↓
/api/parking
```

## 추가 파일

```text
functions/api/ai-parking.js
```

## 수정 파일

```text
app.js
index.html
service-worker.js
```

### ai-parking.js

Gemini가 다음 3가지 의도 중 하나로 사용자 요청을 해석합니다.

- `search_parking`
- `find_available_parking`
- `get_parking_detail`

그 다음 실제 검색/정렬/상세조회는 Cloudflare Function이
기존 `/api/parking` 데이터를 이용해 처리합니다.

즉 Gemini에게 실제 주차장 숫자를 만들어내게 하지 않습니다.

### app.js

기존 AI 입력창의 [보내기] 버튼이 `/api/ai-parking`으로
실제 POST 요청을 보내도록 변경했습니다.

결과는 기존 `createParkingCard()`를 그대로 사용하므로
V5/V6의 카드 UI를 재사용합니다.

### index.html

안내 문구를 실제 구조에 맞게 수정했습니다.

기존:
`V6에서는 AI가 요청을 이해한 뒤 MCP Tool을 선택합니다.`

수정:
`AI가 요청을 이해한 뒤 실제 주차장 데이터를 조회합니다.`

### service-worker.js

PWA가 예전 `app.js`를 계속 보여주지 않도록
캐시 버전을 `busan-parking-v6-3-2`로 변경했습니다.

## 적용 방법

현재 `NEW-BUSAN-PARKING` 프로젝트에 압축 내용을 복사합니다.

- `functions/api/ai-parking.js` → 새 파일
- `app.js` → 덮어쓰기
- `index.html` → 덮어쓰기
- `service-worker.js` → 덮어쓰기

기존 `functions/api/parking.js`, `mcp/`, `lib/` 등은 건드리지 않습니다.

## 테스트 문장

### 일반 검색
`화명 주차장 찾아줘`

예상:
- Gemini → `search_parking`
- 관련 주차장 카드 표시

### 빈자리 많은 순
`화명 쪽에서 지금 빈자리 많은 주차장 찾아줘`

예상:
- Gemini → `find_available_parking`
- 빈자리 많은 순으로 카드 표시

### 상세조회
`화명역 주차장 요금과 운영시간 알려줘`

예상:
- Gemini → `get_parking_detail`
- 화명역 상세 카드 표시

## 배포 후 확인

Cloudflare 배포가 완료된 뒤 PWA 또는 웹에서
AI 입력창에 위 문장을 직접 입력합니다.

PWA 설치본이 예전 화면을 보여주면 앱을 완전히 종료 후 다시 열거나,
브라우저에서 새로고침하여 새 Service Worker가 적용되도록 합니다.

## 권장 커밋 메시지

```text
feat: AI 입력창을 Gemini와 주차장 API에 연결
```
