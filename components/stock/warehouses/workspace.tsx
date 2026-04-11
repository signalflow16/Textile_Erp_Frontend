"use client";

import { Alert } from "antd";

import { WarehouseTreePanel } from "@/components/stock/warehouses/tree-panel";
import { useWarehouseWorkspace } from "@/components/stock/warehouses/use-warehouse-workspace";

export function WarehouseWorkspace({
  selectedWarehouse
}: {
  selectedWarehouse?: string;
}) {
  const workspace = useWarehouseWorkspace(selectedWarehouse);

  return (
    <div className="page-stack item-group-page-shell">
      {workspace.error ? <Alert type="error" showIcon message={workspace.error} /> : null}

      <WarehouseTreePanel
        nodes={workspace.tree}
        loading={workspace.loading}
        selectedWarehouse={workspace.selectedWarehouse}
        search={workspace.search}
        expandedKeys={workspace.expandedKeys}
        onSearchChange={workspace.setSearch}
        onSelect={workspace.setSelectedWarehouse}
        onExpandedKeysChange={workspace.setExpandedKeys}
        onClear={workspace.clearTreeState}
        onCollapseAll={workspace.collapseAll}
        onExpandAll={workspace.expandAll}
        onCreate={() => workspace.goToCreate()}
        onEdit={workspace.goToEdit}
        onAddChild={workspace.goToCreate}
        onDelete={workspace.deleteWarehouse}
      />
    </div>
  );
}
