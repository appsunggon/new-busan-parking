// =====================================================
// HTML 요소 가져오기
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


// =====================================================
// 데이터 저장 공간
// =====================================================

// 전체 주차장 데이터
let parkingData = [];


// 현재 검색된 결과
let currentResults = [];


// 현재 정렬 방식
// default = 기본순
// available = 빈자리 많은 순
let currentSort = "default";


// =====================================================
// 통합 API 데이터 불러오기
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
// 공백
// 괄호
// 쉼표
//
// 등을 제거해서
// 사용자의 입력 차이를 줄인다.
//
// 예:
//
// 부산대역(남측)
// 부산대역남
//
// 둘 다 검색 가능
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
// 값이 없을 때 표시
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
// 주차장 카드 만들기
// =====================================================

function createParkingCard(
  parking
) {

  // -----------------------------
  // 현재 빈자리
  // -----------------------------

  const available =
    parking.curravacnt ??
    "정보 없음";


  // -----------------------------
  // 총 주차면수
  // -----------------------------

  const total =
    parking.maxcnt ??
    "정보 없음";


  // -----------------------------
  // 주소
  // -----------------------------

  const address =
    parking.doroAddr &&
    parking.doroAddr !== "-"

      ? parking.doroAddr

      : displayValue(
          parking.jibunAddr
        );


  // -----------------------------
  // 기본요금
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
      `${Number(parking.tenMin).toLocaleString()}원`;

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
      `${parking.svcSrtTe} ~ ${parking.svcEndTe}`;

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
            주소
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

    </div>

  `;

}


// =====================================================
// 현재 검색 결과 화면에 표시
// =====================================================

function renderResults() {

  // 원본 검색결과는 유지하고
  // 복사본을 만들어 정렬한다.

  let results =
    [...currentResults];


  // ===================================================
  // 빈자리 많은 순 정렬
  // ===================================================

  if (
    currentSort ===
    "available"
  ) {

    results.sort(
      (a, b) => {

        const aAvailable =
          Number(
            a.curravacnt
          );


        const bAvailable =
          Number(
            b.curravacnt
          );


        // -------------------------
        // 유효한 숫자인지 확인
        // -------------------------

        const aValid =
          Number.isFinite(
            aAvailable
          );


        const bValid =
          Number.isFinite(
            bAvailable
          );


        // 둘 다 정보 없음
        if (
          !aValid &&
          !bValid
        ) {

          return 0;

        }


        // A만 정보 없음
        if (!aValid) {

          return 1;

        }


        // B만 정보 없음
        if (!bValid) {

          return -1;

        }


        // -------------------------
        // 빈자리 많은 순
        // -------------------------

        return (
          bAvailable -
          aAvailable
        );

      }
    );

  }


  // ===================================================
  // 검색 결과가 없는 경우
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
  // 검색 결과 카드 출력
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

  const originalKeyword =

    searchInput.value
      .trim();


  // ===================================================
  // 검색어가 없는 경우
  // ===================================================

  if (!originalKeyword) {

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


  // ===================================================
  // 검색어 정규화
  // ===================================================

  const keyword =

    normalizeSearch(
      originalKeyword
    );


  // ===================================================
  // 1순위
  //
  // 검색어로 시작하는 주차장
  // ===================================================

  const startsWithResults =

    parkingData.filter(
      (parking) => {

        const name =

          normalizeSearch(
            parking.parknm
          );


        return (
          name.startsWith(
            keyword
          )
        );

      }
    );


  // ===================================================
  // 2순위
  //
  // 이름 중간에 검색어가 들어가는 주차장
  // ===================================================

  const includesResults =

    parkingData.filter(
      (parking) => {

        const name =

          normalizeSearch(
            parking.parknm
          );


        return (

          !name.startsWith(
            keyword
          ) &&

          name.includes(
            keyword
          )

        );

      }
    );


  // ===================================================
  // 앞부분 일치 결과를 먼저 저장
  // ===================================================

  currentResults = [

    ...startsWithResults,

    ...includesResults

  ];


  // ===================================================
  // 새 검색을 하면
  // 기본순으로 초기화
  // ===================================================

  currentSort =
    "default";


  updateSortButtons();


  // ===================================================
  // 검색 결과 건수 표시
  // ===================================================

  summaryDiv.textContent =

    `검색 결과 ${currentResults.length}건`;


  // ===================================================
  // 화면 출력
  // ===================================================

  renderResults();

}


// =====================================================
// 정렬 버튼 상태 표시
// =====================================================

function updateSortButtons() {

  // 기본순
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

  // 빈자리 많은 순
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
// 페이지 시작
// =====================================================

loadParkingData();