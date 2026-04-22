import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { createBrowserLogger } from "@/lib/logger";
import type { Client, Importance, TaskType } from "@/types/api";
import { CheckCircle2, Check, Circle, Clock, Building2, Mail, Pencil, Phone, ClipboardList, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import CustomSelect from "@/components/shared/CustomSelect";
import { cn } from "@/lib/utils";
import { getClients } from "@/services/clientService";
import { createTask, deleteTask, getTasks, type ExtendedTask, updateTask } from "@/services/taskService";
import { ImportanceOptions } from "@/types/constants";

const logger = createBrowserLogger("Tasks");

const TASK_TYPE_STYLES: Record<TaskType, string> = {
  "Prospecting": "bg-sky-100 text-sky-700 border-sky-200",
  "Follow-Up": "bg-violet-100 text-violet-700 border-violet-200",
  "Training": "bg-teal-100 text-teal-700 border-teal-200",
  "Other": "bg-slate-100 text-slate-600 border-slate-200",
};

const IMPORTANCE_STYLES: Record<Importance, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-slate-100 text-slate-500 border-slate-200",
};

const ALL_TYPES: TaskType[] = ["Prospecting", "Follow-Up", "Training", "Other"];
const AUTOMATED_TRIGGER_OPTIONS = [
  {key:'follow_up',label:"Regular follow-up",date:true},
  {key:'file_placement',label:"No file placement",date:true},
  {key:'low_recovery',label:"Low recovery rate",date:false},
  {key:'low_placement',label:"Lower than avg placing",date:true}
] as const;
const AUTOMATED_RANGE_OPTIONS = [
  "30 days",
  "60 days",
  "90 days",
  "This quarter",
  "Last 6 months",
  "Last year",
] as const;

type AutomatedTriggerType = "follow_up" | "file_placement" | "low_recovery" | "low_placement";
type AutomatedDateRange = typeof AUTOMATED_RANGE_OPTIONS[number];
type TaskTab = "created" | "automated";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateAutomatedTaskModal, setShowCreateAutomatedTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ExtendedTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ExtendedTask | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [typeFilter, setTypeFilter] = useState<TaskType | "All">("All");
  const [importanceFilter, setImportanceFilter] = useState<Importance | "All">("All");
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeTaskTab, setActiveTaskTab] = useState<TaskTab>("created");

  useEffect(() => {
    if (!user?.repId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadTasks() {
      setLoading(true);
      setError(null);

      try {
        const nextTasks = await getTasks(user.repId);
        if (!ignore) {
          setTasks(nextTasks);
        }
      } catch (loadError) {
        logger.error("Failed to load tasks", { error: loadError, repId: user.repId });
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load tasks.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      ignore = true;
    };
  }, [user?.repId]);

  useEffect(() => {
    let ignore = false;

    async function loadClients() {
      try {
        const nextClients = await getClients();
        if (!ignore) {
          setClients(nextClients);
        }
      } catch (loadError) {
        logger.error("Failed to load clients for task creation", { error: loadError });
      }
    }

    void loadClients();

    return () => {
      ignore = true;
    };
  }, []);

  async function toggleTask(id: string) {
    const existingTask = tasks.find((task) => task.id === id);
    if (!existingTask) return;

    const previousTasks = tasks;
    const nextCompleted = !existingTask.completed;

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: nextCompleted } : task))
    );

    try {
      const updated = await updateTask(id, { completed: nextCompleted });
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
    } catch (updateError) {
      logger.error("Failed to update task", { error: updateError, taskId: id });
      setTasks(previousTasks);
      setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    }
  }

  async function handleCreateTask(data: {
    taskType: TaskType;
    title: string;
    clientId?: string;
    importance: Importance;
    dueDate?: string;
    description: string;
  }) {
    if (!user?.repId) {
      setError("Unable to create a task because the current user has no repId.");
      return;
    }

    setCreatingTask(true);
    setError(null);

    try {
      const created = await createTask({
        repId: user.repId,
        clientId: data.clientId,
        title: data.title,
        description: data.description,
        taskType: data.taskType,
        importance: data.importance,
        dueDate: data.dueDate?.trim() || new Date().toISOString().slice(0, 10),
      });

      setTasks((current) => [created, ...current]);
      setShowCreateTaskModal(false);
    } catch (createError) {
      logger.error("Failed to create task", { error: createError, repId: user.repId });
      setError(createError instanceof Error ? createError.message : "Unable to create task.");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleCreateAutomatedTask(data: {
    taskType: TaskType;
    importance: Importance;
    description: string;
    applyToAllClients: boolean;
    clientId?: string;
    triggerType: AutomatedTriggerType;
    dateRange: AutomatedDateRange;
  }) {
    if (!user?.repId) {
      setError("Unable to create an automated task because the current user has no repId.");
      return;
    }

    const targetClients = data.applyToAllClients
      ? clients
      : clients.filter((client) => client.id === data.clientId);

    if (!data.applyToAllClients && targetClients.length === 0) {
      setError("Select a client or choose all clients for the automated task.");
      return;
    }

    setCreatingTask(true);
    setError(null);

    try {
      const createdTasks = await Promise.all(
        targetClients.map((client) =>
          createTask({
            repId: user.repId,
            clientId: client.id,
            title: buildAutomatedTaskTitle(client.companyName, data.triggerType, data.dateRange),
            description: data.description,
            taskType: data.taskType,
            importance: data.importance,
            dueDate: new Date().toISOString().slice(0, 10),
            automated: true,
          })
        )
      );

      setTasks((current) => [...createdTasks, ...current]);
      setActiveTaskTab("automated");
      setShowCreateAutomatedTaskModal(false);
    } catch (createError) {
      logger.error("Failed to create automated tasks", { error: createError, repId: user.repId });
      setError(createError instanceof Error ? createError.message : "Unable to create automated tasks.");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleEditTask(data: {
    taskType: TaskType;
    title: string;
    clientId?: string;
    importance: Importance;
    dueDate?: string;
    description: string;
  }) {
    if (!taskToEdit) return;

    setEditingTask(true);
    setError(null);

    try {
      const updated = await updateTask(taskToEdit.id, {
        clientId: data.clientId ?? null,
        title: data.title,
        description: data.description,
        taskType: data.taskType,
        importance: data.importance,
        dueDate: data.dueDate?.trim() || taskToEdit.dueDateValue,
      });

      setTasks((current) => current.map((task) => (task.id === taskToEdit.id ? updated : task)));
      setTaskToEdit(null);
    } catch (updateError) {
      logger.error("Failed to edit task", { error: updateError, taskId: taskToEdit.id });
      setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    } finally {
      setEditingTask(false);
    }
  }

  async function handleDeleteTask() {
    if (!taskToDelete) return;

    setDeletingTask(true);
    setError(null);

    try {
      await deleteTask(taskToDelete.id);
      setTasks((current) => current.filter((task) => task.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (deleteError) {
      logger.error("Failed to delete task", { error: deleteError, taskId: taskToDelete.id });
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete task.");
    } finally {
      setDeletingTask(false);
    }
  }

  const filtered = tasks.filter((task) => {
    if (activeTaskTab === "created" && task.automated) return false;
    if (activeTaskTab === "automated" && !task.automated) return false;
    if (!showCompleted && task.completed) return false;
    if (typeFilter !== "All" && task.taskType !== typeFilter) return false;
    if (importanceFilter !== "All" && task.importance !== importanceFilter) return false;
    return true;
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  const createdCount = tasks.filter((task) => !task.automated).length;
  const automatedCount = tasks.filter((task) => task.automated).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {showCreateTaskModal && (
          <TaskFormModal
            mode="create"
            clients={clients}
            saving={creatingTask}
            onClose={() => !creatingTask && setShowCreateTaskModal(false)}
            onSave={handleCreateTask}
          />
        )}
        {taskToEdit && (
          <TaskFormModal
            key={taskToEdit.id}
            mode="edit"
            task={taskToEdit}
            clients={clients}
            saving={editingTask}
            onClose={() => !editingTask && setTaskToEdit(null)}
            onSave={handleEditTask}
          />
        )}
        {showCreateAutomatedTaskModal && (
          <CreateAutomatedTaskModal
            clients={clients}
            saving={creatingTask}
            onClose={() => !creatingTask && setShowCreateAutomatedTaskModal(false)}
            onSave={handleCreateAutomatedTask}
          />
        )}
        {taskToDelete && (
          <DeleteTaskConfirmModal
            task={taskToDelete}
            deleting={deletingTask}
            onClose={() => !deletingTask && setTaskToDelete(null)}
            onConfirm={handleDeleteTask}
          />
        )}

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Task
            </button>
            <button
              onClick={() => setShowCreateAutomatedTaskModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Create Automated Task
            </button>
            <button
              onClick={() => setShowCompleted((value) => !value)}
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
        </div>

        {loading && (
          <div className="bg-card rounded-2xl border border-border px-6 py-10 text-sm text-muted-foreground">
            Loading tasks...
          </div>
        )}

        {error && !loading && (
          <div className="bg-card rounded-2xl border border-destructive/20 px-6 py-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTaskTab("created")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              activeTaskTab === "created"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            Created
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px]",
                activeTaskTab === "created"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {createdCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTaskTab("automated")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              activeTaskTab === "automated"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            Automated
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px]",
                activeTaskTab === "automated"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {automatedCount}
            </span>
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
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
            {ALL_TYPES.map((taskType) => (
              <button
                key={taskType}
                onClick={() => setTypeFilter(typeFilter === taskType ? "All" : taskType)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  typeFilter === taskType
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {taskType}
              </button>
            ))}
          </div>

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
            {ImportanceOptions.map((importance) => (
              <button
                key={importance}
                onClick={() => setImportanceFilter(importanceFilter === importance ? "All" : importance)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize",
                  importanceFilter === importance
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {importance}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((task) => (
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
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {task.completed ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        TASK_TYPE_STYLES[task.taskType]
                      )}
                    >
                      {task.taskType}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize",
                        IMPORTANCE_STYLES[task.importance]
                      )}
                    >
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
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {task.dueDate}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTaskToEdit(task)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${task.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskToDelete(task)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${task.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p
                    className={cn(
                      "text-sm font-semibold leading-snug",
                      task.completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    {task.title}
                  </p>

                  <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>

                  {task.associatedCompanyName && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      {task.associatedCompanyId ? (
                        <Link
                          to={`/clients/${task.associatedCompanyId}?from=${task.associatedCompanyOrigin ?? "clients"}`}
                          className="text-xs font-semibold text-primary hover:underline transition-colors"
                        >
                          {task.associatedCompanyName}
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">{task.associatedCompanyName}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm bg-card rounded-2xl border border-border">
              No tasks match the current filters.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function TaskFormModal({
  mode,
  task,
  clients,
  saving,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  task?: ExtendedTask;
  clients: Client[];
  saving: boolean;
  onSave: (data: {
    taskType: TaskType;
    title: string;
    clientId?: string;
    importance: Importance;
    dueDate?: string;
    description: string;
  }) => void;
  onClose: () => void;
}) {
  const initialClient = task?.associatedCompanyId
    ? clients.find((client) => client.id === task.associatedCompanyId) ?? null
    : null;
  const [taskType, setTaskType] = useState<TaskType>(task?.taskType ?? "Follow-Up");
  const [title, setTitle] = useState(task?.title ?? "");
  const [companySearch, setCompanySearch] = useState(initialClient?.companyName ?? task?.associatedCompanyName ?? "");
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient);
  const [importance, setImportance] = useState<Importance>(task?.importance ?? "LOW");
  const [dueDate, setDueDate] = useState(task?.dueDateValue ?? "");
  const [description, setDescription] = useState(task?.description ?? "");

  const isValid = title.trim() !== "" && description.trim() !== "";
  const normalizedSearch = companySearch.trim().toLowerCase();
  const matchingClients = normalizedSearch.length === 0
    ? []
    : clients.filter((client) => client.companyName.toLowerCase().includes(normalizedSearch)).slice(0, 6);

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setCompanySearch(client.companyName);
  }

  function handleCompanySearchChange(value: string) {
    setCompanySearch(value);
    if (selectedClient && value.trim() !== selectedClient.companyName) {
      setSelectedClient(null);
    }
  }

  function handleSave() {
    if (!isValid || saving) return;

    onSave({
      taskType,
      title: title.trim(),
      clientId: selectedClient?.id,
      importance,
      dueDate: dueDate.trim() || undefined,
      description: description.trim(),
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">{mode === "edit" ? "Edit Task" : "Create Task"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "edit"
                ? "Update the task details below."
                : "This task will be assigned to your rep profile automatically."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Task Type
              </label>
              <CustomSelect
                value={taskType}
                onChange={(value) => setTaskType(value as TaskType)}
                options={(["Prospecting", "Follow-Up", "Training", "Other"] as TaskType[]).map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Importance
              </label>
              <CustomSelect
                value={importance}
                onChange={(value) => setImportance(value as Importance)}
                options={ImportanceOptions.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a concise task title"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Client Company
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={companySearch}
                onChange={(event) => handleCompanySearchChange(event.target.value)}
                placeholder="Search for a client company"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setCompanySearch("");
                  }}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {selectedClient ? (
              <p className="mt-1.5 text-xs text-primary">
                Selected company will attach client ID for {selectedClient.companyName}.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">Optional. Choose a company to attach its client record.</p>
            )}
            {!selectedClient && matchingClients.length > 0 && (
              <div className="mt-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {matchingClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-muted/40 transition-colors"
                  >
                    <span className="font-medium text-foreground">{client.companyName}</span>
                    <span className="text-xs text-muted-foreground">{client.clientId || client.id}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedClient && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Check className="h-3.5 w-3.5" />
                {selectedClient.companyName}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Optional</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add details and context for the task..."
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || saving}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (mode === "edit" ? "Saving..." : "Creating...") : (mode === "edit" ? "Save changes" : "Create Task")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DeleteTaskConfirmModal({
  task,
  deleting,
  onClose,
  onConfirm,
}: {
  task: ExtendedTask;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Delete Task?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Remove <span className="font-semibold text-foreground">{task.title}</span> from your task list?
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            This will permanently delete the task and its current progress.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete task"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CreateAutomatedTaskModal({
  clients,
  saving,
  onSave,
  onClose,
}: {
  clients: Client[];
  saving: boolean;
  onSave: (data: {
    taskType: TaskType;
    importance: Importance;
    description: string;
    applyToAllClients: boolean;
    clientId?: string;
    triggerType: AutomatedTriggerType;
    dateRange: AutomatedDateRange;
  }) => void;
  onClose: () => void;
}) {
  const [taskType, setTaskType] = useState<TaskType>("Follow-Up");
  const [importance, setImportance] = useState<Importance>("LOW");
  const [description, setDescription] = useState("");
  const [applyToAllClients, setApplyToAllClients] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [triggerType, setTriggerType] = useState<AutomatedTriggerType>("follow_up");
  const [dateRange, setDateRange] = useState<AutomatedDateRange>("30 days");

  const isValid = description.trim() !== "" && (applyToAllClients || selectedClient !== null);
  const normalizedSearch = companySearch.trim().toLowerCase();
  const matchingClients = applyToAllClients || normalizedSearch.length === 0
    ? []
    : clients.filter((client) => client.companyName.toLowerCase().includes(normalizedSearch)).slice(0, 6);

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setCompanySearch(client.companyName);
    setApplyToAllClients(false);
  }

  function handleCompanySearchChange(value: string) {
    setCompanySearch(value);
    setApplyToAllClients(false);
    if (selectedClient && value.trim() !== selectedClient.companyName) {
      setSelectedClient(null);
    }
  }

  function handleSave() {
    if (!isValid || saving) return;

    onSave({
      taskType,
      importance,
      description: description.trim(),
      applyToAllClients,
      clientId: applyToAllClients ? undefined : selectedClient?.id,
      triggerType,
      dateRange,
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[230] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Create Automated Task</h2>
            <p className="text-xs text-muted-foreground mt-0.5">This workflow will assign tasks to your current rep profile automatically.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Task Type
              </label>
              <CustomSelect
                value={taskType}
                onChange={(value) => setTaskType(value as TaskType)}
                options={ALL_TYPES.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Importance
              </label>
              <CustomSelect
                value={importance}
                onChange={(value) => setImportance(value as Importance)}
                options={[
                  ...ImportanceOptions.map((option) => ({
                    value: option,
                    label: option,
                  })),
                  { value: "All", label: "All" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Client Scope
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setApplyToAllClients(false)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                  !applyToAllClients
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                Specific Client
              </button>
              <button
                type="button"
                onClick={() => {
                  setApplyToAllClients(true);
                  setSelectedClient(null);
                  setCompanySearch("");
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                  applyToAllClients
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                All Clients
              </button>
            </div>

            {!applyToAllClients && (
              <div className="mt-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(event) => handleCompanySearchChange(event.target.value)}
                    placeholder="Search for a client company"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  {selectedClient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null);
                        setCompanySearch("");
                      }}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {!selectedClient && matchingClients.length > 0 && (
                  <div className="mt-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    {matchingClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-muted/40 transition-colors"
                      >
                        <span className="font-medium text-foreground">{client.companyName}</span>
                        <span className="text-xs text-muted-foreground">{client.clientId || client.id}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedClient && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Check className="h-3.5 w-3.5" />
                    {selectedClient.companyName}
                  </div>
                )}
              </div>
            )}

            {applyToAllClients && (
              <p className="mt-2 text-xs text-primary">The automated task will be created for all available clients.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Trigger Type
              </label>
              <CustomSelect
                value={triggerType}
                onChange={(value) => setTriggerType(value as AutomatedTriggerType)}
                options={AUTOMATED_TRIGGER_OPTIONS.map((option) => ({
                  value: option.key,
                  label: option.label,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Date Range
              </label>
              <CustomSelect
                value={dateRange}
                onChange={(value) => setDateRange(value as AutomatedDateRange)}
                options={AUTOMATED_RANGE_OPTIONS.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what to do when this automated task is created..."
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || saving}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Creating..." : "Create Automated Task"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function buildAutomatedTaskTitle(companyName: string, triggerType: AutomatedTriggerType, dateRange: AutomatedDateRange) {
  return `${formatTriggerLabel(triggerType)}: ${companyName} (${dateRange})`;
}

function formatTriggerLabel(triggerType: AutomatedTriggerType) {
  return triggerType
    .split("_")
    .map((part) => part === "avg" ? "Avg" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
