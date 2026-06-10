import { prisma } from "@/server/lib/db/prisma";

export class SettingsManager {
  async getEnabledSources(): Promise<string[]> {
    const states = await prisma.sourceState.findMany({
      where: { isEnabled: true },
      select: { id: true },
    });
    
    // If empty, return default shinigami
    if (states.length === 0) {
      return ["shinigami"];
    }

    return states.map((s) => s.id);
  }

  async setSourceState(id: string, isEnabled: boolean) {
    await prisma.sourceState.upsert({
      where: { id },
      update: { isEnabled },
      create: {
        id,
        name: id, // Basic name
        version: "1.0.0",
        isEnabled,
      },
    });
  }
}

export const settingsManager = new SettingsManager();
