"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { App, Button, Card, Descriptions, Form, Input, InputNumber, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

import { extractApiErrorMessage } from "@/lib/api-errors";
import { useActivePosSession } from "@/modules/pos/hooks/useActivePosSession";
import { usePosClosingEntry } from "@/modules/pos/hooks/usePosClosingEntry";
import { usePosSessionSummary } from "@/modules/pos/hooks/usePosSessionSummary";
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

export function PosClosingEntryPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<ClosingFormValues>();
  const active = useActivePosSession();
  const summaryQuery = usePosSessionSummary(active.session?.name);
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
    if (!modeRows.length) {
      return;
    }

    form.setFieldsValue({
      actuals: modeRows.map((row) => ({
        mode_of_payment: row.mode_of_payment,
        amount: row.actual_amount
      }))
    });
  }, [form, modeRows]);

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

  const onSubmit = async () => {
    const session = active.session;
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
      router.replace("/pos/opening");
    } catch (error) {
      if (error instanceof Error && error.message === "POS closing cancelled.") {
        return;
      }
      message.error(extractApiErrorMessage(error, "Unable to close POS session."));
    }
  };

  if (!active.session) {
    return (
      <Card>
        <Space direction="vertical" size={8}>
          <Text strong>No active POS session</Text>
          <Text type="secondary">Start POS session before billing</Text>
          <Link href="/pos/opening">
            <Button type="primary">Start Session</Button>
          </Link>
        </Space>
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <Card>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text strong>End POS session and verify collected amount</Text>
          <Text type="secondary">Count cash and close the session</Text>
        </Space>
      </Card>

      <Card title="Session Summary" loading={summaryQuery.isLoading}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="POS Profile">{summary?.pos_profile ?? active.session.pos_profile}</Descriptions.Item>
          <Descriptions.Item label="Status">{active.session.status ?? "Open"}</Descriptions.Item>
          <Descriptions.Item label="Company">{summary?.company ?? active.session.company ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="Opening Date/Time">{summary?.opening_time ?? active.session.opening_time ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="Bills">{summary?.invoice_count ?? 0}</Descriptions.Item>
          <Descriptions.Item label="Total Sales">{(summary?.total_sales ?? 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Opening Amount">{(summary?.opening_amount_total ?? 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Expected Closing Cash">{(summary?.expected_closing_cash ?? 0).toFixed(2)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Closing Amounts">
        <Form<ClosingFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            actuals: modeRows.map((row) => ({
              mode_of_payment: row.mode_of_payment,
              amount: row.actual_amount
            }))
          }}
        >
          <div className="pos-payment-grid">
            {modeRows.map((row, index) => (
              <Form.Item key={row.mode_of_payment} label={`Actual ${row.mode_of_payment}`}>
                <Space.Compact block>
                  <Form.Item name={["actuals", index, "mode_of_payment"]} noStyle>
                    <Input readOnly style={{ width: "48%" }} />
                  </Form.Item>
                  <Form.Item
                    name={["actuals", index, "amount"]}
                    noStyle
                    rules={[{ required: true, message: "Enter amount." }]}
                  >
                    <InputNumber min={0} precision={2} style={{ width: "52%" }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            ))}
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} placeholder="Optional remarks" />
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

        <Space style={{ marginTop: 12 }} direction="vertical">
          <Text>Expected Amount: <strong>{totalExpected.toFixed(2)}</strong></Text>
          <Text>Entered Closing Amount: <strong>{totalActual.toFixed(2)}</strong></Text>
          <Text>
            Difference:{" "}
            <Tag color={totalDifference < 0 ? "red" : totalDifference > 0 ? "gold" : "green"}>
              {totalDifference.toFixed(2)}
            </Tag>
          </Text>
        </Space>

        <Space style={{ marginTop: 16 }}>
          <Button type="primary" loading={closing.isClosing} onClick={() => void onSubmit()}>
            Close Session
          </Button>
          <Link href="/pos">
            <Button>Back to Billing</Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}
