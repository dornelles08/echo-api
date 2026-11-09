import type { TestApp } from "./test-app";

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  token: string;
  refreshCookie: string;
}

let counter = 0;

/** Creates a user through the BetterAuth HTTP API and returns a valid session token. */
export async function registerAndLogin(
  app: TestApp,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<TestUser> {
  counter += 1;

  const user: TestUser = {
    name: overrides.name ?? `E2E User ${counter}`,
    email: overrides.email ?? `e2e-user-${counter}-${Date.now()}@echo.test`,
    password: overrides.password ?? "secret123",
    token: "",
    refreshCookie: "",
  };

  const registerResponse = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    headers: { origin: "http://localhost:3000" },
    payload: { name: user.name, email: user.email, password: user.password },
  });

  if (registerResponse.statusCode !== 200) {
    throw new Error(
      `Failed to register user: ${registerResponse.statusCode} ${registerResponse.body}`,
    );
  }

  const body = registerResponse.json() as { token: string };
  user.token = body.token;

  return user;
}

/** Fetches the profile of a logged-in user (also exposes the user id). */
export async function getProfile(app: TestApp, token: string) {
  const response = await app.inject({
    method: "GET",
    url: "/me",
    headers: { authorization: `Bearer ${token}` },
  });

  return response;
}
