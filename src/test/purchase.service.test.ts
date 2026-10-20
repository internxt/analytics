import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureAnalytics } from '../config';
import { sendPurchaseEvents } from '../services/purchase.service';
import gaService from '../services/ga.service';
import metaService from '../services/meta.service';
import { trackPaymentConversion } from '../services/impact.service';

vi.mock('../services/ga.service', () => ({ default: { trackPurchase: vi.fn() } }));
vi.mock('../services/meta.service', () => ({ default: { trackPurchase: vi.fn() } }));
vi.mock('../services/impact.service', () => ({ trackPaymentConversion: vi.fn().mockResolvedValue(undefined) }));

const buyer = { id: 'user_123', email: 'buyer@internxt.com' };

const configure = (isProduction: boolean) =>
  configureAnalytics({ isProduction, impactApiUrl: '', websiteUrl: '', recaptchaV3Key: '' });

describe('sendPurchaseEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('When the buyer is known, then the purchase is sent to Meta, GA and Impact', async () => {
    configure(true);

    await sendPurchaseEvents(buyer);

    expect(metaService.trackPurchase).toHaveBeenCalledOnce();
    expect(gaService.trackPurchase).toHaveBeenCalledExactlyOnceWith(buyer);
    expect(trackPaymentConversion).toHaveBeenCalledExactlyOnceWith(buyer);
  });

  it('When the buyer is unknown, then only the purchase events that need no buyer are sent', async () => {
    configure(true);

    await sendPurchaseEvents(null);

    expect(metaService.trackPurchase).toHaveBeenCalledOnce();
    expect(gaService.trackPurchase).not.toHaveBeenCalled();
    expect(trackPaymentConversion).not.toHaveBeenCalled();
  });

  it('When the app is not running in production, then no purchase event is sent', async () => {
    configure(false);

    await sendPurchaseEvents(buyer);

    expect(metaService.trackPurchase).not.toHaveBeenCalled();
    expect(gaService.trackPurchase).not.toHaveBeenCalled();
    expect(trackPaymentConversion).not.toHaveBeenCalled();
  });
});
