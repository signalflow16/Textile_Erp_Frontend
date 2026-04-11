import type { Rule } from "antd/es/form";

export const uomSchema = {
  uomNameRules: [
    { required: true, message: "UOM name is required." },
    { min: 1, message: "Use at least 1 character." }
  ] as Rule[]
};