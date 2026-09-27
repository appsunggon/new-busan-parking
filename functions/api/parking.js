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


    // 아직 합치지 않고 각각 확인
    return Response.json({
      success: true,

      parkingList: listData,

      realtimeParking: realtimeData
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