import { createContext, useContext, useState, type ReactNode } from "react";
import { MOCK_EXTENDED_TASKS, type ExtendedTask, type Importance, type TaskCompanyOrigin, type TaskType } from "@/lib/mock-data";

interface NewTaskData {
  taskType: TaskType;
  importance: Importance;
  dueDate: string;
  notes: string;
  associatedCompanyName?: string;
  associatedCompanyId?: string;
  associatedCompanyOrigin?: TaskCompanyOrigin;
}

interface TasksCtx {
  tasks: ExtendedTask[];
  toggleTask: (id: string) => void;
  addTask: (data: NewTaskData) => void;
}

const TasksContext = createContext<TasksCtx | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<ExtendedTask[]>(MOCK_EXTENDED_TASKS);

  function toggleTask(id: string) {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  }

  function addTask(data: NewTaskData) {
    const companyName = data.associatedCompanyName?.trim();
    const dueDateLabel = formatDueDate(data.dueDate);
    const title = companyName
      ? `${data.taskType} for ${companyName}`
      : `${data.taskType} task`;

    setTasks(prev => [
      {
        id: `task-${Date.now()}`,
        title,
        description: data.notes.trim(),
        taskType: data.taskType,
        importance: data.importance,
        dueDate: dueDateLabel,
        completed: false,
        commType: null,
        associatedCompanyName: companyName || undefined,
        associatedCompanyId: data.associatedCompanyId,
        associatedCompanyOrigin: data.associatedCompanyOrigin,
      },
      ...prev,
    ]);
  }

  return (
    <TasksContext.Provider value={{ tasks, toggleTask, addTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside TasksProvider");
  return ctx;
}

function formatDueDate(dateStr: string): string {
  const due = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const dayDiff = Math.round(diffMs / 86400000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff === -1) return "Yesterday";

  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
