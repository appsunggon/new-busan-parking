# V6.3-1 Gemini API 연결 테스트

## 이번 단계의 목적

아직 AI 입력창과 MCP를 연결하지 않습니다.

먼저 Cloudflare Pages Function에서
`GEMINI_API_KEY` Secret을 정상적으로 읽고,
Gemini API를 실제로 호출할 수 있는지만 확인합니다.

## 추가 파일

```text
functions/
└─ api/
   └─ ai-test.js
```

기존 프로젝트 루트에 이 폴더 구조 그대로 복사합니다.

이미 `functions/api/` 폴더가 있으므로
실제로는 `ai-test.js` 파일 하나가 추가되는 것입니다.

## 배포 후 테스트

Git 커밋/푸시 후 Cloudflare 배포가 완료되면 브라우저에서:

```text
https://new-busan-parking.pages.dev/api/ai-test
```

를 엽니다.

정상이면 대략 다음과 같이 나옵니다.

```json
{
  "success": true,
  "step": "gemini-api",
  "model": "gemini-3.8-flash",
  "message": "Cloudflare에서 Gemini API 호출에 성공했습니다.",
  "geminiResponse": "Gemini API 연결 성공"
}
```

## 오류별 의미

### GEMINI_API_KEY가 없다고 나옴
Cloudflare의 Variables and Secrets에서
`GEMINI_API_KEY`가 Secret으로 저장됐는지 확인합니다.

### Gemini API 호출 실패
키 상태, API 사용 가능 여부, 모델 사용 가능 여부를 확인합니다.

## 보안

API 키는 다음 위치에 넣지 않습니다.

- app.js
- index.html
- GitHub
- ai-test.js

키는 Cloudflare Secret의 `GEMINI_API_KEY`에만 저장합니다.

## 테스트가 끝난 뒤

`ai-test.js`는 연결 확인용 임시 파일입니다.
V6.3 실제 AI 기능이 완성되면 삭제해도 됩니다.

## 권장 커밋 메시지

```text
test: Gemini API 연결 확인용 Function 추가
```
