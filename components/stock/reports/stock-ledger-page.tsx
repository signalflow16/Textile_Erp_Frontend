"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Space, Tag, Typography } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import { ActiveFilterChips } from "@/components/stock/reports/active-filter-chips";
import { quantityFormatter } from "@/components/stock/reports/helpers";
import { ReportStatStrip } from "@/components/stock/reports/report-stat-strip";
import { StockReportFilterModal } from "@/components/stock/reports/stock-report-filter-modal";
import { StockReportPageHeader } from "@/components/stock/reports/stock-report-page-header";
import { StockReportTable } from "@/components/stock/reports/stock-report-table";
import { fetchStockLedger, fetchStockReportLookups, selectStockReportsState } from "@/store/slices/stockReportSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectStockState } from "@/store/slices/stockSlice";
import type { StockLedgerFilters, StockLedgerRow } from "@/types/stock-report";

const { Text } = Typography;

const defaultFilters: StockLedgerFilters = {
  page: 1,
  pageSize: 20,
  sortBy: "posting_date",
  sortOrder: "desc"
};

const getFilterCount = (filters: StockLedgerFilters) =>
  [filters.itemCode, filters.warehouse, filters.fromDate, filters.toDate, filters.voucherType].filter(Boolean).length;

export function StockLedgerPage() {
  const dispatch = useAppDispatch();
  const { stockLedger, lookups, lookupsStatus, lookupsError, loading, error } = useAppSelector(selectStockReportsState);
  const stockState = useAppSelector(selectStockState);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<StockLedgerFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<StockLedgerFilters>(defaultFilters);

  useEffect(() => {
    if (lookupsStatus === "idle") {
      void dispatch(fetchStockReportLookups());
    }
  }, [dispatch, lookupsStatus]);

  useEffect(() => {
    void dispatch(fetchStockLedger(appliedFilters));
  }, [appliedFilters, dispatch, stockState.stockDataVersion]);

  const columns = useMemo<ColumnsType<StockLedgerRow>>(
    () => [
      {
        title: "Date",
        dataIndex: "postingDate",
        key: "postingDate",
        width: 130,
        sorter: true
      },
      {
        title: "Item",
        dataIndex: "itemCode",
        key: "itemCode",
        render: (value) => <Text strong>{value}</Text>
      },
      {
        title: "Warehouse",
        dataIndex: "warehouse",
        key: "warehouse"
      },
      {
        title: "Qty Change",
        dataIndex: "actualQty",
        key: "actualQty",
        width: 150,
        align: "right",
        sorter: true,
        render: (value) => (
          <Tag bordered={false} color={value >= 0 ? "success" : "error"}>
            {value >= 0 ? "+" : ""}
            {quantityFormatter.format(value)}
          </Tag>
        )
      },
      {
        title: "Voucher Type",
        dataIndex: "voucherType",
        key: "voucherType",
        width: 180
      }
    ],
    []
  );

  const stats = useMemo(
    () => [
      { label: "Rows", value: `${stockLedger.rows.length}` },
      { label: "Positive Movement", value: `${stockLedger.rows.filter((row) => row.actualQty >= 0).length}` },
      { label: "Negative Movement", value: `${stockLedger.rows.filter((row) => row.actualQty < 0).length}` }
    ],
    [stockLedger.rows]
  );

  const handleTableChange = (pagination: TablePaginationConfig, _filters: unknown, sorter: unknown) => {
    const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = nextSorter && "field" in nextSorter ? String(nextSorter.field) : appliedFilters.sortBy;
    const order =
      nextSorter && "order" in nextSorter && nextSorter.order
        ? nextSorter.order === "ascend"
          ? "asc"
          : "desc"
        : appliedFilters.sortOrder;

    setAppliedFilters((prev) => ({
      ...prev,
      page: pagination.current ?? prev.page,
      pageSize: pagination.pageSize ?? prev.pageSize,
      sortBy: field === "postingDate" ? "posting_date" : field === "actualQty" ? "actual_qty" : field,
      sortOrder: order
    }));
  };

  return (
    <div className="page-stack">
      <StockReportPageHeader
        title="Stock Ledger"
        subtitle="Chronological stock movement report with signed quantity changes and voucher context."
        onRefresh={() => void dispatch(fetchStockLedger(appliedFilters))}
      />

      <div className="stock-report-toolbar">
        <Button icon={<FilterOutlined />} onClick={() => setFiltersOpen(true)}>
          Filters {getFilterCount(appliedFilters) ? `(${getFilterCount(appliedFilters)})` : ""}
        </Button>
      </div>

      <ActiveFilterChips
        filters={appliedFilters}
        onRemove={(key) =>
          setAppliedFilters((prev) => ({
            ...prev,
            page: 1,
            ...(key === "fromDate" || key === "toDate" ? { fromDate: undefined, toDate: undefined } : { [key]: undefined })
          }))
        }
        onClear={() => {
          setAppliedFilters(defaultFilters);
          setDraftFilters(defaultFilters);
        }}
      />

      <ReportStatStrip items={stats} />

      {lookupsError ? <Alert type="error" showIcon message={lookupsError} /> : null}
      {error.stockLedger ? <Alert type="error" showIcon message={error.stockLedger} /> : null}

      <StockReportTable
        rowKey="key"
        columns={columns}
        dataSource={stockLedger.rows}
        loading={loading.stockLedger}
        emptyDescription="No stock ledger entries match the current filters."
        pagination={stockLedger.pagination}
        onChange={handleTableChange}
      />

      <StockReportFilterModal
        open={filtersOpen}
        draftFilters={draftFilters}
        lookups={lookups}
        showVoucherType
        onDraftChange={(filters) => setDraftFilters((prev) => ({ ...prev, ...filters }))}
        onApply={() => {
          setAppliedFilters({ ...draftFilters, page: 1 });
          setFiltersOpen(false);
        }}
        onReset={() => setDraftFilters(defaultFilters)}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
