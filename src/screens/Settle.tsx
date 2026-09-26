import { useMemo, useState } from "react";
import { Screen } from "../components/Screen";
import { MoneyAmount } from "../components/MoneyAmount";
import { StatusBanner } from "../components/StatusBanner";
import { formatMoney, buildShareText, playerName } from "../lib/format";
import { computeNets, simplifyDebts } from "../lib/settle";
import type { Game } from "../types";

type SettleProps = {
  game: Game;
  onBack: () => void;
  onFinish: () => void;
};

export function Settle({ game, onBack, onFinish }: SettleProps) {
  const [paid, setPaid] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const nets = computeNets(
      game.players.map((p) => ({ playerId: p.id, totalIn: p.totalIn, cashOut: p.cashOut ?? 0 })),
    );
    return simplifyDebts(nets);
  }, [game.players]);

  if (!result.ok) {
    return (
      <Screen title="Settle Up" onBack={onBack}>
        <StatusBanner
          tone="warning"
          action={
            <button className="btn btn-secondary" onClick={onBack}>
              Back to cash out
            </button>
          }
        >
          <p className="status-banner-title">Numbers don't add up</p>
          <p>
            Cash-outs are off by {formatMoney(Math.abs(result.totalMismatch))}. Go back and recheck the
            cash-out amounts.
          </p>
        </StatusBanner>
      </Screen>
    );
  }

  const togglePaid = (i: number) => {
    setPaid((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const shareText = buildShareText(game, result.payments);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — no-op, user can still use native Share
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // user cancelled — no-op
      }
    } else {
      copySummary();
    }
  };

  const allPaid = result.payments.length > 0 && paid.size === result.payments.length;

  return (
    <Screen
      title="Settle Up"
      onBack={onBack}
      footer={
        <button className="btn btn-primary btn-large" onClick={onFinish}>
          Finish game
        </button>
      }
    >
      <div className="hero-block">
        <p className="text-section">{allPaid ? "Settle up — all done ✓" : "Settle up"}</p>
        {result.payments.length === 0 ? (
          <p className="text-body">Everyone's square — no payments needed. 🎉</p>
        ) : (
          <div className="payment-list">
            {result.payments.map((payment, i) => (
              <label className={paid.has(i) ? "payment-row payment-row-paid" : "payment-row"} key={i}>
                <input
                  type="checkbox"
                  className="payment-checkbox"
                  checked={paid.has(i)}
                  onChange={() => togglePaid(i)}
                />
                <span className="payment-parties">
                  {playerName(game.players, payment.fromPlayerId)}
                  <span className="arrow">→</span>
                  {playerName(game.players, payment.toPlayerId)}
                </span>
                <MoneyAmount value={payment.amount} variant="md" />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <p className="text-section">Net result</p>
        {game.players
          .map((p) => ({ p, net: result.nets[p.id] }))
          .sort((a, b) => b.net - a.net)
          .map(({ p, net }) => (
            <div className="net-row" key={p.id}>
              <span>{p.name}</span>
              <MoneyAmount value={net} variant="sm" signed />
            </div>
          ))}
      </div>

      <div className="share-actions">
        <button className="btn btn-secondary" onClick={copySummary}>
          {copied ? "Copied ✓" : "Copy summary"}
        </button>
        <button className="btn btn-secondary" onClick={share}>
          Share
        </button>
      </div>
    </Screen>
  );
}
