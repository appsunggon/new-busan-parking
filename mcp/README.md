# 부산 공영주차장 V6.1 - MCP 서버 + 첫 번째 Tool

## 이번 단계의 목표

V6.0에서 만든 AI 입력창과는 별도로,
AI가 사용할 수 있는 MCP 서버와 첫 번째 Tool을 준비합니다.

이번 단계에서는 AI API(Gemini 등)를 아직 연결하지 않습니다.

## 추가된 구조

```text
mcp/
├─ package.json
├─ tsconfig.json
├─ .env.example
└─ src/
   ├─ index.ts
   ├─ parkingApi.ts
   └─ tools/
      └─ searchParking.ts
```

## 각 파일 역할

- `src/index.ts`
  - MCP 서버 생성
  - `search_parking` Tool 등록
  - stdio 방식으로 MCP 요청 대기

- `src/parkingApi.ts`
  - 기존 `/api/parking` 호출
  - 검색에 사용하는 문자열 정규화 함수 제공

- `src/tools/searchParking.ts`
  - `화명` 같은 키워드로 주차장 검색
  - V3에서 사용한 것과 같은 앞부분 일치 우선 + 부분검색 방식 적용
  - 검색 결과를 MCP가 반환하기 좋은 형태로 정리

## 설치

Node.js 20 이상이 필요합니다.

```bash
cd mcp
npm install
```

## 실행

```bash
npm start
```

이 상태에서는 화면이 뜨는 것이 아니라
MCP 클라이언트의 요청을 기다립니다.

## MCP Inspector로 직접 테스트

```bash
npm run inspect
```

브라우저에서 Inspector가 열리면:

1. Connect
2. Tools
3. `search_parking`
4. keyword에 `화명` 입력
5. Run Tool

을 실행합니다.

성공하면 `/api/parking`에서 가져온 실제 데이터 중
이름에 `화명`이 들어간 주차장 목록이 반환됩니다.

## 현재 구조

```text
MCP Inspector
    ↓
MCP Server
    ↓
search_parking
    ↓
/api/parking
    ↓
부산 공영주차장 데이터
```

## 아직 하지 않은 것

- Gemini API 연결
- 자연어 의미 해석
- AI의 Tool 자동 선택
- `find_available_parking`
- `get_parking_detail`
- V6 화면과 MCP 실제 연결

이것들은 다음 단계에서 진행합니다.

## 권장 커밋 메시지

```text
feat: MCP 서버와 search_parking Tool 추가
```
