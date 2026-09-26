import { useMemo } from "react";
import { Screen } from "../components/Screen";
import { MoneyAmount } from "../components/MoneyAmount";
import { NumberField } from "../components/NumberField";
import { formatMoney } from "../lib/format";
import type { Game } from "../types";

type CashOutProps = {
  game: Game;
  onBack: () => void;
  onSetCashOut: (playerId: string, amount: number | undefined) => void;
  onSettle: () => void;
};

/** Cash Out: each player does their own denomination math (5×20, 10×1,
 * 25×2, 50×5, 100×0 — whatever they're holding) and types the one number
 * it adds up to, in chips. The app just converts that to rupees via the
 * chip-to-rupee rate — no per-denomination entry or reconciliation here. */
export function CashOut({ game, onBack, onSetCashOut, onSettle }: CashOutProps) {
  const chipsPerRupee = game.chipPlan?.ok ? game.chipPlan.chipsPerRupee : 1;

  const totalPot = game.players.reduce((a, p) => a + p.totalIn, 0);
  const totalCounted = game.players.reduce((a, p) => a + (p.cashOut ?? 0), 0);
  const countedPlayers = game.players.filter((p) => p.cashOut !== undefined).length;
  const anyMissing = countedPlayers < game.players.length;
  const diff = totalPot - totalCounted;
  const isBalanced = !anyMissing && Math.abs(diff) < 0.5;

  const setChips = (playerId: string, inChips: number | undefined) => {
    onSetCashOut(playerId, inChips === undefined ? undefined : inChips / chipsPerRupee);
  };

  const status = useMemo(() => {
    if (anyMissing)
      return { tone: "neutral" as const, text: `${countedPlayers} of ${game.players.length} players counted` };
    if (isBalanced) return { tone: "good" as const, text: `✓ ${formatMoney(totalPot)} accounted for` };
    if (diff > 0)
      return { tone: "warning" as const, text: `${formatMoney(diff)} unaccounted for`, sub: "Check the chip counts." };
    return {
      tone: "warning" as const,
      text: `${formatMoney(-diff)} too much counted`,
      sub: "Check the chip counts.",
    };
  }, [anyMissing, isBalanced, diff, totalPot, countedPlayers, game.players.length]);

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
      <div className={`cashout-status cashout-status-${status.tone}`}>
        <span className="cashout-status-text">{status.text}</span>
        {status.sub && <span className="cashout-status-sub">{status.sub}</span>}
      </div>

      <div className="cashout-list">
        {game.players.map((player, i) => {
          const entered = player.cashOut !== undefined;

          return (
            <div className="cashout-row" key={player.id}>
              <div className="cashout-row-identity">
                <span className="player-name">{player.name}</span>
                <span className="player-meta">bought in {formatMoney(player.totalIn)}</span>
              </div>

              <div className="cashout-row-count">
                <NumberField
                  value={entered ? Math.round((player.cashOut ?? 0) * chipsPerRupee) : undefined}
                  onChange={(v) => setChips(player.id, v)}
                  placeholder="0"
                  size="hero"
                  suffix="in chips"
                  label={`${player.name}'s total chips`}
                />
              </div>

              <span className={entered ? "cashout-row-value" : "cashout-row-value cashout-row-value-quiet"}>
                <MoneyAmount value={player.cashOut ?? 0} variant="md" />
              </span>

              {i < game.players.length - 1 && <div className="cashout-divider" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
