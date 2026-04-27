"use client";

import { useEffect, useMemo } from "react";
import { App, Descriptions, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { extractApiErrorMessage } from "@/lib/api-errors";
import { usePosClosingEntry } from "@/modules/pos/hooks/usePosClosingEntry";
import { usePosSessionSummary } from "@/modules/pos/hooks/usePosSessionSummary";
import type { PosSession } from "@/modules/pos/types/pos";
import { createPosClosingEntry } from "@/modules/pos/utils/posSessionService";

const { Text } = Typography;

type ClosingModeRow = {
  mode_of_payment: string;
  expected_amount: number;
  actual_amount: number;
  difference: number;
};

type ClosingFormValues = {
  remarks?: string;
  actuals: Array<{
    mode_of_payment: string;
    amount?: number;
  }>;
};

export function PosClosingEntryModal({
  open,
  session,
  onSuccess,
  onCancel
}: {
  open: boolean;
  session?: PosSession | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<ClosingFormValues>();
  const summaryQuery = usePosSessionSummary(open ? session?.name : undefined);
  const closing = usePosClosingEntry();

  const summary = summaryQuery.summary;
  const modeRows = useMemo(() => {
    if (!summary) {
      return [] as ClosingModeRow[];
    }
    const hasCash = summary.totals_by_mode.some((row) => row.mode_of_payment.toLowerCase().includes("cash"));
    const baseRows = hasCash
      ? summary.totals_by_mode
      : [{ mode_of_payment: "Cash", amount: 0 }, ...summary.totals_by_mode];

    return baseRows.map((row) => ({
      mode_of_payment: row.mode_of_payment,
      expected_amount: row.mode_of_payment.toLowerCase().includes("cash")
        ? summary.expected_closing_cash
        : row.amount,
      actual_amount: row.mode_of_payment.toLowerCase().includes("cash")
        ? summary.expected_closing_cash
        : row.amount,
      difference: 0
    }));
  }, [summary]);

  useEffect(() => {
    if (!open || !modeRows.length) {
      return;
    }

    form.setFieldsValue({
      actuals: modeRows.map((row) => ({
        mode_of_payment: row.mode_of_payment,
        amount: row.actual_amount
      })),
      remarks: undefined
    });
  }, [form, modeRows, open]);

  const watchedActuals = Form.useWatch("actuals", form);
  const calculatedRows = useMemo(() => {
    return modeRows.map((row) => {
      const current = watchedActuals?.find((entry) => entry.mode_of_payment === row.mode_of_payment);
      const actual = Number(current?.amount ?? row.actual_amount ?? 0);
      const difference = Number((actual - row.expected_amount).toFixed(2));
      return {
        ...row,
        actual_amount: actual,
        difference
      };
    });
  }, [modeRows, watchedActuals]);

  const totalExpected = calculatedRows.reduce((sum, row) => sum + row.expected_amount, 0);
  const totalActual = calculatedRows.reduce((sum, row) => sum + row.actual_amount, 0);
  const totalDifference = Number((totalActual - totalExpected).toFixed(2));

  const columns: ColumnsType<ClosingModeRow> = [
    { title: "Payment Mode", dataIndex: "mode_of_payment", key: "mode_of_payment" },
    { title: "Expected", dataIndex: "expected_amount", key: "expected_amount", render: (v: number) => v.toFixed(2) },
    { title: "Actual", dataIndex: "actual_amount", key: "actual_amount", render: (v: number) => v.toFixed(2) },
    {
      title: "Difference",
      dataIndex: "difference",
      key: "difference",
      render: (v: number) => <Tag color={v < 0 ? "red" : v > 0 ? "gold" : "green"}>{v.toFixed(2)}</Tag>
    }
  ];

  const handleCloseSession = async () => {
    if (!session) {
      message.warning("No active POS session to close.");
      return;
    }

    try {
      const values = await form.validateFields();
      await new Promise<void>((resolve, reject) => {
        modal.confirm({
          title: "Close POS session?",
          content: "You will need a new opening entry before billing again.",
          okText: "Close Session",
          onOk: async () => {
            try {
              await createPosClosingEntry(
                {
                  pos_opening_entry: session.name,
                  actual_amounts: calculatedRows.map((row) => ({
                    mode_of_payment: row.mode_of_payment,
                    amount: row.actual_amount
                  })),
                  remarks: values.remarks
                },
                closing.closeSession
              );
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          onCancel: () => reject(new Error("POS closing cancelled."))
        });
      });

      message.success("POS session closed successfully.");
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error && error.message === "POS closing cancelled.") {
        return;
      }
      message.error(extractApiErrorMessage(error, "Unable to close POS session."));
    }
  };

  return (
    <Modal
      title="POS Closing Entry"
      open={open}
      onCancel={onCancel}
      onOk={() => {
        void handleCloseSession();
      }}
      okText="Close Session"
      confirmLoading={closing.isClosing}
      width={900}
      destroyOnHidden
      maskClosable={false}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {summaryQuery.isLoading ? (
          <Text type="secondary">Loading session summary...</Text>
        ) : (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="POS Profile">{summary?.pos_profile ?? session?.pos_profile ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Status">{session?.status ?? "Open"}</Descriptions.Item>
            <Descriptions.Item label="Company">{summary?.company ?? session?.company ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Opening Date/Time">{summary?.opening_time ?? session?.opening_time ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Bills">{summary?.invoice_count ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Total Sales">{(summary?.total_sales ?? 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Opening Amount">{(summary?.opening_amount_total ?? 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Expected Closing Cash">{(summary?.expected_closing_cash ?? 0).toFixed(2)}</Descriptions.Item>
          </Descriptions>
        )}

        <Form<ClosingFormValues> form={form} layout="vertical" preserve={false}>
          <div className="pos-payment-grid">
            {modeRows.map((row, index) => (
              <Form.Item key={row.mode_of_payment} label={`Actual ${row.mode_of_payment}`}>
                <Form.Item name={["actuals", index, "mode_of_payment"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  name={["actuals", index, "amount"]}
                  noStyle
                  rules={[{ required: true, message: "Enter amount." }]}
                >
                  <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                </Form.Item>
              </Form.Item>
            ))}
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={3} placeholder="Optional remarks" />
            </Form.Item>
          </div>
        </Form>

        <Table
          size="small"
          pagination={false}
          rowKey={(row) => row.mode_of_payment}
          columns={columns}
          dataSource={calculatedRows}
        />

        <Space direction="vertical" size={4}>
          <Text type="secondary">Expected closing cash = Opening Amount + submitted cash sales for this session.</Text>
          <Text>Expected Amount: <strong>{totalExpected.toFixed(2)}</strong></Text>
          <Text>Entered Closing Amount: <strong>{totalActual.toFixed(2)}</strong></Text>
          <Text>
            Difference:{" "}
            <Tag color={totalDifference < 0 ? "red" : totalDifference > 0 ? "gold" : "green"}>
              {totalDifference.toFixed(2)}
            </Tag>
          </Text>
        </Space>
      </Space>
    </Modal>
  );
}
