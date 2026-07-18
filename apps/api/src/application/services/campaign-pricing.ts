import type { ProductDetail, ProductSummary } from '@half-dinar/shared';

/** Apply active campaign sale price to a product summary for storefront display. */
export function applyCampaignToSummary(
  summary: ProductSummary,
  campaignPrices: Map<string, number>,
): ProductSummary {
  const sale = campaignPrices.get(summary.id);
  if (sale === undefined || sale >= summary.price) return summary;
  return {
    ...summary,
    compareAtPrice: summary.price,
    price: sale,
  };
}

export function applyCampaignToSummaries(
  summaries: ProductSummary[],
  campaignPrices: Map<string, number>,
): ProductSummary[] {
  return summaries.map((s) => applyCampaignToSummary(s, campaignPrices));
}

export function applyCampaignToDetail(
  detail: ProductDetail,
  campaignPrices: Map<string, number>,
): ProductDetail {
  const priced = applyCampaignToSummary(detail, campaignPrices);
  return {
    ...detail,
    price: priced.price,
    compareAtPrice: priced.compareAtPrice,
    relatedProducts: applyCampaignToSummaries(detail.relatedProducts, campaignPrices),
  };
}

export function getEffectiveProductPrice(
  productId: string,
  basePrice: number,
  campaignPrices: Map<string, number>,
): { unitPrice: number; originalUnitPrice: number | null } {
  const sale = campaignPrices.get(productId);
  if (sale !== undefined && sale < basePrice) {
    return { unitPrice: sale, originalUnitPrice: basePrice };
  }
  return { unitPrice: basePrice, originalUnitPrice: null };
}
