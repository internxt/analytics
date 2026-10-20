# @internxt/analytics

Shared analytics library for Internxt web apps. It wraps the tracking we send to Google Analytics, Meta Pixel, Impact, AddShoppers and the conversions Google Sheet.

## Installation

```bash
yarn add @internxt/analytics
```

## Setup

Call `configureAnalytics` once, before using anything else from the library (e.g. in the app entry point). Services read the configuration when they run, so without it their events are not sent.

```ts
import { configureAnalytics } from '@internxt/analytics';

configureAnalytics({
  isProduction: true,
  impactApiUrl: 'https://...',
  websiteUrl: 'https://internxt.com',
  recaptchaV3Key: '<recaptcha v3 site key>',
  gaId: 'G-XXXXXXX', // optional
  gaConversionTag: 'AW-XXXXXXX/XXXX', // optional
  onError: (error) => errorService.reportError(error), // optional
});
```

| Option            | Required | Description                                                       |
| ----------------- | -------- | ----------------------------------------------------------------- |
| `isProduction`    | yes      | Purchase events are only sent when `true`.                        |
| `impactApiUrl`    | yes      | Base URL of the Impact integration API.                           |
| `websiteUrl`      | yes      | Base URL used to send conversions to the Google Sheet API.        |
| `recaptchaV3Key`  | yes      | reCAPTCHA v3 site key used when sending conversions.              |
| `gaId`            | no       | Google Analytics measurement ID.                                  |
| `gaConversionTag` | no       | Google Ads conversion tag.                                        |
| `onError`         | no       | Called with errors from the Impact requests, for reporting.       |

The library relies on the browser globals loaded by the app (`window.gtag`, `window.dataLayer`, `window.fbq`, `window.grecaptcha`).

## API

| Export                                                                   | Description                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `gaService`                                                              | Google Analytics events (`track`, `trackBeginCheckout`, `trackPurchase`).      |
| `metaService`, `trackLead`, `trackCheckoutStart`                         | Meta Pixel events.                                                             |
| `trackSignUp`, `trackPaymentConversion`, `handleImpactDTCCheckout`       | Impact events.                                                                 |
| `savePaymentDataInLocalStorage`                                          | Stores the checkout data that purchase events read after the payment.          |
| `sendPurchaseEvents(buyer)`                                              | Sends the purchase to Meta, GA and Impact (production only).                   |
| `sendConversionToAPI`                                                    | Sends a conversion to the Google Sheet API.                                    |
| `sendAddShoppersConversion`                                              | Sends a conversion to AddShoppers.                                             |
| `clearPaymentStorage`, `AnalyticsStorageKey`, `PURCHASE_STORAGE_KEYS`    | Local storage keys used by the library and a helper to clear them.             |
| `getCookie`, `setImpactCookies`                                          | Cookie helpers.                                                                |

## Development

```bash
yarn install
yarn build       # type declarations (tsc) + bundle (vite)
yarn test        # vitest
yarn test:watch
```

To try a change in an app before publishing, run `yarn build && npm pack` and install the generated `.tgz` in the app.

## Publishing

1. Bump `version` in `package.json` in your PR.
2. After merging to `master`, create a GitHub release for that version.
3. The `publish-npm` and `publish-github` workflows build, test and publish the package to npm and to the GitHub package registry.
