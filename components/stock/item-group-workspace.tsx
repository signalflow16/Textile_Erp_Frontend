"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Alert } from "antd";

import { ItemGroupDeleteModal } from "@/components/stock/item-group-delete-modal";
import { ItemGroupDetailPanel } from "@/components/stock/item-group-detail-panel";
import { ItemGroupFormDrawer } from "@/components/stock/item-group-form-drawer";
import { getErrorMessage } from "@/components/stock/item-group-helpers";
import { ItemGroupMoveModal } from "@/components/stock/item-group-move-modal";
import { ItemGroupToolbar } from "@/components/stock/item-group-toolbar";
import { ItemGroupTreePanel } from "@/components/stock/item-group-tree-panel";
import {
  frappeApi,
  useGetItemGroupQuery,
  useGetItemGroupTreeQuery,
  useToggleItemGroupDisabledMutation
} from "@/store/api/frappeApi";
import { setExpandedKeys, setSelectedItemGroup, setTreeSearch } from "@/store/features/itemGroups/itemGroupsUiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { ItemGroupDocument, ItemGroupTreeNode } from "@/types/item-group";

type FormMode = "create" | "edit";

const collectKeys = (nodes: ItemGroupTreeNode[]): string[] =>
  nodes.flatMap((node) => [node.name, ...collectKeys(node.children ?? [])]);

export function ItemGroupWorkspace() {
  const dispatch = useAppDispatch();
  const { message, modal } = App.useApp();
  const ui = useAppSelector((state) => state.itemGroupsUi);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formOpen, setFormOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createParentItemGroup, setCreateParentItemGroup] = useState<string | undefined>(undefined);

  const { data: treeData, isFetching: treeLoading, error: treeError } = useGetItemGroupTreeQuery({
    search: ui.treeSearch
  });
  const { data: selectedItemGroup, isFetching: detailLoading, error: detailError } = useGetItemGroupQuery(
    ui.selectedItemGroup ?? "",
    { skip: !ui.selectedItemGroup }
  );
  const [toggleItemGroupDisabled] = useToggleItemGroupDisabledMutation();

  const allTreeKeys = useMemo(() => collectKeys(treeData?.data ?? []), [treeData?.data]);

  useEffect(() => {
    if (!ui.expandedKeys.length && allTreeKeys.length) {
      dispatch(setExpandedKeys(allTreeKeys));
    }
  }, [allTreeKeys, dispatch, ui.expandedKeys.length]);

  const selectedCountLabel = ui.selectedItemGroup ? `Selected: ${ui.selectedItemGroup}` : "No group selected";
  const currentDoc = selectedItemGroup;

  const openCreate = () => {
    setFormMode("create");
    setCreateParentItemGroup(undefined);
    setFormOpen(true);
  };

  const openEdit = (itemGroupName?: string) => {
    if (itemGroupName) {
      dispatch(setSelectedItemGroup(itemGroupName));
    }
    setFormMode("edit");
    setFormOpen(true);
  };

  const openAddChild = (itemGroupName?: string) => {
    if (itemGroupName) {
      dispatch(setSelectedItemGroup(itemGroupName));
      setCreateParentItemGroup(itemGroupName);
    } else if (currentDoc?.name) {
      setCreateParentItemGroup(currentDoc.name);
    }

    setFormMode("create");
    setFormOpen(true);
  };

  const openMove = (itemGroupName?: string) => {
    if (itemGroupName) {
      dispatch(setSelectedItemGroup(itemGroupName));
    }
    setMoveOpen(true);
  };

  const openDelete = (itemGroupName?: string) => {
    if (itemGroupName) {
      dispatch(setSelectedItemGroup(itemGroupName));
    }
    setDeleteOpen(true);
  };

  const handleMutationSuccess = (itemGroup: ItemGroupDocument) => {
    dispatch(setSelectedItemGroup(itemGroup.name));
    setFormOpen(false);
    setMoveOpen(false);
    setCreateParentItemGroup(undefined);
  };

  const handleDeleteSuccess = () => {
    dispatch(setSelectedItemGroup(undefined));
    setDeleteOpen(false);
  };

  const handleToggleDisabled = async (itemGroupName?: string, disabled?: boolean) => {
    const targetName = itemGroupName ?? currentDoc?.name;
    const targetDisabled = disabled ?? !Boolean(currentDoc?.disabled);

    if (!targetName) {
      return;
    }

    const label = targetDisabled ? "disable" : "enable";

    modal.confirm({
      title: `${targetDisabled ? "Disable" : "Enable"} Item Group`,
      content: `This will ${label} ${targetName}. Continue?`,
      okText: targetDisabled ? "Disable" : "Enable",
      onOk: async () => {
        try {
          const updated = await toggleItemGroupDisabled({
            itemGroup: targetName,
            disabled: targetDisabled
          }).unwrap();
          dispatch(setSelectedItemGroup(updated.name));
          message.success(`Item group ${targetDisabled ? "disabled" : "enabled"} successfully.`);
        } catch (error) {
          message.error(getErrorMessage(error, `Unable to ${label} item group.`));
        }
      }
    });
  };

  const onRefresh = () => {
    dispatch(
      frappeApi.util.invalidateTags([
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        ...(ui.selectedItemGroup ? [{ type: "ItemGroupDetail" as const, id: ui.selectedItemGroup }] : [])
      ])
    );
  };

  return (
    <div className="page-stack">
      <ItemGroupToolbar
        totalGroups={allTreeKeys.length}
        selectedCountLabel={selectedCountLabel}
        onCreate={openCreate}
        onRefresh={onRefresh}
      />

      {treeError ? (
        <Alert
          type="error"
          showIcon
          message="Item Group workspace is unavailable"
          description="The Item Group tree could not be loaded from the backend."
        />
      ) : null}

      <ItemGroupTreePanel
        nodes={treeData?.data ?? []}
        isLoading={treeLoading}
        selectedItemGroup={ui.selectedItemGroup}
        search={ui.treeSearch}
        expandedKeys={ui.expandedKeys}
        onSearchChange={(value) => dispatch(setTreeSearch(value))}
        onSelect={(itemGroupName) => dispatch(setSelectedItemGroup(itemGroupName))}
        onExpandedKeysChange={(keys) => dispatch(setExpandedKeys(keys))}
        onExpandAll={() => dispatch(setExpandedKeys(allTreeKeys))}
        onCollapseAll={() => dispatch(setExpandedKeys([]))}
        onEdit={openEdit}
        onAddChild={openAddChild}
        onViewDetails={(itemGroupName) => dispatch(setSelectedItemGroup(itemGroupName))}
      />

      <div className="item-group-schema-note">
        Backend schema version: {currentDoc?.schema_version ?? treeData?.schema_version ?? "-"}
      </div>

      <ItemGroupFormDrawer
        open={formOpen}
        mode={formMode}
        itemGroup={formMode === "edit" ? currentDoc : undefined}
        initialParentItemGroup={formMode === "create" ? createParentItemGroup : undefined}
        onClose={() => setFormOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      <ItemGroupDetailPanel
        open={Boolean(ui.selectedItemGroup)}
        itemGroup={currentDoc}
        isLoading={detailLoading}
        error={Boolean(detailError)}
        onClose={() => dispatch(setSelectedItemGroup(undefined))}
        onEdit={() => openEdit()}
        onAddChild={() => openAddChild()}
        onMove={() => openMove()}
        onDelete={() => openDelete()}
        onToggleDisabled={() => handleToggleDisabled()}
      />

      <ItemGroupMoveModal
        open={moveOpen}
        itemGroup={currentDoc}
        onClose={() => setMoveOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      <ItemGroupDeleteModal
        open={deleteOpen}
        itemGroup={currentDoc}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
