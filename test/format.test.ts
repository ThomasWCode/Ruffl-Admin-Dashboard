import { describe, expect, it } from 'vitest';

import { disputeExposure, materialTotal, sentenceCase } from '../src/lib/format';

describe('admin financial context', () => {
  it('totals material quantities and costs in pence-safe output', () => {
    expect(
      materialTotal([
        { id: '1', item: 'Fur', quantity: 2.5, unit: 'm', costPerUnit: 34.99 },
        { id: '2', item: 'Foam', quantity: 3, unit: 'sheet', costPerUnit: 12.5 },
      ]),
    ).toBe(124.98);
  });

  it('shows gross commission exposure after logged materials', () => {
    expect(
      disputeExposure({
        id: 'dispute',
        commissionId: 'commission',
        raisedById: 'a',
        status: 'open',
        explanation: 'Test',
        evidence: [],
        createdAt: new Date().toISOString(),
        materials: [{ id: '1', item: 'Fur', quantity: 2, unit: 'm', costPerUnit: 40 }],
        commission: {
          id: 'commission',
          title: 'Test',
          commissionerId: 'a',
          makerId: 'b',
          suitType: 'partial',
          status: 'disputed',
          budget: 2000,
          agreedTotal: 1800,
          depositPaid: true,
          updatedAt: new Date().toISOString(),
        },
      }),
    ).toEqual({ total: 1800, materialCost: 80, estimatedGrossAfterMaterials: 1720 });
  });

  it('formats machine values for people', () => {
    expect(sentenceCase('under_review')).toBe('Under review');
  });
});
