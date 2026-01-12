"use client";

import { createContext, ReactNode, useContext } from "react";

import { useAgentActivity, UseAgentActivityReturn } from "@/hooks";

const AgentActivityContext = createContext<UseAgentActivityReturn | null>(null);

export function AgentActivityProvider({ children }: { children: ReactNode }) {
  const agentActivity = useAgentActivity();

  return (
    <AgentActivityContext.Provider value={agentActivity}>
      {children}
    </AgentActivityContext.Provider>
  );
}

export function useAgentActivityContext(): UseAgentActivityReturn {
  const context = useContext(AgentActivityContext);
  if (!context) {
    throw new Error(
      "useAgentActivityContext must be used within AgentActivityProvider"
    );
  }
  return context;
}
