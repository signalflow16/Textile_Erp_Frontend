"use client";

import { Alert } from "antd";

import { TreePanel } from "./tree-panel";
import { useItemGroupWorkspace } from "./use-item-group-workspace";

export function ItemGroupWorkspace({
  selectedGroup
}: {
  selectedGroup?: string;
}) {
  const workspace = useItemGroupWorkspace(selectedGroup);

  return (
    <div className="page-stack item-group-page-shell">
      {workspace.error ? (
        <Alert type="error" showIcon message={workspace.error} />
      ) : null}

      <TreePanel
        nodes={workspace.tree}
        loading={workspace.loading}
        selectedGroup={workspace.selectedGroup}
        search={workspace.search}
        expandedKeys={workspace.expandedKeys}
        renamingGroup={workspace.renamingGroup}
        renameValue={workspace.renameValue}
        renameLoading={workspace.mutationLoading}
        onSearchChange={workspace.setSearch}
        onSelect={workspace.setSelectedGroup}
        onExpandedKeysChange={workspace.setExpandedKeys}
        onClear={workspace.clearTreeState}
        onCollapseAll={workspace.collapseAll}
        onExpandAll={workspace.expandAll}
        onCreate={() => workspace.goToCreate()}
        onEdit={workspace.goToEdit}
        onAddChild={workspace.goToCreate}
        onDelete={workspace.handleDelete}
        onRenameStart={workspace.startRename}
        onRenameCancel={workspace.cancelRename}
        onRenameChange={workspace.setRenameValue}
        onRenameSubmit={workspace.submitRename}
      />
    </div>
  );
}
