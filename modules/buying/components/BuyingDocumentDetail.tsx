"use client";

import Link from "next/link";
import { Alert, App, Button, Card, Descriptions, Space, Table, Typography } from "antd";

import { CreateNextActions } from "@/modules/buying/components/common/CreateNextActions";
import { DocumentStatusBadge } from "@/modules/buying/components/DocumentStatusBadge";
import { toBuyingErrorMessage } from "@/modules/buying/utils/errorMapper";
import { isDraft } from "@/modules/buying/utils/statusMapper";

const { Text } = Typography;

export function BuyingDocumentDetail({
  title,
  routeBase,
  document,
  loading,
  error,
  onSubmitDraft,
  submitLoading,
  nextActions,
  stockImpactNote,
  financeImpactNote
}: {
  title: string;
  routeBase: string;
  document: Record<string, unknown> | null;
  loading: boolean;
  error?: unknown;
  onSubmitDraft?: (name: string) => Promise<unknown>;
  submitLoading?: boolean;
  nextActions?: Array<{ label: string; href: string }>;
  stockImpactNote?: string;
  financeImpactNote?: string;
}) {
  const { message } = App.useApp();

  if (error) {
    return <Alert type="error" showIcon message="Unable to load document" description={toBuyingErrorMessage(error, "Request failed.")} />;
  }

  if (!document && !loading) {
    return <Alert type="warning" showIcon message="Document not found" />;
  }

  const doc = document ?? {};
  const items = Array.isArray(doc.items) ? (doc.items as Array<Record<string, unknown>>) : [];
  const canEdit = isDraft((typeof doc.docstatus === "number" ? doc.docstatus : undefined) as 0 | 1 | 2 | undefined);
  const sourceReference = (
    [
      ["material_request", "Material Request"],
      ["request_for_quotation", "Request for Quotation"],
      ["supplier_quotation", "Supplier Quotation"],
      ["purchase_order", "Purchase Order"],
      ["purchase_receipt", "Purchase Receipt"]
    ] as const
  ).find(([field]) => typeof doc[field] === "string" && String(doc[field]).trim());

  return (
    <div className="page-stack">
      <Card
        title={title}
        loading={loading}
        extra={
          <Space>
            <Button href={routeBase}>Back to List</Button>
            {canEdit && typeof doc.name === "string" ? (
              <>
                <Button type="primary" href={`${routeBase}/${encodeURIComponent(doc.name)}?edit=1`}>
                  Edit Draft
                </Button>
                {onSubmitDraft ? (
                  <Button
                    type="default"
                    loading={submitLoading}
                    onClick={async () => {
                      const docName = typeof doc.name === "string" ? doc.name : null;
                      if (!docName) {
                        message.error("Document name is missing.");
                        return;
                      }

                      try {
                        await onSubmitDraft(docName);
                        message.success("Document submitted.");
                      } catch (submitError) {
                        message.error(toBuyingErrorMessage(submitError, "Unable to submit document."));
                      }
                    }}
                  >
                    Submit Draft
                  </Button>
                ) : null}
              </>
            ) : null}
          </Space>
        }
      >
        <Descriptions bordered size="small" column={{ xs: 1, md: 2, lg: 3 }}>
          <Descriptions.Item label="Document">{String(doc.name ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Company">{String(doc.company ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Supplier">{String(doc.supplier ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <DocumentStatusBadge status={typeof doc.status === "string" ? doc.status : undefined} docstatus={typeof doc.docstatus === "number" ? (doc.docstatus as 0 | 1 | 2) : undefined} />
          </Descriptions.Item>
          <Descriptions.Item label="Transaction Date">{String(doc.transaction_date ?? doc.posting_date ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Schedule Date">{String(doc.schedule_date ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Warehouse">{String(doc.set_warehouse ?? "-")}</Descriptions.Item>
          <Descriptions.Item label="Created From">
            {sourceReference ? `${sourceReference[1]}: ${String(doc[sourceReference[0]])}` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Grand Total">{typeof doc.grand_total === "number" ? doc.grand_total.toFixed(2) : "-"}</Descriptions.Item>
          <Descriptions.Item label="Modified">{String(doc.modified ?? "-")}</Descriptions.Item>
        </Descriptions>

        {stockImpactNote ? (
          <Alert style={{ marginTop: 14 }} type="info" showIcon message={stockImpactNote} />
        ) : null}
        {financeImpactNote ? (
          <Alert style={{ marginTop: 14 }} type="info" showIcon message={financeImpactNote} />
        ) : null}

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
          Use linked documents to continue the buying flow. Open <Link href="/buying">Buying Dashboard</Link> for process guidance.
        </Text>
      </Card>
    </div>
  );
}
