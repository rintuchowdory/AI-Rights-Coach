import Constants from "expo-constants";

// Set EXPO_PUBLIC_API_URL in a .env file (see .env.example). Falls back to
// localhost, which works in the iOS simulator but NOT on a physical device
// or Android emulator — use your machine's LAN IP there instead.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }

  return res.json() as Promise<T>;
}

export type HealthResponse = { status: string; service: string };

export type Case = {
  id: string;
  user_id: string;
  title: string;
  status: string;
  created_at: string;
};

export const api = {
  health: () => request<HealthResponse>("/health"),
  listCases: (userId?: string) =>
    request<Case[]>(`/cases${userId ? `?user_id=${userId}` : ""}`),
  createCase: (userId: string, title: string) =>
    request<Case>("/cases", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, title }),
    }),
};
