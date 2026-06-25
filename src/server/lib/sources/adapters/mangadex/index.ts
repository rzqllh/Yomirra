import { MangaDexBase } from "./mangadex-base";

export class MangaDexSource extends MangaDexBase {
  id = "mangadex";
  name = "MangaDex";
  description = "A free, high-quality manga reader (Safe/Suggestive only).";
  language = "all";
  isNsfw = false;
  contentRatings = ["safe", "suggestive"];
}

export class MangaDexNsfwSource extends MangaDexBase {
  id = "mangadex-nsfw";
  name = "MangaDex (NSFW)";
  description = "A free, high-quality manga reader (Erotica/Pornographic only).";
  language = "all";
  isNsfw = true;
  contentRatings = ["erotica", "pornographic"];
}
