import { getAnalyticsConfig } from '../config';
import { AnalyticsStorageKey } from '../storage/keys';
import localStorageService from '../storage/storage';
import type { CouponCodeData } from '../types';
import { formatPrice, getProductAmount } from '../utils/price';
import { bytesToString } from '../utils/size';

interface BaseTrackParams {
  planId: string;
  planPrice: number;
  currency: string;
  planType: 'individual' | 'business';
  interval: string;
  storage: string;
  promoCodeId?: string;
  couponCodeData?: CouponCodeData;
  seats?: number;
}

type TrackBeginCheckoutParams = BaseTrackParams;

interface CheckoutItemData {
  item_name: string;
  item_category: string;
  item_variant: string;
  discount: number;
}

if (globalThis.window !== undefined && !globalThis.window.dataLayer) {
  globalThis.window.dataLayer = [];
}

function track(eventName: string, object: Record<string, any>): void {
  try {
    globalThis.window.dataLayer.push({
      event: eventName,
      ...object,
    });
  } catch (error) {
    console.error('[GA Service] Error tracking event:', error);
  }
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPlanCategory(planType: 'individual' | 'business'): string {
  return planType === 'individual' ? 'Individual' : 'Business';
}

function calculateDiscountAmount(originalPrice: number, couponCodeData?: CouponCodeData): number {
  if (!couponCodeData) {
    return 0;
  }

  const finalPriceString = getProductAmount(originalPrice, 1, couponCodeData);
  const finalPrice = Number.parseFloat(finalPriceString);

  if (Number.isNaN(finalPrice)) {
    console.warn('[GA Service] Invalid final price when calculating discount');
    return 0;
  }

  const discount = originalPrice - finalPrice;
  return Number.parseFloat(formatPrice(Math.max(0, discount)));
}

function buildItem(params: BaseTrackParams) {
  const { planId, planPrice, planType, interval, storage, promoCodeId, couponCodeData, seats = 1 } = params;

  const storageBytes = Number.parseInt(storage, 10);
  const formattedStorage = Number.isNaN(storageBytes) ? storage : bytesToString(storageBytes);
  const discount = calculateDiscountAmount(planPrice, couponCodeData);

  return {
    item_id: planId,
    item_name: `${formattedStorage} ${capitalizeFirstLetter(interval)} Plan`,
    item_category: getPlanCategory(planType),
    item_variant: interval,
    price: Number.parseFloat(formatPrice(planPrice)),
    quantity: seats,
    item_brand: 'Internxt',
    ...(promoCodeId && { coupon: promoCodeId }),
    ...(discount > 0 && { discount }),
  };
}

function trackBeginCheckout(params: TrackBeginCheckoutParams): void {
  try {
    const { planPrice, currency, promoCodeId, couponCodeData, seats = 1 } = params;

    const planAmountPerUserString = getProductAmount(planPrice, 1, couponCodeData);
    const planAmountPerUser = Number.parseFloat(planAmountPerUserString);
    const totalAmount = Number.parseFloat(formatPrice(planAmountPerUser * seats));

    const item = buildItem(params);
    const currencyCode = currency ?? 'EUR';

    localStorageService.set(AnalyticsStorageKey.ItemOriginalPrice, item.price.toString());

    const checkoutItemData: CheckoutItemData = {
      item_name: item.item_name,
      item_category: item.item_category,
      item_variant: item.item_variant,
      discount: item.discount || 0,
    };

    localStorageService.set(AnalyticsStorageKey.CheckoutItemData, JSON.stringify(checkoutItemData));

    const ecommerceData = {
      currency: currencyCode,
      value: totalAmount,
      items: [item],
    };

    globalThis.window.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: ecommerceData,
    });

    const { gaId } = getAnalyticsConfig();

    if (globalThis.window.gtag && gaId) {
      globalThis.window.gtag('event', 'begin_checkout', {
        send_to: [gaId],
        value: totalAmount,
        currency: currencyCode,
        items: [item],
        ...(promoCodeId && { coupon: promoCodeId }),
      });
    }
  } catch (error) {
    console.error('[GA Service] Error in trackBeginCheckout:', error);
  }
}

const gaService = {
  track,
  trackBeginCheckout,
};

export default gaService;
