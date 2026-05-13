import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProposalById } from "@/lib/services/proposal.service";
import { ProposalStatusBadge } from "@/components/proposal/ProposalStatusBadge";
import { ProposalActions } from "@/components/proposal/ProposalActions";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProposalDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const proposal = await getProposalById(id, session.user.id);
  if (!proposal) notFound();

  const t = await getServerT();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center justify-between h-16 px-6 border-b border-surface-200 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/proposals">
              <ArrowLeft className="w-4 h-4" />
              {t("actions.back")}
            </Link>
          </Button>
          <div className="h-4 w-px bg-surface-200" />
          <h1 className="text-base font-semibold text-surface-900 truncate">{proposal.eventTitle}</h1>
          <ProposalStatusBadge status={proposal.status} />
          <span className="text-sm text-surface-500 hidden md:block truncate max-w-[200px]">{proposal.leadName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {proposal.status === "DRAFT" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/proposals/${proposal.id}/edit`}>
                <Pencil className="w-4 h-4" />
                {t("actions.edit")}
              </Link>
            </Button>
          )}
          <ProposalActions
            proposalId={proposal.id}
            eventTitle={proposal.eventTitle}
            status={proposal.status}
            leadEmail={proposal.leadEmail ?? ""}
            leadPhone={proposal.leadPhone ?? ""}
          />
        </div>
      </header>

      {/* Proposal summary */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1">Lead</p>
              <p className="text-sm font-medium text-surface-900">{proposal.leadName}</p>
              {proposal.leadEmail && <p className="text-sm text-surface-500">{proposal.leadEmail}</p>}
              {proposal.leadPhone && <p className="text-sm text-surface-500">{proposal.leadPhone}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1">Event</p>
              <p className="text-sm font-medium text-surface-900">{proposal.eventTitle}</p>
            </div>
          </div>

          {/* Packages */}
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">Packages ({proposal.items.length})</p>
            <div className="space-y-3">
              {proposal.items.map((item) => {
                let features: string[] = [];
                try { features = JSON.parse(item.features) as string[]; } catch { features = []; }
                return (
                  <div key={item.id} className="border border-surface-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-surface-900">{item.packageName}</p>
                        {item.tagline && <p className="text-xs text-surface-500 mt-0.5">{item.tagline}</p>}
                        <ul className="mt-2 space-y-1">
                          {features.slice(0, 3).map((f, i) => (
                            <li key={i} className="text-xs text-surface-600 flex gap-1">
                              <span className="text-brand-400">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-brand-600">RM {(item.price / 100).toFixed(2)}</p>
                        {item.originalPrice && (
                          <p className="text-xs text-surface-400 line-through">RM {(item.originalPrice / 100).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add-ons */}
          {proposal.addOns.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">Add-Ons ({proposal.addOns.length})</p>
              <div className="flex flex-wrap gap-2">
                {proposal.addOns.map((ao) => (
                  <div key={ao.id} className="border border-surface-200 rounded-lg px-3 py-2 bg-white text-sm">
                    <span className="font-medium text-surface-900">{ao.addOnName}</span>
                    {ao.priceLabel && <span className="text-surface-500 ml-1">· {ao.priceLabel}</span>}
                    {ao.quantity > 1 && <span className="text-surface-400 ml-1">×{ao.quantity}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
