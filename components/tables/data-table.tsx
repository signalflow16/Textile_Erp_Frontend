"use client";

import { Empty, Table } from "antd";
import type { TablePaginationConfig, TableProps } from "antd";

export function DataTable<RecordType extends object>({
  dataSource,
  columns,
  loading,
  rowKey,
  pagination,
  onChange
}: {
  dataSource: RecordType[];
  columns: TableProps<RecordType>["columns"];
  loading?: boolean;
  rowKey: string | ((record: RecordType) => string);
  pagination?: false | TablePaginationConfig;
  onChange?: TableProps<RecordType>["onChange"];
}) {
  return (
    <Table<RecordType>
      rowKey={rowKey}
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={pagination}
      onChange={onChange}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available." />
      }}
    />
  );
}
