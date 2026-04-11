import type { Rule } from "antd/es/form";

export const companySchema = {
  companyNameRules: [
    { required: true, message: "Company name is required." },
    { min: 2, message: "Use at least 2 characters." }
  ] as Rule[],
  abbreviationRules: [
    { required: true, message: "Abbreviation is required." },
    {
      validator: async (_rule, value: string) => {
        const trimmed = (value ?? "").trim();
        if (!trimmed) {
          return Promise.resolve();
        }

        if (!/^[A-Za-z]{2,6}$/.test(trimmed)) {
          return Promise.reject(new Error("Use 2-6 alphabetic characters."));
        }

        return Promise.resolve();
      }
    }
  ] as Rule[],
  currencyRules: [{ required: true, message: "Default currency is required." }] as Rule[],
  countryRules: [{ required: true, message: "Country is required." }] as Rule[]
};