import {
  fetchParkingData,
  normalizeSearch,
  type ParkingItem
} from "../parkingApi.js";

export type GetParkingDetailArgs = { name: string };

export type GetParkingDetailResult =
  | { status: "found"; item: ParkingItem }
  | { status: "ambiguous"; candidates: ParkingItem[] }
  | { status: "not_found"; candidates: ParkingItem[] };

export async function getParkingDetail(
  args: GetParkingDetailArgs
): Promise<GetParkingDetailResult> {
  const name = args.name.trim();
  const target = normalizeSearch(name);
  const parkingData = await fetchParkingData();

  const exact = parkingData.find(
    (parking) => normalizeSearch(parking.parknm || "") === target
  );
  if (exact) return { status: "found", item: exact };

  const candidates = parkingData.filter((parking) => {
    const parkingName = normalizeSearch(parking.parknm || "");
    return parkingName.startsWith(target) || parkingName.includes(target);
  });

  if (candidates.length === 1) {
    return { status: "found", item: candidates[0] };
  }
  if (candidates.length > 1) {
    return { status: "ambiguous", candidates: candidates.slice(0, 10) };
  }
  return { status: "not_found", candidates: [] };
}

export function formatParkingDetailText(
  result: GetParkingDetailResult,
  requestedName: string
): string {
  if (result.status === "not_found") {
    return `"${requestedName}"에 해당하는 주차장을 찾지 못했습니다.`;
  }

  if (result.status === "ambiguous") {
    const names = result.candidates
      .map((item, index) => `${index + 1}. ${item.parknm || "이름 없음"}`)
      .join("\n");
    return [
      `"${requestedName}"에 여러 주차장이 검색되었습니다.`,
      "조금 더 정확한 주차장 이름을 입력해주세요.",
      "",
      names
    ].join("\n");
  }

  const item = result.item;
  const available = item.curravacnt ?? "정보 없음";
  const total = item.maxcnt ?? "정보 없음";
  const parked = item.parkingcnt ?? "정보 없음";
  const address = item.doroAddr || item.jibunAddr || "정보 없음";
  const fee = (
    item.pkBascTime && item.pkBascTime !== "-" &&
    item.tenMin && item.tenMin !== "-"
  ) ? `${item.pkBascTime}분 ${item.tenMin}원` : "정보 없음";
  const operatingTime = (
    item.svcSrtTe && item.svcSrtTe !== "-" &&
    item.svcEndTe && item.svcEndTe !== "-"
  ) ? `${item.svcSrtTe} ~ ${item.svcEndTe}` : "정보 없음";

  return [
    `${item.parknm || requestedName}`,
    `빈자리: ${available}대`,
    `총 주차면수: ${total}대`,
    `현재 주차대수: ${parked}대`,
    `주소(공공데이터 기준): ${address}`,
    `기본요금: ${fee}`,
    `운영시간: ${operatingTime}`,
    `관리기관: ${item.guNm || "정보 없음"}`,
    `최종 갱신시간: ${item.lastupdatetime || "정보 없음"}`
  ].join("\n");
}
