import { prisma } from '../lib/prisma.js';
import { runMultiTest, DEFAULT_TEST_CASES, type TestCase, type LLMTestResult } from './llm.js';

const METRICS_RETENTION_LIMIT = 100;
const JUICE_TRENDBASE_WINDOW = 5;  // 最近 5 次作为 Juice 基准线

async function cleanupOldMetrics(modelId: string): Promise<void> {
  const metrics = await prisma.metric.findMany({
    where: { modelId },
    orderBy: { timestamp: 'desc' },
    select: { id: true },
  });

  if (metrics.length > METRICS_RETENTION_LIMIT) {
    const idsToDelete = metrics.slice(METRICS_RETENTION_LIMIT).map((m) => m.id);
    await prisma.metric.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`[Cleanup] Deleted ${idsToDelete.length} old metrics for model ${modelId}`);
  }
}

/** 计算 Juice 趋势 */
function calcJuiceTrend(
  currentValue: number | undefined,
  baseline: number
): string | null {
  if (currentValue === undefined) return null;
  if (baseline === 0) return 'stable';
  const pctDiff = ((currentValue - baseline) / baseline) * 100;
  if (pctDiff > 5) return 'improving';
  if (pctDiff < -5) return 'degrading';
  return 'stable';
}

/** 计算一致性分数（基于响应时间变异系数） */
function calcConsistencyScore(responseTimes: number[]): number {
  if (responseTimes.length === 0) return 100;
  const filtered = responseTimes.filter(t => t > 0);
  if (filtered.length === 0) return 100;

  const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  if (mean === 0) return 100;

  const variance = filtered.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / filtered.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;  // 变异系数

  // CV 越小越一致，映射到 0-100
  const score = Math.max(0, Math.min(100, 100 - cv * 100));
  return Math.round(score);
}

/** 计算质量分 */
function calcQualityScore(
  results: Record<string, LLMTestResult>,
  consistencyScore: number,
  juiceTrend: string | null
): number {
  const testResults = Object.values(results);
  const total = testResults.length;
  if (total === 0) return 0;

  // 1. 成功率分量 (40% 权重)
  const successCount = testResults.filter(r => r.success).length;
  const successRate = (successCount / total) * 100;
  const successComponent = successRate * 0.4;

  // 2. 一致性分量 (20% 权重)
  const consistencyComponent = consistencyScore * 0.2;

  // 3. 速度分量 (10% 权重) - 平均响应时间越短越好
  const responseTimes = testResults.map(r => r.responseTime).filter(t => t > 0);
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 60000;
  // 假设目标 < 3000ms 为满分，> 15000ms 为 0 分
  const speedScore = Math.max(0, Math.min(100, 100 * (1 - (avgResponseTime - 3000) / 12000)));
  const speedComponent = speedScore * 0.1;

  // 4. 事实准确性分量 (10% 权重)
  const factResults = testResults.filter(r => r.factMatch !== undefined);
  if (factResults.length > 0) {
    const factCorrect = factResults.filter(r => r.factMatch === true).length;
    const factScore = (factCorrect / factResults.length) * 100;
    return successComponent + consistencyComponent + speedComponent + factScore * 0.1;
  }

  // 5. Juice 趋势分量 (20% 权重)
  let juiceComponent = 0;
  if (juiceTrend === 'stable') {
    juiceComponent = 20;
  } else if (juiceTrend === 'improving') {
    juiceComponent = 25;  // 奖励改进
  } else if (juiceTrend === 'degrading') {
    juiceComponent = 5;   // 惩罚降级
  }

  return Math.round(successComponent + consistencyComponent + speedComponent + juiceComponent);
}

export async function startMonitor(): Promise<void> {
  const models = await prisma.model.findMany({
    include: { apiKey: true, testCases: true },
  });

  for (const model of models) {
    if (!model.apiKey) continue;

    try {
      const testCases: TestCase[] =
        model.testCases.length > 0
          ? model.testCases.map((tc) => ({
              id: tc.id,
              name: tc.name,
              prompt: tc.prompt,
              category: tc.category as TestCase['category'],
              expected: undefined,  // DB doesn't store expected
              weight: 1.0,          // default weight
            }))
          : DEFAULT_TEST_CASES;

      const results = await runMultiTest(
        model.apiEndpoint,
        model.apiKey.key,
        model.apiKey.provider,
        model.name,
        testCases
      );

      // 计算各维度指标
      const responseTimes = Object.values(results).map((r) => r.responseTime);
      const avgResponseTime = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      );

      const successCount = Object.values(results).filter((r) => r.success).length;
      const successRate = Math.round((successCount / Object.keys(results).length) * 100);

      const consistencyScore = calcConsistencyScore(responseTimes);

      // Juice 趋势分析
      const juiceResult = Object.values(results).find((r) => r.juiceValue !== undefined);
      const juiceValue = juiceResult?.juiceValue;

      // 获取最近的 Juice 基准线
      const recentMetrics = await prisma.metric.findMany({
        where: { modelId: model.id, juiceValue: { not: null } },
        orderBy: { timestamp: 'desc' },
        select: { juiceValue: true },
        take: JUICE_TRENDBASE_WINDOW,
      });

      let baseline = 0;
      let juiceTrend: string | null = null;

      if (recentMetrics.length > 0 && juiceValue !== undefined) {
        const juiceValues = recentMetrics.map(m => m.juiceValue).filter(v => v !== null) as number[];
        baseline = Math.round(juiceValues.reduce((a, b) => a + b, 0) / juiceValues.length);
        juiceTrend = calcJuiceTrend(juiceValue, baseline);
      } else if (juiceValue !== undefined) {
        baseline = juiceValue;  // 第一次检测到 Juice，直接设为基准
        juiceTrend = 'stable';
      }

      // 计算质量分
      const qualityScore = calcQualityScore(results, consistencyScore, juiceTrend);

      // 计算吞吐量
      const throughputResult = results['throughput_speed'];
      const throughputTPS = throughputResult && throughputResult.wordCount
        ? parseFloat(((throughputResult.wordCount / (throughputResult.responseTime / 1000))).toFixed(2))
        : undefined;

      // 写入数据库
      await prisma.metric.create({
        data: {
          modelId: model.id,
          responseTime: avgResponseTime,
          success: successCount > 0,
          juiceValue: juiceValue ?? undefined,
          juiceTrend,
          juiceBaseline: baseline,
          successRate: successRate > 0 ? successRate : undefined,
          qualityScore: qualityScore > 0 ? qualityScore : undefined,
          consistencyScore: consistencyScore > 0 ? consistencyScore : undefined,
          throughputTPS: throughputTPS ?? undefined,
        },
      });

      console.log(
        `[Monitor] ${model.name}: ${avgResponseTime}ms, success=${successRate}%, juice=${juiceValue ?? 'N/A'}(${juiceTrend ?? '-'})` +
        `, quality=${qualityScore}, consistency=${consistencyScore}` +
        (throughputTPS ? `, throughput=${throughputTPS} w/s` : '')
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
