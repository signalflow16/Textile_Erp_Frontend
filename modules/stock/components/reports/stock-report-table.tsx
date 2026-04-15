"use client";

import { Empty, Skeleton, Table } from "antd";
import type { TablePaginationConfig, TableProps } from "antd";

export function StockReportTable<RecordType extends object>({
  dataSource,
  columns,
  loading,
  rowKey,
  pagination,
  onChange,
  emptyDescription
}: {
  dataSource: RecordType[];
  columns: TableProps<RecordType>["columns"];
  loading?: boolean;
  rowKey: string | ((record: RecordType) => string);
  pagination?: false | TablePaginationConfig;
  onChange?: TableProps<RecordType>["onChange"];
  emptyDescription: string;
}) {
  return (
    <div className="stock-report-table-card">
      {loading && !dataSource.length ? <Skeleton active paragraph={{ rows: 8 }} className="stock-report-skeleton" /> : null}
      <Table<RecordType>
        sticky
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading && dataSource.length > 0}
        pagination={pagination}
        onChange={onChange}
        scroll={{ x: 980 }}
        className="stock-report-table"
        locale={{
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
        }}
      />
    </div>
  );
}
