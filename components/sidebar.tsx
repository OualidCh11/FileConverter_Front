"use client"

import type React from "react"

import { motion } from "framer-motion"
import { BarChart3, FileUp, Settings, FileJson, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Tableau De Bord",
      icon: BarChart3,
    },
    {
      id: "upload",
      label: "Télécharger",
      icon: FileUp,
    },
    {
      id: "configure",
      label: "Configurer",
      icon: Settings,
    },
    {
      id: "result",
      label: "Résultat",
      icon: FileJson,
    },
    {
      id: "json-to-flat",
      label: "JSON -> Plat",
      icon: ArrowRightLeft,
    },
  ]

  return (
    <div className="w-full md:w-64 md:min-w-64 backdrop-blur-xl bg-white/80 dark:bg-white/10 rounded-2xl shadow-xl border border-slate-200 dark:border-white/20 overflow-hidden transition-colors duration-500">
      <div className="p-4">
        <div className="flex items-center gap-3 p-2 mb-6">
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-[#F55B3B] to-[#ff7b5b] rounded-lg shadow-lg shadow-[#F55B3B]/25 animate-pulse transition-colors duration-500" />
            <div className="h-8 w-8 bg-gradient-to-br from-[#FCBD00] to-[#ffd747] rounded-lg shadow-lg shadow-[#FCBD00]/25 animate-pulse delay-700 transition-colors duration-500" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white transition-colors duration-500">JsonForm</h3>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-300",
                activeSection === item.id
                  ? "bg-gradient-to-r from-[#F55B3B] to-[#ff7b5b] text-white shadow-md shadow-[#F55B3B]/20"
                  : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70",
              )}
            >
              <item.icon className={cn("h-5 w-5", activeSection === item.id ? "text-white" : "text-[#F55B3B]")} />
              <span>{item.label}</span>
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto h-2 w-2 rounded-full bg-white"
                  transition={{ type: "spring", duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
