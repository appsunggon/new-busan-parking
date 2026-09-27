export async function onRequest(context) {
  try {
    const apiKey = context.env.DATA_API_KEY;

    const url = new URL(
      "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingList_v2"
    );

    url.searchParams.set("serviceKey", apiKey);
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("numOfRows", "100");
    url.searchParams.set("resultType", "json");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`공공데이터 API 오류: ${response.status}`);
    }

    const data = await response.json();

    return Response.json(data);

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