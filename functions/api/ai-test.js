// V6.3-1
// Gemini API 연결 확인용 Cloudflare Pages Function
//
// 수정 내용:
// - Gemini 3.8 Flash는 기본적으로 thinking을 사용하므로
//   maxOutputTokens를 너무 작게 잡으면 생각 토큰만 쓰고
//   실제 답변 텍스트가 비어 있을 수 있다.
// - thinkingLevel을 low로 지정하고 작은 maxOutputTokens 제한은 제거한다.

const MODEL =
  "gemini-3.8-flash";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;


function jsonResponse(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store"
      }
    }
  );

}


export async function onRequestGet(
  context
) {

  const apiKey =
    context.env.GEMINI_API_KEY;


  if (!apiKey) {

    return jsonResponse(
      {
        success: false,
        step: "secret-check",
        message:
          "GEMINI_API_KEY가 Cloudflare Secret에 설정되어 있지 않습니다."
      },
      500
    );

  }


  try {

    const response =
      await fetch(
        GEMINI_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              apiKey
          },

          body:
            JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text:
                        "다른 설명 없이 정확히 이 문장만 출력하세요: Gemini API 연결 성공"
                    }
                  ]
                }
              ],

              generationConfig: {
                thinkingConfig: {
                  thinkingLevel: "low"
                }
              }
            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      return jsonResponse(
        {
          success: false,
          step: "gemini-api",
          status: response.status,
          message:
            "Gemini API 호출에 실패했습니다.",
          detail:
            data?.error?.message ||
            "상세 오류 정보 없음"
        },
        response.status
      );

    }


    const candidate =
      data?.candidates?.[0];


    const text =
      candidate?.content?.parts
        ?.filter(
          part =>
            !part?.thought &&
            typeof part?.text === "string"
        )
        .map(
          part =>
            part.text
        )
        .join("")
        .trim();


    return jsonResponse(
      {
        success: true,
        step: "gemini-api",
        model: MODEL,
        message:
          "Cloudflare에서 Gemini API 호출에 성공했습니다.",
        geminiResponse:
          text ||
          "응답 텍스트 없음",
        finishReason:
          candidate?.finishReason ||
          "정보 없음"
      }
    );

  }
  catch (error) {

    return jsonResponse(
      {
        success: false,
        step: "network",
        message:
          "Gemini API 호출 중 예외가 발생했습니다.",
        detail:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );

  }

}


export async function onRequest(
  context
) {

  if (
    context.request.method ===
    "GET"
  ) {

    return onRequestGet(
      context
    );

  }


  return jsonResponse(
    {
      success: false,
      message:
        "V6.3-1 테스트에서는 GET 요청만 사용합니다."
    },
    405
  );

}
