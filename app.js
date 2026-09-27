const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const resultDiv =
  document.getElementById("result");

const summaryDiv =
  document.getElementById("summary");


let parkingData = [];


// -----------------------------------------
// 통합 API 데이터 불러오기
// -----------------------------------------
async function loadParkingData() {

  try {

    summaryDiv.textContent =
      "주차장 정보를 불러오는 중입니다...";

    const response =
      await fetch("/api/parking");

    if (!response.ok) {
      throw new Error(
        "주차장 정보를 불러오지 못했습니다."
      );
    }

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "API 오류"
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


// -----------------------------------------
// 검색용 문자열 정리
// 공백, 괄호, 쉼표 등을 무시
// -----------------------------------------
function normalizeSearch(text = "") {

  return String(text)
    .replace(/\s+/g, "")
    .replace(/[(),]/g, "")
    .toLowerCase();
}


// -----------------------------------------
// "-" 또는 null 처리
// -----------------------------------------
function displayValue(value) {

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


// -----------------------------------------
// 주차장 카드 생성
// -----------------------------------------
function createParkingCard(parking) {

  const available =
    parking.curravacnt ?? "정보 없음";

  const total =
    parking.maxcnt ?? "정보 없음";

  const address =
    parking.doroAddr &&
    parking.doroAddr !== "-"
      ? parking.doroAddr
      : displayValue(parking.jibunAddr);


  let feeText = "정보 없음";

  if (
    parking.pkBascTime &&
    parking.pkBascTime !== "-" &&
    parking.tenMin &&
    parking.tenMin !== "-"
  ) {

    feeText =
      `${parking.pkBascTime}분 ${Number(parking.tenMin).toLocaleString()}원`;
  }


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


  return `
    <div class="parking-card">

      <h2>
        ${parking.parknm}
      </h2>

      <div class="available">
        현재 주차가능 ${available}대
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
            ${displayValue(parking.parkingcnt)}대
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
            ${displayValue(parking.guNm)}
          </div>
        </div>

        <div class="info-item">
          <div class="label">
            최종 갱신시간
          </div>
          <div class="value">
            ${displayValue(parking.lastupdatetime)}
          </div>
        </div>

        <div class="info-item">
          <div class="label">
            기본정보 매칭
          </div>
          <div class="value">
            ${parking.basicMatched
              ? "연결됨"
              : "기본정보 없음"}
          </div>
        </div>

      </div>

    </div>
  `;
}


// -----------------------------------------
// 검색
// -----------------------------------------
function searchParking() {

  const originalKeyword =
    searchInput.value.trim();

  if (!originalKeyword) {

    resultDiv.innerHTML = `
      <div class="no-result">
        주차장 이름을 입력해주세요.
      </div>
    `;

    return;
  }


  const keyword =
    normalizeSearch(originalKeyword);


  // -----------------------------------------
  // 1순위
  // 검색어로 시작하는 주차장
  // -----------------------------------------
  const startsWithResults =
    parkingData.filter((parking) => {

      const name =
        normalizeSearch(parking.parknm);

      return name.startsWith(keyword);
    });


  // -----------------------------------------
  // 2순위
  // 이름 중간에 검색어가 포함된 주차장
  // -----------------------------------------
  const includesResults =
    parkingData.filter((parking) => {

      const name =
        normalizeSearch(parking.parknm);

      return (
        !name.startsWith(keyword) &&
        name.includes(keyword)
      );
    });


  // -----------------------------------------
  // 앞부분 일치 결과를 먼저 배치
  // -----------------------------------------
  const filtered = [
    ...startsWithResults,
    ...includesResults
  ];


  summaryDiv.textContent =
    `검색 결과 ${filtered.length}건`;


  if (filtered.length === 0) {

    resultDiv.innerHTML = `
      <div class="no-result">
        검색 결과가 없습니다.
      </div>
    `;

    return;
  }


  resultDiv.innerHTML =
    filtered
      .map(createParkingCard)
      .join("");
}


// -----------------------------------------
// 검색 버튼
// -----------------------------------------
searchButton.addEventListener(
  "click",
  searchParking
);


// -----------------------------------------
// Enter 키 검색
// -----------------------------------------
searchInput.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {
      searchParking();
    }
  }
);


// -----------------------------------------
// 페이지 시작 시 데이터 로드
// -----------------------------------------
loadParkingData();