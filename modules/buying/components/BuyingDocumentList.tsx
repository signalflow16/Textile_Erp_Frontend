"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, Button, Card, Input, Select, Space, Table } from "antd";

import { DocumentStatusBadge } from "@/modules/buying/components/DocumentStatusBadge";
import type { BuyingDocumentSummary, BuyingListParams, LookupOption } from "@/modules/buying/types/buying";
import { toBuyingErrorMessage } from "@/modules/buying/utils/errorMapper";

type ListResult = {
  data?: { data: BuyingDocumentSummary[]; total_count: number };
  isFetching: boolean;
  error?: unknown;
};

export function BuyingDocumentList({
  title,
  subtitle,
  routeBase,
  includeSupplier,
  companies,
  suppliers,
  useList
}: {
  title: string;
  subtitle: string;
  routeBase: string;
  includeSupplier: boolean;
  companies: LookupOption[];
  suppliers: LookupOption[];
  useList: (params: BuyingListParams) => ListResult;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<BuyingListParams>({
    page: 1,
    pageSize: 20,
    search: "",
    company: undefined,
    supplier: undefined,
    status: "all",
    dateFrom: "",
    dateTo: "",
    sortBy: "modified_desc"
  });

  const result = useList(filters);

  const rows = useMemo(() => result.data?.data ?? [], [result.data]);

  return (
    <div className="page-stack">
      <Card
        title={title}
        extra={
          <Space>
            <Button onClick={() => router.push(`${routeBase}/new`)} type="primary">Create</Button>
            <Button onClick={() => setFilters((prev) => ({ ...prev }))} loading={result.isFetching}>Refresh</Button>
          </Space>
        }
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div className="buying-list-filter-grid">
            <Input
              allowClear
              placeholder="Search document"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, search: event.target.value }))}
            />
            <Select
              allowClear
              placeholder="Company"
              value={filters.company}
              options={companies}
              onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, company: value }))}
            />
            {includeSupplier ? (
              <Select
                allowClear
                placeholder="Supplier"
                value={filters.supplier}
                options={suppliers}
                onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, supplier: value }))}
              />
            ) : null}
            <Select
              value={filters.status}
              options={[
                { label: "All Status", value: "all" },
                { label: "Draft", value: "Draft" },
                { label: "Submitted", value: "Submitted" },
                { label: "Completed", value: "Completed" },
                { label: "Cancelled", value: "Cancelled" }
              ]}
              onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, status: value }))}
            />
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, dateFrom: event.target.value }))}
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, dateTo: event.target.value }))}
            />
          </div>
          <div style={{ color: "#64748b" }}>{subtitle}</div>
        </Space>
      </Card>

      {result.error ? (
        <Alert type="error" showIcon message="Unable to load documents" description={toBuyingErrorMessage(result.error, "Request failed.")} />
      ) : null}

      <Card>
        <Table<BuyingDocumentSummary>
          rowKey="name"
          loading={result.isFetching}
          dataSource={rows}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: result.data?.total_count ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100].map(String)
          }}
          onChange={(pagination) => {
            setFilters((prev) => ({
              ...prev,
              page: pagination.current ?? prev.page,
              pageSize: pagination.pageSize ?? prev.pageSize
            }));
          }}
          columns={[
            {
              title: "Document",
              key: "name",
              render: (_, row) => <Link href={`${routeBase}/${encodeURIComponent(row.name)}`}>{row.name}</Link>
            },
            {
              title: "Supplier",
              key: "supplier",
              render: (_, row) => row.supplier || "-"
            },
            {
              title: "Company",
              dataIndex: "company",
              key: "company"
            },
            {
              title: "Date",
              key: "date",
              render: (_, row) => row.transaction_date || row.posting_date || row.schedule_date || "-"
            },
            {
              title: "Status",
              key: "status",
              render: (_, row) => <DocumentStatusBadge status={row.status} docstatus={row.docstatus} />
            },
            {
              title: "Updated",
              dataIndex: "modified",
              key: "modified"
            }
          ]}
        />
      </Card>
    </div>
  );
}
