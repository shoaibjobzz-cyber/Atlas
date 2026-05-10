export function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (!configured) {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  try {
    const parsed = new URL(configured);
    const browserHost = window.location.hostname;
    if (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      (browserHost === "localhost" || browserHost === "127.0.0.1") &&
      parsed.hostname !== browserHost
    ) {
      parsed.hostname = browserHost;
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return configured;
  }

  return configured;
}

export const API_BASE_URL = resolveApiBaseUrl();

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestUrl = `${API_BASE_URL}${path}`;
  const requestMethod = options.method ?? "GET";
  if (import.meta.env.DEV && path.startsWith("/dfmea")) {
    console.log("[DFMEA][fetch-start]", {
      url: requestUrl,
      method: requestMethod,
      payload: options.body ?? null,
    });
  }

  const response = await fetch(requestUrl, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (import.meta.env.DEV && path.startsWith("/dfmea")) {
    console.log("[DFMEA][fetch-status]", {
      url: requestUrl,
      method: requestMethod,
      status: response.status,
      ok: response.ok,
    });
  }

  if (!response.ok) {
    const detailText = await response.text();
    if (import.meta.env.DEV && path.startsWith("/dfmea")) {
      console.log("[DFMEA][fetch-error-body]", {
        url: requestUrl,
        method: requestMethod,
        body: detailText,
      });
    }
    try {
      const parsed = JSON.parse(detailText) as { detail?: string };
      throw new Error(parsed.detail || detailText || `Request failed with status ${response.status}`);
    } catch {
      throw new Error(detailText || `Request failed with status ${response.status}`);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const parsedJson = (await response.json()) as T;
  if (import.meta.env.DEV && path.startsWith("/dfmea")) {
    console.log("[DFMEA][fetch-json]", {
      url: requestUrl,
      method: requestMethod,
      data: parsedJson,
    });
  }
  return parsedJson;
}
