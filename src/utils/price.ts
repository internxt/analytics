import type { CouponCodeData } from '../types';

export const formatPrice = (price: number) => {
  const truncated = Math.floor(Number(price.toFixed(8)) * 100) / 100;
  const formatted = truncated.toFixed(2);
  return formatted.endsWith('.00') ? String(truncated) : formatted;
};

export const getProductAmount = (
  amount: number,
  users: number,
  couponCodeData?: CouponCodeData,
): string => {
  let finalAmount;

  if (couponCodeData?.amountOff) {
    finalAmount = (amount - couponCodeData.amountOff / 100) * users;
  } else if (couponCodeData?.percentOff) {
    const discount = 100 - couponCodeData.percentOff;
    finalAmount = ((amount * discount) / 100) * users;
  } else {
    finalAmount = amount * users;
  }

  const positiveAmount = Math.max(0, finalAmount);
  return formatPrice(positiveAmount);
};
