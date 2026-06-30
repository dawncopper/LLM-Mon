import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateBusyLevel } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_, res) => {
  const models = await prisma.model.findMany({
    include: { apiKey: { select: { label: true, provider: true } } },
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
    });
  }

  const totalRequests = metrics.length;
  const failedRequests = metrics.filter(m => !m.success).length;
  const avgResponseTime = Math.round(
    metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
  );
  const errorRate = Math.round((failedRequests / totalRequests) * 100);

  res.json({
    modelId: id,
    responseTime: avgResponseTime,
    errorRate,
    successRate: 100 - errorRate,
    busyLevel: calculateBusyLevel(avgResponseTime),
    lastUpdated: metrics[0].timestamp.getTime(),
    history: metrics.map(m => ({
      timestamp: m.timestamp.getTime(),
      responseTime: m.responseTime,
      success: m.success,
    })),
  });
});

export default router;
