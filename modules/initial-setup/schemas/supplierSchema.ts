import type { Rule } from "antd/es/form";

const optionalEmailValidator = async (_rule: unknown, value: string) => {
  const text = (value ?? "").trim();
  if (!text) {
    return Promise.resolve();
  }

  if (!/^\S+@\S+\.\S+$/.test(text)) {
    return Promise.reject(new Error("Enter a valid email."));
  }

  return Promise.resolve();
};

const optionalMobileValidator = async (_rule: unknown, value: string) => {
  const text = (value ?? "").trim();
  if (!text) {
    return Promise.resolve();
  }

  if (!/^\d{10}$/.test(text)) {
    return Promise.reject(new Error("Use a 10-digit mobile number."));
  }

  return Promise.resolve();
};

const optionalGstinValidator = async (_rule: unknown, value: string) => {
  const text = (value ?? "").trim();
  if (!text) {
    return Promise.resolve();
  }

  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/i.test(text)) {
    return Promise.reject(new Error("Enter a valid GSTIN."));
  }

  return Promise.resolve();
};

export const supplierSchema = {
  supplierNameRules: [{ required: true, message: "Supplier name is required." }] as Rule[],
  supplierGroupRules: [{ required: true, message: "Supplier group is required." }] as Rule[],
  supplierTypeRules: [{ required: true, message: "Supplier type is required." }] as Rule[],
  mobileRules: [{ validator: optionalMobileValidator }] as Rule[],
  emailRules: [{ validator: optionalEmailValidator }] as Rule[],
  gstinRules: [{ validator: optionalGstinValidator }] as Rule[]
};
