export function formatTime(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "--:--";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatRelativeTime(dateLike) {
  if (!dateLike) return "Never";

  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "Unknown";

  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) return "Just now";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return `${m}m ago`;
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return `${h}h ago`;
  }

  const days = Math.floor(diffMs / day);
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString();
}
