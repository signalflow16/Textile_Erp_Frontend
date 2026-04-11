"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Button, DatePicker, Drawer, Input, Skeleton, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";

import { DataTable } from "@/components/tables/data-table";
import {
  fetchStockEntries,
  fetchStockEntryDetail,
  hydrateStockEntryItems,
  selectAllStockEntries,
  selectStockEntryDetail,
  selectStockEntryDetailStatus,
  selectStockState
} from "@/store/slices/stockSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { StockEntryListRow } from "@/types/stock";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type DateFilterValue = [Dayjs | null, Dayjs | null] | null;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function StockEntryListPage() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectAllStockEntries);
  const stockState = useAppSelector(selectStockState);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState<DateFilterValue>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const detail = useAppSelector((state) => (selectedEntry ? selectStockEntryDetail(state, selectedEntry) : undefined));
  const detailStatus = useAppSelector((state) =>
    selectedEntry ? selectStockEntryDetailStatus(state, selectedEntry) : "idle"
  );

  useEffect(() => {
    void dispatch(
      fetchStockEntries({
        fromDate: dates?.[0]?.format("YYYY-MM-DD"),
        toDate: dates?.[1]?.format("YYYY-MM-DD")
      })
    );
  }, [dates, dispatch]);

  useEffect(() => {
    if (stockState.stockEntriesStatus === "succeeded" && entries.length > 0) {
      void dispatch(hydrateStockEntryItems(entries.slice(0, 24).map((entry) => entry.name)));
    }
  }, [dispatch, entries, stockState.stockEntriesStatus]);

  useEffect(() => {
    if (selectedEntry && detailStatus === "idle") {
      void dispatch(fetchStockEntryDetail(selectedEntry));
    }
  }, [detailStatus, dispatch, selectedEntry]);

  const filteredEntries = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return entries;
    }

    return entries.filter((entry) =>
      [entry.name, entry.stock_entry_type ?? "", entry.purpose ?? "", ...(entry.itemCodes ?? [])].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [deferredSearch, entries]);

  const columns = useMemo<ColumnsType<StockEntryListRow>>(
    () => [
      {
        title: "Stock Entry",
        dataIndex: "name",
        key: "name",
        render: (value, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{value}</Text>
            <Text type="secondary">{record.stock_entry_type || record.purpose || "Stock Entry"}</Text>
          </Space>
        )
      },
      {
        title: "Posting Date",
        dataIndex: "posting_date",
        key: "posting_date",
        width: 120
      },
      {
        title: "Posting Time",
        dataIndex: "posting_time",
        key: "posting_time",
        width: 120
      },
      {
        title: "Value",
        key: "value",
        width: 160,
        render: (_value, record) =>
          currencyFormatter.format(Number(record.total_incoming_value ?? record.total_outgoing_value ?? 0))
      },
      {
        title: "Items",
        key: "items",
        render: (_value, record) => (
          <Space wrap>
            {(record.itemCodes ?? []).slice(0, 3).map((itemCode) => (
              <Tag key={itemCode} bordered={false}>
                {itemCode}
              </Tag>
            ))}
            {!record.itemCodes?.length ? <Text type="secondary">Items load on demand</Text> : null}
          </Space>
        )
      },
      {
        title: "",
        key: "actions",
        width: 100,
        render: (_value, record) => (
          <Button type="link" onClick={() => setSelectedEntry(record.name)}>
            View
          </Button>
        )
      }
    ],
    []
  );

  return (
    <div className="page-stack">
      {stockState.stockEntriesError ? <Alert type="error" showIcon message={stockState.stockEntriesError} /> : null}

      <div className="stock-entry-list-toolbar">
        <Input
          allowClear
          value={search}
          placeholder="Search stock entry or item"
          onChange={(event) => setSearch(event.target.value)}
        />
        <RangePicker value={dates} onChange={(value) => setDates(value)} />
        <Button type="primary">
          <Link href="/stock/stock-entry/create">New Stock Entry</Link>
        </Button>
      </div>

      <div className="master-summary-bar">
        <Tag color="processing" bordered={false}>
          {filteredEntries.length} entries
        </Tag>
      </div>

      <div className="item-list-card">
        <DataTable
          rowKey={(record) => record.name}
          columns={columns}
          dataSource={filteredEntries}
          loading={stockState.stockEntriesStatus === "loading"}
        />
      </div>

      <Drawer
        title={selectedEntry || "Stock Entry Details"}
        width={540}
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
      >
        {detailStatus === "loading" ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : detail ? (
          <div className="stock-entry-detail-drawer">
            <div className="stock-entry-detail-meta">
              <div>
                <Text type="secondary">Type</Text>
                <div>{detail.stock_entry_type || detail.purpose || "-"}</div>
              </div>
              <div>
                <Text type="secondary">Posting</Text>
                <div>{detail.posting_date || "-"} {detail.posting_time || ""}</div>
              </div>
            </div>
            <Table
              rowKey={(record) => `${record.idx ?? 0}-${record.item_code}`}
              pagination={false}
              dataSource={detail.items ?? []}
              columns={[
                { title: "Item", dataIndex: "item_code", key: "item_code" },
                { title: "Source", dataIndex: "s_warehouse", key: "s_warehouse" },
                { title: "Target", dataIndex: "t_warehouse", key: "t_warehouse" },
                { title: "Qty", dataIndex: "qty", key: "qty", width: 80 },
                {
                  title: "Basic Rate",
                  dataIndex: "basic_rate",
                  key: "basic_rate",
                  width: 120,
                  render: (value) => currencyFormatter.format(Number(value ?? 0))
                }
              ]}
            />
          </div>
        ) : (
          <Alert type="warning" showIcon message="No detail available for this stock entry." />
        )}
      </Drawer>
    </div>
  );
}
