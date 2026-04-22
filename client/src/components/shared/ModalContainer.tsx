import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

type ModalContainerProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  icon?: ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  footerStart?: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  titleClassName?: string;
  hideCloseButton?: boolean;
};

const SECONDARY_ACTION_CLASSNAME =
  "inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed";

const PRIMARY_ACTION_CLASSNAME =
  "inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed";

function ModalActionButton({
  action,
  defaultClassName,
}: {
  action: ModalAction;
  defaultClassName: string;
}) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(defaultClassName, action.className)}
    >
      {action.label}
    </button>
  );
}

export function ModalContainer({
  title,
  description,
  children,
  onClose,
  icon,
  primaryAction,
  secondaryAction,
  footerStart,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
  titleClassName,
  hideCloseButton = false,
}: ModalContainerProps) {
  const hasFooter = Boolean(primaryAction || secondaryAction || footerStart);

  return (
    <div className={cn("relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl", className)}>
      <div className={cn("flex items-start justify-between gap-4 border-b border-border/50 px-6 pt-6 pb-4 shrink-0", headerClassName)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className={cn("text-xl font-display font-bold text-foreground", titleClassName)}>{title}</h2>
          </div>
          {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
        </div>

        {!hideCloseButton && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className={cn("flex-1 overflow-y-auto px-6 py-5", bodyClassName)}>
        {children}
      </div>

      {hasFooter ? (
        <div className={cn("flex items-center justify-between gap-3 border-t border-border/50 bg-muted/10 px-6 py-4 shrink-0", footerClassName)}>
          <div className="min-w-0">{footerStart}</div>
          <div className="flex items-center gap-3">
            {secondaryAction ? <ModalActionButton action={secondaryAction} defaultClassName={SECONDARY_ACTION_CLASSNAME} /> : null}
            {primaryAction ? <ModalActionButton action={primaryAction} defaultClassName={PRIMARY_ACTION_CLASSNAME} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
