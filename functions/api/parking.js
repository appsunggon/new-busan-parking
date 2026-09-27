export async function onRequest(context) {
  try {
    const apiKey = context.env.DATA_API_KEY;

    // API ① 주차장 목록
    const listUrl = new URL(
      "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingList_v2"
    );

    listUrl.searchParams.set("serviceKey", apiKey);
    listUrl.searchParams.set("pageNo", "1");
    listUrl.searchParams.set("numOfRows", "100");
    listUrl.searchParams.set("resultType", "json");


    // API ② 실시간 주차현황
    const realtimeUrl = new URL(
      "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingInfoList_v2"
    );

    realtimeUrl.searchParams.set("serviceKey", apiKey);
    realtimeUrl.searchParams.set("pageNo", "1");
    realtimeUrl.searchParams.set("numOfRows", "50");
    realtimeUrl.searchParams.set("resultType", "json");


    // 두 API 동시에 호출
    const [listResponse, realtimeResponse] = await Promise.all([
      fetch(listUrl.toString()),
      fetch(realtimeUrl.toString())
    ]);


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


    const listData = await listResponse.json();
    const realtimeData = await realtimeResponse.json();


    // API ① 주차장 목록 배열
    const parkingList =
      listData?.response?.body?.items?.item ?? [];

    // API ② 실시간 주차현황 배열
    const realtimeList =
      realtimeData?.response?.body?.items?.item ?? [];


    // 실시간 데이터를 parkgcd 기준으로 빠르게 찾기 위한 Map 생성
    const realtimeMap = new Map(
      realtimeList.map((item) => [
        item.parkgcd,
        item
      ])
    );


    // API ① 목록 + API ② 실시간 정보 결합
    const mergedParkingList = parkingList.map((parking) => {
      const realtime = realtimeMap.get(parking.parkgcd);

      return {
        parkgcd: parking.parkgcd,
        parknm: parking.parknm,

        maxcnt: realtime?.maxcnt ?? null,
        parkingcnt: realtime?.parkingcnt ?? null,
        curravacnt: realtime?.curravacnt ?? null,
        lastupdatetime: realtime?.lastupdatetime ?? null
      };
    });


    return Response.json({
      success: true,
      totalCount: mergedParkingList.length,
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