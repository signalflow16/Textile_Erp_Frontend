"use client";

import { Button, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";

import type { ItemShortageFilters, StockLedgerFilters, StockReportFilters } from "@/modules/stock/types/stock-report";

const { Text } = Typography;

type ReportFilterSet = StockReportFilters | StockLedgerFilters | ItemShortageFilters;

type ActiveFilterChip = {
  key: string;
  label: string;
};

const formatDate = (value?: string) => (value ? dayjs(value).format("DD MMM YYYY") : "");

export function ActiveFilterChips({
  filters,
  onRemove,
  onClear
}: {
  filters: ReportFilterSet;
  onRemove: (key: keyof ReportFilterSet) => void;
  onClear: () => void;
}) {
  const chips: ActiveFilterChip[] = [];

  if (filters.fromDate || filters.toDate) {
    chips.push({
      key: "dateRange",
      label: `${formatDate(filters.fromDate) || "Start"} - ${formatDate(filters.toDate) || "End"}`
    });
  }

  if (filters.itemCode) {
    chips.push({
      key: "itemCode",
      label: `Item: ${filters.itemCode}`
    });
  }

  if (filters.warehouse) {
    chips.push({
      key: "warehouse",
      label: `Warehouse: ${filters.warehouse}`
    });
  }

  if ("voucherType" in filters && filters.voucherType) {
    chips.push({
      key: "voucherType",
      label: `Voucher: ${filters.voucherType}`
    });
  }

  if ("threshold" in filters && filters.threshold && filters.threshold !== 10) {
    chips.push({
      key: "threshold",
      label: `Threshold: ${filters.threshold}`
    });
  }

  if (!chips.length) {
    return (
      <div className="stock-report-active-filters">
        <Text type="secondary">No active filters. Showing the latest available report view.</Text>
      </div>
    );
  }

  return (
    <div className="stock-report-active-filters">
      <Space wrap size={[8, 8]}>
        {chips.map((chip) => (
          <Tag
            key={chip.key}
            closable
            bordered={false}
            className="stock-report-filter-chip"
            onClose={(event) => {
              event.preventDefault();
              if (chip.key === "dateRange") {
                onRemove("fromDate");
                onRemove("toDate");
                return;
              }

              onRemove(chip.key as keyof ReportFilterSet);
            }}
          >
            {chip.label}
          </Tag>
        ))}
      </Space>
      <Button type="link" onClick={onClear}>
        Clear all
      </Button>
    </div>
  );
}
