import Dashboard from "@/components/dashboard"
import { ThemeToggle } from "@/components/theme-toggle"

// This page component can be simpler if Dashboard handles the active section
// or it can set a default active section for the Dashboard.
// For now, let's assume the Dashboard can be made to show the correct section
// or we adjust the Dashboard to accept an initialSection prop.

// For simplicity, we'll rely on the sidebar navigation to set the active section.
// If direct navigation to /json-to-flat should open this section,
// the Dashboard component would need to be aware of the current route
// or be passed an initial active section.

export default function JsonToFlatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#17171E] dark:to-[#1a1a24] relative overflow-hidden transition-colors duration-500">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#F55B3B]/10 dark:bg-[#F55B3B]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#FCBD00]/10 dark:bg-[#FCBD00]/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Geometric patterns */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#17171E_1px,transparent_1px),linear-gradient(to_bottom,#17171E_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#17171E_1px,transparent_1px),linear-gradient(to_bottom,#17171E_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-[0.03] dark:opacity-10" />
      </div>

      <div className="relative">
        <header className="border-b border-slate-200 dark:border-white/10 backdrop-blur-xl bg-white/70 dark:bg-black/20 transition-colors duration-500">
          <div className="container mx-auto py-6 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-br from-[#F55B3B] to-[#ff7b5b] dark:from-[#F55B3B] dark:to-[#ff7b5b] rounded-lg shadow-lg shadow-[#F55B3B]/25 dark:shadow-[#F55B3B]/25 animate-pulse transition-colors duration-500" />
                  <div className="h-8 w-8 bg-gradient-to-br from-[#FCBD00] to-[#ffd747] dark:from-[#FCBD00] dark:to-[#ffd747] rounded-lg shadow-lg shadow-[#FCBD00]/25 dark:shadow-[#FCBD00]/25 animate-pulse delay-700 transition-colors duration-500" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-white/70 transition-colors duration-500">
                  JsonForm: Conversion JSON vers Fichier Plat
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8 px-4">
          {/* The Dashboard component will render the correct active section based on sidebar clicks */}
          {/* To make /json-to-flat directly show the content, Dashboard would need modification */}
          {/* For now, clicking "JSON -> Plat" in the sidebar will show the content */}
          <Dashboard />
        </div>
      </div>
    </main>
  )
}