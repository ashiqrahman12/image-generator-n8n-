"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option {
    id: string;
    label: string;
}

interface SimpleSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: readonly Option[];
    placeholder?: string;
    className?: string; // Trigger class
}

export function SimpleSelect({ value, onChange, options, placeholder = "Select...", className }: SimpleSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.id === value)?.label || placeholder;

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-all border rounded-xl bg-zinc-900/50 border-white/10 hover:border-white/20 active:scale-[0.98]",
                    isOpen ? "ring-2 ring-white/10" : "",
                    "text-white",
                    className
                )}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className={cn("w-4 h-4 ml-2 opacity-50 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 overflow-hidden border shadow-2xl rounded-xl bg-zinc-950 border-white/10"
                    >
                        <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "relative flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-colors outline-none cursor-pointer",
                                        value === option.id
                                            ? "bg-white text-black font-medium"
                                            : "text-zinc-300 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    <span className="flex-1 text-left truncate">{option.label}</span>
                                    {value === option.id && (
                                        <Check className="w-4 h-4 ml-2 text-black" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
