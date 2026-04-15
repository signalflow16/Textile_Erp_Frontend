export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export const quantityFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2
});
