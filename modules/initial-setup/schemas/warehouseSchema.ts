import type { Rule } from "antd/es/form";

export const warehouseSchema = {
  companyRules: [{ required: true, message: "Company is required." }] as Rule[],
  warehouseNameRules: [
    { required: true, message: "Warehouse name is required." },
    { min: 2, message: "Use at least 2 characters." }
  ] as Rule[]
};