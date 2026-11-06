import type { TestApp } from "./test-app";

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  token: string;
  /** Value of the `refreshToken` cookie set by /authenticate. */
  refreshCookie: string;
}

let counter = 0;

/** Creates a user through the HTTP API and returns a valid access token. */
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
    url: "/users",
    payload: { name: user.name, email: user.email, password: user.password },
  });

  if (registerResponse.statusCode !== 201) {
    throw new Error(
      `Failed to register user: ${registerResponse.statusCode} ${registerResponse.body}`,
    );
  }

  const loginResponse = await app.inject({
    method: "POST",
    url: "/authenticate",
    payload: { email: user.email, password: user.password },
  });

  if (loginResponse.statusCode !== 200) {
    throw new Error(`Failed to login: ${loginResponse.statusCode} ${loginResponse.body}`);
  }

  const body = loginResponse.json() as { token: string };
  user.token = body.token;

  const setCookie = loginResponse.cookies.find((cookie) => cookie.name === "refreshToken");
  if (!setCookie) {
    throw new Error("refreshToken cookie was not set");
  }
  user.refreshCookie = setCookie.value;

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
