"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const COPILOTKIT_AGENT = process.env.NEXT_PUBLIC_COPILOTKIT_AGENT || "research_agent";

function CopilotKitWrapper({ children }: { children: ReactNode }) {
  const { apiKey } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    apiClient.setApiKey(apiKey);
  }, [apiKey]);

  // Don't render CopilotKit until hydrated
  if (!mounted) {
    return <>{children}</>;
  }

  // Skip CopilotKit if not authenticated
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <CopilotKit
      runtimeUrl={`${API_URL}/copilotkit`}
      agent={COPILOTKIT_AGENT}
      headers={{ "X-API-Key": apiKey }}
    >
      {children}
    </CopilotKit>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CopilotKitWrapper>{children}</CopilotKitWrapper>
    </QueryClientProvider>
  );
}
