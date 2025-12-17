"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/components/ImageGenerator" // Reusing cn utility or I should define new utils

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-10 h-10" /> // Placeholder to prevent layout shift
    }

    const isDark = theme === "dark"

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center overflow-hidden transition-colors border border-border"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                >
                    {isDark ? (
                        <Moon className="h-5 w-5 text-primary" />
                    ) : (
                        <Sun className="h-5 w-5 text-primary" />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    )
}
