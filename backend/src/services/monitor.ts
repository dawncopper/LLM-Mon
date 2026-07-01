import { prisma } from './lib/prisma.js';
import { runMultiTest, DEFAULT_TEST_CASES } from './llm.js';

const METRICS_RETENTION_LIMIT = 100;

async function cleanupOldMetrics(modelId: string): Promise<void> {
  // 获取该模型的所有 metrics，按时间倒序
  const metrics = await prisma.metric.findMany({
    where: { modelId },
    orderBy: { timestamp: 'desc' },
    select: { id: true },
  });

  // 如果超过限制，删除多余的旧记录
  if (metrics.length > METRICS_RETENTION_LIMIT) {
    const idsToDelete = metrics.slice(METRICS_RETENTION_LIMIT).map((m) => m.id);
    await prisma.metric.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`[Cleanup] Deleted ${idsToDelete.length} old metrics for model ${modelId}`);
  }
}

export async function startMonitor(): Promise<void> {
  const models = await prisma.model.findMany({
    include: { apiKey: true, testCases: true },
  });

  for (const model of models) {
    if (!model.apiKey) continue;

    try {
      // 使用模型的自定义测试用例，如果没有则使用默认测试用例
      const testCases = model.testCases.length > 0 ? model.testCases : DEFAULT_TEST_CASES;

      const results = await runMultiTest(
        model.apiEndpoint,
        model.apiKey.key,
        model.apiKey.provider,
        model.name,
        testCases
      );

      // 计算平均响应时间和成功率
      const responseTimes = Object.values(results).map((r) => r.responseTime);
      const avgResponseTime = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      );
      const successCount = Object.values(results).filter((r) => r.success).length;
      const successRate = Math.round((successCount / Object.keys(results).length) * 100);

      // 提取 Juice 值（如果存在）
      const juiceValue = Object.values(results).find((r) => r.juiceValue)?.juiceValue;

      await prisma.metric.create({
        data: {
          modelId: model.id,
          responseTime: avgResponseTime,
          success: successCount > 0,
          juiceValue: juiceValue ?? undefined,
        },
      });

      console.log(
        `[Monitor] ${model.name}: ${avgResponseTime}ms, success=${successRate}%, juice=${juiceValue ?? 'N/A'}`
      );

      // 清理旧数据
      await cleanupOldMetrics(model.id);
    } catch (err) {
      console.error(`[Monitor] Error monitoring ${model.name}:`, err);

      // 记录失败
      await prisma.metric.create({
        data: {
          modelId: model.id,
          responseTime: 0,
          success: false,
        },
      });
    }
  }
}
