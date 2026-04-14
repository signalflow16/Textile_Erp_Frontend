"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Space, Tag, Typography } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import { ActiveFilterChips } from "@/components/stock/reports/active-filter-chips";
import { currencyFormatter, quantityFormatter } from "@/components/stock/reports/helpers";
import { ReportStatStrip } from "@/components/stock/reports/report-stat-strip";
import { StockReportFilterModal } from "@/components/stock/reports/stock-report-filter-modal";
import { StockReportPageHeader } from "@/components/stock/reports/stock-report-page-header";
import { StockReportTable } from "@/components/stock/reports/stock-report-table";
import { fetchStockBalance, fetchStockReportLookups, selectStockReportsState } from "@/store/slices/stockReportSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectStockState } from "@/store/slices/stockSlice";
import type { StockBalanceRow, StockReportFilters } from "@/types/stock-report";

const { Text } = Typography;

const defaultFilters: StockReportFilters = {
  page: 1,
  pageSize: 20,
  sortBy: "item_code",
  sortOrder: "asc"
};

const getFilterCount = (filters: StockReportFilters) =>
  [filters.itemCode, filters.warehouse, filters.fromDate, filters.toDate].filter(Boolean).length;

export function StockBalancePage() {
  const dispatch = useAppDispatch();
  const { stockBalance, lookups, lookupsStatus, lookupsError, loading, error } = useAppSelector(selectStockReportsState);
  const stockState = useAppSelector(selectStockState);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<StockReportFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<StockReportFilters>(defaultFilters);

  useEffect(() => {
    if (lookupsStatus === "idle") {
      void dispatch(fetchStockReportLookups());
    }
  }, [dispatch, lookupsStatus]);

  useEffect(() => {
    void dispatch(fetchStockBalance(appliedFilters));
  }, [appliedFilters, dispatch, stockState.stockDataVersion]);

  const columns = useMemo<ColumnsType<StockBalanceRow>>(
    () => [
      {
        title: "Item",
        dataIndex: "itemCode",
        key: "itemCode",
        sorter: true,
        render: (value) => <Text strong>{value}</Text>
      },
      {
        title: "Warehouse",
        dataIndex: "warehouse",
        key: "warehouse",
        sorter: true
      },
      {
        title: "Actual Qty",
        dataIndex: "actualQty",
        key: "actualQty",
        width: 130,
        align: "right",
        sorter: true,
        render: (value) => quantityFormatter.format(value)
      },
      {
        title: "Reserved Qty",
        dataIndex: "reservedQty",
        key: "reservedQty",
        width: 130,
        align: "right",
        render: (value) => quantityFormatter.format(value)
      },
      {
        title: "Available Qty",
        dataIndex: "availableQty",
        key: "availableQty",
        width: 180,
        align: "right",
        sorter: true,
        render: (value, record) => (
          <Space direction="vertical" size={4}>
            <Text>{quantityFormatter.format(value)}</Text>
            <Tag
              bordered={false}
              color={record.actualQty < 0 ? "error" : record.reservedQty > record.actualQty * 0.6 ? "warning" : "success"}
            >
              {record.actualQty < 0 ? "Negative Stock" : record.reservedQty > record.actualQty * 0.6 ? "Reserved Heavy" : "In Stock"}
            </Tag>
          </Space>
        )
      },
      {
        title: "Stock Value",
        dataIndex: "stockValue",
        key: "stockValue",
        width: 160,
        align: "right",
        sorter: true,
        render: (value) => currencyFormatter.format(value)
      }
    ],
    []
  );

  const stats = useMemo(
    () => [
      { label: "Rows", value: `${stockBalance.rows.length}` },
      { label: "Total Quantity", value: quantityFormatter.format(stockBalance.rows.reduce((sum, row) => sum + row.actualQty, 0)) },
      { label: "Visible Stock Value", value: currencyFormatter.format(stockBalance.rows.reduce((sum, row) => sum + row.stockValue, 0)) }
    ],
    [stockBalance.rows]
  );

  const handleRefresh = () => {
    void dispatch(fetchStockBalance(appliedFilters));
  };

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
      sortBy: field === "itemCode" ? "item_code" : field === "stockValue" ? "stock_value" : field === "actualQty" ? "actual_qty" : field,
      sortOrder: order
    }));
  };

  return (
    <div className="page-stack">
      <StockReportPageHeader
        title="Stock Balance"
        subtitle="Current stock snapshot by item and warehouse with available quantity visibility."
        onRefresh={handleRefresh}
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
      {error.stockBalance ? <Alert type="error" showIcon message={error.stockBalance} /> : null}

      <StockReportTable
        rowKey="key"
        columns={columns}
        dataSource={stockBalance.rows}
        loading={loading.stockBalance}
        emptyDescription="No stock balance rows match the current filters."
        pagination={stockBalance.pagination}
        onChange={handleTableChange}
      />

      <StockReportFilterModal
        open={filtersOpen}
        draftFilters={draftFilters}
        lookups={lookups}
        enableDateRange={false}
        dateHelperText="Stock balance uses the live Bin snapshot. Historical date filtering is not available on this report."
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
