import type { DailySnapshot, HistoryPoint, VisitPoint } from './types';

/** Calendar day (YYYY-MM-DD) of an ISO date-or-datetime string. */
const day = (iso: string): string => iso.slice(0, 10);

/**
 * Reconstructs the full daily snapshots series for a tracked product.
 *
 * `products` is written insert-on-change, so it only has a row on days a
 * material field changed — a product checked for 5 days with 2 changes has just
 * 2 rows. `product_visits` however has one row per checked day. We drive the
 * output off the dense visits series and carry forward the latest snapshot on or
 * before each day, so all 5 days appear: the unchanged days reuse the prior
 * snapshot's price/ranking/etc. and only their `weekly_visits` differs.
 *
 * Both inputs are expected ascending by date (as the history endpoint returns
 * them). Visit days before the first snapshot are dropped (no values to show).
 * When there are no visit rows at all, falls back to the raw snapshots so the
 * table is never empty for a product that does have history.
 */
export function buildDailySnapshots(
  history: HistoryPoint[],
  visits: VisitPoint[],
): DailySnapshot[] {
  if (visits.length === 0) {
    return history.map((h) => ({
      date: h.snapshot_date,
      price: h.price,
      discount_pct: h.discount_pct,
      ranking_position: h.ranking_position,
      sold_count: h.sold_count,
      usd_price: h.usd_price,
      currency: h.currency,
      weekly_visits: h.weekly_visits,
    }));
  }

  const rows: DailySnapshot[] = [];
  let idx = 0;
  let last: HistoryPoint | null = null;
  for (const v of visits) {
    const d = day(v.date);
    // Advance to the most recent snapshot on or before this day (carry-forward).
    while (idx < history.length && day(history[idx].snapshot_date) <= d) {
      last = history[idx];
      idx += 1;
    }
    if (!last) continue;
    rows.push({
      date: v.date,
      price: last.price,
      discount_pct: last.discount_pct,
      ranking_position: last.ranking_position,
      sold_count: last.sold_count,
      usd_price: last.usd_price,
      currency: last.currency,
      weekly_visits: v.weekly_visits,
    });
  }
  return rows;
}
