export async function onRequest(context) {
  try {
    const apiKey = context.env.DATA_API_KEY;

    // =====================================================
    // API ① 주차장 목록
    // =====================================================
    const listUrl = new URL(
      "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingList_v2"
    );

    listUrl.searchParams.set("serviceKey", apiKey);
    listUrl.searchParams.set("pageNo", "1");
    listUrl.searchParams.set("numOfRows", "100");
    listUrl.searchParams.set("resultType", "json");


    // =====================================================
    // API ② 실시간 주차현황
    // =====================================================
    const realtimeUrl = new URL(
      "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingInfoList_v2"
    );

    realtimeUrl.searchParams.set("serviceKey", apiKey);
    realtimeUrl.searchParams.set("pageNo", "1");
    realtimeUrl.searchParams.set("numOfRows", "50");
    realtimeUrl.searchParams.set("resultType", "json");


    // =====================================================
    // API ③ 부산광역시 공영주차장 기본정보
    // =====================================================
    const basicUrl = new URL(
      "https://apis.data.go.kr/6260000/BusanPblcPrkngInfoService/getPblcPrkngInfo"
    );

    basicUrl.searchParams.set("serviceKey", apiKey);
    basicUrl.searchParams.set("pageNo", "1");
    basicUrl.searchParams.set("numOfRows", "1000");
    basicUrl.searchParams.set("resultType", "json");


    // =====================================================
    // 3개 API 동시에 호출
    // =====================================================
    const [
      listResponse,
      realtimeResponse,
      basicResponse
    ] = await Promise.all([
      fetch(listUrl.toString()),
      fetch(realtimeUrl.toString()),
      fetch(basicUrl.toString())
    ]);


    // =====================================================
    // HTTP 오류 확인
    // =====================================================
    if (!listResponse.ok) {
      throw new Error(
        `주차장 목록 API 오류: ${listResponse.status}`
      );
    }

    if (!realtimeResponse.ok) {
      throw new Error(
        `실시간 주차현황 API 오류: ${realtimeResponse.status}`
      );
    }

    if (!basicResponse.ok) {
      throw new Error(
        `주차장 기본정보 API 오류: ${basicResponse.status}`
      );
    }


    // =====================================================
    // JSON 변환
    // =====================================================
    const listData = await listResponse.json();
    const realtimeData = await realtimeResponse.json();
    const basicData = await basicResponse.json();


    // =====================================================
    // 각 API의 실제 배열 추출
    // =====================================================
    const parkingList =
      listData?.response?.body?.items?.item ?? [];

    const realtimeList =
      realtimeData?.response?.body?.items?.item ?? [];

    const basicList =
      basicData?.response?.body?.items?.item ?? [];


    // =====================================================
    // 주차장 이름 정규화 함수
    // =====================================================
    function normalizeName(name = "") {
      return String(name)
        .replace(/\s+/g, "")
        .replace(/공영주차장/g, "")
        .replace(/공영/g, "")
        .replace(/도시철도/g, "")
        .replace(/[(),]/g, "")
        .toLowerCase();
    }


    // =====================================================
    // 이름은 다르지만 같은 주차장으로 확인된 경우
    // =====================================================
    const parkingAliases = {
      A11: "부산기계공고 공영주차장",
      A21: "화명 공영주차장",
      A37: "롯데광복점 뒤 2번",
      A48: "대연고가도로 밑",
      A434: "만덕2동사 앞"
    };


    // =====================================================
    // API ② 실시간 정보를 parkgcd 기준 Map으로 생성
    // =====================================================
    const realtimeMap = new Map(
      realtimeList.map((item) => [
        item.parkgcd,
        item
      ])
    );


    // =====================================================
    // API ③ 기본정보를 정규화된 이름 기준 Map으로 생성
    // =====================================================
    const basicMap = new Map();

    for (const item of basicList) {
      const key = normalizeName(item.pkNam);

      // 같은 이름이 여러 개 있으면
      // 현재는 첫 번째 데이터만 사용
      if (!basicMap.has(key)) {
        basicMap.set(key, item);
      }
    }


    // =====================================================
    // API ① + API ② + API ③ 통합
    // =====================================================
    const mergedParkingList = parkingList.map((parking) => {

      // -----------------------------------------
      // API ② 실시간 데이터
      // -----------------------------------------
      const realtime =
        realtimeMap.get(parking.parkgcd);


      // -----------------------------------------
      // API ③ 1차 자동 이름 매칭
      // -----------------------------------------
      let basic =
        basicMap.get(
          normalizeName(parking.parknm)
        );

      let matchMethod = "exact";


      // -----------------------------------------
      // API ③ 2차 별칭 매칭
      // -----------------------------------------
      if (
        !basic &&
        parkingAliases[parking.parkgcd]
      ) {

        basic =
          basicMap.get(
            normalizeName(
              parkingAliases[parking.parkgcd]
            )
          );

        if (basic) {
          matchMethod = "alias";
        }
      }


      // -----------------------------------------
      // 끝까지 기본정보를 찾지 못한 경우
      // -----------------------------------------
      if (!basic) {
        matchMethod = "none";
      }


      // -----------------------------------------
      // 최종 통합 객체
      // -----------------------------------------
      return {

        // =====================================
        // API ① 주차장 목록
        // =====================================
        parkgcd: parking.parkgcd,
        parknm: parking.parknm,


        // =====================================
        // API ② 실시간 주차현황
        // =====================================
        maxcnt:
          realtime?.maxcnt ?? null,

        parkingcnt:
          realtime?.parkingcnt ?? null,

        curravacnt:
          realtime?.curravacnt ?? null,

        lastupdatetime:
          realtime?.lastupdatetime ?? null,


        // =====================================
        // API ③ 매칭 상태
        // =====================================
        basicMatched:
          !!basic,

        matchMethod:
          matchMethod,


        // =====================================
        // API ③ 부산시 기본정보
        // =====================================
        mgntNum:
          basic?.mgntNum ?? null,

        guNm:
          basic?.guNm ?? null,

        doroAddr:
          basic?.doroAddr ?? null,

        jibunAddr:
          basic?.jibunAddr ?? null,

        pkFm:
          basic?.pkFm ?? null,

        pkCnt:
          basic?.pkCnt ?? null,


        // =====================================
        // 운영시간
        // =====================================
        svcSrtTe:
          basic?.svcSrtTe ?? null,

        svcEndTe:
          basic?.svcEndTe ?? null,


        // =====================================
        // 주차요금
        // =====================================
        pkBascTime:
          basic?.pkBascTime ?? null,

        tenMin:
          basic?.tenMin ?? null,

        pkAddTime:
          basic?.pkAddTime ?? null,

        feeAdd:
          basic?.feeAdd ?? null,

        ftDay:
          basic?.ftDay ?? null,

        ftMon:
          basic?.ftMon ?? null,


        // =====================================
        // 위치
        // =====================================
        xCdnt:
          basic?.xCdnt ?? null,

        yCdnt:
          basic?.yCdnt ?? null
      };
    });


    // =====================================================
    // 통계
    // =====================================================
    const matchedCount =
      mergedParkingList.filter(
        (item) => item.basicMatched
      ).length;


    const exactMatchedCount =
      mergedParkingList.filter(
        (item) =>
          item.matchMethod === "exact"
      ).length;


    const aliasMatchedCount =
      mergedParkingList.filter(
        (item) =>
          item.matchMethod === "alias"
      ).length;


    const unmatchedCount =
      mergedParkingList.filter(
        (item) =>
          item.matchMethod === "none"
      ).length;


    // =====================================================
    // 최종 JSON 반환
    // =====================================================
    return Response.json({
      success: true,

      totalCount:
        mergedParkingList.length,

      basicDataCount:
        basicList.length,

      matchedCount:
        matchedCount,

      exactMatchedCount:
        exactMatchedCount,

      aliasMatchedCount:
        aliasMatchedCount,

      unmatchedCount:
        unmatchedCount,

      items:
        mergedParkingList
    });


  } catch (error) {

    // =====================================================
    // 오류 처리
    // =====================================================
    return Response.json(
      {
        success: false,
        message: error.message
      },
      {
        status: 500
      }
    );
  }
}