export interface AnalyticsConfig {
  isProduction: boolean;
  impactApiUrl: string;
  websiteUrl: string;
  recaptchaV3Key: string;
  gaId?: string;
  gaConversionTag?: string;
  onError?: (error: unknown) => void;
}

let analyticsConfig: AnalyticsConfig | undefined;

export function configureAnalytics(config: AnalyticsConfig): void {
  analyticsConfig = config;
}

export function getAnalyticsConfig(): AnalyticsConfig {
  if (!analyticsConfig) {
    throw new Error('[Analytics] configureAnalytics() must be called before using the library');
  }

  return analyticsConfig;
}

export function reportError(error: unknown): void {
  analyticsConfig?.onError?.(error);
}
