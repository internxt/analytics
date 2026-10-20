export enum AnalyticsStorageKey {
  CheckoutItemData = 'checkout_item_data',
  ItemOriginalPrice = 'itemOriginalPrice',
  SubscriptionID = 'subscriptionId',
  PaymentIntentID = 'paymentIntentId',
  PriceId = 'priceId',
  ProductName = 'productName',
  Currency = 'currency',
  AmountPaid = 'amountPaid',
  CouponCode = 'couponCode',
  IsFirstPurchase = 'isFirstPurchase',
  CheckoutCustomerId = 'checkout_customer_id',
  ImpactSource = 'impact_source',
}

export const CHECKOUT_STORAGE_KEYS: AnalyticsStorageKey[] = [
  AnalyticsStorageKey.CheckoutItemData,
  AnalyticsStorageKey.ItemOriginalPrice,
];

export const PAYMENT_STORAGE_KEYS: AnalyticsStorageKey[] = [
  AnalyticsStorageKey.SubscriptionID,
  AnalyticsStorageKey.PaymentIntentID,
  AnalyticsStorageKey.PriceId,
  AnalyticsStorageKey.ProductName,
  AnalyticsStorageKey.Currency,
  AnalyticsStorageKey.AmountPaid,
  AnalyticsStorageKey.CouponCode,
  AnalyticsStorageKey.IsFirstPurchase,
  AnalyticsStorageKey.CheckoutCustomerId,
  AnalyticsStorageKey.ImpactSource,
];

export const PURCHASE_STORAGE_KEYS: AnalyticsStorageKey[] = [...CHECKOUT_STORAGE_KEYS, ...PAYMENT_STORAGE_KEYS];
