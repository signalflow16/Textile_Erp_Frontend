"use client";

import { useEffect, useState } from "react";
import { Card, Space, Spin, Typography } from "antd";

import { PosBillingPage } from "@/modules/pos/components/PosBillingPage";
import { PosClosingEntryModal } from "@/modules/pos/components/PosClosingEntryModal";
import { PosOpeningEntryModal } from "@/modules/pos/components/PosOpeningEntryModal";
import { useActivePosSession } from "@/modules/pos/hooks/useActivePosSession";
import { getActivePosSession } from "@/modules/pos/utils/posSessionService";

const { Text } = Typography;

export function PosModulePage({
  initialModal
}: {
  initialModal?: "opening" | "closing";
}) {
  const active = useActivePosSession();
  const [openingModalOpen, setOpeningModalOpen] = useState(initialModal === "opening");
  const [closingModalOpen, setClosingModalOpen] = useState(initialModal === "closing");

  useEffect(() => {
    if (active.isLoading) {
      return;
    }

    if (!active.session) {
      setClosingModalOpen(false);
      setOpeningModalOpen(true);
      return;
    }

    setOpeningModalOpen(false);
    if (initialModal === "closing") {
      setClosingModalOpen(true);
    }
  }, [active.isLoading, active.session, initialModal]);

  const handleRefreshSession = () => {
    void getActivePosSession(async () => {
      const result = await active.refetch();
      return result.data ?? null;
    });
  };

  if (active.isLoading) {
    return (
      <Card>
        <Space align="center">
          <Spin size="small" />
          <Text>Checking POS session...</Text>
        </Space>
      </Card>
    );
  }

  return (
    <>
      <PosBillingPage
        session={active.session}
        onRefreshSession={handleRefreshSession}
        onOpenSession={() => setOpeningModalOpen(true)}
        onCloseSession={() => setClosingModalOpen(true)}
      />

      <PosOpeningEntryModal
        open={openingModalOpen}
        onCancel={() => setOpeningModalOpen(false)}
        onSuccess={() => {
          setOpeningModalOpen(false);
          handleRefreshSession();
        }}
      />

      <PosClosingEntryModal
        open={closingModalOpen}
        session={active.session}
        onCancel={() => setClosingModalOpen(false)}
        onSuccess={() => {
          setClosingModalOpen(false);
          handleRefreshSession();
        }}
      />
    </>
  );
}
