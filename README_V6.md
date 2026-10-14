# new-busan-parking V6.0 - AI 결과 화면 구조

## 이번 단계에서 한 일
- V5 일반 검색 기능은 그대로 유지
- 별도의 AI 자연어 입력창 추가
- AI 설명 영역 추가
- MCP 조회 결과를 기존 주차장 카드 형태로 표시할 수 있는 `renderAiResult()` 준비

## 결과 표시 원칙
V6는 결과 모양 자체가 V5와 완전히 달라지는 것이 아니다.

- V5: 사용자가 검색 기능을 직접 사용 → 주차장 카드 표시
- V6: AI가 요청을 이해하고 MCP Tool을 선택 → AI 설명 + 기존 주차장 카드 표시

즉 V6에서도 기존 카드 UI를 그대로 재사용할 수 있다.

## 아직 하지 않은 것
현재 단계에서는 실제 AI API와 MCP 연결을 하지 않았다.
따라서 AI 입력창의 자연어를 실제로 해석하지 않는다.

## 다음 단계
1. MCP Server 기본 구조
2. `search_parking` / `find_available_parking` Tool
3. `/api/parking` 연결
4. AI API 연결
5. AI 설명 + 카드 출력

## 권장 버전
V6.0 - AI 결과 UI 구조 준비
