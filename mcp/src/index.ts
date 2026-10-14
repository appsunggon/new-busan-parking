import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import {
  formatSearchParkingText,
  searchParking
} from "./tools/searchParking.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "busan-parking-mcp",
    version: "6.1.0"
  });

  server.registerTool(
    "search_parking",
    {
      description:
        "부산 공영주차장 이름을 검색합니다. 예: 화명, 부산대역",
      inputSchema: z.object({
        keyword: z
          .string()
          .min(1)
          .describe("검색할 주차장 이름 또는 이름의 일부")
      })
    },
    async ({ keyword }) => {
      try {
        const result =
          await searchParking({ keyword });

        return {
          content: [
            {
              type: "text",
              text: formatSearchParkingText(result)
            }
          ]
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "알 수 없는 오류";

        return {
          content: [
            {
              type: "text",
              text: `search_parking 실행 오류: ${message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  return server;
}

void serveStdio(createServer);

// stdout은 MCP 프로토콜 통신에 사용되므로 로그는 stderr로 보낸다.
console.error(
  "Busan Parking MCP V6.1 running on stdio"
);
