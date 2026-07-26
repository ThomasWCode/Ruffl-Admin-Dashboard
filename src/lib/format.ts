import type { Dispute, Material } from '../types';

export function formatMoney(value?: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value ?? 0);
}

export function materialTotal(materials: Material[]): number {
  return Math.round(
    materials.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0) * 100,
  ) / 100;
}

export function disputeExposure(dispute: Dispute): {
  total: number;
  materialCost: number;
  estimatedGrossAfterMaterials: number;
} {
  const total = dispute.commission?.agreedTotal ?? dispute.commission?.budget ?? 0;
  const materialCost = materialTotal(dispute.materials);
  return {
    total,
    materialCost,
    estimatedGrossAfterMaterials: Math.round((total - materialCost) * 100) / 100,
  };
}

export function sentenceCase(value: string): string {
  const spaced = value.replaceAll('_', ' ');
  return `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}`;
}
