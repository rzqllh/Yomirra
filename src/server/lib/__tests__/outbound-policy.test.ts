import { describe, it, expect, vi } from 'vitest';
import { isSafeIp, safeFetch } from '../security/outbound-policy';

describe('Outbound Policy Security Regression Suite', () => {
  describe('isSafeIp', () => {
    it('rejects private IPv4 ranges', () => {
      expect(isSafeIp('10.0.0.1')).toBe(false);
      expect(isSafeIp('172.16.0.1')).toBe(false);
      expect(isSafeIp('192.168.1.1')).toBe(false);
    });

    it('rejects loopback addresses', () => {
      expect(isSafeIp('127.0.0.1')).toBe(false);
      expect(isSafeIp('::1')).toBe(false);
    });

    it('rejects link-local addresses', () => {
      expect(isSafeIp('169.254.169.254')).toBe(false);
    });

    it('rejects IPv6 private/local addresses', () => {
      expect(isSafeIp('fc00::1')).toBe(false);
      expect(isSafeIp('fe80::1')).toBe(false);
    });

    it('allows safe external IPs', () => {
      expect(isSafeIp('8.8.8.8')).toBe(true);
      expect(isSafeIp('1.1.1.1')).toBe(true);
      expect(isSafeIp('2001:4860:4860::8888')).toBe(true);
    });
  });

  describe('safeFetch', () => {
    it('rejects unsupported protocols (ftp, file, gopher)', async () => {
      await expect(safeFetch('ftp://example.com/')).rejects.toThrowError('SECURITY_REJECTED: Unsupported protocol');
      await expect(safeFetch('file:///etc/passwd')).rejects.toThrowError('SECURITY_REJECTED: Unsupported protocol');
      await expect(safeFetch('gopher://example.com')).rejects.toThrowError('SECURITY_REJECTED: Unsupported protocol');
    });

    it('rejects URLs with credentials', async () => {
      await expect(safeFetch('https://user:pass@example.com/')).rejects.toThrowError('SECURITY_REJECTED: URL credentials are not allowed');
    });
  });
});
