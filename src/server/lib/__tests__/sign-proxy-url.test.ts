import { describe, it, expect } from "vitest";
import { signImageUrl, verifyImageUrl } from "../sign-proxy-url";

describe("Utils: image signing", () => {
  it("should sign and verify URL correctly", () => {
    const url = "https://example.com/image.jpg";
    const signed = signImageUrl(url);
    
    // The signed URL should contain the original URL and a sig
    expect(signed).toContain("url=https%3A%2F%2Fexample.com%2Fimage.jpg");
    expect(signed).toContain("sig=");

    // Extract signature from URL
    const sigMatch = signed.match(/sig=([a-f0-9]+)/);
    expect(sigMatch).not.toBeNull();
    
    if (sigMatch) {
      const isValid = verifyImageUrl(url, sigMatch[1]);
      expect(isValid).toBe(true);
    }
  });

  it("rejects noncanonical encodings of a valid signature", () => {
    const url = "https://example.com/image.jpg";
    const query = new URL(signImageUrl(url), "https://yomirra.test").searchParams;
    const signature = query.get("sig")!;
    expect(verifyImageUrl(url, signature + "!suffix")).toBe(false);
    expect(verifyImageUrl(url, signature.toUpperCase())).toBe(false);
  });

  it("should fail verification with wrong signature", () => {
    const isValid = verifyImageUrl("https://example.com/image.jpg", "wrongsignature123");
    expect(isValid).toBe(false);
  });
});
