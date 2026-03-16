import * as React from "react";
import { cn } from "@/lib/utils";

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "value"> {
  value: string | number;
  onValueChange: (value: string) => void;
  /** Max decimal places (default 2) */
  decimals?: number;
}

/**
 * Numeric input that supports both dot and comma as decimal separators.
 * Prevents focus loss on comma/dot press (numpad-friendly).
 * Stores value as string with dot internally.
 */
const DecimalInput = React.memo(
  React.forwardRef<HTMLInputElement, DecimalInputProps>(
    ({ className, value, onValueChange, decimals = 2, ...props }, ref) => {
      const [localVal, setLocalVal] = React.useState(() => String(value ?? "").replace(".", ","));

      // Sync from parent only when value actually changes externally
      const parentVal = String(value ?? "");
      const prevParentRef = React.useRef(parentVal);
      React.useEffect(() => {
        if (prevParentRef.current !== parentVal) {
          prevParentRef.current = parentVal;
          // Don't overwrite if user is actively typing (local has trailing comma)
          const normalizedLocal = localVal.replace(",", ".");
          if (normalizedLocal !== parentVal) {
            setLocalVal(parentVal.replace(".", ","));
          }
        }
      }, [parentVal]);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value;

        // Allow empty
        if (raw === "") {
          setLocalVal("");
          onValueChange("");
          return;
        }

        // Replace dot with comma for display consistency
        raw = raw.replace(".", ",");

        // Validate: digits, optional one comma, up to N decimal places
        const regex = new RegExp(`^\\d*,?\\d{0,${decimals}}$`);
        if (!regex.test(raw)) return;

        setLocalVal(raw);
        onValueChange(raw.replace(",", "."));
      };

      return (
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          value={localVal}
          onChange={handleChange}
          {...props}
        />
      );
    },
  ),
);
DecimalInput.displayName = "DecimalInput";

export { DecimalInput };
export type { DecimalInputProps };
