import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getProposalsByUser } from "@/lib/services/proposal.service";
import { ProposalTable } from "@/components/proposal/ProposalTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils/cn";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/translations";

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function ProposalsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getServerT();
  const { status = "all" } = await searchParams;
  const allProposals = await getProposalsByUser(session.user.id);

  const STATUS_TABS: { labelKey: TranslationKey; value: string }[] = [
    { labelKey: "proposals.tab.all",      value: "all" },
    { labelKey: "proposals.tab.draft",    value: "DRAFT" },
    { labelKey: "proposals.tab.sent",     value: "SENT" },
    { labelKey: "proposals.tab.accepted", value: "ACCEPTED" },
    { labelKey: "proposals.tab.rejected", value: "REJECTED" },
  ];

  const filtered =
    status === "all"
      ? allProposals
      : allProposals.filter((p) => p.status === status);

  const counts = Object.fromEntries(
    STATUS_TABS.map(({ value }) => [
      value,
      value === "all" ? allProposals.length : allProposals.filter((p) => p.status === value).length,
    ])
  );

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <header className="flex items-center justify-between h-16 px-6 border-b border-surface-200 bg-white shrink-0">
        <div>
          <h1 className="text-base font-semibold text-surface-900">{t("proposals.title")}</h1>
          <p className="text-xs text-surface-500">{allProposals.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" asChild>
            <Link href="/proposals/new">
              <Plus className="w-4 h-4" />
              {t("proposalBuilder.newProposal")}
            </Link>
          </Button>
          <UserMenu name={session?.user?.name} email={session?.user?.email} />
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-1 rounded-lg bg-surface-100 p-1 w-fit">
          {STATUS_TABS.map(({ labelKey, value }) => {
            const active = status === value;
            return (
              <Link
                key={value}
                href={value === "all" ? "/proposals" : `/proposals?status=${value}`}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-600 hover:text-surface-900"
                )}
              >
                {t(labelKey)}
                {counts[value] > 0 && (
                  <span className={cn("ml-1.5 text-xs", active ? "text-surface-500" : "text-surface-400")}>
                    {counts[value]}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-0 pb-2">
            <ProposalTable proposals={filtered} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
