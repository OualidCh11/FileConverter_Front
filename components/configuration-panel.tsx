"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Check, AlertCircle, Upload, Settings, MapPin, RefreshCw } from "lucide-react"
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
import {
  saveConfigMapping,
  saveMapping,
  generateJsonFile,
  uploadJsonStructureFile,
  getJsonStructureKeys,
  getJsonStructuresByDestination,
} from "@/lib/api-service"
import type { ConfigMappingDTO, MappingDTO } from "@/lib/api-service"
import type { FlatFieldDefinition } from "./file-uploader"
import { JsonStructureUploader } from "./json-structure-uploader"

interface ConfigurationPanelProps {
  onContinue: (configId?: number, fileName?: string) => void
  detectedFields: string[]
  fileId?: number
  fileName?: string
  fieldDefinitions?: FlatFieldDefinition[]
}

// Définir l'interface MappingDetail
interface MappingDetail {
  id: string
  sourceKey: string
  destinationKey: string
  status: "AT" | "RE" | "TR"
  lineNumber?: number
  value?: string
  startPos?: number
  endPos?: number
}

// Interface pour les structures JSON avec positions
interface JsonStructureWithPosition {
  keyPath: string
  startPosition: number
  endPosition: number
}

export function ConfigurationPanel({
  onContinue,
  detectedFields,
  fileId,
  fileName,
  fieldDefinitions,
}: ConfigurationPanelProps) {
  // Commencer avec un seul mapping par défaut
  const [mappingDetails, setMappingDetails] = useState<MappingDetail[]>([
    { id: "mapping-1", sourceKey: "", destinationKey: "", status: "TR" },
  ])

  // État pour suivre les champs sélectionnés
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [selectedDestinationKeys, setSelectedDestinationKeys] = useState<string[]>([])

  // État pour les valeurs d'exemple et numéros de ligne
  const [fileContent, setFileContent] = useState<string>(
    "John Doe    35Paris     \nJane Smith  28London    \nBob Johnson 42New York  ",
  )
  const [configTab, setConfigTab] = useState("json-structure")

  // État pour les informations de configuration de base
  const [sourceFileName, setSourceFileName] = useState(fileName || "customer_data.csv")
  const [destFileName, setDestFileName] = useState(
    fileName ? fileName.replace(/\.[^/.]+$/, ".json") : "customer_data.json",
  )

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingStructure, setIsUploadingStructure] = useState(false)

  // État pour la structure JSON
  const [jsonStructureKeys, setJsonStructureKeys] = useState<string[]>([])
  const [jsonStructuresWithPositions, setJsonStructuresWithPositions] = useState<JsonStructureWithPosition[]>([])
  const [hasJsonStructure, setHasJsonStructure] = useState(false)
  const [showJsonUploader, setShowJsonUploader] = useState(false)

  // Référence pour l'input de fichier JSON
  const jsonFileInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()

  // Mettre à jour sourceFileName quand fileName change
  useEffect(() => {
    if (fileName) {
      setSourceFileName(fileName)
      setDestFileName(fileName.replace(/\.[^/.]+$/, ".json"))
    }
  }, [fileName])

  // Charger les structures JSON quand le nom du fichier de destination change
  useEffect(() => {
    const loadJsonStructures = async () => {
      if (destFileName) {
        try {
          const structures = await getJsonStructuresByDestination(destFileName)
          const keys = structures.map((structure) => structure.keyPath)
          const structuresWithPos = structures.map((structure) => ({
            keyPath: structure.keyPath,
            startPosition: structure.start_position || 1,
            endPosition: structure.end_position || 10,
          }))

          setJsonStructureKeys(keys)
          setJsonStructuresWithPositions(structuresWithPos)
          setHasJsonStructure(keys.length > 0)

          console.log("Structures JSON chargées:", structures)
          console.log("Clés extraites:", keys)
          console.log("Structures avec positions:", structuresWithPos)
        } catch (error) {
          console.log("Aucune structure JSON trouvée pour ce fichier:", destFileName)
          setJsonStructureKeys([])
          setJsonStructuresWithPositions([])
          setHasJsonStructure(false)
        }
      }
    }

    loadJsonStructures()
  }, [destFileName])

  // Initialiser les positions de début et de fin pour les champs FLAT
  useEffect(() => {
    if (fieldDefinitions && fieldDefinitions.length > 0) {
      setMappingDetails((prevMappings) => {
        return prevMappings.map((mapping) => {
          const fieldDef = fieldDefinitions.find((field) => field.name === mapping.sourceKey)
          if (fieldDef && (mapping.startPos !== fieldDef.startPos || mapping.endPos !== fieldDef.endPos)) {
            return {
              ...mapping,
              startPos: fieldDef.startPos,
              endPos: fieldDef.endPos,
            }
          }
          return mapping
        })
      })
    }
  }, [fieldDefinitions])

  // Mettre à jour les champs sélectionnés quand mappingDetails change
  useEffect(() => {
    const sourceFields = mappingDetails.map((detail) => detail.sourceKey).filter((key) => key !== "")
    const destFields = mappingDetails.map((detail) => detail.destinationKey).filter((key) => key !== "")

    setSelectedFields(sourceFields)
    setSelectedDestinationKeys(destFields)
  }, [mappingDetails])

  const addMappingDetail = () => {
    // Générer un ID unique pour le nouveau mapping
    const newId = `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setMappingDetails((prev) => [...prev, { id: newId, sourceKey: "", destinationKey: "", status: "TR" }])
  }

  const removeMappingDetail = (id: string) => {
    setMappingDetails((prev) => prev.filter((detail) => detail.id !== id))
  }

  const updateMappingDetail = (id: string, field: string, value: string) => {
    setMappingDetails((prev) =>
      prev.map((detail) => {
        if (detail.id === id) {
          const updatedDetail = { ...detail, [field]: value } as MappingDetail

          // Si c'est un fichier plat et que nous mettons à jour sourceKey, calculons la valeur et le numéro de ligne
          if (field === "sourceKey" && value && fieldDefinitions) {
            // Trouver la définition du champ correspondant
            const fieldDef = fieldDefinitions.find((field) => field.name === value)
            if (fieldDef) {
              updatedDetail.startPos = fieldDef.startPos
              updatedDetail.endPos = fieldDef.endPos
            }

            // Simuler l'extraction de valeur et numéro de ligne pour les fichiers plats
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

  // Fonction pour gérer l'upload du fichier JSON de structure (ancien système)
  const handleJsonStructureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier JSON valide",
        variant: "destructive",
      })
      return
    }

    setIsUploadingStructure(true)
    try {
      await uploadJsonStructureFile(file, destFileName)

      // Recharger les clés de structure
      const keys = await getJsonStructureKeys(destFileName)
      setJsonStructureKeys(keys)
      setHasJsonStructure(keys.length > 0)

      toast({
        title: "Succès",
        description: "Structure JSON uploadée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'upload de la structure JSON",
        variant: "destructive",
      })
    } finally {
      setIsUploadingStructure(false)
      // Réinitialiser l'input
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = ""
      }
    }
  }

  // Callback pour quand l'upload de structure JSON avec positions est terminé
  const handleJsonStructureComplete = async (fileDestination: string) => {
    setShowJsonUploader(false)
    setDestFileName(fileDestination)

    // Recharger les structures JSON
    try {
      const structures = await getJsonStructuresByDestination(fileDestination)
      const keys = structures.map((structure) => structure.keyPath)
      const structuresWithPos = structures.map((structure) => ({
        keyPath: structure.keyPath,
        startPosition: structure.start_position || 1,
        endPosition: structure.end_position || 10,
      }))

      setJsonStructureKeys(keys)
      setJsonStructuresWithPositions(structuresWithPos)
      setHasJsonStructure(keys.length > 0)

      toast({
        title: "Succès",
        description: "Structure JSON avec positions sauvegardée avec succès",
      })
    } catch (error) {
      console.error("Erreur lors du rechargement des structures:", error)
    }
  }

  // Fonction pour obtenir les clés de destination disponibles (CORRIGÉE)
  const getAvailableDestinationKeys = (currentMappingId?: string) => {
    const selectedKeys = mappingDetails
      .filter((mapping) => mapping.id !== currentMappingId && mapping.destinationKey !== "")
      .map((mapping) => mapping.destinationKey)

    return jsonStructureKeys.filter((key) => !selectedKeys.includes(key))
  }

  // Fonction pour obtenir les champs source disponibles (CORRIGÉE)
  const getAvailableSourceFields = (currentMappingId?: string) => {
    const selectedKeys = mappingDetails
      .filter((mapping) => mapping.id !== currentMappingId && mapping.sourceKey !== "")
      .map((mapping) => mapping.sourceKey)

    const availableFields = detectedFields.length > 0 ? detectedFields : ["nom", "prenom", "age", "ville"]
    return availableFields.filter((field) => !selectedKeys.includes(field))
  }

  // Fonction pour créer un mapping automatique basé sur les noms similaires
  const createAutoMapping = () => {
    const availableSourceFields = detectedFields.length > 0 ? detectedFields : ["nom", "prenom", "age", "ville"]
    const availableDestKeys = jsonStructureKeys

    const autoMappings: MappingDetail[] = []

    // Mapping automatique basé sur des noms similaires
    const mappingRules = [
      { source: "nom", destinations: ["name", "nom", "fullName", "Operations.operationInfo.name"] },
      { source: "prenom", destinations: ["firstName", "prenom", "first_name", "Operations.operationInfo.firstName"] },
      { source: "age", destinations: ["age", "years", "Operations.operationInfo.age"] },
      { source: "ville", destinations: ["city", "ville", "location", "Operations.operationInfo.city"] },
      { source: "id", destinations: ["id", "operationID", "Operations.operationInfo.operationID"] },
      { source: "type", destinations: ["type", "category", "Operations.operationInfo.type"] },
    ]

    availableSourceFields.forEach((sourceField) => {
      const rule = mappingRules.find((r) => r.source === sourceField)
      if (rule) {
        const matchingDest = rule.destinations.find((dest) => availableDestKeys.includes(dest))
        if (matchingDest) {
          const fieldDef = fieldDefinitions?.find((field) => field.name === sourceField)
          autoMappings.push({
            id: `auto-mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceKey: sourceField,
            destinationKey: matchingDest,
            status: "TR",
            startPos: fieldDef?.startPos || 1,
            endPos: fieldDef?.endPos || 10,
            lineNumber: 1,
            value:
              sourceField === "nom"
                ? "John Doe"
                : sourceField === "prenom"
                  ? "John"
                  : sourceField === "age"
                    ? "35"
                    : "Paris",
          })
        }
      }
    })

    if (autoMappings.length > 0) {
      setMappingDetails(autoMappings)
      toast({
        title: "Mapping automatique créé",
        description: `${autoMappings.length} mappings ont été créés automatiquement`,
      })
    } else {
      toast({
        title: "Aucun mapping automatique possible",
        description: "Aucune correspondance trouvée entre les champs source et destination",
        variant: "destructive",
      })
    }
  }

  // Modifier la fonction handleSaveConfiguration pour utiliser les nouveaux endpoints
  const handleSaveConfiguration = async () => {
    if (!hasJsonStructure) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord configurer une structure JSON",
        variant: "destructive",
      })
      return
    }

    const validMappings = mappingDetails.filter((detail) => detail.sourceKey && detail.destinationKey)
    if (validMappings.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez configurer au moins un mapping",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Sauvegarde de la configuration avec les données:", {
        sourceFileName,
        destFileName,
        mappingDetails: validMappings,
        fileId,
      })

      // 1. D'abord, sauvegarder le mapping de base (uniquement le nom du fichier de destination)
      const mappingData: MappingDTO = {
        fileDestinationName: destFileName,
      }

      console.log("Envoi des données de mapping:", mappingData)
      const mappingResult = await saveMapping(mappingData)
      console.log("Résultat du mapping:", mappingResult)

      // Récupérer l'ID du mapping créé
      const configMappingId = mappingResult.id

      // 2. Ensuite, sauvegarder les détails de mapping avec les positions de la structure JSON
      const configMappingDTOList: ConfigMappingDTO[] = validMappings.map((detail) => {
        // Trouver la structure JSON correspondante pour obtenir les positions
        const jsonStructure = jsonStructuresWithPositions.find((struct) => struct.keyPath === detail.destinationKey)

        return {
          keySource: detail.sourceKey,
          keyDistination: detail.destinationKey,
          typeFile: "FLAT", // Type de fichier par défaut
          startPos: jsonStructure?.startPosition || detail.startPos || 1,
          endPos: jsonStructure?.endPosition || detail.endPos || 10,
          nrLineFiles: detail.lineNumber || 1,
          configMappingId: configMappingId,
          fileDetailId: fileId,
        }
      })

      console.log("Envoi des détails de mapping avec positions JSON:", configMappingDTOList)
      const detailResult = await saveConfigMapping(configMappingDTOList)
      console.log("Résultat des détails de mapping:", detailResult)

      // 3. Générer le fichier JSON final
      try {
        const jsonResult = await generateJsonFile()
        console.log("Résultat de la génération JSON:", jsonResult)
      } catch (error) {
        console.error("Erreur lors de la génération du fichier JSON:", error)
        // Continuer même si la génération échoue
      }

      toast({
        title: "Succès",
        description: `Configuration sauvegardée avec succès (${validMappings.length} mappings)`,
      })

      // Passer à l'étape suivante avec l'ID de configuration et le nom du fichier
      onContinue(configMappingId, destFileName)
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

  // Ajouter un état pour les structures existantes
  const [existingStructures, setExistingStructures] = useState<string[]>([])
  const [selectedExistingStructure, setSelectedExistingStructure] = useState<string>("")

  // Fonction pour charger les structures existantes
  const loadExistingStructures = async () => {
    try {
      // Appeler l'API pour récupérer toutes les structures existantes
      const response = await fetch(`/api/json-keys/getAllFileDestinations`)
      if (response.ok) {
        const structures = await response.json()
        setExistingStructures(structures)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des structures existantes:", error)
    }
  }

  // Fonction pour sélectionner une structure existante
  const handleSelectExistingStructure = async (structureName: string) => {
    setDestFileName(structureName)
    setSelectedExistingStructure(structureName)

    try {
      const structures = await getJsonStructuresByDestination(structureName)
      const keys = structures.map((structure) => structure.keyPath)
      const structuresWithPos = structures.map((structure) => ({
        keyPath: structure.keyPath,
        startPosition: structure.start_position || 1,
        endPosition: structure.end_position || 10,
      }))

      setJsonStructureKeys(keys)
      setJsonStructuresWithPositions(structuresWithPos)
      setHasJsonStructure(keys.length > 0)

      toast({
        title: "Structure chargée",
        description: `Structure "${structureName}" chargée avec ${keys.length} clés`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement de la structure sélectionnée",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadExistingStructures()
  }, [])

  return (
    <div className="space-y-8 text-slate-800 dark:text-white transition-colors duration-500">
      <Tabs value={configTab} onValueChange={setConfigTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 dark:bg-white/5 backdrop-blur-lg rounded-xl p-1 transition-colors duration-500">
          <TabsTrigger
            value="json-structure"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F55B3B] data-[state=active]:to-[#ff7b5b] data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Structure JSON
          </TabsTrigger>
          <TabsTrigger
            value="mapping"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F55B3B] data-[state=active]:to-[#ff7b5b] data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Configuration du mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="json-structure">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Fichier source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-white/80 transition-colors duration-500">
                    Nom du fichier source
                  </Label>
                  <Input
                    value={sourceFileName}
                    disabled={true}
                    className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm text-slate-800 dark:text-white transition-colors duration-500 cursor-not-allowed opacity-70"
                  />
                </div>

                {fileId && (
                  <div className="p-3 rounded-lg bg-[#F55B3B]/10 border border-[#F55B3B]/30 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#F55B3B] mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">Fichier associé</p>
                      <p className="text-sm text-slate-600 dark:text-white/70">ID du fichier: {fileId}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#F55B3B]" />
                  Configuration de la structure JSON
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sélecteur de structures existantes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Utiliser une structure existante</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadExistingStructures}
                      className="border-[#FCBD00] text-[#FCBD00] hover:bg-[#FCBD00]/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>

                  {existingStructures.length > 0 ? (
                    <Select value={selectedExistingStructure} onValueChange={handleSelectExistingStructure}>
                      <SelectTrigger className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                        <SelectValue placeholder="Sélectionner une structure existante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Structures disponibles ({existingStructures.length})</SelectLabel>
                          {existingStructures.map((structure) => (
                            <SelectItem key={structure} value={structure}>
                              {structure}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-white/60">
                      Aucune structure existante trouvée. Créez-en une nouvelle ci-dessous.
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-[#17171E] px-2 text-slate-500 dark:text-white/60">
                      Ou créer une nouvelle structure
                    </span>
                  </div>
                </div>

                {/* Configuration avancée avec positions */}
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-white/60">
                    Uploadez un fichier JSON et associez des positions de début/fin à chaque clé.
                    <strong> Ces positions seront utilisées pour extraire les données du fichier plat.</strong>
                  </p>

                  {!showJsonUploader ? (
                    <Button
                      onClick={() => setShowJsonUploader(true)}
                      className="bg-gradient-to-r from-[#F55B3B] to-[#ff7b5b] hover:opacity-90 text-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Créer une nouvelle structure JSON
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Configuration de la nouvelle structure JSON</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowJsonUploader(false)}
                          className="text-slate-600 dark:text-white/70"
                        >
                          Annuler
                        </Button>
                      </div>
                      <JsonStructureUploader
                        onComplete={handleJsonStructureComplete}
                        defaultFileDestination={destFileName}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="mapping">
          <div className="space-y-6">
            {!hasJsonStructure && (
              <div className="p-4 rounded-lg bg-[#F55B3B]/10 border border-[#F55B3B]/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[#F55B3B] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Structure JSON requise</p>
                  <p className="text-sm text-slate-600 dark:text-white/70">
                    Veuillez d'abord configurer une structure JSON dans l'onglet "Structure JSON" pour pouvoir créer des
                    mappings.
                  </p>
                </div>
              </div>
            )}

            {/* Bouton de mapping automatique */}
            {hasJsonStructure && (
              <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#FCBD00]" />
                    Mapping automatique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-white/70">
                        Créer automatiquement des mappings basés sur les noms de champs similaires
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                        Analyse les champs source et destination pour créer des correspondances intelligentes
                      </p>
                    </div>
                    <Button
                      onClick={createAutoMapping}
                      variant="outline"
                      className="border-[#FCBD00] text-[#FCBD00] hover:bg-[#FCBD00]/10"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Créer mapping auto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected fields - Affiche uniquement les champs sélectionnés */}
            {(selectedFields.length > 0 || selectedDestinationKeys.length > 0) && (
              <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Mappings configurés ({mappingDetails.filter((m) => m.sourceKey && m.destinationKey).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedFields.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-white/70">Champs source:</span>
                        {selectedFields.map((field, index) => (
                          <Badge
                            key={`source-${index}`}
                            className="bg-[#F55B3B]/10 dark:bg-[#F55B3B]/20 text-[#F55B3B] dark:text-[#F55B3B] border-[#F55B3B]/30 dark:border-[#F55B3B]/30 transition-colors duration-500"
                          >
                            {field}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {selectedDestinationKeys.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-white/70">Clés destination:</span>
                        {selectedDestinationKeys.map((key, index) => (
                          <Badge
                            key={`dest-${index}`}
                            className="bg-[#FCBD00]/10 dark:bg-[#FCBD00]/20 text-[#FCBD00] dark:text-[#FCBD00] border-[#FCBD00]/30 dark:border-[#FCBD00]/30 transition-colors duration-500"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <motion.div layout className="space-y-4">
              <AnimatePresence mode="popLayout">
                {mappingDetails.map((detail) => (
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
                            <Select
                              value={detail.sourceKey}
                              onValueChange={(value) => updateMappingDetail(detail.id, "sourceKey", value)}
                            >
                              <SelectTrigger className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm focus:border-[#FCBD00] dark:focus:border-[#FCBD00] focus:ring-[#FCBD00] dark:focus:ring-[#FCBD00] text-slate-800 dark:text-white transition-colors duration-500">
                                <SelectValue placeholder="Sélectionner un champ source" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#17171E]/95 backdrop-blur-xl border-slate-200 dark:border-white/20 transition-colors duration-500">
                                <SelectGroup>
                                  <SelectLabel className="text-slate-500 dark:text-white/60 transition-colors duration-500">
                                    Champs source disponibles (
                                    {getAvailableSourceFields(detail.id).length + (detail.sourceKey ? 1 : 0)})
                                  </SelectLabel>
                                  {/* Afficher le champ actuellement sélectionné */}
                                  {detail.sourceKey && (
                                    <SelectItem
                                      value={detail.sourceKey}
                                      className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg transition-colors duration-300"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>{detail.sourceKey}</span>
                                        <Check className="h-4 w-4 text-green-500 ml-2" />
                                      </div>
                                    </SelectItem>
                                  )}
                                  {/* Afficher les champs disponibles */}
                                  {getAvailableSourceFields(detail.id).map((field) => (
                                    <SelectItem
                                      key={field}
                                      value={field}
                                      className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg transition-colors duration-300"
                                    >
                                      {field}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 dark:text-white/60 transition-colors duration-500">
                              Nom de colonne dans le fichier source
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-slate-700 dark:text-white/80 transition-colors duration-500">
                              Clé de destination
                            </Label>
                            <Select
                              value={detail.destinationKey}
                              onValueChange={(value) => updateMappingDetail(detail.id, "destinationKey", value)}
                              disabled={!hasJsonStructure}
                            >
                              <SelectTrigger className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 backdrop-blur-sm focus:border-[#FCBD00] dark:focus:border-[#FCBD00] focus:ring-[#FCBD00] dark:focus:ring-[#FCBD00] text-slate-800 dark:text-white transition-colors duration-500">
                                <SelectValue
                                  placeholder={
                                    hasJsonStructure ? "Sélectionner une clé de destination" : "Structure JSON requise"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#17171E]/95 backdrop-blur-xl border-slate-200 dark:border-white/20 transition-colors duration-500 max-h-60">
                                <SelectGroup>
                                  <SelectLabel className="text-slate-500 dark:text-white/60 transition-colors duration-500">
                                    Clés de destination disponibles (
                                    {getAvailableDestinationKeys(detail.id).length + (detail.destinationKey ? 1 : 0)})
                                  </SelectLabel>
                                  {/* Afficher la clé actuellement sélectionnée */}
                                  {detail.destinationKey && (
                                    <SelectItem
                                      value={detail.destinationKey}
                                      className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg transition-colors duration-300"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex flex-col items-start">
                                          <span className="font-medium">{detail.destinationKey}</span>
                                          <span className="text-xs text-slate-500 dark:text-white/60">
                                            Structure: {destFileName}
                                          </span>
                                        </div>
                                        <Check className="h-4 w-4 text-green-500 ml-2" />
                                      </div>
                                    </SelectItem>
                                  )}
                                  {/* Afficher les clés disponibles */}
                                  {getAvailableDestinationKeys(detail.id).map((key) => (
                                    <SelectItem
                                      key={key}
                                      value={key}
                                      className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg transition-colors duration-300"
                                    >
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium">{key}</span>
                                        <span className="text-xs text-slate-500 dark:text-white/60">
                                          Structure: {destFileName}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 dark:text-white/60 transition-colors duration-500">
                              {hasJsonStructure
                                ? `${jsonStructureKeys.length} clés disponibles depuis la structure JSON`
                                : "Configurez d'abord une structure JSON"}
                            </p>
                          </div>
                        </div>

                        {/* Afficher les positions de la structure JSON si disponibles */}
                        {detail.destinationKey && jsonStructuresWithPositions.length > 0 && (
                          <div className="mt-4 p-3 rounded-lg bg-[#FCBD00]/10 border border-[#FCBD00]/30">
                            <p className="text-sm font-medium text-slate-800 dark:text-white mb-2">
                              Positions de la structure JSON pour: {detail.destinationKey}
                            </p>
                            {(() => {
                              const jsonStructure = jsonStructuresWithPositions.find(
                                (struct) => struct.keyPath === detail.destinationKey,
                              )
                              return jsonStructure ? (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-500 dark:text-white/60">Position début:</p>
                                    <p className="text-sm font-medium">{jsonStructure.startPosition}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 dark:text-white/60">Position fin:</p>
                                    <p className="text-sm font-medium">{jsonStructure.endPosition}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 dark:text-white/60">
                                  Positions par défaut utilisées
                                </p>
                              )
                            })()}
                          </div>
                        )}

                        {/* Display value and line number for flat files */}
                        {detail.sourceKey && detail.value && (
                          <div className="mt-4 p-3 rounded-lg bg-[#F55B3B]/10 border border-[#F55B3B]/30 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-[#F55B3B] mt-0.5" />
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
                disabled={
                  !hasJsonStructure ||
                  getAvailableSourceFields().length === 0 ||
                  getAvailableDestinationKeys().length === 0
                }
                className="border-[#F55B3B] dark:border-[#F55B3B] text-[#F55B3B] dark:text-[#F55B3B] hover:bg-[#F55B3B]/10 dark:hover:bg-[#F55B3B]/10 backdrop-blur-sm transition-colors duration-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un mapping
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="bg-gradient-to-r from-[#FCBD00] to-[#ffd747] dark:from-[#FCBD00] dark:to-[#ffd747] hover:opacity-90 transition-opacity text-slate-800 dark:text-[#17171E] font-medium shadow-lg shadow-[#FCBD00]/25 dark:shadow-[#FCBD00]/25 transition-colors duration-500"
                  onClick={handleSaveConfiguration}
                  disabled={isLoading || !hasJsonStructure}
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