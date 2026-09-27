import { normalizeName } from "./normalizeName.js";

const parkingAliases = {
  A11: "부산기계공고 공영주차장",
  A21: "화명 공영주차장",
  A37: "롯데광복점 뒤 2번",
  A48: "대연고가도로 밑",
  A434: "만덕2동사 앞"
};

export function mergeParkingData(
  parkingList,
  realtimeList,
  basicList
) {

  // 실시간 정보 Map
  const realtimeMap = new Map(
    realtimeList.map((item) => [
      item.parkgcd,
      item
    ])
  );


  // 기본정보 Map
  const basicMap = new Map();

  for (const item of basicList) {
    const key =
      normalizeName(item.pkNam);

    if (!basicMap.has(key)) {
      basicMap.set(key, item);
    }
  }


  // 통합
  const mergedParkingList =
    parkingList.map((parking) => {

      const realtime =
        realtimeMap.get(
          parking.parkgcd
        );


      let basic =
        basicMap.get(
          normalizeName(
            parking.parknm
          )
        );

      let matchMethod = "exact";


      // 별칭 매칭
      if (
        !basic &&
        parkingAliases[
          parking.parkgcd
        ]
      ) {

        basic =
          basicMap.get(
            normalizeName(
              parkingAliases[
                parking.parkgcd
              ]
            )
          );

        if (basic) {
          matchMethod = "alias";
        }
      }


      if (!basic) {
        matchMethod = "none";
      }


      return {
        parkgcd:
          parking.parkgcd,

        parknm:
          parking.parknm,


        // 실시간
        maxcnt:
          realtime?.maxcnt ?? null,

        parkingcnt:
          realtime?.parkingcnt ?? null,

        curravacnt:
          realtime?.curravacnt ?? null,

        lastupdatetime:
          realtime?.lastupdatetime ?? null,


        // 매칭
        basicMatched:
          !!basic,

        matchMethod:
          matchMethod,


        // 기본정보
        mgntNum:
          basic?.mgntNum ?? null,

        guNm:
          basic?.guNm ?? null,

        doroAddr:
          basic?.doroAddr ?? null,

        jibunAddr:
          basic?.jibunAddr ?? null,

        pkFm:
          basic?.pkFm ?? null,

        pkCnt:
          basic?.pkCnt ?? null,

        svcSrtTe:
          basic?.svcSrtTe ?? null,

        svcEndTe:
          basic?.svcEndTe ?? null,

        pkBascTime:
          basic?.pkBascTime ?? null,

        tenMin:
          basic?.tenMin ?? null,

        pkAddTime:
          basic?.pkAddTime ?? null,

        feeAdd:
          basic?.feeAdd ?? null,

        ftDay:
          basic?.ftDay ?? null,

        ftMon:
          basic?.ftMon ?? null,

        xCdnt:
          basic?.xCdnt ?? null,

        yCdnt:
          basic?.yCdnt ?? null
      };
    });


  return mergedParkingList;
}