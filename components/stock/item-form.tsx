"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import type { ItemDocument } from "@/types/item";
import { useCreateItemMutation, useGetItemLookupsQuery, useUpdateItemMutation } from "@/store/api/frappeApi";
import {
  getErrorMessage,
  normalizeItemPayload,
  type ItemFormValues
} from "@/components/stock/item-master-helpers";

const { Text } = Typography;

type ItemFormProps = {
  mode: "create" | "edit";
  itemCode?: string;
  initialValues?: Partial<ItemDocument>;
};

const initialFormValues: Partial<ItemFormValues> = {
  disabled: false,
  is_stock_item: true,
  has_variants: false,
  barcodes: []
};

export function ItemForm({ mode, itemCode, initialValues }: ItemFormProps) {
  const [form] = Form.useForm<ItemFormValues>();
  const router = useRouter();
  const { message } = App.useApp();
  const { data: lookups, isLoading: lookupsLoading } = useGetItemLookupsQuery();
  const [createItem, createState] = useCreateItemMutation();
  const [updateItem, updateState] = useUpdateItemMutation();

  useEffect(() => {
    form.setFieldsValue({
      item_code: initialValues?.item_code ?? itemCode ?? "",
      item_name: initialValues?.item_name ?? "",
      item_group: initialValues?.item_group,
      stock_uom: initialValues?.stock_uom,
      disabled: Boolean(initialValues?.disabled),
      is_stock_item: initialValues?.is_stock_item !== 0,
      has_variants: Boolean(initialValues?.has_variants),
      variant_of: initialValues?.variant_of ?? "",
      standard_rate: initialValues?.standard_rate,
      description: initialValues?.description ?? "",
      brand: initialValues?.brand,
      style_code: initialValues?.style_code,
      collection: initialValues?.collection,
      season: initialValues?.season,
      fabric_type: initialValues?.fabric_type,
      display_category: initialValues?.display_category,
      shelf_rack_code: initialValues?.shelf_rack_code,
      primary_store: initialValues?.primary_store,
      barcodes:
        initialValues?.barcodes?.map((barcode) => ({
          barcode: barcode.barcode,
          uom: barcode.uom
        })) ?? []
    });
  }, [form, initialValues, itemCode]);

  const onFinish = async (values: ItemFormValues) => {
    try {
      if (values.has_variants && values.variant_of?.trim()) {
        message.error("Template item cannot be marked as Variant Of another item.");
        return;
      }

      const payload = normalizeItemPayload(values);

      if (mode === "create") {
        const created = await createItem(payload).unwrap();
        message.success("Item created successfully.");
        router.push(`/stock/items/${encodeURIComponent(created.name || created.item_code)}`);
        return;
      }

      if (!itemCode) {
        return;
      }

      await updateItem({ itemCode, values: payload }).unwrap();
      message.success("Item updated successfully.");
      router.push("/stock/items");
      router.refresh();
    } catch (error) {
      const fallback = mode === "create" ? "Unable to create item." : "Unable to update item.";
      message.error(getErrorMessage(error, fallback));
    }
  };

  const saving = createState.isLoading || updateState.isLoading;

  return (
    <Card variant="borderless" className="item-form-card">
      <Form<ItemFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialFormValues}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Item Code"
              name="item_code"
              rules={[{ required: true, message: "Item Code is required" }]}
            >
              <Input size="large" disabled={mode === "edit"} />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item label="Item Name" name="item_name">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="Brand" name="brand">
              <Select
                allowClear
                size="large"
                loading={lookupsLoading}
                options={lookups?.brands ?? []}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Item Group"
              name="item_group"
              rules={[{ required: true, message: "Item Group is required" }]}
            >
              <Select
                size="large"
                loading={lookupsLoading}
                options={lookups?.item_groups ?? []}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Default Unit of Measure"
              name="stock_uom"
              rules={[{ required: true, message: "Default Unit of Measure is required" }]}
            >
              <Select
                size="large"
                loading={lookupsLoading}
                options={lookups?.uoms ?? []}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Standard Selling Rate" name="standard_rate">
              <InputNumber
                size="large"
                min={0}
                precision={2}
                style={{ width: "100%" }}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          Textile Attributes
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Style Code" name="style_code">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Collection" name="collection">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Season" name="season">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Fabric Type" name="fabric_type">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Display Category" name="display_category">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Primary Store" name="primary_store">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Shelf / Rack Code" name="shelf_rack_code">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item label="Variant Of" name="variant_of">
              <Input size="large" placeholder="Set only when this item is a variant" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          Barcodes
        </Divider>
        <Form.List name="barcodes">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {fields.map((field) => (
                <Row gutter={12} key={field.key}>
                  <Col xs={24} md={14}>
                    <Form.Item
                      {...field}
                      label={field.name === 0 ? "Barcode" : ""}
                      name={[field.name, "barcode"]}
                      rules={[{ required: true, message: "Barcode is required." }]}
                    >
                      <Input placeholder="Scan or enter barcode" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={18} md={8}>
                    <Form.Item {...field} label={field.name === 0 ? "UOM" : ""} name={[field.name, "uom"]}>
                      <Select
                        allowClear
                        size="large"
                        options={lookups?.uoms ?? []}
                        showSearch
                        optionFilterProp="label"
                        placeholder="Unit"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={6} md={2}>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      style={{ marginTop: field.name === 0 ? 34 : 6 }}
                      onClick={() => remove(field.name)}
                    />
                  </Col>
                </Row>
              ))}
              <Button icon={<PlusOutlined />} onClick={() => add({ barcode: "", uom: undefined })}>
                Add Barcode
              </Button>
            </Space>
          )}
        </Form.List>

        <Divider orientation="left" plain>
          Flags
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="disabled" valuePropName="checked">
              <Checkbox>Disabled</Checkbox>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="is_stock_item" valuePropName="checked">
              <Checkbox>Maintain Stock</Checkbox>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="has_variants" valuePropName="checked">
              <Checkbox>Has Variants (Template)</Checkbox>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" size="large" loading={saving}>
            {mode === "create" ? "Create Item" : "Save Changes"}
          </Button>
          <Button size="large" href="/stock/items">
            Cancel
          </Button>
          <Text type="secondary">
            {mode === "create" ? "Creates an ERPNext Item master." : "Updates the existing ERPNext Item master."}
          </Text>
        </Space>
      </Form>
    </Card>
  );
}
