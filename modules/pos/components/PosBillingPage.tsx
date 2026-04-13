"use client";

import { useCallback } from "react";
import { App, Button, Card, Input, Select, Space, Typography } from "antd";

import { extractApiErrorMessage } from "@/lib/api-errors";
import { BillPreviewPanel } from "@/modules/pos/components/BillPreviewPanel";
import { BillingSummary } from "@/modules/pos/components/BillingSummary";
import { CartTable } from "@/modules/pos/components/CartTable";
import { CustomerSelector } from "@/modules/pos/components/CustomerSelector";
import { PaymentSection } from "@/modules/pos/components/PaymentSection";
import { PosHeader } from "@/modules/pos/components/PosHeader";
import { PosPrintButton } from "@/modules/pos/components/PosPrintButton";
import { usePosBilling } from "@/modules/pos/hooks/usePosBilling";
import { usePosCustomerSearch } from "@/modules/pos/hooks/usePosCustomerSearch";

export function PosBillingPage() {
  const { Text } = Typography;
  const { message, modal } = App.useApp();
  const customers = usePosCustomerSearch();
  const billing = usePosBilling();

  const handleSaveDraft = useCallback(async () => {
    try {
      const draft = await billing.saveDraft();
      message.success(`Draft saved${draft.name ? `: ${draft.name}` : "."}`);
    } catch (error) {
      message.error(extractApiErrorMessage(error, "Unable to save draft."));
    }
  }, [billing, message]);

  const handleSaveSubmit = useCallback(async () => {
    try {
      const invoice = await billing.saveAndSubmit();
      message.success(`Bill submitted${invoice.name ? `: ${invoice.name}` : "."}`);
    } catch (error) {
      message.error(extractApiErrorMessage(error, "Unable to save and submit bill."));
    }
  }, [billing, message]);

  const handleClearCart = useCallback(() => {
    modal.confirm({
      title: "Clear current bill?",
      content: "All unsaved cart rows will be removed.",
      okText: "Clear Cart",
      okButtonProps: { danger: true },
      onOk: billing.clearCart
    });
  }, [billing.clearCart, modal]);

  const isActionBusy = billing.isSaving || billing.isSubmitting;

  return (
    <div className="page-stack">
      <Card>
        <PosHeader
          isSaving={billing.isSaving}
          isSubmitting={billing.isSubmitting}
          onSaveDraft={() => {
            void handleSaveDraft();
          }}
          onSaveSubmit={() => {
            void handleSaveSubmit();
          }}
        />
      </Card>

      <CustomerSelector
        customer={billing.form.customer}
        customerOptions={customers.customers}
        loading={customers.isLoading || customers.isFetching}
        onCustomerChange={(value) => billing.updateForm({ customer: value })}
      />

      <Card
        className="pos-square-fields"
        title="Cart"
        extra={
          <Space>
            <div>
              <Text type="secondary">Posting Date</Text>
              <Input
                type="date"
                value={billing.form.posting_date}
                onChange={(event) => billing.updateForm({ posting_date: event.target.value })}
              />
            </div>
            <div style={{ minWidth: 260 }}>
              <Text type="secondary">Warehouse</Text>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={billing.form.set_warehouse}
                placeholder="Optional default warehouse"
                options={billing.warehouseOptions}
                loading={billing.isWarehousesLoading}
                onChange={(value) => {
                  void billing.setWarehouse(value);
                }}
              />
            </div>
            <Button danger disabled={billing.totals.totalItems <= 0 || isActionBusy} onClick={handleClearCart}>
              Clear Cart
            </Button>
            <PosPrintButton
              disabled={!billing.draftDocName && !billing.lastSubmittedInvoiceName}
              onClick={() => {
                const opened = billing.printBill();
                if (!opened) {
                  message.warning("Save draft or submit bill before opening print preview.");
                }
              }}
            />
          </Space>
        }
      >
        <CartTable
          rows={billing.cartItems}
          onChangeRow={billing.updateCartItem}
          onRemoveRow={billing.removeCartItem}
          onApplyItem={async (rowId, itemCode) => {
            await billing.applyItemCodeToRow(rowId, itemCode);
          }}
          onApplyBarcode={(rowId, barcode) => billing.applyBarcodeToRow(rowId, barcode)}
        />
      </Card>

      <div className="pos-preview-layout">
        <div className="pos-summary-grid">
          <BillingSummary totals={billing.totals} />
          <PaymentSection
            modeOfPayment={billing.form.mode_of_payment}
            paymentModes={billing.paymentModes}
            paidAmount={billing.paidAmount}
            balanceAmount={billing.balanceAmount}
            remarks={billing.form.remarks}
            onChangeMode={(value) => billing.updateForm({ mode_of_payment: value })}
            onChangePaidAmount={(value) => billing.updateForm({ paid_amount: value })}
            onChangeRemarks={(value) => billing.updateForm({ remarks: value })}
          />
        </div>
        <BillPreviewPanel
          customer={billing.form.customer}
          rows={billing.billableRows}
          totals={billing.totals}
          invoiceName={billing.lastSubmittedInvoiceName}
        />
      </div>
    </div>
  );
}
