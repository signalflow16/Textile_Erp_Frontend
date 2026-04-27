"use client";

const flag = process.env.NEXT_PUBLIC_VARIANT_ONLY_TRANSACTIONS;

export const isVariantOnlyTransactionsEnabled = () => {
  if (!flag) {
    return true;
  }
  return flag !== "0" && flag.toLowerCase() !== "false";
};
