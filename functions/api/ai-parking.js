// V6.3-2
// 자연어 주차장 요청 처리용 Cloudflare Pages Function
//
// 흐름:
// PWA AI 입력창
//   → /api/ai-parking
//   → Gemini가 요청 의미 해석
//   → 기존 /api/parking 조회
//   → 검색 / 빈자리순 / 상세조회 처리
//   → 결과 JSON 반환
//
// 주의:
// GEMINI_API_KEY는 Cloudflare Secret에만 저장합니다.

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


function normalizeSearch(
  text = ""
) {

  return String(text)
    .replace(/\s+/g, "")
    .replace(/[(),]/g, "")
    .toLowerCase();

}


// 사용자가 "화명역 주차장"처럼 일반명사까지 입력해도
// 실제 데이터의 "화명역"과 매칭되도록 상세조회용 이름을 한 번 더 정리한다.
function normalizeParkingNameForMatch(
  text = ""
) {

  return normalizeSearch(text)
    .replace(/공영주차장/g, "")
    .replace(/주차장/g, "")
    .replace(/주차/g, "");

}


function getSearchText(
  parking
) {

  return normalizeSearch(
    [
      parking.parknm,
      parking.guNm,
      parking.doroAddr,
      parking.jibunAddr
    ]
      .filter(Boolean)
      .join(" ")
  );

}


function hasAvailableValue(
  parking
) {

  return (
    parking.curravacnt !== null &&
    parking.curravacnt !== undefined &&
    parking.curravacnt !== "" &&
    parking.curravacnt !== "-"
  );

}


function searchItems(
  parkingData,
  keyword
) {

  const target =
    normalizeSearch(keyword);


  if (!target) {
    return [];
  }


  // 주차장 이름이 검색어로 시작하는 결과를 먼저 배치
  const startsWithName =
    parkingData.filter(
      parking =>
        normalizeSearch(
          parking.parknm || ""
        ).startsWith(target)
    );


  const used =
    new Set(
      startsWithName.map(
        item =>
          item.parknm
      )
    );


  // 이름 / 구 / 주소에 검색어가 포함되는 결과 추가
  const includes =
    parkingData.filter(
      parking =>
        !used.has(parking.parknm) &&
        getSearchText(parking).includes(target)
    );


  return [
    ...startsWithName,
    ...includes
  ];

}


function extractGeminiText(
  data
) {

  return (
    data?.candidates?.[0]
      ?.content?.parts
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
      .trim() ||
    ""
  );

}


function parseJsonText(
  text
) {

  const cleaned =
    String(text)
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();


  return JSON.parse(
    cleaned
  );

}


async function understandRequest(
  apiKey,
  message
) {

  const prompt =
`당신은 부산 공영주차장 검색 요청을 분류하는 프로그램입니다.

사용자 문장을 읽고 아래 3개 intent 중 하나를 고르세요.

1. search_parking
- 단순히 주차장을 찾거나 검색
- 예: "화명 주차장 찾아줘"

2. find_available_parking
- 빈자리, 여유 공간, 주차 가능한 곳, 빈자리 많은 순 요청
- 예: "화명 쪽에서 지금 빈자리 많은 주차장 찾아줘"

3. get_parking_detail
- 특정 주차장의 요금, 운영시간, 주소, 관리기관, 상세정보 요청
- 예: "화명역 주차장 요금과 운영시간 알려줘"

반드시 JSON 하나만 출력하세요.

형식:
{
  "intent": "search_parking | find_available_parking | get_parking_detail",
  "keyword": "검색 지역 또는 주차장 이름",
  "name": "상세조회할 정확한 주차장 이름 또는 빈 문자열",
  "limit": 5
}

규칙:
- keyword에는 "쪽", "근처", "주차장 찾아줘" 같은 불필요한 표현을 제거하세요.
- 상세조회이면 name에 실제 고유 주차장 이름만 넣으세요. 사용자가 붙인 일반 표현 "주차장", "공영주차장"은 가능하면 제거하세요.
- 상세조회가 아니면 name은 빈 문자열로 두세요.
- limit 기본값은 5입니다.
- 사용자가 특정 개수를 요청하면 limit에 반영하세요.
- 모르는 정보는 만들지 마세요.

사용자 요청:
${message}`;


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
                      prompt
                  }
                ]
              }
            ],

            generationConfig: {
              temperature: 0,

              responseMimeType:
                "application/json",

              thinkingConfig: {
                thinkingLevel:
                  "low"
              }
            }
          })
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data?.error?.message ||
      "Gemini API 요청 분석에 실패했습니다."
    );

  }


  const text =
    extractGeminiText(
      data
    );


  if (!text) {

    throw new Error(
      "Gemini가 요청 분석 결과를 반환하지 않았습니다."
    );

  }


  const parsed =
    parseJsonText(
      text
    );


  const allowedIntents =
    new Set([
      "search_parking",
      "find_available_parking",
      "get_parking_detail"
    ]);


  if (
    !allowedIntents.has(
      parsed.intent
    )
  ) {

    throw new Error(
      "Gemini가 알 수 없는 검색 기능을 선택했습니다."
    );

  }


  return {
    intent:
      parsed.intent,

    keyword:
      String(
        parsed.keyword || ""
      ).trim(),

    name:
      String(
        parsed.name || ""
      ).trim(),

    limit:
      Math.max(
        1,
        Math.min(
          Number(
            parsed.limit || 5
          ),
          20
        )
      )
  };

}


async function fetchParkingData(
  requestUrl
) {

  const parkingUrl =
    new URL(
      "/api/parking",
      requestUrl
    );


  const response =
    await fetch(
      parkingUrl.toString(),
      {
        headers: {
          "Accept":
            "application/json"
        }
      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    data?.success === false
  ) {

    throw new Error(
      data?.message ||
      `주차장 API 호출 실패: HTTP ${response.status}`
    );

  }


  return Array.isArray(
    data?.items
  )
    ? data.items
    : [];

}


function handleSearchParking(
  parkingData,
  requestInfo
) {

  const items =
    searchItems(
      parkingData,
      requestInfo.keyword
    )
      .slice(
        0,
        requestInfo.limit
      );


  return {
    items,

    summary:
      items.length > 0
        ? `"${requestInfo.keyword}" 관련 주차장 ${items.length}곳을 찾았습니다.`
        : `"${requestInfo.keyword}" 관련 주차장을 찾지 못했습니다.`
  };

}


function handleAvailableParking(
  parkingData,
  requestInfo
) {

  const items =
    searchItems(
      parkingData,
      requestInfo.keyword
    )
      .sort(
        (a, b) => {

          const aHas =
            hasAvailableValue(a);

          const bHas =
            hasAvailableValue(b);


          if (
            !aHas &&
            !bHas
          ) {
            return 0;
          }


          if (!aHas) {
            return 1;
          }


          if (!bHas) {
            return -1;
          }


          return (
            Number(b.curravacnt) -
            Number(a.curravacnt)
          );

        }
      )
      .slice(
        0,
        requestInfo.limit
      );


  return {
    items,

    summary:
      items.length > 0
        ? `"${requestInfo.keyword}" 관련 주차장을 현재 빈자리 많은 순으로 정리했습니다.`
        : `"${requestInfo.keyword}" 관련 주차장을 찾지 못했습니다.`
  };

}


function handleParkingDetail(
  parkingData,
  requestInfo
) {

  const targetName =
    requestInfo.name ||
    requestInfo.keyword;


  const normalizedTarget =
    normalizeParkingNameForMatch(
      targetName
    );


  let item =
    parkingData.find(
      parking =>
        normalizeParkingNameForMatch(
          parking.parknm || ""
        ) === normalizedTarget
    );


  if (!item) {

    const candidates =
      parkingData.filter(
        parking => {

          const parkingName =
            normalizeParkingNameForMatch(
              parking.parknm || ""
            );


          return (
            parkingName.startsWith(
              normalizedTarget
            ) ||
            parkingName.includes(
              normalizedTarget
            ) ||
            normalizedTarget.includes(
              parkingName
            )
          );

        }
      );


    if (
      candidates.length === 1
    ) {

      item =
        candidates[0];

    }
    else if (
      candidates.length > 1
    ) {

      return {
        items:
          candidates.slice(0, 5),

        summary:
          `"${targetName}"과 비슷한 주차장이 여러 곳입니다. 아래 결과에서 원하는 주차장을 확인해주세요.`
      };

    }

  }


  if (!item) {

    return {
      items: [],

      summary:
        `"${targetName}"에 해당하는 주차장을 찾지 못했습니다.`
    };

  }


  return {
    items: [
      item
    ],

    summary:
      `"${item.parknm}" 상세정보입니다.`
  };

}


export async function onRequestPost(
  context
) {

  const apiKey =
    context.env.GEMINI_API_KEY;


  if (!apiKey) {

    return jsonResponse(
      {
        success: false,
        message:
          "GEMINI_API_KEY가 설정되어 있지 않습니다."
      },
      500
    );

  }


  try {

    const body =
      await context.request.json();


    const message =
      String(
        body?.message || ""
      ).trim();


    if (!message) {

      return jsonResponse(
        {
          success: false,
          message:
            "AI에게 요청할 내용을 입력해주세요."
        },
        400
      );

    }


    // 1. Gemini가 자연어 요청의 의미를 이해
    const requestInfo =
      await understandRequest(
        apiKey,
        message
      );


    // 2. 기존 통합 주차장 API에서 실제 데이터 조회
    const parkingData =
      await fetchParkingData(
        context.request.url
      );


    // 3. Gemini가 선택한 의도에 따라
    //    서버 코드가 안전하게 실제 기능 실행
    let result;


    if (
      requestInfo.intent ===
      "find_available_parking"
    ) {

      result =
        handleAvailableParking(
          parkingData,
          requestInfo
        );

    }
    else if (
      requestInfo.intent ===
      "get_parking_detail"
    ) {

      result =
        handleParkingDetail(
          parkingData,
          requestInfo
        );

    }
    else {

      result =
        handleSearchParking(
          parkingData,
          requestInfo
        );

    }


    return jsonResponse(
      {
        success: true,

        message:
          body.message,

        interpretation:
          requestInfo,

        summary:
          result.summary,

        items:
          result.items
      }
    );

  }
  catch (error) {

    return jsonResponse(
      {
        success: false,

        message:
          "AI 주차장 요청 처리 중 오류가 발생했습니다.",

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
    "POST"
  ) {

    return onRequestPost(
      context
    );

  }


  return jsonResponse(
    {
      success: false,
      message:
        "POST 요청만 사용할 수 있습니다."
    },
    405
  );

}
