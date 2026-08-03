"use client";

import { useState } from "react";
import { Badge, statusLevel } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Caption, PanelTitle } from "@/components/ui/Panel";
import { freezeAsset, transferAsset, type CompanyAsset } from "@/lib/api";

function money(value: unknown) {
  return typeof value === "number"
    ? value.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : null;
}

/** A live company card in a departing employee's hands is the clearest
 *  "extra expenditure" in the product, so it gets its own line of detail. */
function describe(asset: CompanyAsset) {
  if (asset.asset_type !== "company_card") {
    return `${asset.provider} · ${asset.identifier}`;
  }

  const balance = money(asset.metadata.current_balance);
  const limit = money(asset.metadata.monthly_limit);

  return [
    `${asset.provider} · ${asset.identifier}`,
    balance && limit ? `${balance} of ${limit}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function AssetsPanel({
  assets,
  managerName,
  onChange,
}: {
  assets: CompanyAsset[];
  managerName: string | null;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function act(
    assetId: number,
    action: (token: string) => Promise<unknown>
  ) {
    const token = localStorage.getItem("gatekeep_token");
    if (!token) return;

    setBusy(assetId);

    try {
      await action(token);
      await onChange();
      setMessage("");
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Asset action failed"
      );
    } finally {
      setBusy(null);
    }
  }

  if (assets.length === 0) {
    return (
      <section>
        <PanelTitle>Company assets</PanelTitle>
        <Caption className="mt-2 text-ink-tertiary">
          No assets assigned.
        </Caption>
      </section>
    );
  }

  return (
    <section>
      <PanelTitle>Company assets</PanelTitle>

      <Caption className="mt-2 text-ink-tertiary">
        Freeze spending or hand equipment to the manager.
      </Caption>

      {message ? <Caption className="mt-2 text-ink">{message}</Caption> : null}

      <div className="mt-4 bg-surface">
        {assets.map((asset) => {
          const isCard = asset.asset_type === "company_card";
          const canFreeze = isCard && asset.status === "active";
          // Offboarding reassigns assets to the manager without flipping
          // status to "transferred", so check the assignee too — otherwise the
          // row reads "→ Alex Morgan" and still offers to transfer to him.
          const canTransfer =
            !isCard &&
            asset.status !== "transferred" &&
            managerName &&
            asset.assigned_to !== managerName;

          return (
            <div
              key={asset.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline px-inset py-4 last:border-b-0"
            >
              <div className="flex flex-col gap-1">
                <span className="font-ui text-ui text-ink">
                  {asset.asset_type.replace("_", " ")}
                </span>
                <span className="font-ui text-ui text-ink-tertiary">
                  {describe(asset)}
                </span>
              </div>

              <div className="flex items-center gap-6">
                {asset.assigned_to ? (
                  <span className="font-ui text-ui text-ink-tertiary">
                    → {asset.assigned_to}
                  </span>
                ) : null}

                <Badge level={statusLevel(asset.status)}>{asset.status}</Badge>

                {canFreeze ? (
                  <Button
                    variant="bare"
                    className="h-auto px-0"
                    disabled={busy === asset.id}
                    onClick={() =>
                      act(asset.id, (token) => freezeAsset(token, asset.id))
                    }
                  >
                    {busy === asset.id ? "Working" : "Freeze"}
                  </Button>
                ) : null}

                {canTransfer ? (
                  <Button
                    variant="bare"
                    className="h-auto px-0"
                    disabled={busy === asset.id}
                    onClick={() =>
                      act(asset.id, (token) =>
                        transferAsset(token, asset.id, managerName)
                      )
                    }
                  >
                    {busy === asset.id
                      ? "Working"
                      : `Transfer to ${managerName}`}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
