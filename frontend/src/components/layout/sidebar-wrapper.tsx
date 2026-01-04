"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import { ReactNode } from "react";

import { useAuthStore } from "@/lib/store/auth-store";

interface SidebarWrapperProps {
  children: ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  const { apiKey } = useAuthStore();

  // Don't show sidebar if not authenticated
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <CopilotSidebar
      defaultOpen={false}
      clickOutsideToClose={true}
      labels={{
        title: "Research Assistant",
        initial: "What would you like to research today?",
        placeholder: "Ask me to research any topic...",
      }}
    >
      {children}
    </CopilotSidebar>
  );
}
