import Dashboard from "@/components/dashboard"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
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
                <div className="flex space-x-2 p-10">
                  <div className="flex space-x-2">
                    <img
                      src="/Attijariwafa Bank-vector.ma.svg-vector.ma (1).png" 
                      alt="Logo Attijariwafa Bank" 
                      className="h-24 w-auto" 
                    />
                  </div>
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-white/70 transition-colors duration-500">
                    JsonForm: La clé pour convertir tous vos fichiers en JSON
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8 px-4">
          <Dashboard />
        </div>
      </div>
    </main>
  )
}

