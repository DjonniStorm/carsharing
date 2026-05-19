import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpApiError } from "@/shared/api/http-api-error";
import { messageFromResponseBody } from "@/shared/api/message-from-response-body";
import { resolveApiErrorMessage } from "@/shared/api/resolve-api-error-message";
import { LANG_KEYS } from "@/shared/i18n/keys";

vi.mock("@/shared/i18n/translate", () => ({
  translate: (key: string) => `t:${key}`,
}));

describe("messageFromResponseBody", () => {
  it("returns trimmed string message", () => {
    expect(messageFromResponseBody({ message: "  hello  " })).toBe("hello");
  });

  it("joins validation array", () => {
    expect(messageFromResponseBody({ message: ["a", "b"] })).toBe("a, b");
  });

  it("returns null for missing message", () => {
    expect(messageFromResponseBody({})).toBeNull();
  });
});

describe("resolveApiErrorMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Nest message from HttpApiError", () => {
    expect(
      resolveApiErrorMessage(
        new HttpApiError("Нельзя изменить автомобиль: активная поездка", 409),
      ),
    ).toBe("Нельзя изменить автомобиль: активная поездка");
  });

  it("maps Failed to fetch to network i18n", () => {
    expect(resolveApiErrorMessage(new TypeError("Failed to fetch"))).toBe(
      `t:${LANG_KEYS.errors.network}`,
    );
  });

  it("maps empty 500 to server i18n", () => {
    expect(resolveApiErrorMessage(new HttpApiError("", 500))).toBe(
      `t:${LANG_KEYS.errors.server}`,
    );
  });

  it("maps AbortError to timeout i18n", () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    expect(resolveApiErrorMessage(err)).toBe(`t:${LANG_KEYS.errors.timeout}`);
  });
});
