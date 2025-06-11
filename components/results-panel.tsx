"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Check,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileJson,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { getJsonFileContent } from "@/lib/api-service"

interface ResultsPanelProps {
  onReset: () => void
  configId?: number
  fileName?: string
}

export function ResultsPanel({ onReset, configId, fileName }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [jsonResult, setJsonResult] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [recordCount, setRecordCount] = useState<number>(0)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Charger les résultats de conversion
  useEffect(() => {
    const loadResults = async () => {
      if (!configId) {
        // Utiliser des données de démo si aucun ID de configuration n'est fourni
        setTimeout(() => {
          setJsonResult(sampleComplexJsonResult)
          setRecordCount(3) // Nombre d'enregistrements dans l'exemple
          setIsLoading(false)
        }, 1000)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        // Récupérer le contenu du fichier JSON généré
        const jsonContent = await getJsonFileContent(fileName || "output.json")
        console.log("Contenu JSON récupéré:", jsonContent)

        // Essayer de parser le JSON pour le formater correctement
        try {
          let parsedJson
          try {
            // Essayer de parser le JSON tel quel
            parsedJson = JSON.parse(jsonContent)
          } catch (e) {
            // Si ça échoue, essayer de parser en extrayant le JSON de la réponse
            const jsonMatch = jsonContent.match(/\[.*\]/s)
            if (jsonMatch) {
              parsedJson = JSON.parse(jsonMatch[0])
            } else {
              throw e
            }
          }

          // Formater le JSON pour l'affichage
          const formattedJson = JSON.stringify(parsedJson, null, 2)
          setJsonResult(formattedJson)

          // Calculer le nombre d'enregistrements
          if (Array.isArray(parsedJson)) {
            setRecordCount(parsedJson.length)
          } else {
            setRecordCount(1)
          }
        } catch (parseError) {
          console.warn("Erreur de parsing JSON:", parseError)
          // Si le parsing échoue, afficher le contenu brut
          setJsonResult(jsonContent)
          setRecordCount(1)
        }

        toast({
          title: "Succès",
          description: "Les résultats de conversion ont été chargés avec succès",
        })
      } catch (error) {
        console.error("Erreur lors du chargement des résultats:", error)
        setError(error instanceof Error ? error.message : "Erreur lors du chargement des résultats")

        // Utiliser des données de démo en cas d'erreur
        setJsonResult(sampleComplexJsonResult)
        setRecordCount(3) // Nombre d'enregistrements dans l'exemple

        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Erreur lors du chargement des résultats",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [configId, fileName, toast])

  // Sample JSON result avec la structure complexe
  const sampleComplexJsonResult = `[
  {
    "info1a": "John Doe",
    "info1b": "35",
    "info1c": "Paris",
    "info1d": "Manager",
    "info1e": "2023-01-15",
    "info1f": "Active",
    "info1g": "Premium",
    "info2": [
      {
        "info2.1": {
          "info": "Contact Principal",
          "info2": "john.doe@email.com",
          "info3": "+33123456789",
          "info4": "Professionnel",
          "info5": "Préféré"
        },
        "info2.2": {
          "info": "Adresse",
          "info2": "123 Rue de la Paix",
          "info3": "75001",
          "info4": "Paris"
        },
        "info2.3": {
          "info": "Informations Financières",
          "info2": "EUR",
          "info3": "15000.50",
          "info4": "Compte Courant",
          "info5": "FR7612345678901234567890",
          "info6": "BNP Paribas",
          "info7": "BNPAFRPP",
          "info8": "2025-12-31",
          "info9": "Actif",
          "info10": "Niveau 3"
        }
      }
    ]
  },
  {
    "info1a": "Jane Smith",
    "info1b": "28",
    "info1c": "London",
    "info1d": "Developer",
    "info1e": "2023-02-20",
    "info1f": "Active",
    "info1g": "Standard",
    "info2": [
      {
        "info2.1": {
          "info": "Contact Principal",
          "info2": "jane.smith@email.com",
          "info3": "+44987654321",
          "info4": "Personnel",
          "info5": "Standard"
        },
        "info2.2": {
          "info": "Adresse",
          "info2": "456 Baker Street",
          "info3": "NW1 6XE",
          "info4": "London"
        },
        "info2.3": {
          "info": "Informations Financières",
          "info2": "GBP",
          "info3": "8750.25",
          "info4": "Compte Épargne",
          "info5": "GB82WEST12345698765432",
          "info6": "Barclays",
          "info7": "BARCGB22",
          "info8": "2024-06-30",
          "info9": "Actif",
          "info10": "Niveau 2"
        }
      }
    ]
  },
  {
    "info1a": "Bob Johnson",
    "info1b": "42",
    "info1c": "New York",
    "info1d": "Director",
    "info1e": "2023-03-10",
    "info1f": "Active",
    "info1g": "VIP",
    "info2": [
      {
        "info2.1": {
          "info": "Contact Principal",
          "info2": "bob.johnson@email.com",
          "info3": "+1234567890",
          "info4": "Professionnel",
          "info5": "VIP"
        },
        "info2.2": {
          "info": "Adresse",
          "info2": "789 Fifth Avenue",
          "info3": "10022",
          "info4": "New York"
        },
        "info2.3": {
          "info": "Informations Financières",
          "info2": "USD",
          "info3": "42500.75",
          "info4": "Compte Premium",
          "info5": "US1234567890123456789012",
          "info6": "Chase Bank",
          "info7": "CHASUS33",
          "info8": "2026-03-15",
          "info9": "Actif",
          "info10": "Niveau 5"
        }
      }
    ]
  }
]`

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Copié",
      description: "Le JSON a été copié dans le presse-papiers",
    })
  }

  const handleDownload = () => {
    // Créer un blob avec le contenu JSON
    const blob = new Blob([jsonResult], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Créer un lien de téléchargement et cliquer dessus
    const a = document.createElement("a")
    a.href = url
    a.download = fileName || "conversion_result.json"
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

  // Fonction pour rendre la structure JSON de manière interactive
  const renderJsonStructure = () => {
    try {
      const parsedJson = JSON.parse(jsonResult)
      if (!Array.isArray(parsedJson)) return null

      return (
        <div className="space-y-4">
          {parsedJson.map((record, index) => (
            <div key={index} className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(`record-${index}`)}
                className="w-full p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-between transition-colors duration-200"
              >
                <span className="font-medium text-slate-800 dark:text-white">
                  Enregistrement {index + 1} - {record.info1a || `Record ${index + 1}`}
                </span>
                {expandedSections.has(`record-${index}`) ? (
                  <ChevronDown className="h-4 w-4 text-slate-600 dark:text-white/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-600 dark:text-white/60" />
                )}
              </button>

              {expandedSections.has(`record-${index}`) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 space-y-4"
                >
                  {/* Informations principales */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(record).map(([key, value]) => {
                      if (key === "info2") return null
                      return (
                        <div key={key} className="p-2 bg-slate-50 dark:bg-white/5 rounded">
                          <div className="text-xs font-medium text-slate-500 dark:text-white/60">{key}</div>
                          <div className="text-sm text-slate-800 dark:text-white">{value as string}</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Section info2 */}
                  {record.info2 && Array.isArray(record.info2) && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-800 dark:text-white">Informations détaillées</h4>
                      {record.info2.map((info2Item, info2Index) => (
                        <div key={info2Index} className="space-y-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                          {Object.entries(info2Item).map(([sectionKey, sectionValue]) => (
                            <div key={sectionKey} className="space-y-2">
                              <button
                                onClick={() => toggleSection(`record-${index}-${sectionKey}`)}
                                className="w-full flex items-center justify-between p-2 bg-white dark:bg-white/10 rounded hover:bg-slate-100 dark:hover:bg-white/20 transition-colors duration-200"
                              >
                                <span className="font-medium text-sm text-slate-700 dark:text-white/90">
                                  {sectionKey}
                                </span>
                                {expandedSections.has(`record-${index}-${sectionKey}`) ? (
                                  <ChevronDown className="h-3 w-3 text-slate-500 dark:text-white/50" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-slate-500 dark:text-white/50" />
                                )}
                              </button>

                              {expandedSections.has(`record-${index}-${sectionKey}`) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-white dark:bg-white/10 rounded"
                                >
                                  {Object.entries(sectionValue as Record<string, string>).map(([subKey, subValue]) => (
                                    <div key={subKey} className="p-2 bg-slate-50 dark:bg-white/5 rounded">
                                      <div className="text-xs font-medium text-slate-500 dark:text-white/60">
                                        {subKey}
                                      </div>
                                      <div className="text-sm text-slate-800 dark:text-white">{subValue}</div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )
    } catch (error) {
      return null
    }
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
        <h2 className="text-xl font-medium">Résultat de la Conversion</h2>
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
                Copié
              </motion.div>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copier JSON
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
            Télécharger
          </Button>
        </div>
      </div>

      {fileName && (
        <div className="p-3 rounded-lg bg-[#FCBD00]/10 border border-[#FCBD00]/30 flex items-start gap-3">
          <FileJson className="h-5 w-5 text-[#FCBD00] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white">Fichier généré: {fileName}</p>
            <p className="text-sm text-slate-600 dark:text-white/70">
              Le fichier a été généré dans le répertoire "output" du serveur
            </p>
          </div>
        </div>
      )}

      {configId && (
        <div className="p-3 rounded-lg bg-[#F55B3B]/10 border border-[#F55B3B]/30 flex items-start gap-3">
          <Check className="h-5 w-5 text-[#F55B3B] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white">ID de Configuration: {configId}</p>
            <p className="text-sm text-slate-600 dark:text-white/70">
              Les données ont été converties avec succès selon cette configuration
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white">Erreur lors du chargement</p>
            <p className="text-sm text-slate-600 dark:text-white/70">{error}</p>
            <p className="text-sm text-slate-600 dark:text-white/70 mt-1">
              Affichage des données d'exemple à la place.
            </p>
          </div>
        </div>
      )}

      {/* Vue structurée interactive */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h3 className="text-lg font-medium">Vue structurée des données</h3>
        <div className="max-h-[400px] overflow-auto">{renderJsonStructure()}</div>
      </motion.div>

      {/* Vue JSON brute */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#F55B3B] to-[#FCBD00] dark:from-[#F55B3B] dark:to-[#FCBD00] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative rounded-xl bg-white dark:bg-[#17171E] backdrop-blur-xl border border-slate-200 dark:border-white/10 overflow-hidden transition-colors duration-500">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 transition-colors duration-500">
            <h3 className="font-medium">Sortie JSON</h3>
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
          <p className="font-medium">Conversion réussie</p>
          <p className="text-slate-500 dark:text-white/60 transition-colors duration-500">
            {recordCount} enregistrement{recordCount > 1 ? "s" : ""} converti{recordCount > 1 ? "s" : ""} •{" "}
            {new Date().toLocaleDateString()}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={onReset}
            className="border-[#F55B3B] dark:border-[#F55B3B] text-[#F55B3B] dark:text-[#F55B3B] hover:bg-[#F55B3B]/10 dark:hover:bg-[#F55B3B]/10 backdrop-blur-sm transition-colors duration-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Nouvelle Conversion
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}