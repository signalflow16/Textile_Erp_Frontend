"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Descriptions, Space, Table, Typography } from "antd";

import { CreateNextActions } from "@/modules/buying/components/common/CreateNextActions";
import { DocumentStatusBadge } from "@/modules/buying/components/DocumentStatusBadge";
import { isDraft } from "@/modules/buying/utils/statusMapper";
import { toSellingErrorMessage } from "@/modules/selling/utils/errorMapper";

const { Text } = Typography;

export function SellingDocumentDetail({
  title,
  routeBase,
  document,
  loading,
  error,
  onSubmitDraft,
  onCancelSubmitted,
  submitLoading,
  cancelLoading,
  nextActions,
  stockImpactNote
}: {
  title: string;
  routeBase: string;
  document: Record<string, unknown> | null;
  loading: boolean;
  error?: unknown;
  onSubmitDraft?: (name: string) => Promise<unknown>;
  onCancelSubmitted?: (name: string) => Promise<unknown>;
  submitLoading?: boolean;
  cancelLoading?: boolean;
  nextActions?: Array<{ label: string; href: string }>;
  stockImpactNote?: string;
}) {
  const { message, modal } = App.useApp();
  const router = useRouter();

  if (error) {
    return <Alert type="error" showIcon message="Unable to load document" description={toSellingErrorMessage(error, "Request failed.")} />;
  }

  if (!document && !loading) {
    return <Alert type="warning" showIcon message="Document not found" />;
  }

  const doc = document ?? {};
  const items = Array.isArray(doc.items) ? (doc.items as Array<Record<string, unknown>>) : [];
  const docName = typeof doc.name === "string" ? doc.name : null;
  const docstatus = (typeof doc.docstatus === "number" ? doc.docstatus : undefined) as 0 | 1 | 2 | undefined;
  const canEdit = isDraft(docstatus);
  const canCancel = docstatus === 1;
  const sourceReference = (
    [
      ["quotation", "Quotation"],
      ["sales_order", "Sales Order"]
    ] as const
  ).find(([field]) => typeof doc[field] === "string" && String(doc[field]).trim());

  return (
    <div className="page-stack">
      <Card
        title={title}
        loading={loading}
        extra={
          <Space>
            <Button onClick={() => router.push(routeBase)}>Back to List</Button>
            {canEdit && docName ? (
              <>
                <Button type="primary" onClick={() => router.push(`${routeBase}/${encodeURIComponent(docName)}?edit=1`)}>
                  Edit Draft
                </Button>
                {onSubmitDraft ? (
                  <Button
                    loading={submitLoading}
                    onClick={async () => {
                      try {
                        await onSubmitDraft(docName);
                        message.success("Document submitted.");
                      } catch (submitError) {
                        message.error(toSellingErrorMessage(submitError, "Unable to submit document."));
                      }
                    }}
                  >
                    Submit Draft
                  </Button>
                ) : null}
              </>
            ) : null}
            {canCancel && docName && onCancelSubmitted ? (
              <Button
                danger
                loading={cancelLoading}
                onClick={() =>
                  modal.confirm({
                    title: "Cancel submitted document?",
                    content: "This will mark the document as cancelled in ERPNext.",
                    okText: "Cancel Document",
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      try {
                        await onCancelSubmitted(docName);
                        message.success("Document cancelled.");
                      } catch (cancelError) {
                        message.error(toSellingErrorMessage(cancelError, "Unable to cancel document."));
                      }
                    }
                  })
                }
              >
                Cancel
              </Button>
            ) : null}
          </Space>
        }
      >
        <Descriptions bordered size="small" column={{ xs: 1, md: 2, lg: 3 }}>
          <Descriptions.Item label="Document">{String(doc.name ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Company">{String(doc.company ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Customer">{String(doc.customer ?? doc.party_name ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <DocumentStatusBadge status={typeof doc.status === "string" ? doc.status : undefined} docstatus={docstatus} />
          </Descriptions.Item>
          <Descriptions.Item label="Transaction Date">{String(doc.transaction_date ?? doc.posting_date ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Delivery / Valid Till">{String(doc.delivery_date ?? doc.valid_till ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Warehouse">{String(doc.set_warehouse ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Created From">
            {sourceReference ? `${sourceReference[1]}: ${String(doc[sourceReference[0]])}` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Grand Total">{typeof doc.grand_total === "number" ? doc.grand_total.toFixed(2) : "-"}</Descriptions.Item>
          <Descriptions.Item label="Modified">{String(doc.modified ?? "-")}</Descriptions.Item>
        </Descriptions>

        {stockImpactNote ? <Alert style={{ marginTop: 14 }} type="info" showIcon message={stockImpactNote} /> : null}

        <CreateNextActions actions={nextActions} />
      </Card>

      <Card title="Items">
        <Table<Record<string, unknown>>
          rowKey={(row, index) => String(row.name ?? row.item_code ?? index)}
          dataSource={items}
          pagination={false}
          columns={[
            {
              title: "Item",
              key: "item",
              render: (_, row) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{String(row.item_code ?? "-")}</Text>
                  {typeof row.item_name === "string" ? <Text type="secondary">{row.item_name}</Text> : null}
                </Space>
              )
            },
            {
              title: "Qty",
              key: "qty",
              render: (_, row) => String(row.qty ?? "-")
            },
            {
              title: "UOM",
              key: "uom",
              render: (_, row) => String(row.uom ?? "-")
            },
            {
              title: "Warehouse",
              key: "warehouse",
              render: (_, row) => String(row.warehouse ?? "-")
            },
            {
              title: "Rate",
              key: "rate",
              render: (_, row) => (typeof row.rate === "number" ? row.rate.toFixed(2) : "-")
            },
            {
              title: "Amount",
              key: "amount",
              render: (_, row) => (typeof row.amount === "number" ? row.amount.toFixed(2) : "-")
            }
          ]}
        />
      </Card>

      <Card>
        <Text type="secondary">
          Continue the ERPNext selling flow from <Link href="/selling">Selling Dashboard</Link>.
        </Text>
      </Card>
    </div>
  );
}
