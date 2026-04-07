import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtendedTask } from "@/services/taskService";

type TaskListProps = {
  tasks: ExtendedTask[];
  onToggleTask: (id: string) => void;
};

export default function TaskList({ tasks, onToggleTask }: TaskListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onToggleTask(task.id)}
          className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
        >
          <div className="mt-0.5 flex-shrink-0">
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium transition-colors line-clamp-2",
                task.completed ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
              )}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.dueDate}
              </span>
              {!task.completed && (
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                    task.importance === "HIGH"
                      ? "bg-destructive/10 text-destructive"
                      : task.importance === "MEDIUM"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  )}
                >
                  {task.importance}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
