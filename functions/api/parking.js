export async function onRequest(context) {
  try {
    const apiKey = context.env.DATA_API_KEY;

    // -----------------------------
    // API ① 주차장 목록
    // -----------------------------
    const listUrl = new URL(
      "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingList_v2"
    );

    listUrl.searchParams.set("serviceKey", apiKey);
    listUrl.searchParams.set("pageNo", "1");
    listUrl.searchParams.set("numOfRows", "100");
    listUrl.searchParams.set("resultType", "json");


    // -----------------------------
    // API ② 실시간 주차현황
    // -----------------------------
    const realtimeUrl = new URL(
      "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingInfoList_v2"
    );

    realtimeUrl.searchParams.set("serviceKey", apiKey);
    realtimeUrl.searchParams.set("pageNo", "1");
    realtimeUrl.searchParams.set("numOfRows", "50");
    realtimeUrl.searchParams.set("resultType", "json");


    // -----------------------------
    // API ③ 부산광역시 기본정보
    // -----------------------------
    const basicUrl = new URL(
      "https://apis.data.go.kr/6260000/BusanPblcPrkngInfoService/getPblcPrkngInfo"
    );

    basicUrl.searchParams.set("serviceKey", apiKey);
    basicUrl.searchParams.set("pageNo", "1");
    basicUrl.searchParams.set("numOfRows", "1000");
    basicUrl.searchParams.set("resultType", "json");


    // 3개 API 동시에 호출
    const [
      listResponse,
      realtimeResponse,
      basicResponse
    ] = await Promise.all([
      fetch(listUrl.toString()),
      fetch(realtimeUrl.toString()),
      fetch(basicUrl.toString())
    ]);


    if (!listResponse.ok) {
      throw new Error(`주차장 목록 API 오류: ${listResponse.status}`);
    }

    if (!realtimeResponse.ok) {
      throw new Error(`실시간 주차현황 API 오류: ${realtimeResponse.status}`);
    }

    if (!basicResponse.ok) {
      throw new Error(`주차장 기본정보 API 오류: ${basicResponse.status}`);
    }


    const listData = await listResponse.json();
    const realtimeData = await realtimeResponse.json();
    const basicData = await basicResponse.json();


    const parkingList =
      listData?.response?.body?.items?.item ?? [];

    const realtimeList =
      realtimeData?.response?.body?.items?.item ?? [];

    const basicList =
      basicData?.response?.body?.items?.item ?? [];


    // -----------------------------
    // 이름 정규화
    // -----------------------------
    function normalizeName(name = "") {
      return name
        .replace(/\s+/g, "")
        .replace(/공영주차장/g, "")
        .replace(/공영/g, "")
        .replace(/도시철도/g, "")
        .replace(/[(),]/g, "")
        .toLowerCase();
    }


    // -----------------------------
    // API ② Map
    // -----------------------------
    const realtimeMap = new Map(
      realtimeList.map((item) => [
        item.parkgcd,
        item
      ])
    );


    // -----------------------------
    // API ③ 이름 기준 Map
    // -----------------------------
    const basicMap = new Map();

    for (const item of basicList) {
      const key = normalizeName(item.pkNam);

      if (!basicMap.has(key)) {
        basicMap.set(key, item);
      }
    }


    // -----------------------------
    // 3개 API 결합
    // -----------------------------
    const mergedParkingList = parkingList.map((parking) => {

      const realtime =
        realtimeMap.get(parking.parkgcd);

      const basic =
        basicMap.get(
          normalizeName(parking.parknm)
        );


      return {
        // 시설공단 목록
        parkgcd: parking.parkgcd,
        parknm: parking.parknm,

        // 실시간 정보
        maxcnt: realtime?.maxcnt ?? null,
        parkingcnt: realtime?.parkingcnt ?? null,
        curravacnt: realtime?.curravacnt ?? null,
        lastupdatetime:
          realtime?.lastupdatetime ?? null,

        // 부산시 기본정보
        basicMatched: !!basic,

        mgntNum: basic?.mgntNum ?? null,
        guNm: basic?.guNm ?? null,

        doroAddr: basic?.doroAddr ?? null,
        jibunAddr: basic?.jibunAddr ?? null,

        pkFm: basic?.pkFm ?? null,
        pkCnt: basic?.pkCnt ?? null,

        svcSrtTe: basic?.svcSrtTe ?? null,
        svcEndTe: basic?.svcEndTe ?? null,

        pkBascTime: basic?.pkBascTime ?? null,
        tenMin: basic?.tenMin ?? null,

        pkAddTime: basic?.pkAddTime ?? null,
        feeAdd: basic?.feeAdd ?? null,

        ftDay: basic?.ftDay ?? null,
        ftMon: basic?.ftMon ?? null,

        xCdnt: basic?.xCdnt ?? null,
        yCdnt: basic?.yCdnt ?? null
      };
    });


    // 매칭 성공 개수
    const matchedCount =
      mergedParkingList.filter(
        (item) => item.basicMatched
      ).length;


    return Response.json({
      success: true,

      totalCount: mergedParkingList.length,

      basicDataCount: basicList.length,

      matchedCount: matchedCount,

      items: mergedParkingList
    });


  } catch (error) {

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