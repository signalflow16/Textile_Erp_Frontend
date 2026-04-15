"use client";

import { useMemo, useEffect, type Key } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tabs,
  Typography
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import type { ItemDocument } from "@/modules/stock/types/item";
import {
  useCreateItemMutation,
  useGetItemLookupsQuery,
  useGetItemPriceSummaryQuery,
  useGetItemVariantAttributeLookupsQuery,
  useUpdateItemMutation
} from "@/core/api/frappeApi";
import { getErrorMessage, normalizeItemPayload, type ItemFormValues } from "./item-master-helpers";

const { Text, Title } = Typography;

type ItemFormProps = {
  mode: "create" | "edit";
  itemCode?: string;
  initialValues?: Partial<ItemDocument>;
};

const initialFormValues: Partial<ItemFormValues> = {
  disabled: false,
  is_stock_item: true,
  has_variants: false,
  allow_alternative_item: false,
  is_fixed_asset: false,
  allow_negative_stock: false,
  allow_purchase: true,
  customer_provided_item: false,
  grant_commission: false,
  allow_sales: true,
  inspection_required_before_purchase: false,
  inspection_required_before_delivery: false,
  barcodes: [],
  item_defaults: [],
  taxes: []
};

const getFormListItemProps = <T extends { key: Key }>(field: T): Omit<T, "key"> => {
  const { key: _key, ...itemProps } = field;
  return itemProps;
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
      image: initialValues?.image ?? "",
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
      allow_alternative_item: Boolean(initialValues?.allow_alternative_item),
      is_fixed_asset: Boolean(initialValues?.is_fixed_asset),
      valuation_rate: initialValues?.valuation_rate,
      over_delivery_receipt_allowance: initialValues?.over_delivery_receipt_allowance,
      over_billing_allowance: initialValues?.over_billing_allowance,
      shelf_life_in_days: initialValues?.shelf_life_in_days,
      end_of_life: initialValues?.end_of_life,
      warranty_period: initialValues?.warranty_period,
      weight_per_unit: initialValues?.weight_per_unit,
      weight_uom: initialValues?.weight_uom,
      default_material_request_type: initialValues?.default_material_request_type,
      valuation_method: initialValues?.valuation_method,
      allow_negative_stock: Boolean(initialValues?.allow_negative_stock),
      allow_purchase: initialValues?.allow_purchase !== 0,
      min_order_qty: initialValues?.min_order_qty,
      safety_stock: initialValues?.safety_stock,
      lead_time_days: initialValues?.lead_time_days,
      last_purchase_rate: initialValues?.last_purchase_rate,
      customer_provided_item: Boolean(initialValues?.customer_provided_item),
      grant_commission: Boolean(initialValues?.grant_commission),
      allow_sales: initialValues?.allow_sales !== 0,
      max_discount: initialValues?.max_discount,
      inspection_required_before_purchase: Boolean(initialValues?.inspection_required_before_purchase),
      inspection_required_before_delivery: Boolean(initialValues?.inspection_required_before_delivery),
      quality_inspection_template: initialValues?.quality_inspection_template,
      barcodes:
        initialValues?.barcodes?.map((barcode) => ({
          barcode: barcode.barcode,
          uom: barcode.uom
        })) ?? [],
      item_defaults:
        initialValues?.item_defaults?.map((entry) => ({
          company: entry.company,
          default_warehouse: entry.default_warehouse,
          default_price_list: entry.default_price_list
        })) ?? [],
      taxes:
        initialValues?.taxes?.map((entry) => ({
          item_tax_template: entry.item_tax_template,
          tax_category: entry.tax_category,
          valid_from: entry.valid_from,
          minimum_net_rate: entry.minimum_net_rate,
          maximum_net_rate: entry.maximum_net_rate
        })) ?? [],
      attributes:
        initialValues?.attributes?.map((entry) => ({
          attribute: entry.attribute,
          attribute_value: entry.attribute_value
        })) ?? []
    });
  }, [form, initialValues, itemCode]);

  const saving = createState.isLoading || updateState.isLoading;
  const variantMode = Form.useWatch("has_variants", form);
  const variantParent = Form.useWatch("variant_of", form);
  const imageValue = Form.useWatch("image", form);
  const templateItemCode =
    mode === "edit"
      ? initialValues?.has_variants
        ? itemCode
        : undefined
      : variantMode
        ? form.getFieldValue("item_code")
        : undefined;
  const { data: variantLookups } = useGetItemVariantAttributeLookupsQuery(templateItemCode, {
    skip: !templateItemCode
  });
  const { data: priceSummary } = useGetItemPriceSummaryQuery(itemCode ?? "", {
    skip: mode !== "edit" || !itemCode
  });

  const onFinish = async (values: ItemFormValues) => {
    try {
      const barcodeValues = values.barcodes?.map((row) => row.barcode?.trim()).filter(Boolean) ?? [];
      if (new Set(barcodeValues).size !== barcodeValues.length) {
        message.error("Duplicate barcode values are not allowed.");
        return;
      }

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
      router.refresh();
    } catch (error) {
      const fallback = mode === "create" ? "Unable to create item." : "Unable to update item.";
      message.error(getErrorMessage(error, fallback));
    }
  };

  const moduleTabs = useMemo(
    () => [
      {
        key: "details",
        label: "Details",
        children: (
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
              <Form.Item label="Valuation Rate" name="valuation_rate">
                <InputNumber size="large" min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Style Code" name="style_code">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Collection" name="collection">
                <Select
                  allowClear
                  size="large"
                  loading={lookupsLoading}
                  options={lookups?.collections ?? []}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Season" name="season">
                <Select
                  allowClear
                  size="large"
                  loading={lookupsLoading}
                  options={lookups?.seasons ?? []}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Fabric Type" name="fabric_type">
                <Select
                  allowClear
                  size="large"
                  loading={lookupsLoading}
                  options={lookups?.fabric_types ?? []}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Display Category" name="display_category">
                <Select
                  allowClear
                  size="large"
                  loading={lookupsLoading}
                  options={lookups?.display_categories ?? []}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Primary Store" name="primary_store">
                <Select
                  allowClear
                  size="large"
                  loading={lookupsLoading}
                  options={lookups?.warehouses ?? []}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Shelf / Rack Code" name="shelf_rack_code">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item label="Variant Of" name="variant_of">
                <Select
                  allowClear
                  size="large"
                  disabled={Boolean(variantMode)}
                  loading={lookupsLoading}
                  options={lookups?.variant_parent_candidates ?? []}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Image"
                name="image"
                rules={[
                  {
                    validator: async (_rule, value?: string) => {
                      if (!value?.trim()) {
                        return;
                      }

                      if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(value.trim())) {
                        throw new Error("Use a supported image path or URL.");
                      }
                    }
                  }
                ]}
              >
                <Input size="large" placeholder="Image URL or ERPNext file path" />
              </Form.Item>
            </Col>
            {imageValue ? (
              <Col xs={24}>
                <Card size="small" title="Image Preview" extra={<Button type="link" onClick={() => form.setFieldValue("image", "")}>Remove</Button>}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Item preview"
                    src={imageValue}
                    style={{ maxWidth: 220, maxHeight: 220, objectFit: "contain" }}
                  />
                </Card>
              </Col>
            ) : null}
            <Col xs={24} md={8}>
              <Form.Item name="disabled" valuePropName="checked">
                <Checkbox>Disabled</Checkbox>
              </Form.Item>
              <Form.Item name="allow_alternative_item" valuePropName="checked">
                <Checkbox>Allow Alternative Item</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="is_stock_item" valuePropName="checked">
                <Checkbox>Maintain Stock</Checkbox>
              </Form.Item>
              <Form.Item name="has_variants" valuePropName="checked">
                <Checkbox>Has Variants</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="is_fixed_asset" valuePropName="checked">
                <Checkbox>Is Fixed Asset</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            {variantMode ? (
              <Col xs={24}>
                <Title level={5}>Variant Attributes</Title>
                <Form.List name="attributes">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {fields.map((field) => {
                        const itemProps = getFormListItemProps(field);
                        const attributeName = form.getFieldValue(["attributes", field.name, "attribute"]);
                        const valueOptions =
                          variantLookups?.item_attributes?.find((attribute) => attribute.value === attributeName)?.values ??
                          lookups?.item_attributes?.find((attribute) => attribute.value === attributeName)?.values ??
                          [];

                        return (
                          <Row gutter={12} key={field.key}>
                            <Col xs={24} md={10}>
                              <Form.Item
                                {...itemProps}
                                label={field.name === 0 ? "Attribute" : ""}
                                name={[field.name, "attribute"]}
                                rules={[{ required: true, message: "Attribute is required." }]}
                              >
                                <Select options={lookups?.item_attributes ?? []} showSearch optionFilterProp="label" />
                              </Form.Item>
                            </Col>
                            <Col xs={20} md={12}>
                              <Form.Item
                                {...itemProps}
                                label={field.name === 0 ? "Value" : ""}
                                name={[field.name, "attribute_value"]}
                                rules={[{ required: true, message: "Attribute value is required." }]}
                              >
                                <Select options={valueOptions} showSearch optionFilterProp="label" />
                              </Form.Item>
                            </Col>
                            <Col xs={4} md={2}>
                              <Button
                                danger
                                type="text"
                                icon={<DeleteOutlined />}
                                style={{ marginTop: field.name === 0 ? 28 : 2 }}
                                onClick={() => remove(field.name)}
                              />
                            </Col>
                          </Row>
                        );
                      })}
                      <Button icon={<PlusOutlined />} onClick={() => add({ attribute: "", attribute_value: "" })}>
                        Add Attribute
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Col>
            ) : null}
            {!variantMode && variantParent ? (
              <Col xs={24}>
                <Alert
                  type="info"
                  showIcon
                  message="Variant item"
                  description="This item is linked to a template. Variant attributes are managed from the template context."
                />
              </Col>
            ) : null}
          </Row>
        )
      },
      {
        key: "inventory",
        label: "Inventory",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Shelf Life In Days" name="shelf_life_in_days">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="End Of Life" name="end_of_life">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Warranty Period (days)" name="warranty_period">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Weight Per Unit" name="weight_per_unit">
                <InputNumber style={{ width: "100%" }} min={0} precision={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Weight UOM" name="weight_uom">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Default Material Request Type" name="default_material_request_type">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Valuation Method" name="valuation_method">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="allow_negative_stock" valuePropName="checked" style={{ marginTop: 34 }}>
                <Checkbox>Allow Negative Stock</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Title level={5}>Barcodes</Title>
              <Form.List name="barcodes">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {fields.map((field) => {
                      const itemProps = getFormListItemProps(field);

                      return (
                        <Row gutter={12} key={field.key}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              {...itemProps}
                              label={field.name === 0 ? "Barcode" : ""}
                              name={[field.name, "barcode"]}
                              rules={[{ required: true, message: "Barcode is required." }]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={20} md={10}>
                            <Form.Item {...itemProps} label={field.name === 0 ? "UOM" : ""} name={[field.name, "uom"]}>
                              <Select options={lookups?.uoms ?? []} showSearch optionFilterProp="label" />
                            </Form.Item>
                          </Col>
                          <Col xs={4} md={2}>
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              style={{ marginTop: field.name === 0 ? 28 : 2 }}
                              onClick={() => remove(field.name)}
                            />
                          </Col>
                        </Row>
                      );
                    })}
                    <Button icon={<PlusOutlined />} onClick={() => add({ barcode: "", uom: undefined })}>
                      Add Row
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Col>
          </Row>
        )
      },
      {
        key: "accounting",
        label: "Accounting",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Over Delivery/Receipt Allowance (%)" name="over_delivery_receipt_allowance">
                <InputNumber style={{ width: "100%" }} min={0} precision={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Over Billing Allowance (%)" name="over_billing_allowance">
                <InputNumber style={{ width: "100%" }} min={0} precision={3} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Title level={5}>Item Defaults</Title>
              <Form.List name="item_defaults">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {fields.map((field) => {
                      const itemProps = getFormListItemProps(field);

                      return (
                        <Row gutter={12} key={field.key}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              {...itemProps}
                              label={field.name === 0 ? "Company" : ""}
                              name={[field.name, "company"]}
                              rules={[{ required: true, message: "Company is required." }]}
                            >
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item {...itemProps} label={field.name === 0 ? "Default Warehouse" : ""} name={[field.name, "default_warehouse"]}>
                              <Select options={lookups?.warehouses ?? []} showSearch optionFilterProp="label" />
                            </Form.Item>
                          </Col>
                          <Col xs={20} md={7}>
                            <Form.Item {...itemProps} label={field.name === 0 ? "Default Price List" : ""} name={[field.name, "default_price_list"]}>
                              <Select options={lookups?.price_lists ?? []} showSearch optionFilterProp="label" />
                            </Form.Item>
                          </Col>
                          <Col xs={4} md={1}>
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              style={{ marginTop: field.name === 0 ? 28 : 2 }}
                              onClick={() => remove(field.name)}
                            />
                          </Col>
                        </Row>
                      );
                    })}
                    <Button icon={<PlusOutlined />} onClick={() => add({ company: "" })}>
                      Add Row
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Col>
          </Row>
        )
      },
      {
        key: "purchasing",
        label: "Purchasing",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Minimum Order Qty" name="min_order_qty">
                <InputNumber style={{ width: "100%" }} min={0} precision={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Safety Stock" name="safety_stock">
                <InputNumber style={{ width: "100%" }} min={0} precision={3} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Lead Time (days)" name="lead_time_days">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Last Purchase Rate" name="last_purchase_rate">
                <InputNumber style={{ width: "100%" }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="allow_purchase" valuePropName="checked" style={{ marginTop: 34 }}>
                <Checkbox>Allow Purchase</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="customer_provided_item" valuePropName="checked" style={{ marginTop: 34 }}>
                <Checkbox>Is Customer Provided Item</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        )
      },
      {
        key: "sales",
        label: "Sales",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Standard Selling Rate" name="standard_rate">
                <InputNumber style={{ width: "100%" }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Max Discount (%)" name="max_discount">
                <InputNumber style={{ width: "100%" }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="grant_commission" valuePropName="checked" style={{ marginTop: 34 }}>
                <Checkbox>Grant Commission</Checkbox>
              </Form.Item>
              <Form.Item name="allow_sales" valuePropName="checked">
                <Checkbox>Allow Sales</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        )
      },
      {
        key: "tax",
        label: "Tax",
        children: (
          <Form.List name="taxes">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {fields.map((field) => {
                  const itemProps = getFormListItemProps(field);

                  return (
                    <Row gutter={12} key={field.key}>
                      <Col xs={24} md={7}>
                        <Form.Item
                          {...itemProps}
                          label={field.name === 0 ? "Item Tax Template" : ""}
                          name={[field.name, "item_tax_template"]}
                          rules={[{ required: true, message: "Item Tax Template is required." }]}
                        >
                          <Select options={lookups?.tax_templates ?? []} showSearch optionFilterProp="label" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={5}>
                        <Form.Item {...itemProps} label={field.name === 0 ? "Tax Category" : ""} name={[field.name, "tax_category"]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={4}>
                        <Form.Item {...itemProps} label={field.name === 0 ? "Valid From" : ""} name={[field.name, "valid_from"]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={3}>
                        <Form.Item {...itemProps} label={field.name === 0 ? "Min Net" : ""} name={[field.name, "minimum_net_rate"]}>
                          <InputNumber style={{ width: "100%" }} min={0} precision={2} />
                        </Form.Item>
                      </Col>
                      <Col xs={20} md={4}>
                        <Form.Item {...itemProps} label={field.name === 0 ? "Max Net" : ""} name={[field.name, "maximum_net_rate"]}>
                          <InputNumber style={{ width: "100%" }} min={0} precision={2} />
                        </Form.Item>
                      </Col>
                      <Col xs={4} md={1}>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          style={{ marginTop: field.name === 0 ? 28 : 2 }}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  );
                })}
                <Button icon={<PlusOutlined />} onClick={() => add({ item_tax_template: "" })}>
                  Add Row
                </Button>
              </Space>
            )}
          </Form.List>
        )
      },
      {
        key: "quality",
        label: "Quality",
        children: (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Quality Inspection Template" name="quality_inspection_template">
                <Select
                  allowClear
                  options={lookups?.quality_templates ?? []}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="inspection_required_before_purchase" valuePropName="checked" style={{ marginTop: 34 }}>
                <Checkbox>Inspection Required Before Purchase</Checkbox>
              </Form.Item>
              <Form.Item name="inspection_required_before_delivery" valuePropName="checked">
                <Checkbox>Inspection Required Before Delivery</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        )
      }
    ],
    [form, imageValue, lookups, lookupsLoading, mode, variantLookups, variantMode, variantParent]
  );

  return (
    <Card variant="borderless" className="item-form-card erp-form-shell">
      <Form<ItemFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialFormValues}
      >
        <div className="erp-item-head">
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              {initialValues?.item_name || initialValues?.item_code || "New Item"}
            </Title>
            <Text type="secondary">{mode === "edit" ? "ERPNext Stock" : "Create ERPNext Stock Item"}</Text>
          </div>
          <Space>
            {mode === "edit" && itemCode ? (
              <Button size="middle" href={`/stock/items/${encodeURIComponent(itemCode)}/prices`}>
                Manage Prices
              </Button>
            ) : null}
            <Button size="middle" href="/stock/items">
              Back
            </Button>
            <Button type="primary" htmlType="submit" size="middle" loading={saving}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </Space>
        </div>

        {mode === "edit" && priceSummary ? (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space size={24} wrap>
              <Text>Retail: <Text strong>{priceSummary.retail ?? "-"}</Text></Text>
              <Text>Wholesale: <Text strong>{priceSummary.wholesale ?? "-"}</Text></Text>
              <Text type="secondary">Last Updated: {priceSummary.last_updated ?? "-"}</Text>
            </Space>
          </Card>
        ) : null}

        <Tabs className="erp-item-tabs" items={moduleTabs} />
      </Form>
    </Card>
  );
}
