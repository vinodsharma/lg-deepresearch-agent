"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Clock,
  LogOut,
  FolderOpen,
  Loader2,
} from "lucide-react";

import { apiClient, Session } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";

export default function SessionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { apiKey, clearApiKey } = useAuthStore();
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !apiKey) {
      router.push("/login");
    }
  }, [mounted, apiKey, router]);

  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiClient.getSessions(),
    enabled: !!apiKey,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => apiClient.createSession({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setShowCreateDialog(false);
      setNewSessionTitle("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const handleLogout = () => {
    clearApiKey();
    router.push("/login");
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSessionTitle.trim()) {
      createMutation.mutate(newSessionTitle.trim());
    }
  };

  if (!mounted || !apiKey) {
    return null;
  }

  return (
    <SidebarWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">
              Research Sessions
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <p className="text-slate-400">
              Manage your research sessions and access the AI assistant from the
              sidebar.
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              Failed to load sessions. Please try again.
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No sessions yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Create a new session to start your research
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session: Session) => (
                <div
                  key={session.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-white truncate flex-1">
                      {session.title}
                    </h3>
                    <button
                      onClick={() => deleteMutation.mutate(session.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        session.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : session.status === "PAUSED"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Create Session Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Create New Session
              </h2>
              <form onSubmit={handleCreateSession}>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="Enter session title..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewSessionTitle("");
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newSessionTitle.trim() || createMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarWrapper>
  );
}
