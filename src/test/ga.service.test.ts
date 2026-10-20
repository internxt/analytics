import { beforeEach, describe, expect, it, vi } from 'vitest';
import gaService from '../services/ga.service';
import { configureAnalytics } from '../config';
import localStorageService from '../storage/storage';
import { bytesToString } from '../utils/size';
import type { CouponCodeData } from '../types';

vi.mock('../utils/size', () => ({
  bytesToString: vi.fn((bytes) => {
    if (!bytes || bytes < 1024) return undefined;
    if (bytes === 1099511627776) return '1TB';
    if (bytes === 2199023255552) return '2TB';
    return `${bytes}B`;
  }),
}));

vi.mock('../utils/price', () => ({
  formatPrice: vi.fn((price) => Number(price).toFixed(2)),
  getProductAmount: vi.fn((price, quantity, coupon) => {
    if (coupon?.percentOff) {
      const discount = price * (coupon.percentOff / 100);
      return (price - discount).toFixed(2);
    }
    if (coupon?.amountOff) {
      return (price - coupon.amountOff).toFixed(2);
    }
    return price.toFixed(2);
  }),
}));

vi.mock('../storage/storage', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const mockCouponCodeData: CouponCodeData = {
  amountOff: undefined,
  codeId: 'promo_123',
  percentOff: 20,
  codeName: 'DISCOUNT20',
};

const mockTrackBeginCheckoutParams = {
  planId: 'price_123',
  planPrice: 119.88,
  currency: 'EUR',
  planType: 'individual' as const,
  interval: 'year',
  storage: '1099511627776',
  promoCodeId: 'DISCOUNT20',
  couponCodeData: mockCouponCodeData,
  seats: 1,
};

beforeEach(() => {
  configureAnalytics({
    isProduction: true,
    impactApiUrl: '',
    websiteUrl: '',
    recaptchaV3Key: '',
    gaId: 'G-TEST_ID',
    gaConversionTag: 'AW-TEST_TAG',
  });
  globalThis.window.dataLayer = [];
  globalThis.window.gtag = vi.fn();
  vi.clearAllMocks();
});

describe('Testing GA Service', () => {
  describe('track function', () => {
    it('should push event to dataLayer when called with event name and data', () => {
      const eventName = 'test_event';
      const eventData = { key: 'value', number: 123 };

      gaService.track(eventName, eventData);

      expect(globalThis.window.dataLayer).toHaveLength(1);
      expect(globalThis.window.dataLayer[0]).toEqual({
        event: eventName,
        ...eventData,
      });
    });

    it('should handle errors gracefully when dataLayer throws an error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockDataLayer = {
        push: vi.fn(() => {
          throw new Error('DataLayer Error');
        }),
      };
      globalThis.window.dataLayer = mockDataLayer as any;

      expect(() => gaService.track('test_event', { key: 'value' })).not.toThrow();
      expect(mockDataLayer.push).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('trackBeginCheckout function', () => {
    describe('Successful tracking', () => {
      it('should push begin_checkout event to dataLayer', () => {
        gaService.trackBeginCheckout(mockTrackBeginCheckoutParams);

        expect(globalThis.window.dataLayer).toHaveLength(1);
        expect(globalThis.window.dataLayer[0].event).toBe('begin_checkout');
      });

      it('should call gtag with send_to configuration', () => {
        gaService.trackBeginCheckout(mockTrackBeginCheckoutParams);

        expect(globalThis.window.gtag).toHaveBeenCalledWith(
          'event',
          'begin_checkout',
          expect.objectContaining({
            send_to: expect.any(Array),
          }),
        );
      });

      it('should include coupon code in the event when provided', () => {
        gaService.trackBeginCheckout(mockTrackBeginCheckoutParams);

        const event = globalThis.window.dataLayer[0] as any;
        expect(event.ecommerce.items[0]).toMatchObject({
          coupon: 'DISCOUNT20',
        });
      });

      it('should calculate and include discount amount when coupon is applied', () => {
        gaService.trackBeginCheckout(mockTrackBeginCheckoutParams);

        const event = globalThis.window.dataLayer[0] as any;
        expect(event.ecommerce.items[0].discount).toBeDefined();
        expect(event.ecommerce.items[0].discount).toBeGreaterThan(0);
      });

      it('should calculate total value correctly when multiple seats are purchased', () => {
        const paramsWithMultipleSeats = {
          ...mockTrackBeginCheckoutParams,
          seats: 5,
        };

        gaService.trackBeginCheckout(paramsWithMultipleSeats);

        const event = globalThis.window.dataLayer[0] as any;
        expect(event.ecommerce.items[0].quantity).toBe(5);
        expect(event.ecommerce.value).toBeGreaterThan(0);
      });

      it('should format storage bytes into human-readable format', () => {
        const bytesToStringSpy = vi.mocked(bytesToString);

        gaService.trackBeginCheckout(mockTrackBeginCheckoutParams);

        expect(bytesToStringSpy).toHaveBeenCalledWith(1099511627776);
        const event = globalThis.window.dataLayer[0] as any;
        expect(event.ecommerce.items[0].item_name).toContain('1TB');
      });

      it('should save item data to localStorage for later use in purchase event', () => {
        gaService.trackBeginCheckout(mockTrackBeginCheckoutParams);

        expect(localStorageService.set).toHaveBeenCalledWith(
          'checkout_item_data',
          expect.stringContaining('1TB Year Plan'),
        );
      });

      it('should save original price to localStorage for later use in purchase event', () => {
        gaService.trackBeginCheckout(mockTrackBeginCheckoutParams);

        expect(localStorageService.set).toHaveBeenCalledWith('itemOriginalPrice', expect.any(String));
      });
    });

    describe('Error handling', () => {
      it('should handle errors gracefully when tracking fails', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const mockDataLayer = {
          push: vi.fn(() => {
            throw new Error('Tracking Error');
          }),
        };
        globalThis.window.dataLayer = mockDataLayer as any;

        expect(() => gaService.trackBeginCheckout(mockTrackBeginCheckoutParams)).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
