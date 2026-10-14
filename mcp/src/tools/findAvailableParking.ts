import { type ParkingItem } from "../parkingApi.js";
import { searchParking } from "./searchParking.js";

export type FindAvailableParkingArgs = {
  keyword: string;
  limit?: number;
};

export type FindAvailableParkingResult = {
  keyword: string;
  count: number;
  items: ParkingItem[];
};

function hasAvailableValue(parking: ParkingItem): boolean {
  return (
    parking.curravacnt !== null &&
    parking.curravacnt !== undefined
  );
}

export async function findAvailableParking(
  args: FindAvailableParkingArgs
): Promise<FindAvailableParkingResult> {
  const keyword = args.keyword.trim();
  const limit = Math.max(1, Math.min(Number(args.limit ?? 10), 20));
  const searchResult = await searchParking({ keyword });

  const items = [...searchResult.items]
    .sort((a, b) => {
      const aHasValue = hasAvailableValue(a);
      const bHasValue = hasAvailableValue(b);
      if (!aHasValue && !bHasValue) return 0;
      if (!aHasValue) return 1;
      if (!bHasValue) return -1;
      return Number(b.curravacnt) - Number(a.curravacnt);
    })
    .slice(0, limit);

  return { keyword, count: items.length, items };
}

export function formatAvailableParkingText(
  result: FindAvailableParkingResult
): string {
  if (result.count === 0) {
    return `"${result.keyword}" 조건에 맞는 주차장을 찾지 못했습니다.`;
  }

  const lines = result.items.map((item, index) => {
    const available = item.curravacnt ?? "정보 없음";
    const total = item.maxcnt ?? "정보 없음";
    const address = item.doroAddr || item.jibunAddr || "정보 없음";
    return [
      `${index + 1}. ${item.parknm || "이름 없음"}`,
      `   빈자리: ${available}대 / 총 ${total}대`,
      `   주소(공공데이터 기준): ${address}`
    ].join("\n");
  });

  return [
    `"${result.keyword}" 검색 결과를 빈자리 많은 순으로 정리했습니다.`,
    "",
    ...lines
  ].join("\n");
}
