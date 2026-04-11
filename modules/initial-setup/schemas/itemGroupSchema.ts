import type { Rule } from "antd/es/form";

export const itemGroupSchema = {
  itemGroupNameRules: [
    { required: true, message: "Item group name is required." },
    { min: 2, message: "Use at least 2 characters." }
  ] as Rule[]
};