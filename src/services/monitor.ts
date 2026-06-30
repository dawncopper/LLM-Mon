import { PrismaClient } from '@prisma/client';
import { callLLMApi } from './llm.js';

export async function startMonitor(prisma: PrismaClient): Promise<void> {
  const models = await prisma.model.findMany({
    include: { apiKey: true },
  });

  for (const model of models) {
    try {
      const result = await callLLMApi(
        model.apiEndpoint,
        model.apiKey.key,
        model.apiKey.provider
      );

      await prisma.metric.create({
        data: {
          modelId: model.id,
          responseTime: result.responseTime,
          success: result.success,
        },
      });
      
      console.log(`[Monitor] ${model.name}: ${result.responseTime}ms, success=${result.success}`);
    } catch (err) {
      console.error(`[Monitor] Error monitoring ${model.name}:`, err);
    }
  }
}
