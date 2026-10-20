export { configureAnalytics } from './config';
export type { AnalyticsConfig } from './config';
export type { CouponCodeData, PlanPrice, PriceWithTax, PurchaseBuyer } from './types';

export { AnalyticsStorageKey, PURCHASE_STORAGE_KEYS } from './storage/keys';
export { clearPaymentStorage } from './storage/storage';
export { getCookie, setImpactCookies } from './utils/cookies';

export { default as gaService } from './services/ga.service';
export { default as metaService, trackLead, trackCheckoutStart } from './services/meta.service';
export {
  savePaymentDataInLocalStorage,
  handleImpactDTCCheckout,
  trackSignUp,
  trackPaymentConversion,
} from './services/impact.service';
export type { SavePaymentDataParams } from './services/impact.service';
export { sendConversionToAPI } from './services/googleSheet.service';
export { sendAddShoppersConversion } from './services/addShoppers.services';
export { sendPurchaseEvents } from './services/purchase.service';
