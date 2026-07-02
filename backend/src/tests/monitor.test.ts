/**
 * monitor.test.ts
 * 测试质量评分、一致性评分、Juice 趋势计算逻辑
 */
import { describe, it, expect } from 'vitest';
import {
  calcConsistencyScore,
  calcQualityScore,
  calcJuiceTrend,
} from '../services/monitor.js';

// 为了测试 calcQualityScore，我们需要模拟 LLMTestResult 类型
interface LLMTestResult {
  responseTime: number;
  success: boolean;
  output: string;
  juiceValue?: number;
  factMatch?: boolean;
  wordCount?: number;
}

describe('calcConsistencyScore', () => {
  it('当响应时间完全相同时应当返回 100（完全一致）', () => {
    const times = [1000, 1000, 1000, 1000];
    const score = calcConsistencyScore(times);
    expect(score).toBe(100);
  });

  it('当数组为空时应当返回 100', () => {
    const score = calcConsistencyScore([]);
    expect(score).toBe(100);
  });

  it('当数组只包含 0 时应当返回 100', () => {
    const score = calcConsistencyScore([0, 0, 0]);
    expect(score).toBe(100);
  });

  it('波动较小时应当返回较高的分数', () => {
    const times = [1000, 1100, 1050, 950, 1020];
    const score = calcConsistencyScore(times);
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('波动较大时应当返回较低的分数', () => {
    const times = [500, 2000, 800, 3000, 600];
    const score = calcConsistencyScore(times);
    expect(score).toBeLessThan(50);
  });

  it('应当过滤掉响应时间为 0 的条目', () => {
    const times = [1000, 0, 1000, 0];
    const score = calcConsistencyScore(times);
    // 只有两个有效数据点，score 应该较高
    expect(score).toBeGreaterThan(50);
  });
});

describe('calcJuiceTrend', () => {
  it('当 currentValue 为 undefined 时应当返回 null', () => {
    const trend = calcJuiceTrend(undefined, 500);
    expect(trend).toBeNull();
  });

  it('当 baseline 为 0 时应当返回 "stable"', () => {
    const trend = calcJuiceTrend(500, 0);
    expect(trend).toBe('stable');
  });

  it('当差异小于 5% 时应当返回 "stable"', () => {
    const trend = calcJuiceTrend(520, 500);
    expect(trend).toBe('stable');
  });

  it('当差异大于 5% 且值增加时应当返回 "improving"', () => {
    const trend = calcJuiceTrend(600, 500);
    expect(trend).toBe('improving');
  });

  it('当差异小于 -5% 且值减少时应当返回 "degrading"', () => {
    const trend = calcJuiceTrend(400, 500);
    expect(trend).toBe('degrading');
  });

  it('边界情况：恰好 5% 差异', () => {
    // pctDiff = 5 时，> 5 为 false，所以返回 stable
    const trend1 = calcJuiceTrend(526, 500); // 5.2% -> improving
    expect(trend1).toBe('improving');

    const trend2 = calcJuiceTrend(474, 500); // -5.2% -> degrading
    expect(trend2).toBe('degrading');

    const trend3 = calcJuiceTrend(525, 500); // 恰好 5% -> stable
    expect(trend3).toBe('stable');
  });
});

describe('calcQualityScore', () => {
  function makeResult(success: boolean, responseTime: number, opts?: Partial<LLMTestResult>): LLMTestResult {
    return { responseTime, success, output: '', ...opts };
  }

  it('当没有测试结果时应当返回 0', () => {
    const score = calcQualityScore({}, 100, null);
    expect(score).toBe(0);
  });

  it('全成功且一致性高、速度快时应当返回高分', () => {
    const results: Record<string, LLMTestResult> = {
      t1: makeResult(true, 800),
      t2: makeResult(true, 900),
      t3: makeResult(true, 850),
    };
    const score = calcQualityScore(results, 95, 'stable');
    expect(score).toBeGreaterThan(60);
  });

  it('全失败时应当返回低分', () => {
    const results: Record<string, LLMTestResult> = {
      t1: makeResult(false, 0),
      t2: makeResult(false, 0),
    };
    const score = calcQualityScore(results, 100, null);
    // 成功率 0%，一致性 100，速度 ~0，juice null
    // = 0*0.4 + 100*0.2 + ~0*0.1 + 0 = 20
    expect(score).toBe(20);
  });

  it('有事实性测试结果时应当纳入计算', () => {
    const results: Record<string, LLMTestResult> = {
      t1: makeResult(true, 1000, { factMatch: true }),
      t2: makeResult(true, 1200, { factMatch: true }),
      t3: makeResult(false, 0, { factMatch: false }),
    };
    const score = calcQualityScore(results, 80, 'stable');
    // 有 factResults，走 factMatch 分支
    // successComponent = (2/3)*100*0.4 = 26.67
    // consistencyComponent = 80*0.2 = 16
    // speedComponent 取决于 avgResponseTime
    // factScore = (2/2)*100*0.1 = 10
    // 总计约 52+
    expect(score).toBeGreaterThan(40);
  });

  it('Juice 趋势为 improving 时应当获得额外奖励分数', () => {
    const results: Record<string, LLMTestResult> = {
      t1: makeResult(true, 1000),
      t2: makeResult(true, 1100),
    };
    const scoreStable = calcQualityScore(results, 90, 'stable');
    const scoreImproving = calcQualityScore(results, 90, 'improving');

    expect(scoreImproving).toBeGreaterThan(scoreStable);
  });

  it('Juice 趋势为 degrading 时应当被扣分', () => {
    const results: Record<string, LLMTestResult> = {
      t1: makeResult(true, 1000),
      t2: makeResult(true, 1100),
    };
    const scoreStable = calcQualityScore(results, 90, 'stable');
    const scoreDegrading = calcQualityScore(results, 90, 'degrading');

    expect(scoreDegrading).toBeLessThan(scoreStable);
  });

  it('质量分应当在 0-100 范围内', () => {
    const results: Record<string, LLMTestResult> = {
      t1: makeResult(true, 500),
      t2: makeResult(true, 600),
    };
    const score = calcQualityScore(results, 100, 'improving');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
