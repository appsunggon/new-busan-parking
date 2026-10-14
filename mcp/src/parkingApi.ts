export type ParkingItem = {
  parknm?: string;
  curravacnt?: number | null;
  maxcnt?: number | null;
  parkingcnt?: number | null;
  doroAddr?: string | null;
  jibunAddr?: string | null;
  pkBascTime?: string | number | null;
  tenMin?: string | number | null;
  svcSrtTe?: string | null;
  svcEndTe?: string | null;
  guNm?: string | null;
  lastupdatetime?: string | null;
  basicMatched?: boolean;
  [key: string]: unknown;
};

type ParkingApiResponse = {
  success?: boolean;
  message?: string;
  items?: ParkingItem[];
};

const DEFAULT_API_URL =
  "https://v-busan-parking.pages.dev/api/parking";

export async function fetchParkingData(): Promise<ParkingItem[]> {
  const apiUrl =
    process.env.PARKING_API_URL || DEFAULT_API_URL;

  const response = await fetch(apiUrl, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `주차장 API 호출 실패: HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as ParkingApiResponse;

  if (data.success === false) {
    throw new Error(
      data.message || "주차장 API가 오류를 반환했습니다."
    );
  }

  return Array.isArray(data.items) ? data.items : [];
}

export function normalizeSearch(text = ""): string {
  return String(text)
    .replace(/\s+/g, "")
    .replace(/[(),]/g, "")
    .toLowerCase();
}
