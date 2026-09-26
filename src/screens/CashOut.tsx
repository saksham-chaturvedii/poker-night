import { useMemo, useState } from "react";
import { Screen } from "../components/Screen";
import { ChipPill } from "../components/ChipPill";
import { PlayerRow } from "../components/PlayerRow";
import { MoneyAmount } from "../components/MoneyAmount";
import { StatusBanner } from "../components/StatusBanner";
import { NumberWheel } from "../components/NumberWheel";
import { NumberPickerSheet } from "../components/NumberPickerSheet";
import { formatMoney, playerName } from "../lib/format";
import type { Game } from "../types";

type CashOutProps = {
  game: Game;
  onBack: () => void;
  onSetCashOut: (playerId: string, amount: number | undefined) => void;
  onSettle: () => void;
};

type OpenPicker = { playerId: string; denomValue: number };

export function CashOut({ game, onBack, onSetCashOut, onSettle }: CashOutProps) {
  // chip counts entered per player per denomination
  const [chipCounts, setChipCounts] = useState<Record<string, Record<number, number>>>({});
  const [openPicker, setOpenPicker] = useState<OpenPicker | null>(null);

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

  // How many of a denomination could physically exist — bounds the wheel
  // sensibly instead of an arbitrary large number.
  const maxForDenom = (value: number): number => game.setup.inventory.find((d) => d.value === value)?.count ?? 200;

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
            <div className="chip-count-list">
              {rungs.map((rung) => (
                <button
                  type="button"
                  className="chip-count-row"
                  key={rung.value}
                  onClick={() => setOpenPicker({ playerId: player.id, denomValue: rung.value })}
                >
                  <ChipPill value={rung.value} size="sm" />
                  <span className="chip-count-row-count">{chipCounts[player.id]?.[rung.value] ?? 0}</span>
                  <span className="chip-count-row-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
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

      {openPicker && (
        <NumberPickerSheet
          title={`${openPicker.denomValue} chip — ${playerName(game.players, openPicker.playerId)}`}
          onClose={() => setOpenPicker(null)}
        >
          <NumberWheel
            value={chipCounts[openPicker.playerId]?.[openPicker.denomValue] ?? 0}
            min={0}
            max={maxForDenom(openPicker.denomValue)}
            step={1}
            itemHeight={52}
            label={`${openPicker.denomValue} chip count for ${playerName(game.players, openPicker.playerId)}`}
            onChange={(v) => setChipCount(openPicker.playerId, openPicker.denomValue, v)}
          />
        </NumberPickerSheet>
      )}
    </Screen>
  );
}
