import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileJson, AlertCircle, Trash2, Plus, Eye, EyeOff, Save, Loader2, Wand2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { uploadJsonStructureWithPositions } from "@/lib/api-service" 
import type { JsonUploadRequest } from "@/lib/api-service" 

const lineTypeOptions = [
  { value: "01", label: "01 - Entête" },
  { value: "02", label: "02 - Données" },
  { value: "03", label: "03 - Total" },
  { value: "04", label: "04 - Pied" },
]

interface JsonKey {
  id: string
  keyPath: string
  typeLigne?: string
}

interface JsonStructureUploaderProps {
  onComplete?: (fileDestination: string, uploadedKeys?: JsonKey[]) => void 
  defaultFileDestination?: string
}

export function JsonStructureUploader({ onComplete, defaultFileDestination }: JsonStructureUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jsonContent, setJsonContent] = useState<string>("")
  const [extractedKeys, setExtractedKeys] = useState<string[]>([]) // Clés brutes extraites du JSON
  const [jsonKeys, setJsonKeys] = useState<JsonKey[]>([]) // Clés configurables avec positions et type de ligne
  const [fileDestination, setFileDestination] = useState(defaultFileDestination || "")
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const extractJsonKeysRecursive = (obj: any, prefix = "", depth = 0): string[] => {
    const keys: string[] = []
    const maxDepth = 10
    if (depth > maxDepth) return keys

    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        if (prefix) keys.push(prefix)
        if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
          const arrayItemPrefix = prefix ? `${prefix}[0]` : "[0]"
          keys.push(...extractJsonKeysRecursive(obj[0], arrayItemPrefix, depth + 1))
        }
      } else {
        // if (prefix) keys.push(prefix) // Optionnel: inclure les objets parents comme clés
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key
          keys.push(fullKey)
          if (typeof obj[key] === "object" && obj[key] !== null) {
            keys.push(...extractJsonKeysRecursive(obj[key], fullKey, depth + 1))
          }
        })
      }
    }
    return Array.from(new Set(keys)) // Assurer l'unicité
  }

  // Mettre à jour generateSmartPositions pour inclure typeLigne (par défaut "02")
  const generateSmartPositions = (keys: string[]): JsonKey[] => {
    return keys.map((key, index) => {
      return {
        id: `key-${index}-${Date.now()}`,
        keyPath: key,
        typeLigne: "02", // Type de ligne par défaut pour les clés JSON
      }
    })
  }

  const useAllDetectedKeys = () => {
    if (extractedKeys.length === 0) {
      toast({ title: "Aucune clé détectée", variant: "destructive" })
      return
    }
    const allKeysConfigured = generateSmartPositions(extractedKeys)
    setJsonKeys(allKeysConfigured)
    toast({
      title: "Toutes les clés détectées appliquées",
      description: `${allKeysConfigured.length} clés configurées.`,
    })
  }

  const getOrganizedKeys = () => {
    const groups: { [key: string]: string[] } = {}
    extractedKeys.forEach((key) => {
      const firstSegment = key.split(".")[0]
      if (!groups[firstSegment]) groups[firstSegment] = []
      groups[firstSegment].push(key)
    })
    return groups
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith(".json")) {
      setError("Veuillez sélectionner un fichier JSON.")
      return
    }
    setSelectedFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        setJsonContent(content)
        const parsedJson = JSON.parse(content)
        const keys = extractJsonKeysRecursive(parsedJson)
        setExtractedKeys(keys)
        setJsonKeys(generateSmartPositions(keys)) // Pré-remplir avec positions et types par défaut
        toast({ title: "Fichier analysé", description: `${keys.length} clés uniques détectées.` })
      } catch (parseError) {
        setError("Erreur d'analyse JSON.")
        console.error("JSON parse error:", parseError)
      }
    }
    reader.onerror = () => setError("Erreur de lecture du fichier.")
    reader.readAsText(file)
  }

  // Mettre à jour updateJsonKey pour gérer typeLigne
  const updateJsonKey = (id: string, field: keyof JsonKey, value: string | number) => {
    setJsonKeys((prev) => prev.map((key) => (key.id === id ? { ...key, [field]: value } : key)))
  }

  const removeJsonKey = (id: string) => {
    setJsonKeys((prev) => prev.filter((key) => key.id !== id))
  }

  const addJsonKey = () => {
    // Permet d'ajouter une clé manuellement si nécessaire
    const newKey: JsonKey = {
      id: `key-manual-${Date.now()}`,
      keyPath: "",
      typeLigne: "02", // Type par défaut
    }
    setJsonKeys((prev) => [...prev, newKey])
  }

  const getAvailableRawKeys = (currentKeyId?: string) => {
    const selectedKeyPaths = jsonKeys.filter((key) => key.id !== currentKeyId && key.keyPath).map((key) => key.keyPath)
    return extractedKeys.filter((key) => !selectedKeyPaths.includes(key))
  }

  // Mettre à jour handleSave pour inclure typeLigne dans PositionJsonDto
  const handleSave = async () => {
    if (!selectedFile || !fileDestination.trim() || jsonKeys.length === 0) {
      toast({ title: "Erreur", description: "Veuillez compléter tous les champs requis.", variant: "destructive" })
      return
    }
    if (jsonKeys.some((key) => !key.keyPath || !key.typeLigne)) {
      toast({
        title: "Erreur",
        description: "Chaque clé doit avoir un chemin et un type de ligne.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const metadata: JsonUploadRequest = {
        fileDestination: fileDestination.trim(),
        positionJsonDtos: jsonKeys.map((key) => ({
          keyPayh: key.keyPath,
          typeLigne: key.typeLigne || "02", // Inclure le type de ligne
        })),
      }
      // Utiliser la fonction importée pour l'upload
      await uploadJsonStructureWithPositions(selectedFile, metadata)

      toast({ title: "Succès", description: "Structure JSON sauvegardée." })
      if (onComplete) onComplete(fileDestination.trim(), jsonKeys) // Passer les clés sauvegardées
    } catch (saveError) {
      const errorMessage = saveError instanceof Error ? saveError.message : "Erreur de sauvegarde"
      setError(errorMessage)
      toast({ title: "Erreur de sauvegarde", description: errorMessage, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileJson className="h-5 w-5 text-[#F55B3B]" /> Upload de Structure JSON
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
          <div className="space-y-2">
            <Label>Fichier JSON de structure</Label>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 border-dashed">
                <Upload className="h-4 w-4 mr-2" /> {selectedFile ? selectedFile.name : "Sélectionner un fichier"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nom du fichier de destination</Label>
            <Input
              value={fileDestination}
              onChange={(e) => setFileDestination(e.target.value)}
              placeholder="ex: StructureV1"
            />
          </div>
          {jsonContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Aperçu JSON</Label>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
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
          {extractedKeys.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Clés détectées ({extractedKeys.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={useAllDetectedKeys}
                  className="border-[#FCBD00] text-[#FCBD00] hover:bg-[#FCBD00]/10"
                >
                  <Plus className="h-4 w-4 mr-2" /> Appliquer toutes les clés détectées
                </Button>
              </div>
              <div className="max-h-60 overflow-auto p-2 bg-slate-50 dark:bg-white/5 rounded border">
                {Object.entries(getOrganizedKeys()).map(([group, keysInGroup]) => (
                  <div key={group} className="mb-3">
                    <h4 className="text-sm font-medium mb-1 text-slate-700 dark:text-white/80">{group}</h4>
                    <div className="flex flex-wrap gap-2 pl-2">
                      {keysInGroup.map((key, index) => (
                        <Badge
                          key={`${group}-${index}`}
                          variant="outline"
                          className="text-xs bg-[#FCBD00]/10 border-[#FCBD00]/30 text-[#FCBD00]"
                        >
                          {key.includes(group + ".") ? key.substring(group.length + 1) : key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {jsonKeys.length > 0 && (
        <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Configuration des Clés JSON et Types de Ligne</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addJsonKey}
                className="border-[#F55B3B] text-[#F55B3B] hover:bg-[#F55B3B]/10"
              >
                <Plus className="h-4 w-4 mr-2" /> Ajouter une clé manuellement
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-[#FCBD00]/10 border-[#FCBD00]/30">
                <Wand2 className="h-4 w-4 text-[#FCBD00]" />
                <AlertTitle className="text-[#FCBD00]">Configuration des Types de Ligne</AlertTitle>
                <AlertDescription>
                  Pour chaque clé JSON, sélectionnez le type de ligne correspondant (Entête, Données, etc.). Le type de
                  ligne est crucial pour le mapping.
                </AlertDescription>
              </Alert>
              <AnimatePresence mode="popLayout">
                {jsonKeys.map((jsonKey) => (
                  <motion.div
                    key={jsonKey.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-1 md:grid-cols-[3fr_2fr_auto] gap-4 items-end p-3 bg-slate-50 dark:bg-white/5 rounded-lg mb-2"
                  >
                    <div>
                      <Label className="text-xs mb-1 block">Clé JSON</Label>
                      <Select
                        value={jsonKey.keyPath}
                        onValueChange={(value) => updateJsonKey(jsonKey.id, "keyPath", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-white/10 text-sm">
                          <SelectValue placeholder="Sélectionner une clé" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#17171E]/95 max-h-60">
                          {jsonKey.keyPath && (
                            <SelectItem value={jsonKey.keyPath} className="font-semibold">
                              {jsonKey.keyPath} (Actuelle)
                            </SelectItem>
                          )}
                          {getAvailableRawKeys(jsonKey.id).map((key) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Type Ligne</Label>
                      <Select
                        value={jsonKey.typeLigne || "02"}
                        onValueChange={(value) => updateJsonKey(jsonKey.id, "typeLigne", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-white/10 text-sm">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#17171E]/95">
                          {lineTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeJsonKey(jsonKey.id)}
                      className="text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isLoading}
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
                    Sauvegarder Structure ({jsonKeys.length} clés)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}