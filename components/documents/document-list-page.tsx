"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Button, DatePicker, Input, Space } from "antd";

import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/documents/status-badge";
import { documentConfigs } from "@/services/documentEngine";
import { fetchDocumentList, selectDocumentList, selectDocumentModule } from "@/store/slices/documentEngineSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { DocumentEngineConfig } from "@/types/document-engine";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";

type DateFilterValue = [Dayjs | null, Dayjs | null] | null;

export function DocumentListPage({ doctype }: { doctype: DocumentEngineConfig["doctype"] }) {
  const dispatch = useAppDispatch();
  const config = useMemo(
    () => Object.values(documentConfigs).find((entry) => entry.doctype === doctype) as DocumentEngineConfig,
    [doctype]
  );
  const entries = useAppSelector((state) => selectDocumentList(state, config.key));
  const moduleState = useAppSelector((state) => selectDocumentModule(state, config.key));
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState<DateFilterValue>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    void dispatch(
      fetchDocumentList({
        key: config.key,
        filters: {
          search: deferredSearch,
          fromDate: dates?.[0]?.format("YYYY-MM-DD"),
          toDate: dates?.[1]?.format("YYYY-MM-DD"),
          page: moduleState.pagination.current,
          pageSize: moduleState.pagination.pageSize
        }
      })
    );
  }, [config.key, dates, deferredSearch, dispatch, moduleState.pagination.current, moduleState.pagination.pageSize]);

  const columns = useMemo<ColumnsType<(typeof entries)[number]>>(
    () => [
      {
        title: config.title,
        dataIndex: "name",
        key: "name",
        render: (value) => <Link href={`${config.routeBase}/${value}`}>{value}</Link>
      },
      {
        title: config.partyField === "supplier" ? "Supplier" : "Customer",
        dataIndex: "party",
        key: "party"
      },
      {
        title: "Posting Date",
        dataIndex: "posting_date",
        key: "posting_date"
      },
      {
        title: "Warehouse",
        dataIndex: "set_warehouse",
        key: "set_warehouse"
      },
      {
        title: "Amount",
        dataIndex: "grand_total",
        key: "grand_total",
        render: (value) => Number(value ?? 0).toFixed(2)
      },
      {
        title: "Status",
        dataIndex: "docstatus",
        key: "docstatus",
        render: (value) => <StatusBadge status={value} />
      }
    ],
    [config.partyField, config.routeBase, config.title, entries]
  );

  return (
    <div className="page-stack">
      {moduleState.commands.listError ? <Alert type="error" showIcon message={moduleState.commands.listError} /> : null}
      <div className="stock-entry-list-toolbar">
        <Input allowClear value={search} placeholder={`Search ${config.title}`} onChange={(event) => setSearch(event.target.value)} />
        <DatePicker.RangePicker value={dates} onChange={(value) => setDates(value)} />
        <Button type="primary">
          <Link href={`${config.routeBase}/create`}>New {config.title}</Link>
        </Button>
      </div>
      <div className="item-list-card">
        <DataTable
          rowKey={(record) => record.name}
          columns={columns}
          dataSource={entries}
          loading={moduleState.commands.listStatus === "loading"}
          pagination={{
            current: moduleState.pagination.current,
            pageSize: moduleState.pagination.pageSize,
            total: moduleState.pagination.total,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100].map(String)
          }}
          onChange={(pagination) => {
            void dispatch(
              fetchDocumentList({
                key: config.key,
                filters: {
                  search: deferredSearch,
                  fromDate: dates?.[0]?.format("YYYY-MM-DD"),
                  toDate: dates?.[1]?.format("YYYY-MM-DD"),
                  page: pagination.current ?? 1,
                  pageSize: pagination.pageSize ?? 20
                }
              })
            );
          }}
        />
      </div>
    </div>
  );
}
