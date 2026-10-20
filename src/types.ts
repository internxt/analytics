export interface PurchaseBuyer {
  id: string;
  email: string;
}

// Subsets of the @internxt/sdk payment types, so apps on any SDK version can pass their objects.
export interface CouponCodeData {
  codeId: string;
  codeName: string;
  amountOff?: number;
  percentOff?: number;
}

export interface PlanPrice {
  id: string;
  currency: string;
  bytes: number;
  interval: 'month' | 'year' | 'lifetime';
  decimalAmount: number;
}

export interface PriceWithTax {
  price: PlanPrice;
}
