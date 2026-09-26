import type { ReactNode } from "react";

type StatusBannerProps = {
  tone: "neutral" | "good" | "warning";
  children: ReactNode;
  action?: ReactNode;
};

/** The one shared "here's where things stand" surface — the Cash Out
 * reconciliation banner and the Chip Plan / Settle Up failure states are
 * all the same pattern: a tone, a message, an optional way forward. */
export function StatusBanner({ tone, children, action }: StatusBannerProps) {
  return (
    <div className={`status-banner status-banner-${tone}`}>
      {children}
      {action}
    </div>
  );
}
