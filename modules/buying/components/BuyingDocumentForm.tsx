"use client";

import { useEffect } from "react";
import { Alert, App, Button, Card, Form, Input, InputNumber, Select, Space } from "antd";

import { BuyingItemRowsEditor } from "@/modules/buying/components/BuyingItemRowsEditor";
import { useListWarehousesQuery } from "@/modules/buying/api/buyingApi";
import { useBuyingMasters } from "@/modules/buying/hooks/useBuyingMasters";
import { toBuyingErrorMessage } from "@/modules/buying/utils/errorMapper";
import { isDraft } from "@/modules/buying/utils/statusMapper";
import { DocumentActionBar } from "@/modules/buying/components/common/DocumentActionBar";
import type { SourceReference } from "@/modules/buying/utils/sourceRouteHelpers";
import { SourceReferenceBanner } from "@/modules/buying/components/common/SourceReferenceBanner";

type BuyingFormKind =
  | "material-request"
  | "rfq"
  | "supplier-quotation"
  | "purchase-order"
  | "purchase-receipt"
  | "purchase-invoice";

type DocLike = Record<string, unknown>;

const today = () => new Date().toISOString().slice(0, 10);

const defaultByKind = (kind: BuyingFormKind): DocLike => {
  if (kind === "material-request") {
    return {
      material_request_type: "Purchase",
      transaction_date: today(),
      items: [{ qty: 1, conversion_factor: 1 }]
    };
  }

  if (kind === "rfq") {
    return {
      transaction_date: today(),
      suppliers: [{ supplier: undefined }],
      items: [{ qty: 1, conversion_factor: 1 }]
    };
  }

  if (kind === "supplier-quotation") {
    return {
      transaction_date: today(),
      items: [{ qty: 1, conversion_factor: 1 }]
    };
  }

  if (kind === "purchase-order") {
    return {
      schedule_date: today(),
      items: [{ qty: 1, conversion_factor: 1 }]
    };
  }

  if (kind === "purchase-receipt") {
    return {
      posting_date: today(),
      items: [{ qty: 1, conversion_factor: 1 }]
    };
  }

  return {
    posting_date: today(),
    due_date: today(),
    items: [{ qty: 1, conversion_factor: 1 }]
  };
};

export function BuyingDocumentForm({
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
  stockImpactHint,
  financeImpactHint
}: {
  title: string;
  flowHint: string;
  kind: BuyingFormKind;
  initialValues?: DocLike | null;
  loading?: boolean;
  error?: unknown;
  isSavingDraft?: boolean;
  isSubmittingDoc?: boolean;
  onSaveDraft: (values: DocLike) => Promise<unknown>;
  onSaveSubmit: (values: DocLike) => Promise<unknown>;
  sourceReference?: SourceReference | null;
  stockImpactHint?: string;
  financeImpactHint?: string;
}) {
  const [form] = Form.useForm<Record<string, unknown>>();
  const { message } = App.useApp();
  const masters = useBuyingMasters();
  const selectedCompany = Form.useWatch("company", form) as string | undefined;
  const warehousesByCompany = useListWarehousesQuery(selectedCompany);
  const warehouseOptions = warehousesByCompany.data ?? masters.data?.warehouses ?? [];

  useEffect(() => {
    form.setFieldsValue({
      ...defaultByKind(kind),
      ...(initialValues ?? {})
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
      await onSaveDraft(values);
    } catch (requestError) {
      message.error(toBuyingErrorMessage(requestError, "Unable to save document."));
    }
  };

  const handleSubmitClick = async () => {
    try {
      const values = (await form.validateFields()) as DocLike;
      await onSaveSubmit(values);
    } catch (requestError) {
      message.error(toBuyingErrorMessage(requestError, "Unable to submit document."));
    }
  };

  return (
    <div className="page-stack">
      <Card loading={loading} title={title}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <div style={{ color: "#64748b" }}>{flowHint}</div>
          <SourceReferenceBanner source={sourceReference} />
          {stockImpactHint ? <Alert type="info" showIcon message={stockImpactHint} /> : null}
          {financeImpactHint ? <Alert type="info" showIcon message={financeImpactHint} /> : null}
        </Space>
      </Card>

      {error ? (
        <Alert type="error" showIcon message="Unable to load document" description={toBuyingErrorMessage(error, "Request failed.")} />
      ) : null}

      <Card>
        <Form<Record<string, unknown>> form={form} layout="vertical" requiredMark={false} disabled={!canEdit || masters.isLoading}>
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

            {kind === "material-request" ? (
              <Form.Item label="Material Request Type" name="material_request_type" rules={[{ required: true, message: "Type is required." }]}>
                <Select
                  options={[
                    { label: "Purchase", value: "Purchase" },
                    { label: "Material Transfer", value: "Material Transfer" },
                    { label: "Material Issue", value: "Material Issue" },
                    { label: "Customer Provided", value: "Customer Provided" }
                  ]}
                />
              </Form.Item>
            ) : null}

            {["supplier-quotation", "purchase-order", "purchase-receipt", "purchase-invoice"].includes(kind) ? (
              <Form.Item label="Supplier" name="supplier" rules={[{ required: true, message: "Supplier is required." }]}>
                <Select showSearch optionFilterProp="label" options={masters.data?.suppliers ?? []} />
              </Form.Item>
            ) : null}

            {["material-request", "rfq", "supplier-quotation"].includes(kind) ? (
              <Form.Item label="Transaction Date" name="transaction_date" rules={[{ required: true, message: "Transaction Date is required." }]}>
                <Input type="date" />
              </Form.Item>
            ) : null}

            {["purchase-receipt", "purchase-invoice"].includes(kind) ? (
              <Form.Item label="Posting Date" name="posting_date" rules={[{ required: true, message: "Posting Date is required." }]}>
                <Input type="date" />
              </Form.Item>
            ) : null}

            {kind === "purchase-receipt" ? (
              <Form.Item label="Posting Time" name="posting_time">
                <Input type="time" />
              </Form.Item>
            ) : null}

            {["material-request", "purchase-order"].includes(kind) ? (
              <Form.Item label="Schedule Date" name="schedule_date">
                <Input type="date" />
              </Form.Item>
            ) : null}

            {kind === "purchase-invoice" ? (
              <Form.Item label="Due Date" name="due_date">
                <Input type="date" />
              </Form.Item>
            ) : null}

            {["material-request", "purchase-order", "purchase-receipt"].includes(kind) ? (
              <Form.Item label="Set Warehouse" name="set_warehouse">
                <Select allowClear showSearch optionFilterProp="label" options={warehouseOptions} />
              </Form.Item>
            ) : null}

            {kind === "rfq" ? (
              <Form.Item label="Message for Supplier" name="message_for_supplier">
                <Input.TextArea rows={2} />
              </Form.Item>
            ) : null}

            {kind === "supplier-quotation" ? (
              <Form.Item label="Terms" name="terms">
                <Input.TextArea rows={2} />
              </Form.Item>
            ) : null}

            {kind === "purchase-order" ? (
              <>
                <Form.Item label="Buying Price List" name="buying_price_list">
                  <Input />
                </Form.Item>
                <Form.Item label="Taxes and Charges" name="taxes_and_charges">
                  <Input />
                </Form.Item>
              </>
            ) : null}

            {kind === "purchase-invoice" ? (
              <>
                <Form.Item label="Bill No" name="bill_no">
                  <Input />
                </Form.Item>
                <Form.Item label="Credit To" name="credit_to">
                  <Input />
                </Form.Item>
                <Form.Item label="Taxes and Charges" name="taxes_and_charges">
                  <Input />
                </Form.Item>
              </>
            ) : null}

            {kind === "rfq" ? (
              <Form.List name="suppliers">
                {(fields, { add, remove }) => (
                  <div className="buying-suppliers-list">
                    {fields.map((field) => {
                      const { key: _key, ...fieldProps } = field;

                      return (
                      <div key={field.key} className="buying-supplier-row">
                        <Form.Item
                          {...fieldProps}
                          label={field.name === 0 ? "Suppliers" : ""}
                          name={[field.name, "supplier"]}
                          rules={[{ required: true, message: "Supplier is required." }]}
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Select showSearch optionFilterProp="label" options={masters.data?.suppliers ?? []} />
                        </Form.Item>
                        <Button danger onClick={() => remove(field.name)}>
                          Remove
                        </Button>
                      </div>
                      );
                    })}
                    <Button onClick={() => add({ supplier: undefined })}>Add Supplier</Button>
                  </div>
                )}
              </Form.List>
            ) : null}
          </div>

          <Card size="small" title="Items" style={{ marginTop: 8, marginBottom: 16 }}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Variant-only policy active. Template items are blocked in transactions."
            />
            <BuyingItemRowsEditor
              itemOptions={masters.data?.items ?? []}
              uomOptions={masters.data?.uoms ?? []}
              warehouseOptions={warehouseOptions}
              withScheduleDate={kind === "material-request" || kind === "purchase-order"}
              withRate={kind === "supplier-quotation" || kind === "purchase-order" || kind === "purchase-invoice"}
              withBatch={kind === "purchase-receipt"}
              withRejectedQty={kind === "purchase-receipt"}
              variantOnly
            />
          </Card>

          {kind === "purchase-invoice" ? (
            <Card size="small" title="Invoice Summary" style={{ marginBottom: 16 }}>
              <div className="buying-form-grid-3">
                <Form.Item label="Grand Total" name="grand_total">
                  <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled />
                </Form.Item>
                <Form.Item label="Outstanding Amount" name="outstanding_amount">
                  <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled />
                </Form.Item>
              </div>
            </Card>
          ) : null}

        </Form>
      </Card>
    </div>
  );
}
