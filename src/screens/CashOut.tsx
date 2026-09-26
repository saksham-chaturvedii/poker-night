import { useMemo, useState } from "react";
import { Screen } from "../components/Screen";
import { ChipPill } from "../components/ChipPill";
import { PlayerRow } from "../components/PlayerRow";
import { MoneyAmount } from "../components/MoneyAmount";
import { StatusBanner } from "../components/StatusBanner";
import { formatMoney } from "../lib/format";
import type { Game } from "../types";

type CashOutProps = {
  game: Game;
  onBack: () => void;
  onSetCashOut: (playerId: string, amount: number | undefined) => void;
  onSettle: () => void;
};

export function CashOut({ game, onBack, onSetCashOut, onSettle }: CashOutProps) {
  // chip counts entered per player per denomination
  const [chipCounts, setChipCounts] = useState<Record<string, Record<number, number>>>({});

  const rungs = game.chipPlan?.ok ? game.chipPlan.rungs : [];
  const chipsPerRupee = game.chipPlan?.ok ? game.chipPlan.chipsPerRupee : 1;
  const totalPot = game.players.reduce((a, p) => a + p.totalIn, 0);
  const totalCountedRaw = game.players.reduce((a, p) => a + (p.cashOut ?? 0), 0);
  const anyMissing = game.players.some((p) => p.cashOut === undefined);
  const diff = totalPot - totalCountedRaw;
  const isBalanced = !anyMissing && Math.abs(diff) < 0.5;

  const setChipCount = (playerId: string, value: number, count: number) => {
    setChipCounts((prev) => {
      const playerCounts = { ...(prev[playerId] ?? {}), [value]: count };
      const next = { ...prev, [playerId]: playerCounts };

      const inChips = rungs.reduce((sum, rung) => sum + (playerCounts[rung.value] ?? 0) * rung.value, 0);
      onSetCashOut(playerId, inChips / chipsPerRupee);

      return next;
    });
  };

  const setNoneLeft = (playerId: string) => {
    const zeroed = Object.fromEntries(rungs.map((r) => [r.value, 0]));
    setChipCounts((prev) => ({ ...prev, [playerId]: zeroed }));
    onSetCashOut(playerId, 0);
  };

  const chipTotalFor = (playerId: string): number =>
    rungs.reduce((sum, rung) => sum + (chipCounts[playerId]?.[rung.value] ?? 0) * rung.value, 0);

  const banner = useMemo(() => {
    if (anyMissing)
      return { tone: "neutral" as const, text: "Enter every player's remaining chips balance to continue." };
    if (isBalanced) return { tone: "good" as const, text: `All ${formatMoney(totalPot)} accounted for. ✓` };
    if (diff > 0)
      return { tone: "warning" as const, text: `${formatMoney(diff)} unaccounted for — recount the chips.` };
    return { tone: "warning" as const, text: `${formatMoney(-diff)} too much counted — recount the chips.` };
  }, [anyMissing, isBalanced, diff, totalPot]);

  return (
    <Screen
      title="Cash Out"
      onBack={onBack}
      footer={
        <button className="btn btn-primary btn-large" disabled={!isBalanced} onClick={onSettle}>
          Settle up →
        </button>
      }
    >
      <StatusBanner tone={banner.tone}>
        <span className="status-banner-message">{banner.text}</span>
      </StatusBanner>

      <div className="player-list">
        {game.players.map((player) => (
          <PlayerRow
            key={player.id}
            name={player.name}
            meta={`bought in ${formatMoney(player.totalIn)}`}
          >
            <div className="chip-count-grid">
              {rungs.map((rung) => (
                <div className="chip-count-cell" key={rung.value}>
                  <ChipPill value={rung.value} />
                  <input
                    className="chip-count-input"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={chipCounts[player.id]?.[rung.value] ?? ""}
                    onChange={(e) => setChipCount(player.id, rung.value, Number(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
            <div className="chip-count-footer">
              <button className="btn btn-secondary btn-compact" onClick={() => setNoneLeft(player.id)}>
                No chips left
              </button>
              <span className="text-small">
                {chipTotalFor(player.id)} in chips →{" "}
                <MoneyAmount value={player.cashOut ?? 0} variant="sm" />
              </span>
            </div>
          </PlayerRow>
        ))}
      </div>
    </Screen>
  );
}
