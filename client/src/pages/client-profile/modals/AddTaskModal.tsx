import { useState } from "react";
import { createPortal } from "react-dom";
import CustomSelect from "@/components/shared/CustomSelect";
import { ModalContainer } from "@/components/shared/ModalContainer";
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
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 px-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        <ModalContainer
          title="Create Task"
          description={companyName}
          onClose={onClose}
          className="max-w-lg"
          bodyClassName="space-y-4"
          secondaryAction={{ label: "Cancel", onClick: onClose }}
          primaryAction={{ label: "Create Task", onClick: handleSave, disabled: !isValid }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Criticality
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add context for the task..."
              rows={5}
              className="w-full resize-none rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </ModalContainer>
      </div>
    </div>,
    document.body,
  );
}
