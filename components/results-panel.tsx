"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, Download, RefreshCw, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface ResultsPanelProps {
  onReset: () => void
  configId?: number
}

export function ResultsPanel({ onReset, configId }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonResult, setJsonResult] = useState("")
  const { toast } = useToast()

  // Charger les résultats de conversion
  useEffect(() => {
    const loadResults = async () => {
      if (!configId) {
        // Utiliser des données de démo si aucun ID de configuration n'est fourni
        setJsonResult(sampleJsonResult)
        return
      }

      setIsLoading(true)
      try {
        // Dans une implémentation réelle, nous utiliserions getConversionResults
        // const results = await getConversionResults(configId)
        // setJsonResult(JSON.stringify(results, null, 2))

        // Simuler un délai de chargement
        setTimeout(() => {
          setJsonResult(sampleJsonResult)
          setIsLoading(false)
        }, 1500)
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Erreur lors du chargement des résultats",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadResults()
  }, [configId, toast])

  // Sample JSON result
  const sampleJsonResult = `[
  {
    "fullName": "John Smith",
    "emailAddress": "john.smith@example.com",
    "accountNumber": "ACC123456789",
    "balance": 15000.75,
    "currency": "USD",
    "lastTransaction": "2023-05-15"
  },
  {
    "fullName": "Sarah Johnson",
    "emailAddress": "sarah.j@example.com",
    "accountNumber": "ACC987654321",
    "balance": 42500.50,
    "currency": "USD",
    "lastTransaction": "2023-05-10"
  },
  {
    "fullName": "Michael Brown",
    "emailAddress": "m.brown@example.com",
    "accountNumber": "ACC456789123",
    "balance": 8750.25,
    "currency": "USD",
    "lastTransaction": "2023-05-12"
  }
]`

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // Créer un blob avec le contenu JSON
    const blob = new Blob([jsonResult], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Créer un lien de téléchargement et cliquer dessus
    const a = document.createElement("a")
    a.href = url
    a.download = "conversion_result.json"
    document.body.appendChild(a)
    a.click()

    // Nettoyer
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Téléchargement",
      description: "Le fichier JSON a été téléchargé avec succès",
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-[#F55B3B] animate-spin mb-4" />
        <p className="text-lg font-medium text-slate-800 dark:text-white">Chargement des résultats...</p>
        <p className="text-sm text-slate-500 dark:text-white/60 mt-2">
          Veuillez patienter pendant que nous récupérons les données de conversion
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 text-slate-800 dark:text-white transition-colors duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Conversion Result</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={`
              backdrop-blur-sm transition-all duration-300
              ${
                copied
                  ? "bg-[#FCBD00]/10 dark:bg-[#FCBD00]/10 border-[#FCBD00] dark:border-[#FCBD00] text-[#FCBD00] dark:text-[#FCBD00]"
                  : "bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              } transition-colors duration-500
            `}
          >
            {copied ? (
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center">
                <Check className="h-4 w-4 mr-2" />
                Copied
              </motion.div>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[#F55B3B] dark:hover:text-[#F55B3B] transition-colors duration-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {configId && (
        <div className="p-3 rounded-lg bg-[#F55B3B]/10 border border-[#F55B3B]/30 flex items-start gap-3">
          <Check className="h-5 w-5 text-[#F55B3B] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white">Configuration ID: {configId}</p>
            <p className="text-sm text-slate-600 dark:text-white/70">
              Les données ont été converties avec succès selon cette configuration
            </p>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#F55B3B] to-[#FCBD00] dark:from-[#F55B3B] dark:to-[#FCBD00] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative rounded-xl bg-white dark:bg-[#17171E] backdrop-blur-xl border border-slate-200 dark:border-white/10 overflow-hidden transition-colors duration-500">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 transition-colors duration-500">
            <h3 className="font-medium">JSON Output</h3>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-[#F55B3B] dark:bg-[#F55B3B] transition-colors duration-500" />
              <div className="h-3 w-3 rounded-full bg-[#FCBD00] dark:bg-[#FCBD00] transition-colors duration-500" />
              <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-white/20 transition-colors duration-500" />
            </div>
          </div>
          <div className="p-4 overflow-auto max-h-[400px]">
            <pre className="text-sm font-mono">
              <code className="text-slate-700 dark:text-white/90 transition-colors duration-500">{jsonResult}</code>
            </pre>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center p-4 rounded-xl bg-gradient-to-r from-[#F55B3B]/20 to-transparent dark:from-[#F55B3B]/20 dark:to-transparent backdrop-blur-sm border border-[#F55B3B]/30 dark:border-[#F55B3B]/30 transition-colors duration-500"
      >
        <div className="text-sm mb-4 sm:mb-0">
          <p className="font-medium">Conversion successful</p>
          <p className="text-slate-500 dark:text-white/60 transition-colors duration-500">
            3 records converted • {new Date().toLocaleDateString()}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={onReset}
            className="border-[#F55B3B] dark:border-[#F55B3B] text-[#F55B3B] dark:text-[#F55B3B] hover:bg-[#F55B3B]/10 dark:hover:bg-[#F55B3B]/10 backdrop-blur-sm transition-colors duration-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Conversion
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

