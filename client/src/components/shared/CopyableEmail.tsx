import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyableEmailProps = {
  email: string;
  className?: string;
};

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";

  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export function CopyableEmail({ email, className }: CopyableEmailProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await copyToClipboard(email);
      setIsCopied(true);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy email to clipboard", error);
    }
  };

  return (
    <div
      className={cn(
        "group inline-flex min-w-0 items-center rounded-lg border border-border bg-muted/20 text-xs font-medium text-foreground transition-all hover:border-primary/30",
        className
      )}
    >
      <a
        href={`mailto:${email}`}
        className="inline-flex min-w-0 flex-1 items-center gap-1.5 px-3 py-1.5 hover:text-primary transition-colors"
      >
        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{email}</span>
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 group-hover:opacity-100"
        aria-label={isCopied ? `Copied ${email}` : `Copy ${email} to clipboard`}
        title={isCopied ? "Copied" : "Copy email"}
      >
        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
