"use client";

import { Button, Card, Checkbox, Descriptions, Form, Input, Select, Space, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import type { LookupOption } from "@/modules/stock/types/item";
import type { ItemGroupDocument } from "@/modules/stock/types/item-group";
import type { ItemGroupFormValues } from "@/modules/stock/components/item-group-helpers";

const { Text } = Typography;

export function ItemGroupDocumentPage({
  mode,
  form,
  itemGroup,
  parentOptions,
  loading,
  onSubmit,
  onCancel,
  onAddChild
}: {
  mode: "create" | "edit";
  form: ReturnType<typeof Form.useForm<ItemGroupFormValues>>[0];
  itemGroup?: ItemGroupDocument;
  parentOptions: LookupOption[];
  loading: boolean;
  onSubmit: (values: ItemGroupFormValues) => Promise<void>;
  onCancel: () => void;
  onAddChild: (itemGroup: string) => void;
}) {
  return (
    <div className="item-group-document-shell">
      <div className="item-group-document-main">
        <Card className="item-group-document-card">
          <div className="item-group-document-header">
            <div>
              <Text className="item-group-content-title">
                {mode === "create" ? "Create Item Group" : itemGroup?.item_group_name || "Edit Item Group"}
              </Text>
              <Text className="item-group-content-subtitle">
                {mode === "create"
                  ? "Create a new stock hierarchy node using the standard Frappe Item Group resource."
                  : "Review and update the selected item group from a document-style page."}
              </Text>
            </div>
            <Space wrap>
              {mode === "edit" && itemGroup ? (
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => onAddChild(itemGroup.name)}
                  disabled={!itemGroup.is_group}
                >
                  Add Child
                </Button>
              ) : null}
              <Button type="primary" loading={loading} onClick={() => form.submit()}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
              <Button onClick={onCancel}>Cancel</Button>
            </Space>
          </div>

          <Form<ItemGroupFormValues> form={form} layout="vertical" requiredMark={false} onFinish={onSubmit}>
            <div className="item-group-document-section">
              <Text className="item-group-document-section-title">General Settings</Text>
              <div className="item-group-document-form-grid">
                <Form.Item
                  label="Item Group Name"
                  name="item_group_name"
                  rules={[{ required: true, message: "Item group name is required." }]}
                >
                  <Input placeholder="Enter item group name" />
                </Form.Item>

                <Form.Item label="Parent Item Group" name="parent_item_group">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={parentOptions}
                    placeholder="Select parent item group"
                  />
                </Form.Item>
              </div>

              <Form.Item name="is_group" valuePropName="checked">
                <Checkbox>Is Group</Checkbox>
              </Form.Item>

              <Text type="secondary" className="item-group-document-help">
                Only group nodes can contain child item groups. Leaf nodes are transaction-facing endpoints.
              </Text>
            </div>
          </Form>
        </Card>
      </div>

      <aside className="item-group-document-aside">
        <Card className="item-group-document-side-card">
          <div className="item-group-document-avatar">
            {(itemGroup?.item_group_name || "C").slice(0, 1).toUpperCase()}
          </div>
          <Text className="item-group-document-side-title">
            {itemGroup?.item_group_name || "New Item Group"}
          </Text>
          <Space size={8} wrap>
            <Tag bordered={false} color={itemGroup?.is_group ? "gold" : "blue"}>
              {itemGroup?.is_group ? "Group" : "Leaf"}
            </Tag>
            {itemGroup ? <Tag bordered={false}>{itemGroup.children_count} child groups</Tag> : null}
          </Space>
        </Card>

        <Card className="item-group-document-side-card">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Document Name">{itemGroup?.name || "-"}</Descriptions.Item>
            <Descriptions.Item label="Parent">{itemGroup?.parent_item_group || "All Item Groups"}</Descriptions.Item>
            <Descriptions.Item label="Created">{itemGroup?.creation || "-"}</Descriptions.Item>
            <Descriptions.Item label="Modified">{itemGroup?.modified || "-"}</Descriptions.Item>
          </Descriptions>
        </Card>
      </aside>
    </div>
  );
}
