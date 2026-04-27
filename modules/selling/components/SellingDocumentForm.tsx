"use client";

import { useEffect } from "react";
import { Alert, App, Button, Card, Form, Input, InputNumber, Select, Space } from "antd";

import { DocumentActionBar } from "@/modules/buying/components/common/DocumentActionBar";
import { isDraft } from "@/modules/buying/utils/statusMapper";
import { useListWarehousesQuery } from "@/modules/buying/api/buyingApi";
import { SellingItemRowsEditor } from "@/modules/selling/components/SellingItemRowsEditor";
import { useSellingMasters } from "@/modules/selling/hooks/useSellingMasters";
import type { SourceReference } from "@/modules/selling/utils/sourceRouteHelpers";
import { SourceReferenceBanner } from "@/modules/selling/components/common/SourceReferenceBanner";
import { toSellingErrorMessage } from "@/modules/selling/utils/errorMapper";

type SellingFormKind = "quotation" | "sales-order" | "delivery-note";
type DocLike = Record<string, unknown>;
type SellingItemFormRow = {
  qty?: unknown;
  rate?: unknown;
  amount?: unknown;
};

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 8);
const nextMonth = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const toFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const recalculateItemAmounts = (items: unknown) => {
  if (!Array.isArray(items)) {
    return {
      items: [],
      grandTotal: 0
    };
  }

  let grandTotal = 0;

  const normalizedItems = items.map((item) => {
    if (!item || typeof item !== "object") {
      return item;
    }

    const row = item as SellingItemFormRow & Record<string, unknown>;
    const qty = toFiniteNumber(row.qty) ?? 0;
    const rate = toFiniteNumber(row.rate);
    const amount = rate === undefined ? undefined : roundCurrency(qty * rate);

    grandTotal += amount ?? 0;

    return {
      ...row,
      amount
    };
  });

  return {
    items: normalizedItems,
    grandTotal: roundCurrency(grandTotal)
  };
};

const defaultByKind = (kind: SellingFormKind): DocLike => {
  if (kind === "quotation") {
    return {
      quotation_to: "Customer",
      transaction_date: today(),
      valid_till: nextMonth(),
      items: [{ qty: 1, conversion_factor: 1 }]
    };
  }

  if (kind === "sales-order") {
    return {
      transaction_date: today(),
      delivery_date: nextMonth(),
      items: [{ qty: 1, conversion_factor: 1 }]
    };
  }

  return {
    posting_date: today(),
    posting_time: nowTime(),
    items: [{ qty: 1, conversion_factor: 1 }]
  };
};

export function SellingDocumentForm({
  title,
  flowHint,
  kind,
  initialValues,
  loading,
  error,
  isSavingDraft,
  isSubmittingDoc,
  onSaveDraft,
  onSaveSubmit,
  sourceReference,
  stockImpactHint
}: {
  title: string;
  flowHint: string;
  kind: SellingFormKind;
  initialValues?: DocLike | null;
  loading?: boolean;
  error?: unknown;
  isSavingDraft?: boolean;
  isSubmittingDoc?: boolean;
  onSaveDraft: (values: DocLike) => Promise<unknown>;
  onSaveSubmit: (values: DocLike) => Promise<unknown>;
  sourceReference?: SourceReference | null;
  stockImpactHint?: string;
}) {
  const [form] = Form.useForm<Record<string, unknown>>();
  const { message } = App.useApp();
  const masters = useSellingMasters();
  const selectedCompany = Form.useWatch("company", form) as string | undefined;
  const warehousesByCompany = useListWarehousesQuery(selectedCompany);
  const warehouseOptions = warehousesByCompany.data ?? masters.data?.warehouses ?? [];

  useEffect(() => {
    const resolvedCustomer =
      typeof initialValues?.party_name === "string" ? initialValues.party_name :
      typeof initialValues?.customer === "string" ? initialValues.customer :
      undefined;

    const seededValues = {
      ...defaultByKind(kind),
      ...(initialValues ?? {}),
      ...(kind === "quotation"
        ? {
            quotation_to: "Customer",
            party_name: resolvedCustomer,
            customer: resolvedCustomer
          }
        : {})
    } as Record<string, unknown>;
    const { items, grandTotal } = recalculateItemAmounts(seededValues.items);

    form.setFieldsValue({
      ...seededValues,
      items,
      grand_total: grandTotal
    } as never);
  }, [form, initialValues, kind]);

  useEffect(() => {
    const allowedWarehouses = new Set(warehouseOptions.map((entry) => entry.value));
    const currentSetWarehouse = form.getFieldValue("set_warehouse");
    if (typeof currentSetWarehouse === "string" && currentSetWarehouse && !allowedWarehouses.has(currentSetWarehouse)) {
      form.setFieldValue("set_warehouse", undefined);
    }

    const currentItems = form.getFieldValue("items");
    if (Array.isArray(currentItems)) {
      const normalizedItems = currentItems.map((row) => {
        if (!row || typeof row !== "object") {
          return row;
        }

        const rowWarehouse = (row as { warehouse?: unknown }).warehouse;
        if (typeof rowWarehouse === "string" && rowWarehouse && !allowedWarehouses.has(rowWarehouse)) {
          return {
            ...row,
            warehouse: undefined
          };
        }

        return row;
      });

      form.setFieldValue("items", normalizedItems);
    }
  }, [form, warehouseOptions]);

  const docstatus = typeof initialValues?.docstatus === "number" ? (initialValues.docstatus as 0 | 1 | 2) : undefined;
  const canEdit = initialValues ? isDraft(docstatus) : true;

  const handleDraftClick = async () => {
    try {
      const values = form.getFieldsValue(true) as DocLike;
      if (kind === "quotation" && typeof values.party_name === "string") {
        values.customer = values.party_name;
      }
      await onSaveDraft(values);
    } catch (requestError) {
      message.error(toSellingErrorMessage(requestError, "Unable to save document."));
    }
  };

  const handleSubmitClick = async () => {
    try {
      const values = (await form.validateFields()) as DocLike;
      if (kind === "quotation" && typeof values.party_name === "string") {
        values.customer = values.party_name;
      }
      await onSaveSubmit(values);
    } catch (requestError) {
      message.error(toSellingErrorMessage(requestError, "Unable to submit document."));
    }
  };

  return (
    <div className="page-stack">
      <Card loading={loading} title={title}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <div style={{ color: "#64748b" }}>{flowHint}</div>
          <SourceReferenceBanner source={sourceReference} />
          {stockImpactHint ? <Alert type="info" showIcon message={stockImpactHint} /> : null}
        </Space>
      </Card>

      {error ? (
        <Alert type="error" showIcon message="Unable to load document" description={toSellingErrorMessage(error, "Request failed.")} />
      ) : null}

      <Card>
        <Form<Record<string, unknown>>
          form={form}
          layout="vertical"
          requiredMark={false}
          disabled={!canEdit || masters.isLoading}
          onValuesChange={(changedValues, allValues) => {
            if (!("items" in changedValues)) {
              return;
            }

            const { items, grandTotal } = recalculateItemAmounts((allValues as { items?: unknown }).items);
            form.setFieldsValue({
              items,
              grand_total: grandTotal
            } as never);
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            {!canEdit ? (
              <Button disabled>Submitted/Cancelled</Button>
            ) : (
              <DocumentActionBar
                canEdit={canEdit}
                isSaving={Boolean(isSavingDraft)}
                isSubmitting={Boolean(isSubmittingDoc)}
                onSaveDraft={handleDraftClick}
                onSaveSubmit={handleSubmitClick}
              />
            )}
          </div>

          <div className="buying-form-grid-3">
            <Form.Item label="Company" name="company" rules={[{ required: true, message: "Company is required." }]}>
              <Select showSearch optionFilterProp="label" options={masters.data?.companies ?? []} />
            </Form.Item>

            {kind === "quotation" ? (
              <Form.Item label="Quotation To" name="quotation_to">
                <Input disabled />
              </Form.Item>
            ) : null}

            <Form.Item
              label="Customer"
              name={kind === "quotation" ? "party_name" : "customer"}
              rules={[{ required: true, message: "Customer is required." }]}
            >
              <Select showSearch optionFilterProp="label" options={masters.data?.customers ?? []} />
            </Form.Item>

            {kind !== "delivery-note" ? (
              <Form.Item label="Transaction Date" name="transaction_date" rules={[{ required: true, message: "Transaction Date is required." }]}>
                <Input type="date" />
              </Form.Item>
            ) : null}

            {kind === "quotation" ? (
              <Form.Item label="Valid Till" name="valid_till">
                <Input type="date" />
              </Form.Item>
            ) : null}

            {kind === "sales-order" ? (
              <Form.Item label="Delivery Date" name="delivery_date">
                <Input type="date" />
              </Form.Item>
            ) : null}

            {kind === "delivery-note" ? (
              <>
                <Form.Item label="Posting Date" name="posting_date" rules={[{ required: true, message: "Posting Date is required." }]}>
                  <Input type="date" />
                </Form.Item>
                <Form.Item label="Posting Time" name="posting_time">
                  <Input type="time" />
                </Form.Item>
              </>
            ) : null}

            {kind !== "quotation" ? (
              <Form.Item label="Set Warehouse" name="set_warehouse">
                <Select allowClear showSearch optionFilterProp="label" options={warehouseOptions} />
              </Form.Item>
            ) : null}

            {kind !== "delivery-note" ? (
              <>
                <Form.Item label="Selling Price List" name="selling_price_list">
                  <Input />
                </Form.Item>
                <Form.Item label="Taxes and Charges" name="taxes_and_charges">
                  <Input />
                </Form.Item>
              </>
            ) : null}

            <Form.Item label={kind === "quotation" ? "Remarks / Terms" : "Remarks"} name="remarks">
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>

          <Card size="small" title="Items" style={{ marginTop: 8, marginBottom: 16 }}>
            <SellingItemRowsEditor
              itemOptions={masters.data?.items ?? []}
              uomOptions={masters.data?.uoms ?? []}
              warehouseOptions={warehouseOptions}
              withDeliveryDate={kind !== "delivery-note"}
              withRate
            />
          </Card>

          <Card size="small" title="Totals">
            <div className="buying-form-grid-3">
              <Form.Item label="Grand Total" name="grand_total">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled />
              </Form.Item>
            </div>
          </Card>
        </Form>
      </Card>
    </div>
  );
}
