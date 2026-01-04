const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiClientOptions {
  apiKey?: string | null;
}

interface Session {
  id: string;
  title: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateSessionRequest {
  title: string;
}

class ApiClient {
  private apiKey: string | null = null;

  setApiKey(key: string | null) {
    this.apiKey = key;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }
    return headers;
  }

  async createSession(data: CreateSessionRequest): Promise<Session> {
    const response = await fetch(`${API_URL}/sessions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    return response.json();
  }

  async getSessions(): Promise<Session[]> {
    const response = await fetch(`${API_URL}/sessions`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    return response.json();
  }

  async getSession(id: string): Promise<Session> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteSession(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }
}

export const apiClient = new ApiClient();
export type { Session, CreateSessionRequest };
