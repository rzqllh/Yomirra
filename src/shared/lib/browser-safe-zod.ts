import { z } from "zod";

if (typeof window !== "undefined") {
  // Configure before constructing shared object schemas. Zod probes eval at construction.
  z.config({ jitless: true });
}

export { z };
