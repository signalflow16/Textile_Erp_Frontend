"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, App, Button, Card, DatePicker, Form, Select, Space, TimePicker, Typography } from "antd";
import { useRouter } from "next/navigation";
import dayjs, { type Dayjs } from "dayjs";

import { validateStockAvailability } from "@/modules/shared/document/api/documentEngine";
import { fetchStockEntryLookups, createStockEntry, selectStockEntryLookups, selectStockState } from "@/modules/stock/store/stockSlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import type { RowStockValidation } from "@/modules/shared/document/types/document-engine";
import type { StockEntryCreateValues } from "@/modules/stock/types";
import { StockEntryItemsTable } from "./stock-entry-items-table";

const { Text } = Typography;

type StockEntryFormValues = {
  stock_entry_type: string;
  posting_date: Dayjs;
  posting_time: Dayjs;
  items: StockEntryCreateValues["items"];
};

const getStockEntryErrorMessage = (error: unknown) => {
  const fallback = "Please review the form values and try again.";
  const message = typeof error === "string" ? error : fallback;

  if (message.includes("FiscalYearError")) {
    return "The posting date is outside an active Fiscal Year for the company linked to this stock entry. Create or activate the Fiscal Year in ERPNext, or change the posting date to a valid fiscal period.";
  }

  return message;
};

export function StockEntryForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { notification } = App.useApp();
  const [form] = Form.useForm<StockEntryFormValues>();
  const items = Form.useWatch("items", form);
  const lookups = useAppSelector(selectStockEntryLookups);
  const stockState = useAppSelector(selectStockState);
  const [validations, setValidations] = useState<RowStockValidation[]>([]);

  useEffect(() => {
    if (stockState.lookupsStatus === "idle") {
      void dispatch(fetchStockEntryLookups());
    }
  }, [dispatch, stockState.lookupsStatus]);

  useEffect(() => {
    if (!form.getFieldValue("stock_entry_type") && lookups.stockEntryTypes.length > 0) {
      form.setFieldsValue({
        stock_entry_type: lookups.stockEntryTypes[0].value,
        posting_date: dayjs(),
        posting_time: dayjs(),
        items: form.getFieldValue("items")?.length ? form.getFieldValue("items") : [{ qty: 1 }]
      });
    }
  }, [form, lookups.stockEntryTypes]);

  useEffect(() => {
    const currentItems = Array.isArray(items) ? items : [];
    if (currentItems.length === 0) {
      setValidations([]);
      return;
    }

    let cancelled = false;

    void Promise.all(
      currentItems.map(async (item, index) => {
        if (!item?.source_warehouse || !item?.item_code) {
          return {
            rowId: String(index),
            warehouse: item?.source_warehouse,
            availableQty: 0,
            requiredQty: Number(item?.qty ?? 0),
            shortageQty: 0,
            ok: true
          } satisfies RowStockValidation;
        }

        const validation = await validateStockAvailability({
          itemCode: item.item_code,
          warehouse: item.source_warehouse,
          requiredQty: Number(item.qty ?? 0)
        });

        return {
          ...validation,
          rowId: String(index)
        };
      })
    ).then((rows) => {
      if (!cancelled) {
        setValidations(rows);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const handleFinish = async (values: StockEntryFormValues) => {
    const invalidRow = values.items.find((item) => !item.source_warehouse && !item.target_warehouse);
    const stockIssue = validations.find((entry) => !entry.ok);

    if (invalidRow) {
      notification.error({
        message: "Warehouse is required",
        description: "Each stock entry row must include at least a source warehouse or a target warehouse."
      });
      return;
    }

    if (stockIssue) {
      notification.error({
        message: "Insufficient stock",
        description: stockIssue.message || "Source warehouse does not have enough stock for one or more rows."
      });
      return;
    }

    try {
      await dispatch(
        createStockEntry({
          stock_entry_type: values.stock_entry_type,
          posting_date: values.posting_date.format("YYYY-MM-DD"),
          posting_time: values.posting_time.format("HH:mm:ss"),
          items: values.items
        })
      ).unwrap();

      notification.success({
        message: "Stock entry submitted",
        description: "The stock movement was created and submitted successfully."
      });

      router.push("/stock/stock-entry/list");
    } catch (error) {
      notification.error({
        message: "Unable to submit stock entry",
        description: getStockEntryErrorMessage(error)
      });
    }
  };

  return (
    <div className="page-stack stock-entry-page-shell">
      {stockState.lookupsError ? <Alert type="error" showIcon message={stockState.lookupsError} /> : null}
      {stockState.createError ? <Alert type="error" showIcon message={stockState.createError} /> : null}

      <Card className="stock-entry-document-card" bordered={false}>
        <div className="stock-entry-document-head">
          <div>
            <Text className="item-toolbar-title">New Stock Entry</Text>
            <Text className="item-toolbar-subtitle">
              Capture inbound, outbound, and transfer movements and submit them so ERPNext updates stock bins and stock ledger balances.
            </Text>
          </div>
          <Space wrap>
            <Button>
              <Link href="/stock/stock-entry/list">Cancel</Link>
            </Button>
            <Button
              type="primary"
              loading={stockState.createStatus === "loading"}
              disabled={stockState.lookupsStatus === "loading" || lookups.items.length === 0 || lookups.warehouses.length === 0}
              onClick={() => void form.submit()}
            >
              Create and Submit
            </Button>
          </Space>
        </div>

        <Form<StockEntryFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            posting_date: dayjs(),
            posting_time: dayjs(),
            items: [{ qty: 1, allow_zero_valuation_rate: false }]
          }}
          onFinish={handleFinish}
        >
          <Alert
            type="info"
            showIcon
            className="form-helper-alert"
            message="Use Allow Zero Valuation for rows that should post without an item valuation rate. The posting date must also fall inside an active ERPNext Fiscal Year."
          />

          <div className="stock-entry-form-grid">
            <Form.Item
              label="Stock Entry Type"
              name="stock_entry_type"
              rules={[{ required: true, message: "Stock entry type is required." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={lookups.stockEntryTypes}
                placeholder="Select stock entry type"
              />
            </Form.Item>
            <Form.Item
              label="Posting Date"
              name="posting_date"
              rules={[{ required: true, message: "Posting date is required." }]}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              label="Posting Time"
              name="posting_time"
              rules={[{ required: true, message: "Posting time is required." }]}
            >
              <TimePicker style={{ width: "100%" }} format="HH:mm:ss" />
            </Form.Item>
          </div>

          <StockEntryItemsTable lookups={lookups} validations={validations} />
        </Form>
      </Card>
    </div>
  );
}

