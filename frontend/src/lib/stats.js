// The last 7 days (oldest first) with XP earned each day, from the API's `weekActivity` rows.
export function lastSevenDays(activity) {
  const byDay = new Map(activity.map((a) => [a.day, a]));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('en-CA');
    return { key, label: d.toLocaleDateString(undefined, { weekday: 'short' }), xp: byDay.get(key)?.xp ?? 0, today: i === 6 };
  });
}
