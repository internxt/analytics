import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import dayjs from 'dayjs';
import { getAnalyticsConfig, reportError } from '../config';
import { AnalyticsStorageKey } from '../storage/keys';
import localStorageService from '../storage/storage';
import type { CouponCodeData, PriceWithTax } from '../types';
import { getCookie, setImpactCookies } from '../utils/cookies';
import { getProductAmount } from '../utils/price';
import { bytesToString } from '../utils/size';

/**
 * Stores relevant payment data in local storage to be retrieved later,
 * particularly after a successful checkout (e.g., in CheckoutSuccessView).
 * This enables tracking and analytics with accurate purchase context.
 *
 * Depending on the type of plan (subscription vs lifetime), the function stores:
 * - `subscriptionId` for subscription-based plans (non-lifetime)
 * - `paymentIntentId` for lifetime plans
 *
 * Additionally, it stores metadata such as product name, amount paid, price ID, and currency.
 * The `amountPaid` value is computed based on:
 * - The raw price (pre-tax and before any discounts)
 * - Number of users
 * - Coupon code data (if any)
 *
 */
export interface SavePaymentDataParams {
  subscriptionId: string | undefined;
  paymentIntentId: string | undefined;
  selectedPlan: PriceWithTax | undefined;
  users: number;
  couponCodeData: CouponCodeData | undefined;
  isFirstPurchase: boolean;
  customerId: string;
}

export function savePaymentDataInLocalStorage({
  subscriptionId,
  paymentIntentId,
  selectedPlan,
  users,
  couponCodeData,
  isFirstPurchase,
  customerId,
}: SavePaymentDataParams) {
  if (subscriptionId && selectedPlan?.price.interval !== 'lifetime') {
    localStorageService.set(AnalyticsStorageKey.SubscriptionID, subscriptionId);
  }

  if (paymentIntentId && selectedPlan?.price.interval === 'lifetime') {
    localStorageService.set(AnalyticsStorageKey.PaymentIntentID, paymentIntentId);
  }

  if (selectedPlan) {
    const planName = bytesToString(selectedPlan.price.bytes) + selectedPlan.price.interval;
    const amountToPay = getProductAmount(selectedPlan.price.decimalAmount, users, couponCodeData);

    localStorageService.set(AnalyticsStorageKey.ProductName, planName);
    localStorageService.set(AnalyticsStorageKey.AmountPaid, amountToPay);
    localStorageService.set(AnalyticsStorageKey.PriceId, selectedPlan.price.id);
    localStorageService.set(AnalyticsStorageKey.Currency, selectedPlan.price.currency);
  }

  if (couponCodeData?.codeName) {
    localStorageService.set(AnalyticsStorageKey.CouponCode, couponCodeData.codeName);
  }

  localStorageService.set(AnalyticsStorageKey.IsFirstPurchase, String(isFirstPurchase));
  localStorageService.set(AnalyticsStorageKey.CheckoutCustomerId, customerId);

  const impactSource = getCookie('impactSource');
  if (impactSource) {
    localStorageService.set(AnalyticsStorageKey.ImpactSource, impactSource);
  } else {
    localStorageService.removeItem(AnalyticsStorageKey.ImpactSource);
  }
}

export async function handleImpactDTCCheckout({
  irclickid,
  utmMedium,
}: {
  irclickid: string;
  utmMedium?: string | null;
}): Promise<void> {
  try {
    const IMPACT_API = getAnalyticsConfig().impactApiUrl;
    const existingAnonymousId = getCookie('impactAnonymousId');
    const anonymousId = existingAnonymousId || uuidV4();

    setImpactCookies(anonymousId, irclickid, utmMedium);

    await axios.post(IMPACT_API, {
      anonymousId,
      timestamp: dayjs().format('YYYY-MM-DDTHH:mm:ss.sssZ'),
      context: {
        userAgent: navigator.userAgent,
        page: {
          url: globalThis.location.href,
          referrer: document.referrer,
        },
      },
      type: 'page',
      properties: {
        irclickid,
        ...(utmMedium && { partner_id: utmMedium }),
      },
    });
  } catch (error) {
    reportError(error);
  }
}

export async function trackSignUp(uuid: string): Promise<void> {
  try {
    const gclid = getCookie('gclid');
    const IMPACT_API = getAnalyticsConfig().impactApiUrl;
    const anonymousID = getCookie('impactAnonymousId');
    const source = getCookie('impactSource');

    if (globalThis.window.gtag) {
      window.gtag('event', 'User Signup');
    }

    if (source && source !== 'direct') {
      await axios.post(IMPACT_API, {
        anonymousId: anonymousID,
        timestamp: dayjs().format('YYYY-MM-DDTHH:mm:ss.sssZ'),
        messageId: uuidV4(),
        userId: uuid,
        type: 'track',
        event: 'User Signup',
        ...(gclid && { gclid }),
      });
    }
  } catch (error) {
    reportError(error);
  }
}
