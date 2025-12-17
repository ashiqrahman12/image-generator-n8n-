"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlowingBorderProps extends React.HTMLAttributes<HTMLDivElement> {
    containerClassName?: string;
}

export const GlowingBorder = ({
    children,
    className,
    containerClassName,
    ...props
}: GlowingBorderProps) => {
    return (
        <div
            className={cn(
                "relative rounded-xl overflow-hidden p-[2px]", // p-[2px] creates the border width
                containerClassName
            )}
            {...props}
        >
            {/* Spinning Gradient Layer */}
            <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_50%,#FF6B00_100%)]" />

            {/* Inner Content Layer (Masks the center) */}
            <div className={cn("relative h-full w-full bg-black rounded-xl", className)}>
                {children}
            </div>
        </div>
    );
};
