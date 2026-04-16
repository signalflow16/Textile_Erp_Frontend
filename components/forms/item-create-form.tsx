"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Form, Input, InputNumber, Select, Typography } from "antd";

import { apiRequest, normalizeApiError } from "@/core/api/axiosInstance";
import type { ItemCreateValues, ItemFieldAvailability, ItemFormLookups } from "@/modules/stock/types/master-data";

const ITEM_CODE_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ITEM_CODE_DEBOUNCE_MS = 300;

export function ItemCreateForm({
  form,
  lookups,
  fieldAvailability,
  onItemCodeValidationChange
}: {
  form: ReturnType<typeof Form.useForm<ItemCreateValues>>[0];
  lookups: ItemFormLookups;
  fieldAvailability: ItemFieldAvailability;
  onItemCodeValidationChange?: (validating: boolean) => void;
}) {
  const { Text } = Typography;
  const unavailableFields = Object.entries(fieldAvailability)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const itemCodeValue = Form.useWatch("item_code", form);
  const [itemCodeChecking, setItemCodeChecking] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemCodeCacheRef = useRef(new Map<string, boolean>());

  useEffect(() => {
    onItemCodeValidationChange?.(itemCodeChecking);
  }, [itemCodeChecking, onItemCodeValidationChange]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const itemCodeRules = useMemo(
    () => [
      { required: true, message: "Item Code is required" },
      {
        pattern: ITEM_CODE_PATTERN,
        message: "Only letters, numbers, hyphen (-), and underscore (_) are allowed"
      },
      {
        validator: async (_: unknown, value?: string) => {
          const normalizedValue = value?.trim() ?? "";

          if (!normalizedValue || !ITEM_CODE_PATTERN.test(normalizedValue)) {
            return Promise.resolve();
          }

          const cachedExists = itemCodeCacheRef.current.get(normalizedValue);
          if (typeof cachedExists === "boolean") {
            if (cachedExists) {
              return Promise.reject(new Error("Item Code already exists"));
            }

            return Promise.resolve();
          }

          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          setItemCodeChecking(true);

          try {
            await new Promise<void>((resolve) => {
              debounceTimerRef.current = setTimeout(() => {
                debounceTimerRef.current = null;
                resolve();
              }, ITEM_CODE_DEBOUNCE_MS);
            });

            const response = await apiRequest<{ message?: { name?: string } }>({
              url: "/method/frappe.client.get_value",
              method: "GET",
              params: {
                doctype: "Item",
                filters: JSON.stringify({ item_code: normalizedValue }),
                fieldname: "name"
              }
            });

            const exists = Boolean(response?.message?.name);
            itemCodeCacheRef.current.set(normalizedValue, exists);

            if (exists) {
              return Promise.reject(new Error("Item Code already exists"));
            }

            return Promise.resolve();
          } catch (error) {
            return Promise.reject(
              new Error(normalizeApiError(error, "Unable to validate Item Code.").message)
            );
          } finally {
            setItemCodeChecking(false);
          }
        }
      }
    ],
    []
  );

  return (
    <Form<ItemCreateValues> form={form} layout="vertical" requiredMark={false}>
      {unavailableFields.length ? (
        <Alert
          type="info"
          showIcon
          className="form-helper-alert"
          message="Textile helper fields are visible in the UI only."
          description={`The connected backend does not expose: ${unavailableFields.join(", ")}. Those values will be skipped during create.`}
        />
      ) : null}

      <Form.Item
        label="Item Code"
        name="item_code"
        validateTrigger="onBlur"
        hasFeedback
        rules={itemCodeRules}
      >
        <Input placeholder="Enter unique item code (e.g. ITEM-001)" />
      </Form.Item>

      {itemCodeChecking && itemCodeValue?.trim() ? (
        <Text type="secondary">Checking Item Code availability...</Text>
      ) : null}

      <Form.Item label="Item Name" name="item_name" rules={[{ required: true, message: "Item Name is required." }]}>
        <Input placeholder="Dyed Cotton Shirting" />
      </Form.Item>

      <Form.Item label="Item Group" name="item_group" rules={[{ required: true, message: "Item Group is required." }]}>
        <Select showSearch optionFilterProp="label" options={lookups.itemGroups} placeholder="Select item group" />
      </Form.Item>

      <Form.Item label="Unit" name="stock_uom" rules={[{ required: true, message: "Unit is required." }]}>
        <Select showSearch optionFilterProp="label" options={lookups.uoms} placeholder="Select UOM" />
      </Form.Item>

      <div className="master-form-grid">
        <Form.Item label="Fabric Type" name="fabric_type">
          <Input placeholder="Cotton" />
        </Form.Item>
        <Form.Item label="Color" name="color">
          <Input placeholder="Indigo Blue" />
        </Form.Item>
        <Form.Item label="GSM" name="gsm">
          <InputNumber min={1} style={{ width: "100%" }} placeholder="120" />
        </Form.Item>
      </div>
    </Form>
  );
}
