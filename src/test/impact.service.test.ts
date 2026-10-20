import type { PriceWithTax } from '../types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureAnalytics } from '../config';
import { savePaymentDataInLocalStorage } from '../services/impact.service';
import localStorageService from '../storage/storage';
import { getProductAmount } from '../utils/price';
import { bytesToString } from '../utils/size';

vi.mock('../storage/storage', () => ({
  default: {
    get: vi.fn(),
    clear: vi.fn(),
    set: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => mockedUserUuid),
}));

vi.mock('../utils/cookies', () => ({
  getCookie: vi.fn((key) => {
    if (key === 'impactAnonymousId') return 'anon_id';
    if (key === 'impactSource') return 'ads';
    if (key === 'gclid') return '';
    return '';
  }),
  setImpactCookies: vi.fn(),
}));

vi.mock('../services/addShoppers.services', () => ({
  sendAddShoppersConversion: vi.fn(),
}));

const onErrorMock = vi.fn();
const subId = 'sub_123';
const paymentIntentId = 'py_123';
const mockedUserUuid = '00000000-0000-0000-0000-0000000000';
const mockImpactApiUrl = 'mock-impact-api-url';
const customerId = 'cus_123';

const promoCode = {
  amountOff: undefined,
  codeId: 'promo_123',
  percentOff: 99,
  codeName: 'CNINTERNXTL',
};

const product = {
  price: {
    id: 'price_123',
    currency: 'eur',
    amount: 11988,
    bytes: 1099511627776,
    interval: 'year',
    decimalAmount: 119.88,
    type: 'individual',
    product: 'prod_1234',
  },
  taxes: {
    tax: 25,
    decimalTax: 0.25,
    amountWithTax: 145,
    decimalAmountWithTax: 1.45,
  },
};

const expectedAmount = getProductAmount(product.price.decimalAmount, 1, promoCode);
const planName = bytesToString(product.price.bytes) + product.price.interval;

beforeEach(() => {
  globalThis.window.gtag = vi.fn();
  vi.clearAllMocks();
  vi.resetModules();

  configureAnalytics({
    isProduction: true,
    impactApiUrl: mockImpactApiUrl,
    websiteUrl: '',
    recaptchaV3Key: '',
    onError: onErrorMock,
  });

  vi.spyOn(localStorageService, 'get').mockImplementation((key) => {
    if (key === 'paymentIntentId') return paymentIntentId;
    if (key === 'subscriptionId') return subId;
    if (key === 'productName') return planName;
    if (key === 'priceId') return product.price.id;
    if (key === 'currency') return product.price.currency;
    if (key === 'amountPaid') return expectedAmount;
    if (key === 'couponCode') return promoCode.codeName;
    if (key === 'isFirstPurchase') return 'true';
    return null;
  });
});

describe('Testing Impact Service', () => {
  describe('savePaymentDataInLocalStorage', () => {
    it('When a coupon is applied, then it saves the discounted amount to localStorage', () => {
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('amountPaid', expectedAmount);
    });

    it('When the plan is not lifetime, then it saves the subscription ID to localStorage', () => {
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId: undefined,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('subscriptionId', subId);
    });

    it('When the plan is lifetime, then it saves the payment intent ID to localStorage', () => {
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');
      const lifetimeProduct = {
        ...product,
        price: { ...product.price, interval: 'lifetime' },
      };

      savePaymentDataInLocalStorage({
        subscriptionId: undefined,
        paymentIntentId,
        selectedPlan: lifetimeProduct as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('paymentIntentId', paymentIntentId);
    });

    it('When saving payment data, then it saves the product name, price ID, and currency to localStorage', () => {
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('productName', planName);
      expect(setToLocalStorageSpy).toHaveBeenCalledWith('priceId', product.price.id);
      expect(setToLocalStorageSpy).toHaveBeenCalledWith('currency', product.price.currency);
    });

    it('When a coupon code is provided, then it saves the coupon code to localStorage', () => {
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('couponCode', promoCode.codeName);
    });

    it('When saving payment data, then it saves the isFirstPurchase flag to localStorage', () => {
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('isFirstPurchase', 'true');
    });

    it('When saving payment data, then it saves the customer so the purchase can be tracked before the account exists', () => {
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('checkout_customer_id', customerId);
    });

    it('When the user comes from Impact, then it keeps the source so a later conversion is still attributed', async () => {
      const { getCookie } = await import('../utils/cookies');
      vi.mocked(getCookie).mockImplementationOnce((key) => (key === 'impactSource' ? 'Impact' : ''));
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).toHaveBeenCalledWith('impact_source', 'Impact');
    });

    it('When the user does not come from Impact, then it drops any source kept from an earlier purchase', async () => {
      const { getCookie } = await import('../utils/cookies');
      vi.mocked(getCookie).mockImplementationOnce(() => '');
      const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');
      const removeFromLocalStorageSpy = vi.spyOn(localStorageService, 'removeItem');

      savePaymentDataInLocalStorage({
        subscriptionId: subId,
        paymentIntentId,
        selectedPlan: product as PriceWithTax,
        users: 1,
        couponCodeData: promoCode,
        isFirstPurchase: true,
        customerId,
      });

      expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('impact_source', expect.anything());
      expect(removeFromLocalStorageSpy).toHaveBeenCalledWith('impact_source');
    });
  });
});

describe('savePaymentDataInLocalStorage - edge cases', () => {
  it('When no plan has been selected, then no plan details are stored for later', () => {
    const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

    savePaymentDataInLocalStorage({
      subscriptionId: subId,
      paymentIntentId,
      selectedPlan: undefined,
      users: 1,
      couponCodeData: promoCode,
      isFirstPurchase: true,
      customerId,
    });

    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('productName', expect.anything());
    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('amountPaid', expect.anything());
    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('priceId', expect.anything());
    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('currency', expect.anything());
  });

  it('When a discount code has no identifier, then it is not stored for later use', () => {
    const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');
    const couponWithoutName = { ...promoCode, codeName: '' };

    savePaymentDataInLocalStorage({
      subscriptionId: subId,
      paymentIntentId,
      selectedPlan: product as PriceWithTax,
      users: 1,
      couponCodeData: couponWithoutName,
      isFirstPurchase: true,
      customerId,
    });

    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('couponCode', expect.anything());
  });

  it('When no discount code is provided, then no discount information is stored', () => {
    const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

    savePaymentDataInLocalStorage({
      subscriptionId: subId,
      paymentIntentId,
      selectedPlan: product as PriceWithTax,
      users: 1,
      couponCodeData: undefined,
      isFirstPurchase: true,
      customerId,
    });

    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('couponCode', expect.anything());
  });

  it('When the user buys a lifetime plan, then no recurring subscription reference is stored', () => {
    const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');
    const lifetimeProduct = { ...product, price: { ...product.price, interval: 'lifetime' } };

    savePaymentDataInLocalStorage({
      subscriptionId: subId,
      paymentIntentId,
      selectedPlan: lifetimeProduct as PriceWithTax,
      users: 1,
      couponCodeData: promoCode,
      isFirstPurchase: true,
      customerId,
    });

    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('subscriptionId', expect.anything());
  });

  it('When the user buys a subscription plan, then no one-time payment reference is stored', () => {
    const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

    savePaymentDataInLocalStorage({
      subscriptionId: subId,
      paymentIntentId,
      selectedPlan: product as PriceWithTax,
      users: 1,
      couponCodeData: promoCode,
      isFirstPurchase: true,
      customerId,
    });

    expect(setToLocalStorageSpy).not.toHaveBeenCalledWith('paymentIntentId', expect.anything());
  });

  it('When this is a returning customer, then that is correctly recorded', () => {
    const setToLocalStorageSpy = vi.spyOn(localStorageService, 'set');

    savePaymentDataInLocalStorage({
      subscriptionId: subId,
      paymentIntentId,
      selectedPlan: product as PriceWithTax,
      users: 1,
      couponCodeData: promoCode,
      isFirstPurchase: false,
      customerId,
    });

    expect(setToLocalStorageSpy).toHaveBeenCalledWith('isFirstPurchase', 'false');
  });
});
