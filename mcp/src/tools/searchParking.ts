import {
  fetchParkingData,
  normalizeSearch,
  type ParkingItem
} from "../parkingApi.js";

export type SearchParkingArgs = {
  keyword: string;
};

export type SearchParkingResult = {
  keyword: string;
  count: number;
  items: ParkingItem[];
};

export async function searchParking(
  args: SearchParkingArgs
): Promise<SearchParkingResult> {

  const keyword = args.keyword.trim();

  if (!keyword) {
    return {
      keyword,
      count: 0,
      items: []
    };
  }

  const normalizedKeyword =
    normalizeSearch(keyword);

  const parkingData =
    await fetchParkingData();

  const startsWithResults =
    parkingData.filter((parking) => {
      const name =
        normalizeSearch(parking.parknm || "");

      return name.startsWith(normalizedKeyword);
    });

  const includesResults =
    parkingData.filter((parking) => {
      const name =
        normalizeSearch(parking.parknm || "");

      return (
        !name.startsWith(normalizedKeyword) &&
        name.includes(normalizedKeyword)
      );
    });

  const items = [
    ...startsWithResults,
    ...includesResults
  ];

  return {
    keyword,
    count: items.length,
    items
  };
}

export function formatSearchParkingText(
  result: SearchParkingResult
): string {

  if (result.count === 0) {
    return `"${result.keyword}" 검색 결과가 없습니다.`;
  }

  const lines = result.items.map((item, index) => {
    const available =
      item.curravacnt ?? "정보 없음";

    const total =
      item.maxcnt ?? "정보 없음";

    const address =
      item.doroAddr ||
      item.jibunAddr ||
      "정보 없음";

    return [
      `${index + 1}. ${item.parknm || "이름 없음"}`,
      `   빈자리: ${available}대 / 총 ${total}대`,
      `   주소(공공데이터 기준): ${address}`
    ].join("\n");
  });

  return [
    `"${result.keyword}" 검색 결과 ${result.count}건`,
    "",
    ...lines
  ].join("\n");
}
