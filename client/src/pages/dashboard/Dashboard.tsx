import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GraphqlStatusCard } from "@/components/graphql/GraphqlStatusCard";
import { ArrowUpDown, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createBrowserLogger } from "@/lib/logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import IndustryEvents from "./IndustryEvents";
import UpcomingMeetings from "./UpcomingMeetings";
import ClientHealthCheck from "./ClientHealthCheck";
import QuarterlyGoalProgress from "./QuarterlyGoalProgress";
import TaskList from "./TaskList";
import { getTasks, type ExtendedTask } from "@/services/taskService";

const logger = createBrowserLogger("Dashboard");

type TaskDateFilter = "today" | "week" | "month";
type TaskSort = "dueDate" | "importance";

const TASK_IMPORTANCE_ORDER: Record<ExtendedTask["importance"], number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2
};

const TASK_DATE_FILTER_LABELS: Record<TaskDateFilter, string> = {
  today: "Today",
  week: "This week",
  month: "This month"
};

const TASK_SORT_LABELS: Record<TaskSort, string> = {
  dueDate: "Due date",
  importance: "Importance"
};

function getLocalDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateFromValue(dateValue: string): Date {
  return new Date(`${dateValue}T00:00:00`);
}

function getStartOfWeek(date: Date): Date {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return startOfWeek;
}

function getEndOfWeek(date: Date): Date {
  const endOfWeek = new Date(date);
  endOfWeek.setDate(date.getDate() + (6 - date.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  return endOfWeek;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isTaskInDateFilter(task: ExtendedTask, filter: TaskDateFilter): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return task.dueDateValue === getLocalDateValue(today);
  }

  const taskDueDate = getDateFromValue(task.dueDateValue);
  const startDate = filter === "week" ? getStartOfWeek(today) : getStartOfMonth(today);
  const endDate = filter === "week" ? getEndOfWeek(today) : getEndOfMonth(today);

  return taskDueDate >= startDate && taskDueDate <= endDate;
}

function compareDashboardTasks(a: ExtendedTask, b: ExtendedTask, sort: TaskSort): number {
  if (sort === "dueDate") {
    const dateDiff = a.dueDateValue.localeCompare(b.dueDateValue);
    if (dateDiff !== 0) return dateDiff;
  }

  const importanceDiff = TASK_IMPORTANCE_ORDER[a.importance] - TASK_IMPORTANCE_ORDER[b.importance];
  if (importanceDiff !== 0) return importanceDiff;

  return a.dueDateValue.localeCompare(b.dueDateValue);
}

function getDashboardTasks(tasks: ExtendedTask[], filter: TaskDateFilter, sort: TaskSort): ExtendedTask[] {
  return tasks
    .filter((task) => !task.completed && isTaskInDateFilter(task, filter))
    .sort((a, b) => compareDashboardTasks(a, b, sort))
    .slice(0, 5);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [taskDateFilter, setTaskDateFilter] = useState<TaskDateFilter>("week");
  const [taskSort, setTaskSort] = useState<TaskSort>("importance");

  useEffect(() => {
    if (!user?.repId) {
      setTasks([]);
      return;
    }

    let ignore = false;

    async function loadTasks() {
      try {
        const nextTasks = await getTasks(user.repId);
        if (!ignore) {
          setTasks(nextTasks);
        }
      } catch (error) {
        logger.error("Failed to load dashboard tasks", { error, repId: user.repId });
      }
    }

    void loadTasks();

    return () => {
      ignore = true;
    };
  }, [user?.repId]);

  const dashboardTasks = useMemo(
    () => getDashboardTasks(tasks, taskDateFilter, taskSort),
    [tasks, taskDateFilter, taskSort]
  );

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Welcome back, {user?.firstName}. Here's what's happening today.</p>
      </div>

      <GraphqlStatusCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuarterlyGoalProgress />

        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col hover-elevate overflow-hidden">
          <div className="border-b border-border/50 bg-muted/20 shrink-0 px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Tasks</span>
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 inline-flex items-center justify-center transition-colors"
                    aria-label={`Filter tasks by ${TASK_DATE_FILTER_LABELS[taskDateFilter].toLowerCase()}`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={taskDateFilter}
                    onValueChange={(value) => setTaskDateFilter(value as TaskDateFilter)}
                  >
                    <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="week">This week</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="month">This month</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 inline-flex items-center justify-center transition-colors"
                    aria-label={`Sort tasks by ${TASK_SORT_LABELS[taskSort].toLowerCase()}`}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={taskSort}
                    onValueChange={(value) => setTaskSort(value as TaskSort)}
                  >
                    <DropdownMenuRadioItem value="dueDate">Due date</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="importance">Importance</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-primary/10 text-primary">
                {dashboardTasks.length}
              </span>
            </div>
          </div>

          <TaskList tasks={dashboardTasks} />
        </div>

        <ClientHealthCheck />
        <UpcomingMeetings />
        <IndustryEvents />
      </div>
    </AppLayout>
  );
}
