// V6.4
// 부산 공영주차장 AI 자연어 검색 완성도 개선
//
// 핵심 원칙:
// 1) Gemini는 사용자의 말을 "검색 조건"으로 해석만 한다.
// 2) 실제 주차장 수치와 결과는 /api/parking 실제 데이터로 처리한다.
// 3) Gemini가 주차장 정보 자체를 만들어내지 않도록 한다.
//
// 흐름:
// 사용자 문장
// → Gemini가 JSON 조건으로 해석
// → 서버 코드가 조건 검증
// → /api/parking 실제 데이터 조회
// → 검색/필터/정렬
// → 결과 반환

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


// "화명역 주차장"과 실제 데이터의 "화명역"을 같은 이름으로 비교
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


function availableCount(
  parking
) {

  return hasAvailableValue(parking)
    ? Number(parking.curravacnt)
    : null;

}


function searchItems(
  parkingData,
  keyword
) {

  const target =
    normalizeSearch(keyword);


  // 지역/이름이 없는 경우:
  // "빈자리 10대 이상인 곳 3개" 같은 부산 전체 조건 검색 허용
  if (!target) {

    return [
      ...parkingData
    ];

  }


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
          item.parkgcd ||
          item.parknm
      )
    );


  const includes =
    parkingData.filter(
      parking => {

        const key =
          parking.parkgcd ||
          parking.parknm;


        return (
          !used.has(key) &&
          getSearchText(parking)
            .includes(target)
        );

      }
    );


  return [
    ...startsWithName,
    ...includes
  ];

}


function applyMinimumAvailable(
  items,
  minAvailable
) {

  if (
    minAvailable === null ||
    minAvailable === undefined
  ) {

    return items;

  }


  return items.filter(
    parking => {

      const count =
        availableCount(parking);


      return (
        count !== null &&
        count >= minAvailable
      );

    }
  );

}


function sortByAvailableDesc(
  items
) {

  return [
    ...items
  ].sort(
    (a, b) => {

      const aCount =
        availableCount(a);

      const bCount =
        availableCount(b);


      if (
        aCount === null &&
        bCount === null
      ) {
        return 0;
      }


      if (aCount === null) {
        return 1;
      }


      if (bCount === null) {
        return -1;
      }


      return (
        bCount -
        aCount
      );

    }
  );

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
`당신은 부산 공영주차장 서비스의 "요청 해석기"입니다.

중요:
- 당신이 주차장 정보나 빈자리 수를 직접 답하면 안 됩니다.
- 사용자의 문장을 아래 JSON 검색 조건으로만 바꾸세요.
- 실제 주차장 데이터 조회와 필터링은 별도 프로그램이 합니다.

intent는 다음 4개 중 하나입니다.

1. search_parking
단순히 지역/이름으로 주차장을 찾는 요청
예: "화명 주차장 찾아줘"

2. find_available_parking
빈자리, 여유, 주차 가능, 빈자리 많은 순, 가장 여유 있는 곳을 찾는 요청
예: "부산대 쪽에서 지금 빈자리 많은 주차장 찾아줘"
예: "화명에서 빈자리 10대 이상인 곳 3개만 찾아줘"
예: "화명에서 제일 여유 있는 곳 알려줘"

3. get_parking_detail
특정 주차장의 요금, 운영시간, 주소, 관리기관 등 상세정보 요청
예: "화명역 주차장 요금과 운영시간 알려줘"

4. clarify
주차장 검색과 관계가 없거나 검색에 필요한 뜻을 파악하기 어려운 요청

반드시 JSON 하나만 출력하세요.

형식:
{
  "intent": "search_parking | find_available_parking | get_parking_detail | clarify",
  "keyword": "검색 지역 또는 주차장 이름, 없으면 빈 문자열",
  "name": "상세조회할 고유 주차장 이름, 아니면 빈 문자열",
  "minAvailable": null,
  "sort": "default | available_desc",
  "limit": 5,
  "clarification": ""
}

해석 규칙:
- "쪽", "근처", "주변", "주차장 찾아줘" 같은 불필요한 표현은 keyword에서 제거하세요.
- 상세조회 name에는 "주차장", "공영주차장" 같은 일반 표현을 가능하면 제거하세요.
- "빈자리 10대 이상"이면 minAvailable = 10
- "3개만"이면 limit = 3
- "가장", "제일", "한 곳"이면 limit = 1
- "빈자리 많은 순", "여유 있는", "주차 가능한" 요청이면 sort = "available_desc"
- 일반검색은 sort = "default"
- 값이 없는 조건은 만들지 마세요.
- 부산 전체를 대상으로 "빈자리 10대 이상인 곳"처럼 요청하면 keyword는 빈 문자열이어도 됩니다.
- clarify일 때 clarification에 사용자가 다시 입력하면 좋을 짧은 안내문을 넣으세요.

사용자 요청:
${message}`;


  let response;
  let data;


  // Gemini의 일시적인 고수요(429/503) 상황은 자동으로 최대 2회 재시도한다.
  // 사용자의 검색 조건이나 /api/parking 데이터 문제와는 별개의 외부 API 상태이다.
  for (let attempt = 0; attempt < 3; attempt += 1) {

    response =
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


    data =
      await response.json();


    if (response.ok) {
      break;
    }


    const temporaryError =
      response.status === 429 ||
      response.status === 503 ||
      /high demand|temporar|overload|resource exhausted/i.test(
        data?.error?.message || ""
      );


    if (
      !temporaryError ||
      attempt === 2
    ) {
      break;
    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          700 * (attempt + 1)
        )
    );

  }


  if (!response?.ok) {

    const errorMessage =
      data?.error?.message ||
      "Gemini API 요청 분석에 실패했습니다.";


    const temporaryError =
      response?.status === 429 ||
      response?.status === 503 ||
      /high demand|temporar|overload|resource exhausted/i.test(
        errorMessage
      );


    if (temporaryError) {

      const error =
        new Error(
          "현재 AI 요청이 몰려 잠시 처리하지 못했습니다. 잠시 후 다시 보내주세요."
        );

      error.temporary =
        true;

      throw error;

    }


    throw new Error(
      errorMessage
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
      "get_parking_detail",
      "clarify"
    ]);


  const allowedSorts =
    new Set([
      "default",
      "available_desc"
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


  const rawMinAvailable =
    parsed.minAvailable;


  const minAvailable =
    (
      rawMinAvailable === null ||
      rawMinAvailable === undefined ||
      rawMinAvailable === ""
    )
      ? null
      : Math.max(
          0,
          Number(rawMinAvailable)
        );


  const limit =
    Math.max(
      1,
      Math.min(
        Number(
          parsed.limit || 5
        ),
        20
      )
    );


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

    minAvailable:
      Number.isFinite(minAvailable)
        ? minAvailable
        : null,

    sort:
      allowedSorts.has(
        parsed.sort
      )
        ? parsed.sort
        : "default",

    limit,

    clarification:
      String(
        parsed.clarification || ""
      ).trim()
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


function conditionText(
  requestInfo
) {

  const parts = [];


  if (requestInfo.keyword) {
    parts.push(
      `"${requestInfo.keyword}"`
    );
  }


  if (
    requestInfo.minAvailable !== null
  ) {

    parts.push(
      `빈자리 ${requestInfo.minAvailable}대 이상`
    );
  }


  return (
    parts.join(" · ") ||
    "부산 전체"
  );

}


function handleSearchParking(
  parkingData,
  requestInfo
) {

  let items =
    searchItems(
      parkingData,
      requestInfo.keyword
    );


  items =
    applyMinimumAvailable(
      items,
      requestInfo.minAvailable
    );


  if (
    requestInfo.sort ===
    "available_desc"
  ) {

    items =
      sortByAvailableDesc(
        items
      );

  }


  items =
    items.slice(
      0,
      requestInfo.limit
    );


  return {
    items,

    summary:
      items.length > 0
        ? `${conditionText(requestInfo)} 조건으로 주차장 ${items.length}곳을 찾았습니다.`
        : `${conditionText(requestInfo)} 조건에 맞는 주차장을 찾지 못했습니다.`
  };

}


function handleAvailableParking(
  parkingData,
  requestInfo
) {

  let items =
    searchItems(
      parkingData,
      requestInfo.keyword
    );


  items =
    applyMinimumAvailable(
      items,
      requestInfo.minAvailable
    );


  items =
    sortByAvailableDesc(
      items
    )
      .slice(
        0,
        requestInfo.limit
      );


  return {
    items,

    summary:
      items.length > 0
        ? `${conditionText(requestInfo)} 조건의 주차장을 현재 빈자리 많은 순으로 정리했습니다.`
        : `${conditionText(requestInfo)} 조건에 맞는 주차장을 찾지 못했습니다.`
  };

}


function handleParkingDetail(
  parkingData,
  requestInfo
) {

  const targetName =
    requestInfo.name ||
    requestInfo.keyword;


  if (!targetName) {

    return {
      items: [],

      summary:
        "상세조회할 주차장 이름을 입력해주세요.",

      needClarification:
        true
    };

  }


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
          candidates.slice(
            0,
            requestInfo.limit
          ),

        summary:
          `"${targetName}"과 비슷한 주차장이 여러 곳입니다. 원하는 주차장을 확인해주세요.`,

        needClarification:
          false
      };

    }

  }


  if (!item) {

    return {
      items: [],

      summary:
        `"${targetName}"에 해당하는 주차장을 찾지 못했습니다.`,

      needClarification:
        false
    };

  }


  return {
    items: [
      item
    ],

    summary:
      `"${item.parknm}" 상세정보입니다.`,

    needClarification:
      false
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


    // 1. Gemini는 사용자 문장을 구조화된 검색 조건으로만 변환
    const requestInfo =
      await understandRequest(
        apiKey,
        message
      );


    // 2. 이해하기 어려운 요청은 실제 데이터 조회 전에 사용자에게 재질문
    if (
      requestInfo.intent ===
      "clarify"
    ) {

      return jsonResponse(
        {
          success: true,

          message,

          interpretation:
            requestInfo,

          summary:
            requestInfo.clarification ||
            "지역이나 주차장 이름, 원하는 조건을 조금 더 구체적으로 입력해주세요.",

          items: [],

          needClarification:
            true
        }
      );

    }


    // 3. 실제 주차장 정보는 반드시 기존 통합 API에서 조회
    const parkingData =
      await fetchParkingData(
        context.request.url
      );


    // 4. 서버 프로그램이 검증된 조건대로 검색/필터/정렬
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

        message,

        interpretation:
          requestInfo,

        summary:
          result.summary,

        items:
          result.items,

        needClarification:
          result.needClarification ||
          false
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
            : String(error),

        temporary:
          Boolean(
            error &&
            error.temporary
          )
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
