"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Check, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { saveConfigMapping, saveMapping } from "@/lib/api-service"
import type { ConfigMappingDTO } from "@/types"

interface ConfigurationPanelProps {
  onContinue: (configId?: number) => void
  detectedFields: string[]
  fileId?: number
  fileName?: string
}

// Définir l'interface MappingDetail
interface MappingDetail {
  id: string
  sourceKey: string
  destinationKey: string
  status: "AT" | "RE" | "TR"
  lineNumber?: number
  value?: string
}

export function ConfigurationPanel({ onContinue, detectedFields, fileId, fileName }: ConfigurationPanelProps) {
  // Commencer avec un seul mapping par défaut
  const [mappingDetails, setMappingDetails] = useState<MappingDetail[]>([
    { id: "mapping-1", sourceKey: "", destinationKey: "", status: "TR" },
  ])

  // État pour suivre les champs sélectionnés
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  // État pour les valeurs d'exemple et numéros de ligne
  const [fileContent, setFileContent] = useState<string>(
    "John Doe    35Paris     \nJane Smith  28London    \nBob Johnson 42New York  ",
  )
  const [configTab, setConfigTab] = useState("basic")

  // État pour les informations de configuration de base
  const [sourceFileName, setSourceFileName] = useState(fileName || "customer_data.csv")
  const [destFileName, setDestFileName] = useState(
    fileName ? fileName.replace(/\.[^/.]+$/, ".json") : "customer_data.json",
  )
  const [fileType, setFileType] = useState("FLAT")
  // const [status, setStatus] = useState<"AT" | "RE" | "TR">("TR")

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  // Mettre à jour sourceFileName quand fileName change
  useEffect(() => {
    if (fileName) {
      setSourceFileName(fileName)
      setDestFileName(fileName.replace(/\.[^/.]+$/, ".json"))
    }
  }, [fileName])

  // Mettre à jour les champs sélectionnés quand mappingDetails change
  useEffect(() => {
    const fields = mappingDetails.map((detail) => detail.sourceKey).filter((key) => key !== "")
    setSelectedFields(fields)
  }, [mappingDetails])

  const addMappingDetail = () => {
    // Générer un ID unique pour le nouveau mapping
    const newId = `mapping-${Date.now()}`
    setMappingDetails([...mappingDetails, { id: newId, sourceKey: "", destinationKey: "", status: "TR" }])
  }

  const removeMappingDetail = (id: string) => {
    setMappingDetails(mappingDetails.filter((detail) => detail.id !== id))
  }

  const updateMappingDetail = (id: string, field: string, value: string) => {
    setMappingDetails(
      mappingDetails.map((detail) => {
        if (detail.id === id) {
          const updatedDetail = { ...detail, [field]: value } as MappingDetail

          // Si c'est un fichier plat et que nous mettons à jour sourceKey, calculons la valeur et le numéro de ligne
          if (field === "sourceKey" && value) {
            // Simuler l'extraction de valeur et numéro de ligne pour les fichiers plats
            const lines = fileContent.split("\n")
            const lineNumber = 1 // Première ligne pour l'exemple
            let extractedValue = ""

            // Simuler l'extraction de valeur basée sur le nom du champ
            if (value === "nom") extractedValue = "John Doe"
            else if (value === "prenom") extractedValue = "Jane"
            else if (value === "age") extractedValue = "35"
            else if (value === "ville") extractedValue = "Paris"

            updatedDetail.lineNumber = lineNumber
            updatedDetail.value = extractedValue
          }

          return updatedDetail
        }
        return detail
      }),
    )
  }

  // Modifier la fonction handleSaveConfiguration pour utiliser les nouveaux endpoints
  const handleSaveConfiguration = async () => {
    setIsLoading(true)

    try {
      console.log("Sauvegarde de la configuration avec les données:", {
        sourceFileName,
        destFileName,
        fileType,
        status,
        mappingDetails,
        fileId,
      })

      // 1. D'abord, sauvegarder le mapping de base
      const mappingData = {
        fileDestinationName: destFileName, // ← assure-toi que `destFileName` contient une valeur valide
      };
  

      console.log("Envoi des données de mapping:", mappingData)
      const mappingResult = await saveMapping(mappingData)
      console.log("Résultat du mapping:", mappingResult)

      // Récupérer l'ID du mapping créé
      const configMappingId = mappingResult.id

      // 2. Ensuite, sauvegarder les détails de mapping
      const savedDetails = []
      for (const detail of mappingDetails) {
        if (detail.sourceKey && detail.destinationKey) {
          const configMappingDetailData: Partial<ConfigMappingDTO> = {
            keySource: detail.sourceKey,
            keyDistination: detail.destinationKey,
            typeFile: fileType,
            nrLineFiles: detail.lineNumber || 1,
            configMappingId: configMappingId,
            fileDetailId: fileId || 0,
          }

          console.log("Envoi des détails de mapping:", configMappingDetailData)
          const detailResult = await saveConfigMapping(configMappingDetailData)
          savedDetails.push(detailResult)
        }
      }

      console.log("Tous les détails sauvegardés:", savedDetails)

      toast({
        title: "Succès",
        description: "Configuration sauvegardée avec succès",
      })

      // Passer à l'étape suivante avec l'ID de configuration
      onContinue(configMappingId)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la sauvegarde de la configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 text-slate-800 dark:text-white transition-colors duration-500">
      <Tabs value={configTab} onValueChange={setConfigTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 dark:bg-white/5 backdrop-blur-lg rounded-xl p-1 transition-colors duration-500">
          <TabsTrigger
            value="basic"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F55B3B] data-[state=active]:to-[#ff7b5b] data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Configuration de base
          </TabsTrigger>
          <TabsTrigger
            value="mapping"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F55B3B] data-[state=active]:to-[#ff7b5b] data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Configuration du mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Informations du fichier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-white/80 transition-colors duration-500">
                      Nom du fichier source
                    </Label>
                    <Input
                      value={sourceFileName}
                      disabled={true}
                      className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm focus:border-[#F55B3B] dark:focus:border-[#F55B3B] focus:ring-[#F55B3B] dark:focus:ring-[#F55B3B] text-slate-800 dark:text-white transition-colors duration-500 cursor-not-allowed opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-white/80 transition-colors duration-500">
                      Nom du fichier JSON de destination
                    </Label>
                    <Input
                      value={destFileName}
                      onChange={(e) => setDestFileName(e.target.value)}
                      className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm focus:border-[#F55B3B] dark:focus:border-[#F55B3B] focus:ring-[#F55B3B] dark:focus:ring-[#F55B3B] text-slate-800 dark:text-white transition-colors duration-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="mapping">
          <div className="space-y-6">
            {/* Selected fields - Affiche uniquement les champs sélectionnés */}
            {selectedFields.length > 0 && (
              <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Champs source sélectionnés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedFields.map((field, index) => (
                      <Badge
                        key={index}
                        className="bg-[#F55B3B]/10 dark:bg-[#F55B3B]/20 text-[#F55B3B] dark:text-[#F55B3B] border-[#F55B3B]/30 dark:border-[#F55B3B]/30 transition-colors duration-500"
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <motion.div layout className="space-y-4">
              <AnimatePresence mode="popLayout">
                {mappingDetails.map((detail, index) => (
                  <motion.div
                    key={detail.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group relative"
                  >
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#F55B3B] to-[#FCBD00] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Card className="relative border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-medium">Mapping de champ</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMappingDetail(detail.id)}
                          className="text-[#F55B3B] dark:text-[#F55B3B] hover:bg-[#F55B3B]/10 dark:hover:bg-[#F55B3B]/10 hover:text-[#F55B3B] dark:hover:text-[#F55B3B] transition-colors duration-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-white/80 transition-colors duration-500">
                              Clé source
                            </Label>
                            {/* Remplacer l'Input par un Select pour Source Key */}
                            <Select
                              value={detail.sourceKey}
                              onValueChange={(value) => updateMappingDetail(detail.id, "sourceKey", value)}
                            >
                              <SelectTrigger className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm focus:border-[#FCBD00] dark:focus:border-[#FCBD00] focus:ring-[#FCBD00] dark:focus:ring-[#FCBD00] text-slate-800 dark:text-white transition-colors duration-500">
                                <SelectValue placeholder="Sélectionner un champ" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#17171E]/95 backdrop-blur-xl border-slate-200 dark:border-white/20 transition-colors duration-500">
                                <SelectGroup>
                                  <SelectLabel className="text-slate-500 dark:text-white/60 transition-colors duration-500">
                                    Champs disponibles
                                  </SelectLabel>
                                  {detectedFields.length > 0
                                    ? detectedFields.map((field) => (
                                        <SelectItem
                                          key={field}
                                          value={field}
                                          className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg transition-colors duration-300"
                                          disabled={selectedFields.includes(field) && detail.sourceKey !== field}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span>{field}</span>
                                            {selectedFields.includes(field) && (
                                              <Check className="h-4 w-4 text-green-500 ml-2" />
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))
                                    : // Fallback fields for demo
                                      ["nom", "prenom", "age", "ville"].map((field) => (
                                        <SelectItem
                                          key={field}
                                          value={field}
                                          className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg transition-colors duration-300"
                                          disabled={selectedFields.includes(field) && detail.sourceKey !== field}
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span>{field}</span>
                                            {selectedFields.includes(field) && (
                                              <Check className="h-4 w-4 text-green-500 ml-2" />
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 dark:text-white/60 transition-colors duration-500">
                              Nom de champ dans le fichier source
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-white/80 transition-colors duration-500">
                              Clé de destination
                            </Label>
                            <Input
                              placeholder="nom_champ_json"
                              className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm focus:border-[#FCBD00] dark:focus:border-[#FCBD00] focus:ring-[#FCBD00] dark:focus:ring-[#FCBD00] text-slate-800 dark:text-white transition-colors duration-500"
                              value={detail.destinationKey}
                              onChange={(e) => updateMappingDetail(detail.id, "destinationKey", e.target.value)}
                            />
                            <p className="text-xs text-slate-500 dark:text-white/60 transition-colors duration-500">
                              Nom du champ dans le JSON de sortie
                            </p>
                          </div>                    
                        </div>

                        {/* Display value and line number for flat files */}
                        {detail.sourceKey && detail.value && (
                          <div className="mt-4 p-3 rounded-lg bg-[#FCBD00]/10 border border-[#FCBD00]/30 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-[#FCBD00] mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-white">
                                Aperçu pour le champ: {detail.sourceKey}
                              </p>
                              <div className="mt-1 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-white/60">Valeur:</p>
                                  <p className="text-sm font-medium">{detail.value}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-white/60">Numéro de ligne:</p>
                                  <p className="text-sm font-medium">{detail.lineNumber}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={addMappingDetail}
                className="border-[#F55B3B] dark:border-[#F55B3B] text-[#F55B3B] dark:text-[#F55B3B] hover:bg-[#F55B3B]/10 dark:hover:bg-[#F55B3B]/10 backdrop-blur-sm transition-colors duration-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un mapping
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="bg-gradient-to-r from-[#FCBD00] to-[#ffd747] dark:from-[#FCBD00] dark:to-[#ffd747] hover:opacity-90 transition-opacity text-slate-800 dark:text-[#17171E] font-medium shadow-lg shadow-[#FCBD00]/25 dark:shadow-[#FCBD00]/25 transition-colors duration-500"
                  onClick={handleSaveConfiguration}
                  disabled={isLoading}
                >
                  {isLoading ? "Enregistrement..." : "Enregistrer et continuer"}
                </Button>
              </motion.div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

