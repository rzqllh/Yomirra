// Shared normalization for the application and offline metadata index.
export function normalizeTitle(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/\[(?:bahasa indonesia|indonesia|indo|color|warna|raw)\]|\((?:bahasa indonesia|indonesia|indo|color|warna|raw)\)/gi, " ")
    .replace(/\bseason\s+(?:i{1,3}|iv|v|vi{1,3}|ix|x)\b/gi, (match) => {
      const map = {
        "season i": "season 1",
        "season ii": "season 2",
        "season iii": "season 3",
        "season iv": "season 4",
        "season v": "season 5",
        "season vi": "season 6",
        "season vii": "season 7",
        "season viii": "season 8",
        "season ix": "season 9",
        "season x": "season 10",
      };
      return map[match.toLowerCase()] ?? match;
    })
    .replace(/[^\p{L}\p{N}\p{M} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

