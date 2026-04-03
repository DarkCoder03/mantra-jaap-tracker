import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MoreHorizontal,
  Settings,
  ChevronDown,
  Star,
  Info,
  Save,
  Upload,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

const STORAGE_KEY = "mantraJaapCountersV10";
const SETTINGS_KEY = "mantraJaapSettingsV10";
const MALA_SIZE_DEFAULT = 108;
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ---------- utils ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const fromISODate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthEnd = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d, x) => new Date(d.getFullYear(), d.getMonth() + x, 1);
const isSameDay = (a, b) => toISODate(a) === toISODate(b);

function getCalendarCells(currentMonthDate) {
  const start = monthStart(currentMonthDate);
  const end = monthEnd(currentMonthDate);
  const out = [];
  for (let i = 0; i < start.getDay(); i++) out.push(null);
  for (let d = 1; d <= end.getDate(); d++) {
    out.push(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d));
  }
  while (out.length % 7 !== 0) out.push(null);
  return out;
}

function playSound(type = "bell") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const make = (freq, start, dur, gainVal = 0.14, wave = "sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = wave;
      o.frequency.setValueAtTime(freq, ctx.currentTime + start);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(gainVal, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };

    if (type === "bell") make(880, 0, 0.35);
    if (type === "chime") {
      make(660, 0, 0.22);
      make(990, 0.12, 0.28);
    }
    if (type === "mantra") {
      make(432, 0, 0.42, 0.11);
      make(648, 0.1, 0.32, 0.08);
    }
    if (type === "conch") {
      make(220, 0, 0.5, 0.18, "triangle");
      make(330, 0.08, 0.42, 0.1, "triangle");
    }
    if (type === "damru") {
      make(180, 0, 0.08, 0.15, "square");
      make(220, 0.1, 0.08, 0.15, "square");
      make(180, 0.2, 0.08, 0.15, "square");
      make(220, 0.3, 0.08, 0.15, "square");
    }
    if (type === "ghanta") {
      make(1046, 0, 0.6, 0.16, "sine");
      make(784, 0.06, 0.5, 0.1, "sine");
      make(1568, 0.1, 0.45, 0.06, "sine");
    }
    if (type === "flute") {
      make(523, 0, 0.25, 0.1, "triangle");
      make(659, 0.12, 0.25, 0.08, "triangle");
      make(784, 0.24, 0.3, 0.08, "triangle");
    }
  } catch {}
}

/* ---------- themes ---------- */
const GENERAL_THEMES = [
  {
    key: "amber",
    label: "Amber",
    text: "text-amber-500",
    ring: "ring-amber-500/70",
    border: "border-amber-400",
    primaryBtn: "bg-amber-600 hover:bg-amber-500",
    switch: "bg-amber-500",
  },
  {
    key: "rose",
    label: "Rose",
    text: "text-rose-500",
    ring: "ring-rose-500/70",
    border: "border-rose-400",
    primaryBtn: "bg-rose-600 hover:bg-rose-500",
    switch: "bg-rose-500",
  },
  {
    key: "emerald",
    label: "Emerald",
    text: "text-emerald-500",
    ring: "ring-emerald-500/70",
    border: "border-emerald-400",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-500",
    switch: "bg-emerald-500",
  },
];

const COUNTER_COLORS = [
  { key: "amber", label: "Kesari (Amber)", plus: "bg-amber-500 hover:bg-amber-400", minus: "bg-amber-700 hover:bg-amber-600", glow: "rgba(245,158,11,0.20)" },
  { key: "saffron", label: "Saffron", plus: "bg-orange-500 hover:bg-orange-400", minus: "bg-orange-700 hover:bg-orange-600", glow: "rgba(249,115,22,0.20)" },
  { key: "lotus", label: "Lotus Pink", plus: "bg-pink-500 hover:bg-pink-400", minus: "bg-pink-700 hover:bg-pink-600", glow: "rgba(236,72,153,0.22)" },
  { key: "peacock", label: "Peacock Teal", plus: "bg-teal-500 hover:bg-teal-400", minus: "bg-teal-700 hover:bg-teal-600", glow: "rgba(20,184,166,0.22)" },
  { key: "vrindavan", label: "Vrindavan Green", plus: "bg-emerald-500 hover:bg-emerald-400", minus: "bg-emerald-700 hover:bg-emerald-600", glow: "rgba(16,185,129,0.22)" },
  { key: "indigo", label: "Krishna Indigo", plus: "bg-indigo-500 hover:bg-indigo-400", minus: "bg-indigo-700 hover:bg-indigo-600", glow: "rgba(99,102,241,0.22)" },
];

const CAL_DOT_COLORS = ["#14B8A6", "#A855F7", "#F43F5E", "#2563EB", "#D97706", "#16A34A"];

const DEFAULT_SETTINGS = {
  themeShade: "system",
  soundAlert: true,
  soundType: "bell",
  generalTheme: "amber",
  counterColor: "lotus",
  hideMinusButton: false,
  regularHaptic: true,
  longHaptic: true,
  cycleSize: 108,
};

function ToggleRow({ title, subtitle, checked, onChange, switchClass, dark }) {
  return (
    <div className={`rounded-2xl border p-4 ${dark ? "border-zinc-700" : "border-zinc-300"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-medium leading-6">{title}</p>
          <p className="text-sm text-zinc-500 leading-5 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 shrink-0 ${
            checked ? switchClass : "bg-zinc-400"
          }`}
          aria-label={`${title} toggle`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [store, setStore] = useState({ counters: [], activeCounterId: null });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [currentMonth, setCurrentMonth] = useState(monthStart(new Date()));
  const [selectedDateISO, setSelectedDateISO] = useState(null);

  const [firstSetupOpen, setFirstSetupOpen] = useState(false);
  const [newCounterName, setNewCounterName] = useState("");

  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const [counterSwitchOpen, setCounterSwitchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [cycleFx, setCycleFx] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.counters?.length) setStore(p);
        else setFirstSetupOpen(true);
      } else setFirstSetupOpen(true);
    } catch {
      setFirstSetupOpen(true);
    }

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(store)), [store]);
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);

  const isDark = useMemo(() => {
    if (settings.themeShade === "dark") return true;
    if (settings.themeShade === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
  }, [settings.themeShade]);

  const gTheme = GENERAL_THEMES.find((x) => x.key === settings.generalTheme) || GENERAL_THEMES[0];
  const cTheme = COUNTER_COLORS.find((x) => x.key === settings.counterColor) || COUNTER_COLORS[2];

  const activeCounter = useMemo(
    () => store.counters.find((c) => c.id === store.activeCounterId) || store.counters[0] || null,
    [store]
  );

  const cycleSize = settings.cycleSize || MALA_SIZE_DEFAULT;
  const selectedCount =
    selectedDateISO && activeCounter ? activeCounter.countsByDate?.[selectedDateISO] || 0 : 0;
  const cycleProgress = selectedCount % cycleSize;
  const completedCycles = Math.floor(selectedCount / cycleSize);

  const cells = useMemo(() => getCalendarCells(currentMonth), [currentMonth]);
  const today = useMemo(() => new Date(), []);

  const vibrate = (long = false) => {
    if (!navigator.vibrate) return;
    if (long && settings.longHaptic) navigator.vibrate([60, 40, 100]);
    if (!long && settings.regularHaptic) navigator.vibrate(20);
  };

  const setCountForActive = (dateISO, value) => {
    if (!activeCounter) return;
    setStore((prev) => ({
      ...prev,
      counters: prev.counters.map((c) =>
        c.id === prev.activeCounterId
          ? { ...c, countsByDate: { ...c.countsByDate, [dateISO]: value } }
          : c
      ),
    }));
  };

  const increment = () => {
    if (!selectedDateISO || !activeCounter) return;
    const next = selectedCount + 1;
    setCountForActive(selectedDateISO, next);
    vibrate(false);

    if (next % cycleSize === 0) {
      setCycleFx(true);
      setTimeout(() => setCycleFx(false), 1000);
      if (settings.soundAlert) playSound(settings.soundType);
      vibrate(true);
    }
  };

  const decrement = () => {
    if (!selectedDateISO || !activeCounter) return;
    if (selectedCount <= 0) return;
    setCountForActive(selectedDateISO, selectedCount - 1);
    vibrate(false);
  };

  const resetDay = () => {
    if (!selectedDateISO || !activeCounter) return;
    setCountForActive(selectedDateISO, 0);
  };

  const addCounter = () => {
    const name = prompt("Enter new counter name");
    if (!name?.trim()) return;
    if (store.counters.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      return alert("Counter already exists.");
    }
    const c = { id: uid(), name: name.trim(), countsByDate: {} };
    setStore((p) => ({ counters: [...p.counters, c], activeCounterId: c.id }));
  };

  const renameCounter = (id) => {
    const old = store.counters.find((c) => c.id === id);
    if (!old) return;
    const name = prompt("Rename counter", old.name);
    if (!name?.trim()) return;
    setStore((p) => ({
      ...p,
      counters: p.counters.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)),
    }));
  };

  const removeCounter = (id) => {
    if (store.counters.length <= 1) return alert("At least one counter is required.");
    if (!confirm("Remove this counter?")) return;
    setStore((p) => {
      const rest = p.counters.filter((c) => c.id !== id);
      const activeExists = rest.some((c) => c.id === p.activeCounterId);
      return { counters: rest, activeCounterId: activeExists ? p.activeCounterId : rest[0].id };
    });
  };

  const backupData = () => {
    const blob = new Blob([JSON.stringify({ store, settings }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mantra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const restoreDataFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(reader.result);
        if (p?.store?.counters) setStore(p.store);
        if (p?.settings) setSettings({ ...DEFAULT_SETTINGS, ...p.settings });
        alert("Backup restored.");
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const settingsModal = settingsOpen && (
    <div className="fixed inset-0 z-50 bg-black/65 flex items-end md:items-center justify-center p-3">
      <div className={`w-full max-w-2xl rounded-3xl border max-h-[90vh] overflow-y-auto ${isDark ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}`}>
        <div className="sticky top-0 px-5 py-4 border-b border-zinc-800/20 bg-inherit flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h3 className="font-serif text-3xl leading-none">General Settings</h3>
          </div>
          <button onClick={() => setSettingsOpen(false)} className="rounded-xl border px-4 py-2 text-sm">Close</button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <section>
            <p className={`text-xl font-medium mb-3 ${gTheme.text}`}>Common settings</p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Theme shade</label>
              <select
                value={settings.themeShade}
                onChange={(e) => setSettings((s) => ({ ...s, themeShade: e.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 text-base leading-6 ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}
              >
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <ToggleRow
              dark={isDark}
              switchClass={gTheme.switch}
              title="Sound alert"
              subtitle={settings.soundAlert ? "Sound alert is ON after each completed cycle" : "Sound alert is OFF"}
              checked={settings.soundAlert}
              onChange={(v) => setSettings((s) => ({ ...s, soundAlert: v }))}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">Sound type</label>
              <select
                value={settings.soundType}
                onChange={(e) => setSettings((s) => ({ ...s, soundType: e.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 text-base leading-6 ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}
              >
                <option value="bell">Bell</option>
                <option value="chime">Chime</option>
                <option value="mantra">Mantra</option>
                <option value="conch">Conch</option>
                <option value="damru">Damru</option>
                <option value="ghanta">Ghanta</option>
                <option value="flute">Flute</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">Colour theme</label>
              <select
                value={settings.generalTheme}
                onChange={(e) => setSettings((s) => ({ ...s, generalTheme: e.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 text-base leading-6 ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}
              >
                {GENERAL_THEMES.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="border-t border-zinc-800/20 pt-6">
            <p className={`text-xl font-medium mb-3 ${gTheme.text}`}>Counter specific settings</p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Counter color</label>
              <select
                value={settings.counterColor}
                onChange={(e) => setSettings((s) => ({ ...s, counterColor: e.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 text-base leading-6 ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}
              >
                {COUNTER_COLORS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <ToggleRow
              dark={isDark}
              switchClass={gTheme.switch}
              title="Hide minus button"
              subtitle={settings.hideMinusButton ? "Minus button is hidden" : "Minus button is showing"}
              checked={settings.hideMinusButton}
              onChange={(v) => setSettings((s) => ({ ...s, hideMinusButton: v }))}
            />

            <div className="mt-3">
              <ToggleRow
                dark={isDark}
                switchClass={gTheme.switch}
                title="Regular haptic feedback"
                subtitle={settings.regularHaptic ? "Vibration on each button press" : "No vibration on key press"}
                checked={settings.regularHaptic}
                onChange={(v) => setSettings((s) => ({ ...s, regularHaptic: v }))}
              />
            </div>

            <div className="mt-3">
              <ToggleRow
                dark={isDark}
                switchClass={gTheme.switch}
                title="Long haptic feedback"
                subtitle={settings.longHaptic ? "Long vibration on cycle completion" : "Long vibration is OFF"}
                checked={settings.longHaptic}
                onChange={(v) => setSettings((s) => ({ ...s, longHaptic: v }))}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">Size of 1 cycle / mala</label>
              <input
                type="number"
                min={1}
                value={settings.cycleSize}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    cycleSize: Math.max(1, Number(e.target.value || 1)),
                  }))
                }
                className={`w-full rounded-2xl border px-4 py-3 text-base leading-6 ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  if (selectedDateISO && activeCounter) {
    const date = fromISODate(selectedDateISO);
    const dateLabel = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <main className={`min-h-screen ${isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"} flex flex-col relative overflow-hidden`}>
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-out ${cycleFx ? "opacity-100" : "opacity-0"}`}
          style={{ background: `radial-gradient(circle at center, ${cTheme.glow} 0%, transparent 78%)` }}
        />

        <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between z-10 gap-2">
          <button onClick={() => setSelectedDateISO(null)} className={`rounded-full px-4 py-2 text-sm border ${isDark ? "border-zinc-700 hover:bg-zinc-900" : "border-zinc-300 hover:bg-zinc-100"}`}>
            ← Back
          </button>

          <div className="text-center min-w-0">
            <p className="text-xs text-zinc-500">{dateLabel}</p>
            <p className="text-xs text-zinc-500 truncate">{activeCounter.name} • Total: {selectedCount}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`rounded-full border px-3 py-2 text-xs ${isDark ? "border-zinc-700" : "border-zinc-300"}`}>
              <select
                value={settings.counterColor}
                onChange={(e) => setSettings((s) => ({ ...s, counterColor: e.target.value }))}
                className="bg-transparent outline-none text-xs max-w-[120px]"
              >
                {COUNTER_COLORS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setSettings((s) => ({ ...s, hideMinusButton: !s.hideMinusButton }))}
              className={`rounded-full border px-3 py-2 text-xs ${isDark ? "border-zinc-700 hover:bg-zinc-900" : "border-zinc-300 hover:bg-zinc-100"}`}
            >
              {settings.hideMinusButton ? "Minus: OFF" : "Minus: ON"}
            </button>

            <button onClick={resetDay} className={`rounded-full px-4 py-2 text-sm text-white ${gTheme.primaryBtn}`}>
              Reset
            </button>
          </div>
        </header>

        <section className="flex-1 w-full max-w-6xl mx-auto px-4 pb-8 flex flex-col items-center justify-center z-10" onClick={settings.hideMinusButton ? increment : undefined}>
          <p className="font-serif text-xl md:text-3xl mb-2">{activeCounter.name}</p>
          <p className="text-sm text-zinc-500 mb-2">Cycle: {cycleProgress} / {cycleSize} • Completed: {completedCycles}</p>
          <div className="text-7xl md:text-9xl font-light mb-8">{cycleProgress}</div>

          {!settings.hideMinusButton ? (
            <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); decrement(); }} className={`w-16 h-16 md:w-20 md:h-20 rounded-full text-3xl text-white shadow-lg ${cTheme.minus}`}>
                −
              </button>
              <button onClick={(e) => { e.stopPropagation(); increment(); }} className={`w-28 h-28 md:w-36 md:h-36 rounded-full text-5xl text-white shadow-2xl ${cTheme.plus}`}>
                +
              </button>
            </div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); increment(); }} className={`w-40 h-40 md:w-52 md:h-52 rounded-full text-6xl text-white shadow-2xl ${cTheme.plus}`}>
              +
            </button>
          )}
        </section>

        {settingsModal}
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <header className="mb-8 grid grid-cols-3 items-start">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Productive Mantra Tracker</h1>
            <p className="mt-2 text-sm text-zinc-500">One full cycle = {cycleSize}</p>
          </div>

          <div className="flex justify-center mt-2">
            {store.counters.length > 1 && (
              <div className="relative">
                <button onClick={() => setCounterSwitchOpen((v) => !v)} className={`rounded-full border px-3 py-1.5 text-sm inline-flex items-center gap-2 ${isDark ? "border-zinc-700 hover:bg-zinc-900" : "border-zinc-300 hover:bg-zinc-100"}`}>
                  {activeCounter?.name || "Counter"} <ChevronDown className="w-4 h-4" />
                </button>

                {counterSwitchOpen && (
                  <div className={`absolute mt-2 min-w-[270px] rounded-xl border shadow-lg z-40 ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"}`}>
                    {store.counters.map((c) => (
                      <div key={c.id} className="flex items-center justify-between px-3 py-2 hover:bg-zinc-800/20">
                        <button
                          onClick={() => {
                            setStore((p) => ({ ...p, activeCounterId: c.id }));
                            setCounterSwitchOpen(false);
                          }}
                          className="text-left flex-1 truncate"
                        >
                          {c.name}
                        </button>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => renameCounter(c.id)}
                            className="h-7 w-7 rounded-md border inline-flex items-center justify-center hover:bg-zinc-800/20"
                            aria-label="Rename counter"
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => removeCounter(c.id)}
                            className="h-7 w-7 rounded-md border inline-flex items-center justify-center hover:bg-zinc-800/20"
                            aria-label="Remove counter"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button onClick={addCounter} className="w-full text-left px-3 py-2 border-t border-zinc-700/30 hover:bg-zinc-800/20">
                      + Add Counter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="relative">
              <button onClick={() => setHomeMenuOpen((v) => !v)} className={`rounded-full w-11 h-11 border flex items-center justify-center ${isDark ? "border-zinc-700 hover:bg-zinc-900" : "border-zinc-300 hover:bg-zinc-100"}`}>
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {homeMenuOpen && (
                <div className={`absolute right-0 mt-2 w-60 rounded-2xl border shadow-xl z-50 overflow-hidden ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"}`}>
                  <button onClick={() => { setSettingsOpen(true); setHomeMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-800/20 inline-flex items-center gap-2">
                    <Settings className="w-4 h-4 shrink-0" /> <span>General Settings</span>
                  </button>

                  <button onClick={() => { addCounter(); setHomeMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800/20 inline-flex items-center gap-2">
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Add Counter</span>
                  </button>

                  <button onClick={() => { backupData(); setHomeMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800/20 inline-flex items-center gap-2">
                    <Save className="w-4 h-4 shrink-0" /> <span>Backup</span>
                  </button>

                  <button onClick={() => { fileInputRef.current?.click(); setHomeMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800/20 inline-flex items-center gap-2">
                    <Upload className="w-4 h-4 shrink-0" /> <span>Restore</span>
                  </button>

                  <button onClick={() => { alert("Thanks for rating us! ⭐"); setHomeMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800/20 inline-flex items-center gap-2">
                    <Star className="w-4 h-4 shrink-0" /> <span>Rate Us</span>
                  </button>

                  <button onClick={() => { alert("Productive Mantra Jaap Tracker\nMinimal • Clean • Multi-counter"); setHomeMenuOpen(false); }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800/20 inline-flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" /> <span>About Us</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const p = JSON.parse(reader.result);
                  if (p?.store?.counters) setStore(p.store);
                  if (p?.settings) setSettings({ ...DEFAULT_SETTINGS, ...p.settings });
                  alert("Backup restored.");
                } catch {
                  alert("Invalid backup file.");
                }
              };
              reader.readAsText(f);
              e.target.value = "";
            }}
          />
        </header>

        <section className="flex items-center justify-between mb-5">
          <button onClick={() => setCurrentMonth((m) => addMonths(m, -1))} className={`rounded-full border px-4 py-2 text-sm ${isDark ? "border-zinc-700 hover:bg-zinc-900" : "border-zinc-300 hover:bg-zinc-100"}`}>
            ← Prev
          </button>
          <h2 className="font-serif text-2xl md:text-3xl">
            {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className={`rounded-full border px-4 py-2 text-sm ${isDark ? "border-zinc-700 hover:bg-zinc-900" : "border-zinc-300 hover:bg-zinc-100"}`}>
            Next →
          </button>
        </section>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekdayLabels.map((d) => (
            <div key={d} className="text-center text-[10px] md:text-xs uppercase tracking-[0.18em] text-zinc-500 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((dateObj, idx) => {
            if (!dateObj) return <div key={`empty-${idx}`} className="aspect-square rounded-2xl" />;
            const iso = toISODate(dateObj);
            const todayFlag = isSameDay(dateObj, today);

            const dots = [];
            store.counters.forEach((counter, ci) => {
              const full = Math.floor((counter.countsByDate?.[iso] || 0) / cycleSize);
              for (let i = 0; i < full; i++) dots.push(CAL_DOT_COLORS[ci % CAL_DOT_COLORS.length]);
            });

            const MAX_DOTS = 8;
            const visible = dots.slice(0, MAX_DOTS);
            const overflow = dots.length - visible.length;

            return (
              <button
                key={iso}
                onClick={() => setSelectedDateISO(iso)}
                className={`aspect-square rounded-2xl border p-2 md:p-3 text-left transition ${
                  isDark ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800" : "bg-white hover:bg-zinc-50 border-zinc-200"
                } ${todayFlag ? `ring-1 ${gTheme.ring} ${gTheme.border}` : ""}`}
              >
                <div className="h-full flex flex-col">
                  <span className={`text-sm md:text-base ${todayFlag ? gTheme.text : ""}`}>{dateObj.getDate()}</span>
                  <div className="mt-2 grid grid-cols-4 gap-1 items-start">
                    {visible.map((c, i) => (
                      <span key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                    {overflow > 0 && (
                      <span className={`text-[10px] px-1 py-0.5 rounded-md font-semibold col-span-2 ${gTheme.text}`}>
                        +{overflow}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {settingsModal}

      {firstSetupOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 ${isDark ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}`}>
            <h2 className="font-serif text-2xl mb-2">Create your first counter</h2>
            <p className="text-sm text-zinc-500 mb-4">Enter counter name to begin.</p>
            <input
              autoFocus
              value={newCounterName}
              onChange={(e) => setNewCounterName(e.target.value)}
              placeholder="Counter name"
              className={`w-full rounded-xl border px-3 py-2 mb-4 ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}`}
            />
            <button
              onClick={() => {
                const name = newCounterName.trim();
                if (!name) return alert("Please enter counter name.");
                const c = { id: uid(), name, countsByDate: {} };
                setStore({ counters: [c], activeCounterId: c.id });
                setFirstSetupOpen(false);
                setNewCounterName("");
              }}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2 font-medium"
            >
              Start
            </button>
          </div>
        </div>
      )}
    </main>
  );
}