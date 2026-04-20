import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import CustomSelect from "@/components/shared/CustomSelect";
import { ImportanceOptions } from "@/types/constants";
import type { Importance, TaskType } from "@/types/api";

type AddTaskModalProps = {
  companyName: string;
  onSave: (data: { taskType: TaskType; importance: Importance; dueDate: string; notes: string }) => void;
  onClose: () => void;
};

export function AddTaskModal({
  companyName,
  onSave,
  onClose,
}: AddTaskModalProps) {
  const [taskType, setTaskType] = useState<TaskType>("Follow-Up");
  const [importance, setImportance] = useState<Importance>("MEDIUM");
  const [dueDate, setDueDate] = useState<string>(() => {
    const today = new Date();
    return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");

  const isValid = dueDate.trim() !== "" && notes.trim() !== "";

  function handleSave() {
    if (!isValid) return;
    onSave({
      taskType,
      importance,
      dueDate,
      notes: notes.trim(),
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Create Task</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <X className="w-4 h-4" />
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
                onChange={value => setTaskType(value as TaskType)}
                options={(["Prospecting", "Follow-Up", "Training", "Other"] as TaskType[]).map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Criticality
              </label>
              <CustomSelect
                value={importance}
                onChange={value => setImportance(value as Importance)}
                options={ImportanceOptions.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add context for the task..."
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
            disabled={!isValid}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
