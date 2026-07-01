import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { calculateBusyLevel } from '../types/index.js';
import { runMultiTest, TestCase } from '../services/llm.js';

const router = Router();

router.get('/', async (_, res) => {
  const models = await prisma.model.findMany({
    include: { apiKey: { select: { label: true, provider: true, id: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(models);
});

router.post('/', async (req, res) => {
  const { name, apiDocUrl, apiEndpoint, apiKeyId } = req.body;
  if (!name || !apiEndpoint || !apiKeyId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const model = await prisma.model.create({
    data: { name, apiDocUrl, apiEndpoint, apiKeyId },
  });
  res.json(model);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.model.delete({ where: { id } });
  res.json({ success: true });
});

router.get('/:id/metrics', async (req, res) => {
  const { id } = req.params;
  const hours = req.query.hours ? Number(req.query.hours) : 24;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const metrics = await prisma.metric.findMany({
    where: { modelId: id, timestamp: { gte: since } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  if (metrics.length === 0) {
    return res.json({
      modelId: id,
      responseTime: 0,
      errorRate: 0,
      successRate: 100,
      busyLevel: 'idle',
      lastUpdated: Date.now(),
      history: [],
      qualityScore: 0,
      consistencyScore: 100,
      juiceValue: null,
    });
  }

  const totalRequests = metrics.length;
  const failedRequests = metrics.filter(m => !m.success).length;
  const avgResponseTime = Math.round(
    metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
  );
  const errorRate = Math.round((failedRequests / totalRequests) * 100);

  const responseTimes = metrics.map(m => m.responseTime);
  const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const variance = responseTimes.reduce((a, b) => a + (b - mean) ** 2, 0) / responseTimes.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  const consistencyScore = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));

  let speedScore = 25;
  if (avgResponseTime < 1000) speedScore = 100;
  else if (avgResponseTime < 3000) speedScore = 75;
  else if (avgResponseTime < 5000) speedScore = 50;

  const successRate = 100 - errorRate;
  const qualityScore = Math.round(successRate * 0.4 + consistencyScore * 0.3 + speedScore * 0.3);

  const latestMetric = metrics[0];
  const juiceValue = latestMetric.juiceValue;

  res.json({
    modelId: id,
    responseTime: avgResponseTime,
    errorRate,
    successRate,
    busyLevel: calculateBusyLevel(avgResponseTime),
    lastUpdated: metrics[0].timestamp.getTime(),
    history: metrics.map(m => ({
      timestamp: m.timestamp.getTime(),
      responseTime: m.responseTime,
      success: m.success,
    })),
    qualityScore,
    consistencyScore,
    juiceValue,
  });
});

router.post('/:id/test', async (req, res) => {
  const { id } = req.params;
  const testCases = req.body.testCases as TestCase[] | undefined;

  try {
    const model = await prisma.model.findUnique({
      where: { id },
      include: { apiKey: true },
    });

    if (!model || !model.apiKey) {
      return res.status(404).json({ error: 'Model or API key not found' });
    }

    const results = await runMultiTest(
      model.apiEndpoint,
      model.apiKey.key,
      model.apiKey.provider,
      model.name,
      testCases
    );

    const testResults: Record<string, any> = {};
    let totalResponseTime = 0;
    let successCount = 0;
    let totalTests = 0;
    let juiceValue: number | null = null;

    for (const [testId, result] of Object.entries(results)) {
      testResults[testId] = {
        responseTime: result.responseTime,
        success: result.success,
        outputSnippet: result.output.slice(0, 500),
        score: result.success ? 100 : 0,
      };
      totalResponseTime += result.responseTime;
      if (result.success) successCount++;
      totalTests++;
      if (result.juiceValue !== undefined) {
        juiceValue = result.juiceValue;
      }
    }

    const avgResponseTime = totalTests > 0 ? Math.round(totalResponseTime / totalTests) : 0;
    const successRate = totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0;

    await prisma.metric.create({
      data: {
        modelId: model.id,
        responseTime: avgResponseTime,
        success: successCount > 0,
        juiceValue: juiceValue ?? undefined,
      },
    });

    res.json({
      modelId: model.id,
      responseTime: avgResponseTime,
      successRate,
      errorRate: 100 - successRate,
      juiceValue,
      testResults,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('Test error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/test-cases', async (req, res) => {
  const { id } = req.params;
  try {
    const testCases = await prisma.testCase.findMany({
      where: { modelId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(testCases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/test-cases', async (req, res) => {
  const { id } = req.params;
  const { name, prompt, category } = req.body;
  if (!name || !prompt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const testCase = await prisma.testCase.create({
      data: { modelId: id, name, prompt, category: category || 'custom' },
    });
    res.json(testCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/test-cases/:testCaseId', async (req, res) => {
  const { testCaseId } = req.params;
  try {
    await prisma.testCase.delete({ where: { id: testCaseId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
