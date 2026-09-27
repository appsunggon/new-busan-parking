export async function fetchBasicInfo(apiKey) {
  const url = new URL(
    "https://apis.data.go.kr/6260000/BusanPblcPrkngInfoService/getPblcPrkngInfo"
  );

  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("resultType", "json");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `주차장 기본정보 API 오류: ${response.status}`
    );
  }

  const data = await response.json();

  return (
    data?.response?.body?.items?.item ?? []
  );
}