import { cn } from "@/lib/utils";
import type { FormStatus } from "@/lib/api";

export function StatusChip({ status, className }: { status: FormStatus; className?: string }) {
  const isCompleted = status === "Completed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        isCompleted
          ? "bg-success/20 text-success-foreground ring-success/30"
          : "bg-warning/25 text-warning-foreground ring-warning/40",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isCompleted ? "bg-success" : "bg-warning"
        )}
      />
      {status}
    </span>
  );
}
