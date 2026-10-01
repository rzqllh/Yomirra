import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../logger";

describe("logger credential redaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts credential-bearing metadata fields recursively", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("request failed", {
      authorization: "Bearer super-secret-token",
      nested: {
        cookie: "yomirra_admin_session=session-value",
        safe: "visible",
      },
      headers: {
        "x-api-key": "api-key-value",
      },
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const output = errorSpy.mock.calls[0].join(" ");
    expect(output).toContain("[REDACTED]");
    expect(output).toContain("visible");
    expect(output).not.toContain("super-secret-token");
    expect(output).not.toContain("session-value");
    expect(output).not.toContain("api-key-value");
  });

  it("redacts tokens and signatures embedded in strings and URLs", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error(
      "upstream failed https://example.test/image?sig=signed-value&token=token-value",
      {
        message: "Authorization: Bearer bearer-value",
        url: "https://example.test/path?key=key-value&safe=1",
      },
    );

    const output = errorSpy.mock.calls[0].join(" ");
    expect(output).toContain("safe=1");
    expect(output).not.toContain("signed-value");
    expect(output).not.toContain("token-value");
    expect(output).not.toContain("bearer-value");
    expect(output).not.toContain("key-value");
  });

  it("redacts sensitive values from Error messages and stacks", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error(
      "failed with Bearer bearer-secret at https://example.test/?sig=signature-secret",
    );

    logger.error("request failed", { error });

    const output = errorSpy.mock.calls[0].join(" ");
    expect(output).not.toContain("bearer-secret");
    expect(output).not.toContain("signature-secret");
  });
});
