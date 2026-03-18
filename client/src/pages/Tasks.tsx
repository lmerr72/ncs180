import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MOCK_EXTENDED_TASKS, type TaskType, type Importance } from "@/lib/mock-data";
import { CheckCircle2, Circle, Clock, Building2, Mail, Phone, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const TASK_TYPE_STYLES: Record<TaskType, string> = {
  "Prospecting": "bg-sky-100 text-sky-700 border-sky-200",
  "Follow-Up":   "bg-violet-100 text-violet-700 border-violet-200",
  "Training":    "bg-teal-100 text-teal-700 border-teal-200",
  "Other":       "bg-slate-100 text-slate-600 border-slate-200",
};

const IMPORTANCE_STYLES: Record<Importance, string> = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low:    "bg-slate-100 text-slate-500 border-slate-200",
};

const ALL_TYPES: TaskType[] = ["Prospecting", "Follow-Up", "Training", "Other"];
const ALL_IMPORTANCE: Importance[] = ["high", "medium", "low"];

export default function Tasks() {
  const [tasks, setTasks] = useState(MOCK_EXTENDED_TASKS);
  const [typeFilter, setTypeFilter] = useState<TaskType | "All">("All");
  const [importanceFilter, setImportanceFilter] = useState<Importance | "All">("All");
  const [showCompleted, setShowCompleted] = useState(false);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const filtered = tasks.filter(t => {
    if (!showCompleted && t.completed) return false;
    if (typeFilter !== "All" && t.taskType !== typeFilter) return false;
    if (importanceFilter !== "All" && t.importance !== importanceFilter) return false;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Tasks</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {completedCount} of {tasks.length} completed
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCompleted(v => !v)}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
              showCompleted
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {showCompleted ? "Hide Completed" : "Show Completed"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          {/* Task type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 shrink-0">Type</span>
            <button
              onClick={() => setTypeFilter("All")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                typeFilter === "All"
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              All
            </button>
            {ALL_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? "All" : t)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  typeFilter === t
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Importance filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 shrink-0">Priority</span>
            <button
              onClick={() => setImportanceFilter("All")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                importanceFilter === "All"
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              All
            </button>
            {ALL_IMPORTANCE.map(imp => (
              <button
                key={imp}
                onClick={() => setImportanceFilter(importanceFilter === imp ? "All" : imp)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize",
                  importanceFilter === imp
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {imp}
              </button>
            ))}
          </div>
        </div>

        {/* Task cards */}
        <div className="space-y-3">
          {filtered.map(task => (
            <div
              key={task.id}
              className={cn(
                "bg-card rounded-2xl border shadow-sm p-5 transition-all",
                task.completed
                  ? "border-border/40 opacity-60"
                  : "border-border hover:shadow-md hover:border-primary/20"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {task.completed
                    ? <CheckCircle2 className="w-5 h-5 text-primary" />
                    : <Circle className="w-5 h-5" />
                  }
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* Top row: badges + comm icon */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      TASK_TYPE_STYLES[task.taskType]
                    )}>
                      {task.taskType}
                    </span>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize",
                      IMPORTANCE_STYLES[task.importance]
                    )}>
                      {task.importance}
                    </span>
                    {task.commType === "email" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-600 border-blue-200">
                        <Mail className="w-3 h-3" />
                        Email
                      </span>
                    )}
                    {task.commType === "phone" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-200">
                        <Phone className="w-3 h-3" />
                        Phone
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {task.dueDate}
                    </span>
                  </div>

                  {/* Title */}
                  <p className={cn(
                    "text-sm font-semibold leading-snug",
                    task.completed ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {task.title}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {task.description}
                  </p>

                  {/* Company link */}
                  {task.associatedCompanyName && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      {task.associatedCompanyId ? (
                        <Link
                          to={`/clients/${task.associatedCompanyId}?from=tasks`}
                          className="text-xs font-semibold text-primary hover:underline transition-colors"
                        >
                          {task.associatedCompanyName}
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {task.associatedCompanyName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm bg-card rounded-2xl border border-border">
              No tasks match the current filters.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
