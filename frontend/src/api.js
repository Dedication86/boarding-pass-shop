const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

export async function api(path, options = {}) {
  const res = await fetch(API + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong at the gate.");
  return data;
}

export const money = n => `$${Number(n).toFixed(2)}`;

export const LANES = {
  "transit-minimal": { code: "TM", name: "Transit Minimal" },
  "destination-loud": { code: "DL", name: "Destination Loud" },
  "tarmac-utility": { code: "TU", name: "Tarmac Utility" }
};

/** Departures-board vocabulary used for product + drop statuses. */
export const STATUS = {
  boarding: { label: "Boarding", tone: "ok" },
  limited: { label: "Limited", tone: "warn" },
  standby: { label: "Standby", tone: "muted" },
  scheduled: { label: "Scheduled", tone: "info" },
  departed: { label: "Departed", tone: "muted" }
};
