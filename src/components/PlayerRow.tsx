import type { ReactNode } from "react";

type PlayerRowProps = {
  name: string;
  /** Small muted detail beside the name — a buy-in count badge, or
   * "bought in ₹200". */
  meta?: ReactNode;
  /** Right-aligned amount in the header line (usually a MoneyAmount). */
  amount?: ReactNode;
  /** Right-most action(s) — a rebuy button, an undo icon, etc. */
  action?: ReactNode;
  /** Extra content below the header line (Cash Out's chip-count grid). */
  children?: ReactNode;
};

/** One player, one row — used by both Live Game (name + buy-ins + rebuy)
 * and Cash Out (name + bought-in note + chip-count grid below). */
export function PlayerRow({ name, meta, amount, action, children }: PlayerRowProps) {
  return (
    <div className="player-row">
      <div className="player-row-top">
        <div className="player-row-identity">
          <span className="player-name">{name}</span>
          {meta && <span className="player-meta">{meta}</span>}
        </div>
        {amount && <div className="player-row-amount">{amount}</div>}
        {action && <div className="player-row-action">{action}</div>}
      </div>
      {children && <div className="player-row-body">{children}</div>}
    </div>
  );
}
