"use client";

import { Button, DatePicker, Divider, InputNumber, Modal, Select, Space, Typography } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import type { StockReportLookups } from "@/modules/stock/types/stock-report";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type FilterDraft = {
  fromDate?: string;
  toDate?: string;
  itemCode?: string;
  warehouse?: string;
  voucherType?: string;
  threshold?: number;
};

const presetDateRange = (type: "today" | "last7" | "thisMonth" | "lastMonth") => {
  const now = dayjs();

  if (type === "today") {
    return {
      fromDate: now.format("YYYY-MM-DD"),
      toDate: now.format("YYYY-MM-DD")
    };
  }

  if (type === "last7") {
    return {
      fromDate: now.subtract(6, "day").format("YYYY-MM-DD"),
      toDate: now.format("YYYY-MM-DD")
    };
  }

  if (type === "thisMonth") {
    return {
      fromDate: now.startOf("month").format("YYYY-MM-DD"),
      toDate: now.endOf("month").format("YYYY-MM-DD")
    };
  }

  return {
    fromDate: now.subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
    toDate: now.subtract(1, "month").endOf("month").format("YYYY-MM-DD")
  };
};

export function StockReportFilterModal({
  open,
  draftFilters,
  lookups,
  onDraftChange,
  onApply,
  onReset,
  onClose,
  enableDateRange = true,
  showVoucherType = false,
  showThreshold = false,
  dateHelperText
}: {
  open: boolean;
  draftFilters: FilterDraft;
  lookups: StockReportLookups;
  onDraftChange: (filters: FilterDraft) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  enableDateRange?: boolean;
  showVoucherType?: boolean;
  showThreshold?: boolean;
  dateHelperText?: string;
}) {
  const rangeValue: [Dayjs | null, Dayjs | null] | null =
    draftFilters.fromDate || draftFilters.toDate
      ? [
          draftFilters.fromDate ? dayjs(draftFilters.fromDate) : null,
          draftFilters.toDate ? dayjs(draftFilters.toDate) : null
        ]
      : null;

  const handleChange = (next: Partial<FilterDraft>) => onDraftChange({ ...draftFilters, ...next });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={780}
      className="item-filter-modal stock-report-filter-modal"
      title={
        <Space size={8}>
          <FilterOutlined />
          <span>Report Filters</span>
        </Space>
      }
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={onReset}>
          Reset
        </Button>,
        <Button key="apply" type="primary" onClick={onApply}>
          Apply Filters
        </Button>
      ]}
    >
      <div className="stock-report-filter-preset-row">
        <Button size="small" onClick={() => handleChange(presetDateRange("today"))} disabled={!enableDateRange}>
          Today
        </Button>
        <Button size="small" onClick={() => handleChange(presetDateRange("last7"))} disabled={!enableDateRange}>
          Last 7 Days
        </Button>
        <Button size="small" onClick={() => handleChange(presetDateRange("thisMonth"))} disabled={!enableDateRange}>
          This Month
        </Button>
        <Button size="small" onClick={() => handleChange(presetDateRange("lastMonth"))} disabled={!enableDateRange}>
          Last Month
        </Button>
        <Button
          size="small"
          type="text"
          onClick={() => handleChange({ fromDate: undefined, toDate: undefined })}
          disabled={!enableDateRange}
        >
          Clear
        </Button>
      </div>

      <div className="item-filter-modal-grid stock-report-filter-grid">
        <div>
          <RangePicker
            value={rangeValue}
            disabled={!enableDateRange}
            style={{ width: "100%" }}
            onChange={(value) =>
              handleChange({
                fromDate: value?.[0]?.format("YYYY-MM-DD"),
                toDate: value?.[1]?.format("YYYY-MM-DD")
              })
            }
          />
          {dateHelperText ? <Text className="stock-report-filter-help">{dateHelperText}</Text> : null}
        </div>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Item"
          value={draftFilters.itemCode}
          options={lookups.items}
          onChange={(value) => handleChange({ itemCode: value })}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Warehouse"
          value={draftFilters.warehouse}
          options={lookups.warehouses}
          onChange={(value) => handleChange({ warehouse: value })}
        />
        {showVoucherType ? (
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Voucher Type"
            value={draftFilters.voucherType}
            options={lookups.voucherTypes}
            onChange={(value) => handleChange({ voucherType: value })}
          />
        ) : null}
        {showThreshold ? (
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder="Shortage threshold"
            value={draftFilters.threshold}
            onChange={(value) => handleChange({ threshold: typeof value === "number" ? value : undefined })}
          />
        ) : null}
      </div>

      <Divider style={{ margin: "16px 0 0" }} />
    </Modal>
  );
}
