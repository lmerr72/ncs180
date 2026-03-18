import { useState } from "react";
import { createPortal } from "react-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MOCK_ALL_CLIENTS } from "@/lib/mock-data";
import {
  ChevronLeft, ChevronRight, Plus, X, MapPin, Clock,
  Calendar as CalendarIcon, Users, Ban, Umbrella, ChevronDown,
} from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek,
  addWeeks, subWeeks, addDays, subDays, parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

/* ─── Timezone helpers ─── */
function getTimezoneAbbr(): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(new Date());
    return parts.find(p => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

function formatTimeWithTz(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr);
  const m = parseInt(mStr);
  const period = h < 12 ? "AM" : "PM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const paddedM = String(m).padStart(2, "0");
  const tzAbbr = getTimezoneAbbr();
  return tzAbbr ? `${displayH}:${paddedM} ${period} ${tzAbbr}` : `${displayH}:${paddedM} ${period}`;
}

/* ─── Constants ─── */
const HOUR_START = 7;
const HOUR_END = 17;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
const SLOT_H = 64;

function hourLabel(hour: number): string {
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

function getEntryPosition(startTime: string): { top: number; height: number } {
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr);
  const m = parseInt(mStr);
  const totalMinutes = (h - HOUR_START) * 60 + m;
  return { top: (totalMinutes / 60) * SLOT_H, height: SLOT_H - 4 };
}

/* ─── Types ─── */
type EntryType = "meeting" | "block" | "dayoff";

type CalendarEntry = {
  id: string;
  title: string;
  type: EntryType | "event";
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  company?: string;
  contact?: string;
  platform?: string;
};

/* ─── Style map ─── */
const TYPE_STYLES: Record<string, string> = {
  meeting: "bg-emerald-100 text-emerald-700 border-emerald-200",
  block:   "bg-amber-100  text-amber-700  border-amber-200",
  dayoff:  "bg-rose-100   text-rose-700   border-rose-200",
  event:   "bg-indigo-100 text-indigo-700 border-indigo-200",
};

/* ─── Seed data ─── */
const SEED: CalendarEntry[] = [
  { id: "s1",  title: "Q1 Sales Training",           type: "event",   date: "2026-03-20", startTime: "10:00", endTime: "11:30", location: "Denver, CO" },
  { id: "s2",  title: "Client Demo – Synergy Props", type: "meeting", date: "2026-03-22", startTime: "14:30", endTime: "15:30" },
  { id: "s3",  title: "Team Standup",                type: "meeting", date: "2026-03-25", startTime: "09:00", endTime: "09:30" },
  { id: "s4",  title: "NAA Conference Call",         type: "meeting", date: "2026-03-28", startTime: "11:00", endTime: "11:30" },
  { id: "s5",  title: "Denver Trade Show",           type: "event",   date: "2026-04-10", location: "Denver, CO" },
  { id: "s6",  title: "NAA Apartmentalize",          type: "event",   date: "2026-06-05", location: "Atlanta, GA" },
  { id: "s7",  title: "Spring Break",                type: "dayoff",  date: "2026-03-19" },
  { id: "s8",  title: "Blocked – Quarterly Review",  type: "block",   date: "2026-03-24", startTime: "13:00", endTime: "17:00" },
  { id: "s9",  title: "Apex Management Follow-up",   type: "meeting", date: "2026-03-17", startTime: "10:00", endTime: "10:45" },
  { id: "s10", title: "Focus Block – Proposals",     type: "block",   date: "2026-03-18", startTime: "08:00", endTime: "12:00" },
];

/* ─── Add-button config ─── */
const TYPE_CONFIG: Record<EntryType, { label: string; short: string; icon: React.ElementType; desc: string }> = {
  meeting: { label: "Schedule Meeting", short: "Meeting",  icon: Users,    desc: "Plan a client or team meeting" },
  block:   { label: "Block Time",       short: "Block",    icon: Ban,      desc: "Reserve time for focused work" },
  dayoff:  { label: "Add Day Off",      short: "Day Off",  icon: Umbrella, desc: "Mark vacation or time off" },
};

/* ─── Platform logos ─── */
const PLATFORM_OPTIONS = [
  {
    id: "zoom",
    label: "Zoom",
    logo: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="8" fill="#2D8CFF"/>
        <path d="M6 11.5C6 10.67 6.67 10 7.5 10h11C19.33 10 20 10.67 20 11.5v9c0 .83-.67 1.5-1.5 1.5h-11C6.67 22 6 21.33 6 20.5v-9z" fill="white"/>
        <path d="M20 14.5l6-3.5v10l-6-3.5v-3z" fill="white"/>
      </svg>
    ),
  },
  {
    id: "google-meet",
    label: "Google Meet",
    logo: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="8" fill="#fff"/>
        <path d="M18.5 16l4.5 3V13l-4.5 3z" fill="#00832D"/>
        <rect x="6" y="11" width="12.5" height="10" rx="1.5" fill="#0066DA"/>
        <path d="M6 19.5V22h3v-2.5H6z" fill="#E94235"/>
        <path d="M9 22h5.5v-2.5H9V22z" fill="#2684FC"/>
        <path d="M14.5 22H18.5V19.5H14.5V22z" fill="#00AC47"/>
        <path d="M6 16.75V19.5h3v-2.75H6z" fill="#FFBA00"/>
        <path d="M9 11H14.5V13.5H9V11z" fill="#00AC47"/>
        <path d="M14.5 11H18.5V13.5H14.5V11z" fill="#00832D"/>
        <path d="M6 11H9V13.5H6V11z" fill="#0066DA"/>
        <path d="M6 13.5H9V16.75H6V13.5z" fill="#2684FC"/>
      </svg>
    ),
  },
  {
    id: "teams",
    label: "Teams",
    logo: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <rect width="32" height="32" rx="8" fill="#5059C9"/>
        <circle cx="21" cy="11" r="3" fill="#7B83EB"/>
        <path d="M25 20v-4a3 3 0 00-6 0v4h6z" fill="#7B83EB"/>
        <circle cx="13" cy="10" r="4" fill="white"/>
        <path d="M19 20v-4a6 6 0 00-12 0v4h12z" fill="white"/>
      </svg>
    ),
  },
];

const TODAY = new Date(2026, 2, 17); // March 17, 2026

/* ═══════════════════════════════════════════════════════════ */
export default function CalendarPage() {
  const [view, setView]                 = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate]   = useState(TODAY);
  const [entries, setEntries]           = useState<CalendarEntry[]>(SEED);
  const [showModal, setShowModal]       = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalType, setModalType]       = useState<EntryType>("meeting");
  const [form, setForm] = useState({
    title: "", date: format(TODAY, "yyyy-MM-dd"),
    startTime: "09:00", endTime: "10:00", location: "",
    company: "", contact: "", platform: "zoom",
  });

  const tzAbbr = getTimezoneAbbr();

  const prev = () => {
    if (view === "month") setCurrentDate(d => subMonths(d, 1));
    else if (view === "week") setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subDays(d, 1));
  };
  const next = () => {
    if (view === "month") setCurrentDate(d => addMonths(d, 1));
    else if (view === "week") setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addDays(d, 1));
  };

  const headerLabel =
    view === "month" ? format(currentDate, "MMMM yyyy")
    : view === "week"
      ? (() => {
          const ws = startOfWeek(currentDate);
          const we = endOfWeek(currentDate);
          return format(ws, "MMM") === format(we, "MMM")
            ? `${format(ws, "MMM d")} – ${format(we, "d, yyyy")}`
            : `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
        })()
      : format(currentDate, "EEEE, MMMM d, yyyy");

  const openModal = (type: EntryType, date?: Date) => {
    setModalType(type);
    setShowDropdown(false);
    setForm(f => ({
      ...f,
      date: date ? format(date, "yyyy-MM-dd") : format(currentDate, "yyyy-MM-dd"),
      title: "", location: "", company: "", contact: "", platform: "zoom",
    }));
    setShowModal(true);
  };

  const saveEntry = () => {
    if (!form.title.trim()) return;
    const e: CalendarEntry = {
      id: `u${Date.now()}`,
      type: modalType,
      title: form.title,
      date: form.date,
      startTime: modalType !== "dayoff" ? form.startTime : undefined,
      endTime:   modalType !== "dayoff" ? form.endTime   : undefined,
      location:  form.location || undefined,
      company:   modalType === "meeting" ? form.company || undefined : undefined,
      contact:   modalType === "meeting" ? form.contact || undefined : undefined,
      platform:  modalType === "meeting" ? form.platform : undefined,
    };
    setEntries(prev => [...prev, e]);
    setShowModal(false);
  };

  const dayEntries = (day: Date) => entries.filter(e => isSameDay(parseISO(e.date), day));

  const upcomingEntries = [...entries]
    .filter(e => !isSameDay(parseISO(e.date), TODAY) ? parseISO(e.date) >= TODAY : true)
    .sort((a, b) => {
      const dateDiff = parseISO(a.date).getTime() - parseISO(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00");
    })
    .slice(0, 8);

  /* ──── MONTH VIEW ──── */
  const MonthView = () => {
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentDate)),
      end:   endOfWeek(endOfMonth(currentDate)),
    });
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/20 shrink-0">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
          {days.map((day, idx) => {
            const items = dayEntries(day);
            const inMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, TODAY);
            return (
              <div key={day.toString()} onClick={() => openModal("meeting", day)}
                className={cn(
                  "min-h-[90px] border-b border-r border-border/30 p-1.5 hover:bg-muted/10 cursor-pointer",
                  !inMonth && "bg-muted/5",
                  idx % 7 === 6 && "border-r-0"
                )}>
                <span className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1",
                  isToday ? "bg-primary text-primary-foreground"
                  : inMonth ? "text-foreground" : "text-muted-foreground/40"
                )}>
                  {format(day, "d")}
                </span>
                <div className="flex flex-col gap-0.5">
                  {items.slice(0, 3).map(item => (
                    <div key={item.id} className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border",
                      TYPE_STYLES[item.type]
                    )}>
                      {item.startTime && <span className="opacity-60 mr-1">{item.startTime}</span>}
                      {item.title}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-1">+{items.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ──── WEEK VIEW ──── */
  const WeekView = () => {
    const ws = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day headers */}
        <div className="grid border-b border-border/50 bg-muted/20 shrink-0" style={{ gridTemplateColumns: "72px repeat(7, 1fr)" }}>
          <div className="py-3 text-[10px] text-muted-foreground text-center self-end pb-2">{tzAbbr}</div>
          {weekDays.map(day => (
            <div key={day.toString()}
              className={cn("py-2 text-center border-l border-border/30 cursor-pointer hover:text-primary transition-colors",
                isSameDay(day, TODAY) ? "text-primary" : "text-muted-foreground")}
              onClick={() => { setCurrentDate(day); setView("day"); }}>
              <div className="text-xs font-bold uppercase tracking-wider">{format(day, "EEE")}</div>
              <div className={cn(
                "w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-bold",
                isSameDay(day, TODAY) ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {HOURS.map(hour => {
              const label = `${hourLabel(hour)} ${tzAbbr}`.trim();
              return (
                <div key={hour} className="grid border-b border-border/20"
                  style={{ gridTemplateColumns: "72px repeat(7, 1fr)", height: `${SLOT_H}px` }}>
                  <div className="flex items-start justify-end pr-3 pt-1">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>
                  </div>
                  {weekDays.map(day => (
                    <div key={day.toString()}
                      onClick={() => openModal("meeting", day)}
                      className="border-l border-border/20 hover:bg-muted/10 cursor-pointer" />
                  ))}
                </div>
              );
            })}

            {/* Entry blocks overlay */}
            {weekDays.map((day, colIdx) => {
              const timedEntries = dayEntries(day).filter(e => {
                if (!e.startTime) return false;
                const h = parseInt(e.startTime.split(":")[0]);
                const m = parseInt(e.startTime.split(":")[1]);
                return h >= HOUR_START && (h < HOUR_END || (h === HOUR_END && m === 0));
              });
              return timedEntries.map(entry => {
                const { top, height } = getEntryPosition(entry.startTime!);
                return (
                  <div key={entry.id}
                    className={cn(
                      "absolute z-10 px-1.5 py-1 rounded text-[10px] font-semibold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border",
                      TYPE_STYLES[entry.type]
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `calc(72px + ${colIdx} * (100% - 72px) / 7 + 1px)`,
                      width: `calc((100% - 72px) / 7 - 4px)`,
                    }}
                    title={`${entry.title} — ${formatTimeWithTz(entry.startTime!)}`}
                  >
                    <div className="truncate font-bold">{entry.title}</div>
                    <div className="opacity-70">{formatTimeWithTz(entry.startTime!)}</div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ──── DAY VIEW ──── */
  const DayView = () => {
    const items = dayEntries(currentDate);
    const allDayItems = items.filter(e => !e.startTime);
    const timedItems  = items.filter(e => {
      if (!e.startTime) return false;
      const h = parseInt(e.startTime.split(":")[0]);
      const m = parseInt(e.startTime.split(":")[1]);
      return h >= HOUR_START && (h < HOUR_END || (h === HOUR_END && m === 0));
    });

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day header */}
        <div className="border-b border-border/50 bg-muted/20 shrink-0 flex items-center gap-4 px-5 py-3">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{format(currentDate, "EEE")}</span>
            <span className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold mt-1",
              isSameDay(currentDate, TODAY) ? "bg-primary text-primary-foreground" : "text-foreground"
            )}>
              {format(currentDate, "d")}
            </span>
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {format(currentDate, "MMMM yyyy")} · {tzAbbr}
          </div>
        </div>

        {/* All-day items */}
        {allDayItems.length > 0 && (
          <div className="p-3 border-b border-border/50 bg-muted/10 flex flex-wrap gap-2 shrink-0">
            {allDayItems.map(e => (
              <div key={e.id} className={cn("px-3 py-1 rounded-full text-xs font-semibold border", TYPE_STYLES[e.type])}>
                {e.title}
              </div>
            ))}
          </div>
        )}

        {/* Scrollable time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {HOURS.map(hour => {
              const label = `${hourLabel(hour)} ${tzAbbr}`.trim();
              return (
                <div key={hour} className="flex border-b border-border/20" style={{ height: `${SLOT_H}px` }}>
                  <div className="w-20 flex items-start justify-end pr-3 pt-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>
                  </div>
                  <div onClick={() => openModal("meeting", currentDate)}
                    className="flex-1 border-l border-border/20 hover:bg-muted/10 cursor-pointer" />
                </div>
              );
            })}

            {/* Entry blocks */}
            {timedItems.map(entry => {
              const { top, height } = getEntryPosition(entry.startTime!);
              return (
                <div key={entry.id}
                  className={cn(
                    "absolute z-10 rounded-xl px-4 py-2 border cursor-pointer hover:opacity-80 transition-opacity",
                    TYPE_STYLES[entry.type]
                  )}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: "calc(80px + 8px)",
                    right: "8px",
                  }}
                  title={`${entry.title} — ${formatTimeWithTz(entry.startTime!)}`}
                >
                  <div className="text-sm font-bold truncate">{entry.title}</div>
                  <div className="text-xs opacity-70 mt-0.5 flex items-center gap-3">
                    <span>{formatTimeWithTz(entry.startTime!)}{entry.endTime ? ` – ${formatTimeWithTz(entry.endTime)}` : ""}</span>
                    {entry.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{entry.location}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════ RENDER ══════════════════════════════════════════════ */
  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5 shrink-0 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground mt-1">Schedule and upcoming events.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Add button + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(d => !d)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-40">
                    {(["meeting", "block", "dayoff"] as EntryType[]).map(type => {
                      const cfg = TYPE_CONFIG[type];
                      return (
                        <button key={type} onClick={() => openModal(type)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left">
                          <cfg.icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">{cfg.label}</div>
                            <div className="text-xs text-muted-foreground">{cfg.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* View switcher */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
              {(["month", "week", "day"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
                  view === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                  {v}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 bg-card p-1.5 rounded-xl border border-border shadow-sm">
              <button onClick={() => setCurrentDate(TODAY)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Today
              </button>
              <div className="w-px h-5 bg-border mx-0.5" />
              <button onClick={prev} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold min-w-[160px] text-center px-1">{headerLabel}</span>
              <button onClick={next} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-5 min-h-0">
          {/* Calendar canvas */}
          <div className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
            {view === "month" && <MonthView />}
            {view === "week"  && <WeekView />}
            {view === "day"   && <DayView />}
          </div>

          {/* Upcoming sidebar */}
          <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border/50 bg-muted/20 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Upcoming
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {upcomingEntries.map((entry, i) => (
                <div key={`upcoming-${i}`} className="relative pl-4 border-l-2 border-muted hover:border-primary transition-colors pb-4 last:pb-0">
                  <div className="absolute w-3 h-3 bg-background border-2 border-primary rounded-full -left-[7px] top-1" />
                  <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border mb-1", TYPE_STYLES[entry.type])}>
                    {entry.type === "meeting" && <Users className="w-2.5 h-2.5" />}
                    {entry.type === "block"   && <Ban className="w-2.5 h-2.5" />}
                    {entry.type === "dayoff"  && <Umbrella className="w-2.5 h-2.5" />}
                    {entry.type === "event"   && <CalendarIcon className="w-2.5 h-2.5" />}
                    {TYPE_CONFIG[entry.type as EntryType]?.short ?? "Event"}
                  </div>
                  <h4 className="font-bold text-sm text-foreground mb-1">{entry.title}</h4>
                  <div className="text-xs font-medium text-primary mb-1">
                    {format(parseISO(entry.date), "MMM d, yyyy")}
                  </div>
                  {entry.startTime && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeWithTz(entry.startTime)}
                    </div>
                  )}
                  {entry.location && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {entry.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Create Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Add to Calendar
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type tabs */}
            <div className="flex border-b border-border/50 bg-muted/20">
              {(["meeting", "block", "dayoff"] as EntryType[]).map(type => {
                const cfg = TYPE_CONFIG[type];
                return (
                  <button key={type} onClick={() => setModalType(type)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-3.5 text-xs font-bold uppercase tracking-wide transition-all",
                      modalType === type ? "text-primary border-b-2 border-primary bg-card" : "text-muted-foreground hover:text-foreground"
                    )}>
                    <cfg.icon className="w-4 h-4" />
                    {cfg.short}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  {modalType === "dayoff" ? "Label" : "Title"}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={
                    modalType === "meeting" ? "e.g. Q2 Review with Apex Management"
                    : modalType === "block"  ? "e.g. Deep work – proposals"
                    : "e.g. Vacation, Sick Day, PTO"
                  }
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && saveEntry()}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              {modalType !== "dayoff" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Start Time {tzAbbr && <span className="font-normal normal-case opacity-60">({tzAbbr})</span>}
                    </label>
                    <input type="time" value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">End Time</label>
                    <input type="time" value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
              )}

              {/* Meeting-specific fields */}
              {modalType === "meeting" && (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Company</label>
                    <select value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-all">
                      <option value="">Select a company…</option>
                      {MOCK_ALL_CLIENTS.map(c => (
                        <option key={c.id} value={c.companyName}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Contact Person</label>
                    <input type="text" value={form.contact} placeholder="Contact name"
                      onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Platform</label>
                    <div className="flex gap-3">
                      {PLATFORM_OPTIONS.map(p => (
                        <button key={p.id} onClick={() => setForm(f => ({ ...f, platform: p.id }))}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            form.platform === p.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"
                          )}>
                          {p.logo}
                          <span className="text-xs font-semibold text-foreground">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {modalType !== "meeting" && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Location <span className="font-normal normal-case opacity-60">(optional)</span>
                  </label>
                  <input type="text" placeholder="e.g. Denver Office, Conference Room B"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              )}

              {/* Color preview */}
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border", TYPE_STYLES[modalType])}>
                {modalType === "meeting" && <><Users    className="w-3.5 h-3.5" /> Meeting – will show in green</>}
                {modalType === "block"   && <><Ban      className="w-3.5 h-3.5" /> Blocked time – will show in amber</>}
                {modalType === "dayoff"  && <><Umbrella className="w-3.5 h-3.5" /> Day off – will show in rose</>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={saveEntry} disabled={!form.title.trim()}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                Add to Calendar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AppLayout>
  );
}
