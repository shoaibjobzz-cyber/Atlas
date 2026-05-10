import { requestJson } from "./httpClient";
import type { AuthSession, SignInPayload } from "../types/auth";

export function fetchCurrentSession(): Promise<AuthSession> {
  return requestJson<AuthSession>("/auth/session");
}

export function signIn(payload: SignInPayload): Promise<AuthSession> {
  return requestJson<AuthSession>("/auth/sign-in", {
    method: "POST",
    body: payload,
  });
}

export function signOut(): Promise<{ ok: boolean }> {
  return requestJson<{ ok: boolean }>("/auth/sign-out", {
    method: "POST",
  });
}
