import { getAnalyticsConfig } from '../config';
import type { PurchaseBuyer } from '../types';
import gaService from './ga.service';
import { trackPaymentConversion } from './impact.service';
import metaService from './meta.service';

export const sendPurchaseEvents = async (buyer: PurchaseBuyer | null): Promise<void> => {
  if (!getAnalyticsConfig().isProduction) {
    console.info('[Analytics] Purchase events are not sent outside production');
    return;
  }

  metaService.trackPurchase();

  if (!buyer) {
    console.warn('[Analytics] No buyer found, GA and Impact purchase events are not sent');
    return;
  }

  gaService.trackPurchase(buyer);
  await trackPaymentConversion(buyer);
};
