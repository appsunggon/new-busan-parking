import {
  fetchParkingList
} from "../../lib/fetchParkingList.js";

import {
  fetchRealtime
} from "../../lib/fetchRealtime.js";

import {
  fetchBasicInfo
} from "../../lib/fetchBasicInfo.js";

import {
  mergeParkingData
} from "../../lib/mergeParkingData.js";


export async function onRequest(context) {

  try {

    const apiKey =
      context.env.DATA_API_KEY;


    // 3개 API 동시에 호출
    const [
      parkingList,
      realtimeList,
      basicList
    ] = await Promise.all([
      fetchParkingList(apiKey),
      fetchRealtime(apiKey),
      fetchBasicInfo(apiKey)
    ]);


    // 데이터 통합
    const items =
      mergeParkingData(
        parkingList,
        realtimeList,
        basicList
      );


    // 통계
    const exactMatchedCount =
      items.filter(
        (item) =>
          item.matchMethod === "exact"
      ).length;


    const aliasMatchedCount =
      items.filter(
        (item) =>
          item.matchMethod === "alias"
      ).length;


    const unmatchedCount =
      items.filter(
        (item) =>
          item.matchMethod === "none"
      ).length;


    return Response.json({

      success: true,

      totalCount:
        items.length,

      basicDataCount:
        basicList.length,

      matchedCount:
        exactMatchedCount +
        aliasMatchedCount,

      exactMatchedCount,

      aliasMatchedCount,

      unmatchedCount,

      items
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