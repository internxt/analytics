export {};

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    gtag: any;
    fbq: any;
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
