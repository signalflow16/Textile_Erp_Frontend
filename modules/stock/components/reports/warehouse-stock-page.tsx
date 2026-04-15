"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Typography } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import { fetchStockReportLookups, fetchWarehouseStock, selectStockReportsState } from "@/modules/stock/store/stockReportSlice";
import { selectStockState } from "@/modules/stock/store/stockSlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import type { StockReportFilters, WarehouseStockRow } from "@/modules/stock/types/stock-report";
import { ActiveFilterChips } from "./active-filter-chips";
import { currencyFormatter, quantityFormatter } from "./helpers";
import { ReportStatStrip } from "./report-stat-strip";
import { StockReportFilterModal } from "./stock-report-filter-modal";
import { StockReportPageHeader } from "./stock-report-page-header";
import { StockReportTable } from "./stock-report-table";

const { Text } = Typography;

const defaultFilters: StockReportFilters = {
  page: 1,
  pageSize: 20,
  sortBy: "warehouse",
  sortOrder: "asc"
};

const getFilterCount = (filters: StockReportFilters) => [filters.itemCode, filters.warehouse].filter(Boolean).length;

export function WarehouseStockPage() {
  const dispatch = useAppDispatch();
  const { warehouseStock, lookups, lookupsStatus, lookupsError, loading, error } = useAppSelector(selectStockReportsState);
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
    void dispatch(fetchWarehouseStock(appliedFilters));
  }, [appliedFilters, dispatch, stockState.stockDataVersion]);

  const columns = useMemo<ColumnsType<WarehouseStockRow>>(
    () => [
      {
        title: "Warehouse",
        dataIndex: "warehouse",
        key: "warehouse",
        sorter: true,
        render: (value) => <Text strong>{value}</Text>
      },
      {
        title: "Total Items",
        dataIndex: "totalItems",
        key: "totalItems",
        width: 130,
        align: "right",
        sorter: true
      },
      {
        title: "Total Quantity",
        dataIndex: "totalQuantity",
        key: "totalQuantity",
        width: 160,
        align: "right",
        sorter: true,
        render: (value) => quantityFormatter.format(value)
      },
      {
        title: "Total Stock Value",
        dataIndex: "totalStockValue",
        key: "totalStockValue",
        width: 180,
        align: "right",
        sorter: true,
        render: (value) => currencyFormatter.format(value)
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
      sortBy: field,
      sortOrder: order
    }));
  };

  return (
    <div className="page-stack">
      <StockReportPageHeader
        title="Warehouse Stock"
        subtitle="Warehouse-level inventory concentration with item count, quantity, and stock value totals."
        onRefresh={() => void dispatch(fetchWarehouseStock(appliedFilters))}
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

      <ReportStatStrip
        items={[
          { label: "Warehouses", value: `${warehouseStock.meta?.warehouseCount ?? 0}` },
          { label: "Total Quantity", value: quantityFormatter.format(warehouseStock.meta?.totalQuantity ?? 0) },
          { label: "Total Stock Value", value: currencyFormatter.format(warehouseStock.meta?.totalStockValue ?? 0) }
        ]}
      />

      {lookupsError ? <Alert type="error" showIcon message={lookupsError} /> : null}
      {error.warehouseStock ? <Alert type="error" showIcon message={error.warehouseStock} /> : null}

      <StockReportTable
        rowKey="key"
        columns={columns}
        dataSource={warehouseStock.rows}
        loading={loading.warehouseStock}
        emptyDescription="No warehouse stock groups match the current filters."
        pagination={warehouseStock.pagination}
        onChange={handleTableChange}
      />

      <StockReportFilterModal
        open={filtersOpen}
        draftFilters={draftFilters}
        lookups={lookups}
        enableDateRange={false}
        dateHelperText="Warehouse stock is derived from the current Bin snapshot. Date filters are not available here."
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

