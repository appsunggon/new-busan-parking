export async function fetchRealtime(apiKey) {
  const url = new URL(
    "https://apis.data.go.kr/B552587/ParkingInfoService_v2/getParkingInfoList_v2"
  );

  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "50");
  url.searchParams.set("resultType", "json");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `실시간 주차현황 API 오류: ${response.status}`
    );
  }

  const data = await response.json();

  return (
    data?.response?.body?.items?.item ?? []
  );
}