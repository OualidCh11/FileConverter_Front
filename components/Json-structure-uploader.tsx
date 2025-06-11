"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileJson,
  AlertCircle,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Check,
  RefreshCw,
  Wand2,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface JsonKey {
  id: string
  keyPath: string
  startPosition: number
  endPosition: number
}

interface JsonStructureUploaderProps {
  onComplete?: (fileDestination: string) => void
  defaultFileDestination?: string
}

export function JsonStructureUploader({ onComplete, defaultFileDestination }: JsonStructureUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jsonContent, setJsonContent] = useState<string>("")
  const [extractedKeys, setExtractedKeys] = useState<string[]>([])
  const [jsonKeys, setJsonKeys] = useState<JsonKey[]>([])
  const [fileDestination, setFileDestination] = useState(defaultFileDestination || "")
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoDetectPositions, setAutoDetectPositions] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fonction pour extraire les clés d'un objet JSON de manière récursive
  const extractJsonKeys = (obj: any, prefix = ""): string[] => {
    const keys: string[] = []

    if (typeof obj === "object" && obj !== null) {
      // Si c'est un tableau, analyser le premier élément
      if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
          keys.push(...extractJsonKeys(obj[0], prefix ? `${prefix}[0]` : "[0]"))
        }
      } else {
        // Si c'est un objet, analyser toutes les clés
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key
          keys.push(fullKey)

          if (typeof obj[key] === "object" && obj[key] !== null) {
            keys.push(...extractJsonKeys(obj[key], fullKey))
          }
        })
      }
    }

    return keys
  }

  // Fonction pour utiliser toutes les clés détectées avec positions auto-générées
  const useAllDetectedKeys = () => {
    if (extractedKeys.length === 0) {
      toast({
        title: "Aucune clé détectée",
        description: "Veuillez d'abord uploader un fichier JSON valide",
        variant: "destructive",
      })
      return
    }

    const allKeys: JsonKey[] = extractedKeys.map((key, index) => ({
      id: `key-${index}`,
      keyPath: key,
      startPosition: index * 10 + 1,
      endPosition: index * 10 + 10,
    }))
    setJsonKeys(allKeys)

    toast({
      title: "Toutes les clés appliquées",
      description: `${allKeys.length} clés ont été configurées automatiquement avec positions`,
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      setError("Veuillez sélectionner un fichier JSON valide")
      return
    }

    setSelectedFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        setJsonContent(content)

        // Parser et extraire les clés
        const parsedJson = JSON.parse(content)
        const keys = extractJsonKeys(parsedJson)
        setExtractedKeys(keys)

        // Réinitialiser les clés configurées
        setJsonKeys([])

        if (keys.length > 0) {
          toast({
            title: "Fichier analysé",
            description: `${keys.length} clés détectées dans le fichier JSON`,
          })
        } else {
          toast({
            title: "Attention",
            description: "Aucune clé détectée dans le fichier JSON. Vérifiez le format.",
            variant: "destructive",
          })
        }
      } catch (error) {
        setError("Erreur lors de l'analyse du fichier JSON")
        console.error("Erreur de parsing JSON:", error)
      }
    }

    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier")
    }

    reader.readAsText(file)
  }

  const updateJsonKey = (id: string, field: keyof JsonKey, value: string | number) => {
    setJsonKeys((prev) =>
      prev.map((key) => {
        if (key.id === id) {
          return { ...key, [field]: value }
        }
        return key
      }),
    )
  }

  const removeJsonKey = (id: string) => {
    setJsonKeys((prev) => prev.filter((key) => key.id !== id))
  }

  const addJsonKey = () => {
    const newKey: JsonKey = {
      id: `key-${Date.now()}`,
      keyPath: "",
      startPosition: 1,
      endPosition: 10,
    }
    setJsonKeys((prev) => [...prev, newKey])
  }

  // Fonction pour obtenir les clés disponibles (non encore sélectionnées)
  const getAvailableKeys = (currentKeyId?: string) => {
    const selectedKeys = jsonKeys
      .filter((key) => key.id !== currentKeyId)
      .map((key) => key.keyPath)
      .filter((keyPath) => keyPath !== "")

    return extractedKeys.filter((key) => !selectedKeys.includes(key))
  }

  // Fonction pour auto-détecter les positions
  const autoDetectKeyPositions = () => {
    if (extractedKeys.length === 0) return

    // Créer des positions automatiques pour chaque clé
    const keysWithPositions = extractedKeys.map((key, index) => {
      // Calculer des positions basées sur l'index
      // Chaque clé aura une plage de 10 caractères
      const startPos = index * 10 + 1
      const endPos = startPos + 9

      return {
        id: `key-${index}`,
        keyPath: key,
        startPosition: startPos,
        endPosition: endPos,
      }
    })

    setJsonKeys(keysWithPositions)

    toast({
      title: "Positions auto-détectées",
      description: `${keysWithPositions.length} clés ont reçu des positions automatiques`,
    })
  }

  // Effet pour auto-détecter les positions quand les clés sont extraites
  useEffect(() => {
    if (extractedKeys.length > 0 && autoDetectPositions && jsonKeys.length === 0) {
      autoDetectKeyPositions()
    }
  }, [extractedKeys, autoDetectPositions])

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier JSON",
        variant: "destructive",
      })
      return
    }

    if (!fileDestination.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier un nom de fichier de destination",
        variant: "destructive",
      })
      return
    }

    if (jsonKeys.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez configurer au moins une clé avec ses positions",
        variant: "destructive",
      })
      return
    }

    // Valider que toutes les clés ont des positions valides
    const invalidKeys = jsonKeys.filter((key) => !key.keyPath.trim() || key.startPosition >= key.endPosition)
    if (invalidKeys.length > 0) {
      toast({
        title: "Erreur",
        description: "Certaines clés ont des configurations invalides",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Préparer les données pour l'envoi
      const formData = new FormData()
      formData.append("file", selectedFile)

      const metadata = {
        fileDestination: fileDestination.trim(),
        positionJsonDtos: jsonKeys.map((key) => ({
          keyPayh: key.keyPath, // Note: le backend utilise "keyPayh" (avec une faute de frappe)
          start_position: key.startPosition,
          end_position: key.endPosition,
        })),
      }

      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"}/api/json-keys/saveKeys-withPosition`,
        {
          method: "POST",
          body: formData,
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Erreur lors de la sauvegarde")
      }

      const result = await response.text()

      toast({
        title: "Succès",
        description: "Structure JSON sauvegardée avec succès",
      })

      // Appeler le callback si fourni
      if (onComplete) {
        onComplete(fileDestination.trim())
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      setError(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileJson className="h-5 w-5 text-[#F55B3B]" />
            Upload de Structure JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload de fichier */}
          <div className="space-y-2">
            <Label>Fichier JSON de structure</Label>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-dashed border-2 border-[#F55B3B]/30 hover:border-[#F55B3B]/50 hover:bg-[#F55B3B]/5"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : "Sélectionner un fichier JSON"}
              </Button>
            </div>
          </div>

          {/* Nom du fichier de destination */}
          <div className="space-y-2">
            <Label>Nom du fichier de destination</Label>
            <Input
              value={fileDestination}
              onChange={(e) => setFileDestination(e.target.value)}
              placeholder="ex: StructureV1"
              className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10"
            />
          </div>

          {/* Aperçu du JSON */}
          {jsonContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Aperçu du fichier JSON</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-slate-600 dark:text-white/70"
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="max-h-40 overflow-auto p-3 bg-slate-50 dark:bg-white/5 rounded border font-mono text-xs"
                >
                  <pre>{jsonContent}</pre>
                </motion.div>
              )}
            </div>
          )}

          {/* Clés détectées */}
          {extractedKeys.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Clés détectées ({extractedKeys.length})</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={autoDetectKeyPositions}
                    className="border-[#FCBD00] text-[#FCBD00] hover:bg-[#FCBD00]/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recalculer positions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={useAllDetectedKeys}
                    className="border-[#FCBD00] text-[#FCBD00] hover:bg-[#FCBD00]/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Utiliser toutes les clés
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto p-2 bg-slate-50 dark:bg-white/5 rounded">
                {extractedKeys.map((key, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-[#FCBD00]/10 border-[#FCBD00]/30 text-[#FCBD00]"
                  >
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration des positions */}
      {extractedKeys.length > 0 && (
        <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Configuration des Positions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addJsonKey}
                className="border-[#F55B3B] text-[#F55B3B] hover:bg-[#F55B3B]/10"
                disabled={getAvailableKeys().length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une clé
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-[#FCBD00]/10 border-[#FCBD00]/30">
                <Wand2 className="h-4 w-4 text-[#FCBD00]" />
                <AlertTitle className="text-[#FCBD00]">Positions automatiques</AlertTitle>
                <AlertDescription>
                  Les positions définissent où extraire les données dans le fichier plat. Chaque clé doit avoir une
                  position de début et de fin.
                </AlertDescription>
              </Alert>

              {jsonKeys.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-white/60">
                  <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune clé configurée</p>
                  <p className="text-sm">Cliquez sur "Utiliser toutes les clés" ou "Ajouter une clé" pour commencer</p>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {jsonKeys.map((jsonKey) => (
                  <motion.div
                    key={jsonKey.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 dark:bg-white/5 rounded-lg"
                  >
                    <div className="col-span-5">
                      <Label className="text-xs mb-1 block">Clé JSON</Label>
                      <Select
                        value={jsonKey.keyPath}
                        onValueChange={(value) => updateJsonKey(jsonKey.id, "keyPath", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-white/10 text-sm">
                          <SelectValue placeholder="Sélectionner une clé JSON" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#17171E]/95 backdrop-blur-xl border-slate-200 dark:border-white/20 max-h-60">
                          <SelectGroup>
                            <SelectLabel className="text-slate-500 dark:text-white/60">
                              Clés disponibles ({getAvailableKeys(jsonKey.id).length + (jsonKey.keyPath ? 1 : 0)})
                            </SelectLabel>
                            {/* Afficher la clé actuellement sélectionnée */}
                            {jsonKey.keyPath && (
                              <SelectItem
                                value={jsonKey.keyPath}
                                className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{jsonKey.keyPath}</span>
                                  <Check className="h-4 w-4 text-green-500 ml-2" />
                                </div>
                              </SelectItem>
                            )}
                            {/* Afficher les clés disponibles */}
                            {getAvailableKeys(jsonKey.id).map((key) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg"
                              >
                                {key}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs mb-1 block">Position début</Label>
                      <Input
                        type="number"
                        value={jsonKey.startPosition}
                        onChange={(e) => updateJsonKey(jsonKey.id, "startPosition", Number.parseInt(e.target.value))}
                        className="bg-white dark:bg-white/10 text-sm"
                        min="1"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs mb-1 block">Position fin</Label>
                      <Input
                        type="number"
                        value={jsonKey.endPosition}
                        onChange={(e) => updateJsonKey(jsonKey.id, "endPosition", Number.parseInt(e.target.value))}
                        className="bg-white dark:bg-white/10 text-sm"
                        min="1"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeJsonKey(jsonKey.id)}
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/10">
            <Button
              onClick={handleSave}
              disabled={isLoading || !selectedFile || !fileDestination.trim() || jsonKeys.length === 0}
              className="bg-gradient-to-r from-[#FCBD00] to-[#ffd747] hover:opacity-90 text-slate-800 font-medium shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder la Structure ({jsonKeys.length} clés)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

