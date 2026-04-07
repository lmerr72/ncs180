import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CustomSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  itemClassName?: string;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
  contentClassName,
  itemClassName,
}: CustomSelectProps) {
  return (
    <Select
      value={value && value.length > 0 ? value : undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-auto min-h-[46px] rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm shadow-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "z-[320] max-h-72 overflow-y-auto rounded-xl border-2 border-border bg-background p-1.5 shadow-xl",
          contentClassName,
        )}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn("rounded-lg px-3.5 py-2.5 text-sm", itemClassName)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
