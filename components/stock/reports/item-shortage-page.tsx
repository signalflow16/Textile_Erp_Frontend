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
import { fetchItemShortage, fetchStockReportLookups, selectStockReportsState } from "@/store/slices/stockReportSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectStockState } from "@/store/slices/stockSlice";
import type { ItemShortageFilters, ItemShortageRow } from "@/types/stock-report";

const { Text } = Typography;

const defaultFilters: ItemShortageFilters = {
  page: 1,
  pageSize: 20,
  sortBy: "actual_qty",
  sortOrder: "asc",
  threshold: 10
};

const getFilterCount = (filters: ItemShortageFilters) =>
  [filters.itemCode, filters.warehouse, filters.threshold && filters.threshold !== 10 ? filters.threshold : undefined].filter(Boolean).length;

export function ItemShortagePage() {
  const dispatch = useAppDispatch();
  const { itemShortage, lookups, lookupsStatus, lookupsError, loading, error } = useAppSelector(selectStockReportsState);
  const stockState = useAppSelector(selectStockState);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ItemShortageFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<ItemShortageFilters>(defaultFilters);

  useEffect(() => {
    if (lookupsStatus === "idle") {
      void dispatch(fetchStockReportLookups());
    }
  }, [dispatch, lookupsStatus]);

  useEffect(() => {
    void dispatch(fetchItemShortage(appliedFilters));
  }, [appliedFilters, dispatch, stockState.stockDataVersion]);

  const columns = useMemo<ColumnsType<ItemShortageRow>>(
    () => [
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
        title: "Current Qty",
        dataIndex: "currentQty",
        key: "currentQty",
        width: 140,
        align: "right",
        sorter: true,
        render: (value, record) => (
          <Space direction="vertical" size={4}>
            <Text>{quantityFormatter.format(value)}</Text>
            <Tag bordered={false} color={record.currentQty <= 0 ? "error" : "warning"}>
              {record.currentQty <= 0 ? "Critical" : "Low"}
            </Tag>
          </Space>
        )
      },
      {
        title: "Minimum Level",
        dataIndex: "minimumLevel",
        key: "minimumLevel",
        width: 150,
        align: "right",
        render: (value) => quantityFormatter.format(value)
      },
      {
        title: "Shortage Qty",
        dataIndex: "shortageQty",
        key: "shortageQty",
        width: 150,
        align: "right",
        sorter: true,
        render: (value) => <Text strong>{quantityFormatter.format(value)}</Text>
      }
    ],
    []
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
      sortBy: field === "currentQty" ? "actual_qty" : field,
      sortOrder: order
    }));
  };

  return (
    <div className="page-stack">
      <StockReportPageHeader
        title="Item Shortage"
        subtitle="Low-stock and out-of-stock items using the live Bin snapshot with a configurable manual threshold."
        onRefresh={() => void dispatch(fetchItemShortage(appliedFilters))}
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
            ...(String(key) === "threshold"
              ? { threshold: 10 }
              : key === "fromDate" || key === "toDate"
                ? { fromDate: undefined, toDate: undefined }
                : { [key]: undefined })
          }))
        }
        onClear={() => {
          setAppliedFilters(defaultFilters);
          setDraftFilters(defaultFilters);
        }}
      />

      <ReportStatStrip
        items={[
          { label: "Rows", value: `${itemShortage.rows.length}` },
          { label: "Critical", value: `${itemShortage.rows.filter((row) => row.currentQty <= 0).length}` },
          { label: "Threshold Source", value: itemShortage.meta?.thresholdSource === "manual" ? "Manual threshold" : "Unknown" }
        ]}
      />

      {lookupsError ? <Alert type="error" showIcon message={lookupsError} /> : null}
      {error.itemShortage ? <Alert type="error" showIcon message={error.itemShortage} /> : null}

      <StockReportTable
        rowKey="key"
        columns={columns}
        dataSource={itemShortage.rows}
        loading={loading.itemShortage}
        emptyDescription="No shortage items match current filters."
        pagination={itemShortage.pagination}
        onChange={handleTableChange}
      />

      <StockReportFilterModal
        open={filtersOpen}
        draftFilters={draftFilters}
        lookups={lookups}
        showThreshold
        enableDateRange={false}
        dateHelperText="Item shortage is based on the current Bin snapshot. Date filters are not available on this report."
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
