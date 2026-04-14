import { AppShell } from "@/components/app-shell";
import { ItemGroupEditor } from "@/components/stock/item-groups/editor";

export default async function CreateItemGroupPage({
  searchParams
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell
      title="Create Item Group"
      breadcrumb="Stock > Item Groups > Create"
      subtitle="Create a new stock hierarchy node with a page-based workflow."
    >
      <ItemGroupEditor mode="create" parentItemGroup={params.parent ? decodeURIComponent(params.parent) : undefined} />
    </AppShell>
  );
}
