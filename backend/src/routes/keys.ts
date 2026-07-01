import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { encryptKey, decryptKey } from '../utils/crypto.js';

const router = Router();

router.get('/', async (_, res) => {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  // 返回时隐藏真实 key
  res.json(keys.map(k => ({ ...k, key: '***' })));
});

router.post('/', async (req, res) => {
  const { provider, key, label } = req.body;
  if (!provider || !key || !label) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const encrypted = encryptKey(key);
  const apiKey = await prisma.apiKey.create({
    data: { provider, key: encrypted, label },
  });
  res.json({ ...apiKey, key: '***' });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.apiKey.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
