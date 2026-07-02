import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { encryptKey, decryptKey } from '../utils/crypto.js';

const router = Router();

// 获取当前用户的所有 API Key
router.get('/', async (req: any, res) => {
  const userId = req.userId;
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  // 返回时隐藏真实 key
  res.json(keys.map(k => ({ ...k, key: '***' })));
});

// 创建 API Key（绑定到当前用户）
router.post('/', async (req: any, res) => {
  const userId = req.userId;
  const { provider, key, label } = req.body;
  if (!provider || !key || !label) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const encrypted = encryptKey(key);
  const apiKey = await prisma.apiKey.create({
    data: { provider, key: encrypted, label, userId },
  });
  res.json({ ...apiKey, key: '***' });
});

// 删除 API Key（仅限自己的）
router.delete('/:id', async (req: any, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const existing = await prisma.apiKey.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return res.status(404).json({ error: 'API key not found' });
  }
  await prisma.apiKey.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
