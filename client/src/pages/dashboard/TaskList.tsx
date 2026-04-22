import { Link } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtendedTask } from "@/services/taskService";

type TaskListProps = {
  tasks: ExtendedTask[];
};

export default function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="p-2">
      {tasks.length === 0 && (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-muted-foreground">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium">All caught up!</p>
        </div>
      )}

      {tasks.map((task) => {
        const content = (
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium transition-colors line-clamp-2 text-foreground",
                task.associatedCompanyId && "group-hover:text-primary"
              )}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.dueDate}
              </span>
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
            </div>
          </div>
        );

        if (!task.associatedCompanyId) {
          return (
            <div
              key={task.id}
              className="w-full flex items-start gap-3 p-3 rounded-xl text-left"
            >
              {content}
            </div>
          );
        }

        return (
          <Link
            key={task.id}
            to={`/clients/${task.associatedCompanyId}`}
            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
