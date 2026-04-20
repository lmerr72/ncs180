import { CheckCircle2, Circle, Clock, Mail, Phone, Plus, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtendedTask } from "@/services/taskService";

type RelatedTasksWidgetProps = {
  tasks: ExtendedTask[];
  isProspectView: boolean;
  onAddTask: () => void;
  onToggleTask: (id: string) => void;
};

export function RelatedTasksWidget({
  tasks,
  isProspectView,
  onAddTask,
  onToggleTask,
}: RelatedTasksWidgetProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Tasks</h2>
          <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{tasks.length}</span>
        </div>
        <button
          onClick={onAddTask}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      <div className="divide-y divide-border/40">
        {tasks.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No tasks for this {isProspectView ? "prospect" : "client"} yet.
          </p>
        )}
        {tasks.map(task => (
          <div key={task.id} className="px-6 py-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
            <button
              onClick={() => onToggleTask(task.id)}
              className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
            >
              {task.completed
                ? <CheckCircle2 className="w-5 h-5 text-primary" />
                : <Circle className="w-5 h-5" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-violet-100 text-violet-700 border-violet-200">
                  {task.taskType}
                </span>
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize",
                  task.importance === "HIGH" && "bg-red-100 text-red-700 border-red-200",
                  task.importance === "MEDIUM" && "bg-amber-100 text-amber-700 border-amber-200",
                  task.importance === "LOW" && "bg-slate-100 text-slate-500 border-slate-200",
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
              <p className={cn(
                "text-sm font-semibold leading-snug",
                task.completed ? "text-muted-foreground line-through" : "text-foreground",
              )}>
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                {task.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
