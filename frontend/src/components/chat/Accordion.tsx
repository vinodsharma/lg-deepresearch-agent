// frontend/src/components/chat/Accordion.tsx
import { ChevronDown } from "lucide-react";
import { ReactNode, useState } from "react";

export interface AccordionProps {
  header: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  icon?: ReactNode;
}

export function Accordion({
  header,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  icon,
}: AccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newValue = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(newValue);
    }
    onToggle?.(newValue);
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
      >
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="flex-1 text-sm font-medium text-slate-300">{header}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700/50">
          {children}
        </div>
      )}
    </div>
  );
}
