export { configureAnalytics } from './config';
export type { AnalyticsConfig } from './config';
export type { CouponCodeData, PlanPrice, PriceWithTax, PurchaseBuyer } from './types';

export { AnalyticsStorageKey, PURCHASE_STORAGE_KEYS } from './storage/keys';
export { clearPaymentStorage } from './storage/storage';

export { default as gaService } from './services/ga.service';
export { default as metaService, trackLead, trackCheckoutStart } from './services/meta.service';
export { sendAddShoppersConversion } from './services/addShoppers.services';
