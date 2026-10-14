# 부산 공영주차장 V6.2 - MCP Tool 3개 구성

## 목표
V6.1의 `search_parking`에 두 Tool을 추가합니다.

```text
MCP Server
├─ search_parking
├─ find_available_parking
└─ get_parking_detail
```

이번 단계에서도 Gemini API는 아직 연결하지 않습니다.
MCP Inspector에서 각 Tool을 직접 실행해 정상 동작하는지만 확인합니다.

## Tool 1 - search_parking
주차장 이름을 검색합니다.

예: `keyword = 화명`

## Tool 2 - find_available_parking
검색 결과를 현재 빈자리 많은 순으로 정리합니다.

예:
```text
keyword = 화명
limit = 5
```

## Tool 3 - get_parking_detail
특정 주차장의 상세정보를 조회합니다.

예: `name = 화명역`

반환 정보: 빈자리, 총 주차면수, 현재 주차대수, 주소(공공데이터 기준), 기본요금, 운영시간, 관리기관, 최종 갱신시간.

입력한 이름이 여러 주차장과 일치하면 임의로 하나를 고르지 않고 후보 목록을 보여줍니다.

## 실제 API 주소
기본 주소를 실제 배포 주소로 수정했습니다.

`https://new-busan-parking.pages.dev/api/parking`

필요하면 `PARKING_API_URL` 환경변수로 다른 주소를 사용할 수 있습니다.

## Inspector 테스트 순서
```bash
cd mcp
npm install
npm run inspect
```

Inspector에서 `List Tools` 후 아래 세 가지를 차례로 테스트합니다.

1. `search_parking` → `화명`
2. `find_available_parking` → `화명`
3. `get_parking_detail` → `화명역`

세 Tool 모두 `Tool Result: Success`면 V6.2 완료입니다.

## 다음 단계
V6.3에서 Gemini API를 연결하여 사용자의 자연어 요청을 이해하고 세 Tool 중 적절한 Tool을 AI가 자동 선택하게 합니다.

## 권장 커밋 메시지
`feat: MCP 주차장 Tool 3종 구성 완료`
