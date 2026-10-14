// =====================================================
// HTML 요소
// =====================================================

const searchInput =
  document.getElementById(
    "searchInput"
  );


const searchButton =
  document.getElementById(
    "searchButton"
  );


const resultDiv =
  document.getElementById(
    "result"
  );


const summaryDiv =
  document.getElementById(
    "summary"
  );


const defaultSortButton =
  document.getElementById(
    "defaultSortButton"
  );


const availableSortButton =
  document.getElementById(
    "availableSortButton"
  );


const refreshButton =
  document.getElementById(
    "refreshButton"
  );


// =====================================================
// 데이터
// =====================================================

// 전체 주차장 데이터
let parkingData = [];


// 현재 검색 결과
let currentResults = [];


// 현재 정렬 방식
// default
// available
let currentSort = "default";


// 마지막 검색어
let currentKeyword = "";


// =====================================================
// API 데이터 불러오기
// =====================================================

async function loadParkingData() {

  try {

    summaryDiv.textContent =
      "주차장 정보를 불러오는 중입니다...";


    const response =
      await fetch(
        "/api/parking"
      );


    if (!response.ok) {

      throw new Error(
        "주차장 정보를 불러오지 못했습니다."
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "API 오류"
      );

    }


    parkingData =
      data.items || [];


    summaryDiv.textContent =
      `실시간 주차장 ${parkingData.length}개 정보를 불러왔습니다.`;


  } catch (error) {

    summaryDiv.textContent =
      "데이터를 불러오는 중 오류가 발생했습니다.";


    console.error(error);

  }

}


// =====================================================
// 검색용 문자열 정리
// =====================================================
//
// 공백, 괄호, 쉼표를 제거한다.
//
// 예:
//
// 부산대역(남측)
// 부산대역 남
// 부산대역남
//
// 비교 가능
//
// =====================================================

function normalizeSearch(
  text = ""
) {

  return String(text)

    .replace(
      /\s+/g,
      ""
    )

    .replace(
      /[(),]/g,
      ""
    )

    .toLowerCase();

}


// =====================================================
// 값 표시
// =====================================================

function displayValue(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "-"
  ) {

    return "정보 없음";

  }


  return value;

}


// =====================================================
// 지도보기 관련 함수
// =====================================================
//
// 공공데이터의 주소가 오래되거나 실제 위치와 다를 수 있으므로
// 카카오맵 검색에는 주소를 사용하지 않는다.
// "부산 + 주차장명"으로 카카오맵 장소 검색을 연다.
//
// =====================================================

function getParkingAddress(
  parking
) {

  if (
    parking.doroAddr &&
    parking.doroAddr !== "-"
  ) {

    return parking.doroAddr;

  }


  if (
    parking.jibunAddr &&
    parking.jibunAddr !== "-"
  ) {

    return parking.jibunAddr;

  }


  return "";

}


function getMapUrl(
  parking
) {

  const query =
    `부산 ${parking.parknm}`;


  return (
    "https://map.kakao.com/link/search/" +
    encodeURIComponent(query)
  );

}


// =====================================================
// 주차장 카드 생성
// =====================================================

function createParkingCard(
  parking
) {

  const available =
    parking.curravacnt ??
    "정보 없음";


  const total =
    parking.maxcnt ??
    "정보 없음";


  // -----------------------------
  // 주소
  // -----------------------------

  const rawAddress =
    getParkingAddress(
      parking
    );


  const address =
    rawAddress ||
    "정보 없음";


  const mapUrl =
    getMapUrl(
      parking
    );


  // -----------------------------
  // 기본 요금
  // -----------------------------

  let feeText =
    "정보 없음";


  if (
    parking.pkBascTime &&
    parking.pkBascTime !== "-" &&
    parking.tenMin &&
    parking.tenMin !== "-"
  ) {

    feeText =

      `${parking.pkBascTime}분 ` +

      `${Number(
        parking.tenMin
      ).toLocaleString()}원`;

  }


  // -----------------------------
  // 운영시간
  // -----------------------------

  let operatingTime =
    "정보 없음";


  if (
    parking.svcSrtTe &&
    parking.svcSrtTe !== "-" &&
    parking.svcEndTe &&
    parking.svcEndTe !== "-"
  ) {

    operatingTime =

      `${parking.svcSrtTe} ~ ` +

      `${parking.svcEndTe}`;

  }


  // -----------------------------
  // 카드 HTML
  // -----------------------------

  return `

    <div class="parking-card">

      <h2>
        ${parking.parknm}
      </h2>


      <div class="available">

        현재 주차가능
        ${available}대

      </div>


      <div class="info-grid">


        <div class="info-item">

          <div class="label">
            총 주차면수
          </div>

          <div class="value">
            ${total}대
          </div>

        </div>


        <div class="info-item">

          <div class="label">
            현재 주차대수
          </div>

          <div class="value">

            ${displayValue(
              parking.parkingcnt
            )}대

          </div>

        </div>


        <div class="info-item">

          <div class="label">
            주소(공공데이터 기준)
          </div>

          <div class="value">
            ${address}
          </div>

        </div>


        <div class="info-item">

          <div class="label">
            기본요금
          </div>

          <div class="value">
            ${feeText}
          </div>

        </div>


        <div class="info-item">

          <div class="label">
            운영시간
          </div>

          <div class="value">
            ${operatingTime}
          </div>

        </div>


        <div class="info-item">

          <div class="label">
            관리기관
          </div>

          <div class="value">

            ${displayValue(
              parking.guNm
            )}

          </div>

        </div>


        <div class="info-item">

          <div class="label">
            최종 갱신시간
          </div>

          <div class="value">

            ${displayValue(
              parking.lastupdatetime
            )}

          </div>

        </div>


        <div class="info-item">

          <div class="label">
            기본정보 매칭
          </div>

          <div class="value">

            ${
              parking.basicMatched
                ? "연결됨"
                : "기본정보 없음"
            }

          </div>

        </div>


      </div>


      <div class="address-notice">
        ※ 주소는 공공데이터 기준이며 실제 위치와 다를 수 있습니다.
        지도보기에서 위치를 확인하세요.
      </div>


      <div class="card-actions">

        <a
          class="map-button"
          href="${mapUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 카카오맵에서 위치 확인
        </a>

      </div>

    </div>

  `;

}


// =====================================================
// 검색 결과 만들기
// =====================================================

function makeSearchResults(
  keyword
) {

  const normalizedKeyword =
    normalizeSearch(
      keyword
    );


  // -----------------------------
  // 1순위
  // 앞부분 일치
  // -----------------------------

  const startsWithResults =

    parkingData.filter(
      (parking) => {

        const name =
          normalizeSearch(
            parking.parknm
          );


        return (
          name.startsWith(
            normalizedKeyword
          )
        );

      }
    );


  // -----------------------------
  // 2순위
  // 중간 포함
  // -----------------------------

  const includesResults =

    parkingData.filter(
      (parking) => {

        const name =
          normalizeSearch(
            parking.parknm
          );


        return (

          !name.startsWith(
            normalizedKeyword
          ) &&

          name.includes(
            normalizedKeyword
          )

        );

      }
    );


  return [

    ...startsWithResults,

    ...includesResults

  ];

}


// =====================================================
// 결과 화면 출력
// =====================================================

function renderResults() {

  let results =
    [...currentResults];


  // ===================================================
  // 빈자리 많은 순
  // ===================================================

  if (
    currentSort ===
    "available"
  ) {

    results.sort(
      (a, b) => {

        // null을 Number로 바꾸면 0이 되므로
        // 먼저 데이터 존재 여부를 확인한다.

        const aHasValue =

          a.curravacnt !== null &&

          a.curravacnt !== undefined;


        const bHasValue =

          b.curravacnt !== null &&

          b.curravacnt !== undefined;


        // 둘 다 정보 없음
        if (
          !aHasValue &&
          !bHasValue
        ) {

          return 0;

        }


        // A만 정보 없음
        if (!aHasValue) {

          return 1;

        }


        // B만 정보 없음
        if (!bHasValue) {

          return -1;

        }


        const aAvailable =
          Number(
            a.curravacnt
          );


        const bAvailable =
          Number(
            b.curravacnt
          );


        return (
          bAvailable -
          aAvailable
        );

      }
    );

  }


  // ===================================================
  // 검색 결과 없음
  // ===================================================

  if (
    results.length === 0
  ) {

    resultDiv.innerHTML = `

      <div class="no-result">

        검색 결과가 없습니다.

      </div>

    `;


    return;

  }


  // ===================================================
  // 카드 출력
  // ===================================================

  resultDiv.innerHTML =

    results

      .map(
        createParkingCard
      )

      .join("");

}


// =====================================================
// 검색
// =====================================================

function searchParking() {

  const keyword =

    searchInput.value
      .trim();


  // -----------------------------
  // 검색어 없음
  // -----------------------------

  if (!keyword) {

    currentKeyword = "";

    currentResults = [];


    summaryDiv.textContent =
      "검색어를 입력해주세요.";


    resultDiv.innerHTML = `

      <div class="no-result">

        주차장 이름을 입력해주세요.

      </div>

    `;


    return;

  }


  // -----------------------------
  // 검색어 저장
  // -----------------------------

  currentKeyword =
    keyword;


  // -----------------------------
  // 검색 결과 생성
  // -----------------------------

  currentResults =
    makeSearchResults(
      currentKeyword
    );


  // -----------------------------
  // 새 검색 시 기본순
  // -----------------------------

  currentSort =
    "default";


  updateSortButtons();


  // -----------------------------
  // 검색 결과 표시
  // -----------------------------

  summaryDiv.textContent =

    `검색 결과 ${currentResults.length}건`;


  renderResults();

}


// =====================================================
// 정렬 버튼 상태
// =====================================================

function updateSortButtons() {

  if (
    currentSort ===
    "default"
  ) {

    defaultSortButton
      .classList
      .add(
        "active"
      );


    availableSortButton
      .classList
      .remove(
        "active"
      );

  }

  else {

    availableSortButton
      .classList
      .add(
        "active"
      );


    defaultSortButton
      .classList
      .remove(
        "active"
      );

  }

}


// =====================================================
// 최신정보 새로고침
// =====================================================

async function refreshParkingData() {

  try {

    // 버튼 중복 클릭 방지
    refreshButton.disabled =
      true;


    refreshButton.textContent =
      "새로고침 중...";


    // -----------------------------
    // 최신 API 호출
    // -----------------------------

    const response =
      await fetch(
        "/api/parking",
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "최신 주차정보를 불러오지 못했습니다."
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "API 오류"
      );

    }


    // -----------------------------
    // 전체 데이터 교체
    // -----------------------------

    parkingData =
      data.items || [];


    // =================================================
    // 기존 검색어가 있는 경우
    // 다시 같은 검색 실행
    // =================================================

    if (currentKeyword) {

      currentResults =
        makeSearchResults(
          currentKeyword
        );


      summaryDiv.textContent =

        `검색 결과 ${currentResults.length}건 · 최신정보 반영`;


      // currentSort는 그대로 유지
      renderResults();

    }


    // =================================================
    // 검색 전이라면
    // 데이터만 갱신
    // =================================================

    else {

      summaryDiv.textContent =

        `실시간 주차장 ${parkingData.length}개 최신정보를 불러왔습니다.`;

    }


  } catch (error) {

    summaryDiv.textContent =
      "새로고침 중 오류가 발생했습니다.";


    console.error(error);

  }

  finally {

    refreshButton.disabled =
      false;


    refreshButton.textContent =
      "↻ 최신정보 새로고침";

  }

}


// =====================================================
// 기본순 버튼
// =====================================================

defaultSortButton.addEventListener(

  "click",

  () => {

    currentSort =
      "default";


    updateSortButtons();


    renderResults();

  }

);


// =====================================================
// 빈자리 많은 순 버튼
// =====================================================

availableSortButton.addEventListener(

  "click",

  () => {

    currentSort =
      "available";


    updateSortButtons();


    renderResults();

  }

);


// =====================================================
// 새로고침 버튼
// =====================================================

refreshButton.addEventListener(

  "click",

  refreshParkingData

);


// =====================================================
// 검색 버튼
// =====================================================

searchButton.addEventListener(

  "click",

  searchParking

);


// =====================================================
// Enter 키 검색
// =====================================================

searchInput.addEventListener(

  "keydown",

  (event) => {

    if (
      event.key ===
      "Enter"
    ) {

      searchParking();

    }

  }

);


// =====================================================
// 최초 실행
// =====================================================

loadParkingData();

// =====================================================
// V6 결과 표시용 공통 함수
// =====================================================
//
// 실제 AI/MCP 연결 후에는 아래 함수에
// AI가 정리한 설명(summary)과 MCP 조회 결과(items)를 넘긴다.
//
// V6의 결과는 "AI 설명 + 기존 주차장 카드" 형태로 표시한다.
//
// =====================================================

function renderAiResult(
  summary,
  items
) {

  const aiAnswer =
    document.getElementById(
      "aiAnswer"
    );


  const aiResult =
    document.getElementById(
      "aiResult"
    );


  aiAnswer.hidden =
    false;


  aiAnswer.textContent =
    summary;


  if (
    !items ||
    items.length === 0
  ) {

    aiResult.innerHTML =
      '<div class="no-result">조건에 맞는 주차장을 찾지 못했습니다.</div>';

    return;

  }


  aiResult.innerHTML =
    items
      .map(
        createParkingCard
      )
      .join("");

}


// =====================================================
// V6 AI 입력창
// =====================================================
//
// 현재 단계에서는 화면과 결과 출력 구조만 준비한다.
// 실제 자연어 이해와 MCP Tool 선택은 다음 단계에서
// AI API + MCP 연결 후 구현한다.
//
// =====================================================

const aiInput =
  document.getElementById(
    "aiInput"
  );


const aiSendButton =
  document.getElementById(
    "aiSendButton"
  );


const aiStatus =
  document.getElementById(
    "aiStatus"
  );


async function handleAiRequest() {

  const text =
    aiInput.value.trim();


  if (!text) {

    aiStatus.textContent =
      "요청 내용을 입력해주세요.";

    return;

  }


  aiStatus.textContent =
    "현재는 V6 결과 화면 구조까지 준비된 단계입니다. 다음 단계에서 AI API와 MCP를 연결합니다.";

}


aiSendButton.addEventListener(
  "click",
  handleAiRequest
);


aiInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Enter"
    ) {

      handleAiRequest();

    }

  }
);
