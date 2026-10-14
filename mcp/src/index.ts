import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import { formatSearchParkingText, searchParking } from "./tools/searchParking.js";
import { findAvailableParking, formatAvailableParkingText } from "./tools/findAvailableParking.js";
import { formatParkingDetailText, getParkingDetail } from "./tools/getParkingDetail.js";

function createServer(): McpServer {
  const server = new McpServer({ name: "busan-parking-mcp", version: "6.2.0" });

  server.registerTool(
    "search_parking",
    {
      description: "부산 공영주차장 이름을 검색합니다. 예: 화명, 부산대역",
      inputSchema: z.object({
        keyword: z.string().min(1).describe("검색할 주차장 이름 또는 이름의 일부")
      })
    },
    async ({ keyword }) => {
      try {
        const result = await searchParking({ keyword });
        return { content: [{ type: "text", text: formatSearchParkingText(result) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text", text: `search_parking 실행 오류: ${message}` }],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    "find_available_parking",
    {
      description: "주차장 이름 검색 결과를 현재 빈자리 많은 순으로 정리합니다.",
      inputSchema: z.object({
        keyword: z.string().min(1).describe("검색할 지역 또는 주차장 이름의 일부"),
        limit: z.number().int().min(1).max(20).optional().describe("최대 결과 개수. 기본값 10")
      })
    },
    async ({ keyword, limit }) => {
      try {
        const result = await findAvailableParking({ keyword, limit });
        return { content: [{ type: "text", text: formatAvailableParkingText(result) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text", text: `find_available_parking 실행 오류: ${message}` }],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    "get_parking_detail",
    {
      description: "특정 부산 공영주차장의 상세정보를 조회합니다.",
      inputSchema: z.object({
        name: z.string().min(1).describe("상세조회할 주차장 이름")
      })
    },
    async ({ name }) => {
      try {
        const result = await getParkingDetail({ name });
        return { content: [{ type: "text", text: formatParkingDetailText(result, name) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text", text: `get_parking_detail 실행 오류: ${message}` }],
          isError: true
        };
      }
    }
  );

  return server;
}

void serveStdio(createServer);
console.error("Busan Parking MCP V6.2 running on stdio");
