import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

// Backend URL - use internal Docker network URL when running in container
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const POST = async (req: NextRequest) => {
  // Get API key from request headers (passed from CopilotKit component)
  const apiKey = req.headers.get("X-API-Key") || "";

  // Create LangGraph HTTP agent pointing to FastAPI AG-UI endpoint
  const researchAgent = new LangGraphHttpAgent({
    url: `${BACKEND_URL}/copilotkit`,
    headers: {
      "X-API-Key": apiKey,
    },
  });

  const runtime = new CopilotRuntime({
    agents: {
      research_agent: researchAgent,
    },
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
