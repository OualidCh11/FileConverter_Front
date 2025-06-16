"use client"

import type React from "react"

import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  FileUp,
  Upload,
  FileText,
  Table,
  FileJson,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
  Wand2,
  RotateCcw,
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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { uploadFile } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

interface FileUploaderProps {
  onContinue: (fields: string[], fileId?: number, fileName?: string, fieldDefinitions?: FlatFieldDefinition[]) => void
}

interface FileTypeInfo {
  id: string
  name: string
  description: string
  icon: React.ElementType
  extensions: string[]
}

// Remplacer isHeader par typeLigne dans l'interface FlatFieldDefinition
export interface FlatFieldDefinition {
  id: number
  name: string
  startPos: number
  endPos: number
  typeLigne?: string // Remplacé isHeader par typeLigne
}

const fileTypes: FileTypeInfo[] = [
  {
    id: "XML",
    name: "Document XML",
    description: "Données structurées avec balises",
    icon: FileText,
    extensions: [".xml", ".xhtml", ".svg"],
  },
  {
    id: "CSV",
    name: "Feuille CSV",
    description: "Valeurs séparées par des virgules",
    icon: Table,
    extensions: [".csv", ".tsv"],
  },
  {
    id: "FLAT",
    name: "Fichier Plat",
    description: "Fichiers texte à largeur fixe",
    icon: FileJson,
    extensions: [".txt", ".dat"],
  },
]

// Options pour le type de ligne
const lineTypeOptions = [
  { value: "01", label: "01 - Entête" },
  { value: "02", label: "02 - Données" },
  { value: "03", label: "03 - ??" },
  { value: "04", label: "04 - ??" },
  // Ajouter d'autres types si nécessaire
]

export function FileUploader({ onContinue }: FileUploaderProps) {
  const [fileType, setFileType] = useState<string>("CSV")
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [fileFields, setFileFields] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)
  // Initialiser flatFields avec typeLigne (par défaut "02")
  const [flatFields, setFlatFields] = useState<FlatFieldDefinition[]>([
    { id: 1, name: "nom", startPos: 1, endPos: 9, typeLigne: "02" },
    { id: 2, name: "prenom", startPos: 10, endPos: 17, typeLigne: "02" },
    { id: 3, name: "age", startPos: 18, endPos: 21, typeLigne: "02" },
    { id: 4, name: "ville", startPos: 22, endPos: 27, typeLigne: "02" },
  ])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [uploadedFileId, setUploadedFileId] = useState<number | undefined>(undefined)
  const [autoDetectedFields, setAutoDetectedFields] = useState<FlatFieldDefinition[]>([])
  const [showAutoDetection, setShowAutoDetection] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0])
    }
  }

  const validateAndProcessFile = (file: File) => {
    setFileError(null)
    handleFile(file)
  }

  const handleFile = (file: File) => {
    setSelectedFile(file)
    setIsLoading(true)
    setLoadingProgress(0)

    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content)
      extractFields(content, fileType)

      if (fileType === "FLAT") {
        const detectedFields = autoDetectFlatFields(content)
        setAutoDetectedFields(detectedFields)
        setShowAutoDetection(true)
      }

      setIsLoading(false)
      setLoadingProgress(100)
    }

    reader.onerror = () => {
      console.error("Error reading file")
      setFileError("Erreur lors de la lecture du fichier")
      setIsLoading(false)
    }

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        setLoadingProgress(progress)
      }
    }

    reader.readAsText(file)
  }

  const autoDetectFlatFields = (content: string): FlatFieldDefinition[] => {
    const lines = content.split("\n").filter((line) => line.trim().length > 0)
    if (lines.length === 0) return []

    const sampleLines = lines.slice(0, Math.min(3, lines.length))
    const maxLength = Math.max(...sampleLines.map((line) => line.length))

    const detectedFields: FlatFieldDefinition[] = []
    const firstLine = sampleLines[0]
    const segments = []
    let currentSegment = { start: 1, end: 1, content: "" }
    let inWord = false

    for (let i = 0; i < firstLine.length; i++) {
      const char = firstLine[i]
      const isSpace = char === " " || char === "\t"

      if (!isSpace && !inWord) {
        currentSegment = { start: i + 1, end: i + 1, content: char }
        inWord = true
      } else if (!isSpace && inWord) {
        currentSegment.end = i + 1
        currentSegment.content += char
      } else if (isSpace && inWord) {
        segments.push({ ...currentSegment })
        inWord = false
      }
    }
    if (inWord) {
      segments.push(currentSegment)
    }

    segments.forEach((segment, index) => {
      let fieldName = `champ${index + 1}`
      const content = segment.content.toLowerCase()
      if (content.match(/^[a-z]+$/)) {
        if (content.length > 2) fieldName = content.length > 8 ? "nom" : "prenom"
      } else if (content.match(/^\d+$/)) {
        fieldName = content.length <= 3 ? "age" : "code"
      } else if (content.match(/^[a-z\s]+$/i)) {
        fieldName = content.length > 5 ? "ville" : "nom"
      }
      // Initialiser typeLigne à "02" (Données) par défaut pour les champs auto-détectés
      detectedFields.push({
        id: index + 1,
        name: fieldName,
        startPos: segment.start,
        endPos: segment.end,
        typeLigne: "02",
      })
    })

    if (detectedFields.length === 0) {
      const fieldWidth = Math.floor(maxLength / 4)
      for (let i = 0; i < 4; i++) {
        detectedFields.push({
          id: i + 1,
          name: `champ${i + 1}`,
          startPos: i * fieldWidth + 1,
          endPos: (i + 1) * fieldWidth,
          typeLigne: "02", // Valeur par défaut
        })
      }
    }
    return detectedFields
  }

  const extractFields = (content: string, type: string) => {
    let fields: string[] = []
    try {
      if (type === "CSV") {
        const lines = content.split("\n")
        if (lines.length > 0) fields = lines[0].split(",").map((field) => field.trim())
      } else if (type === "XML") {
        const tagRegex = /<([a-zA-Z0-9_]+)>/g
        const matches = content.matchAll(tagRegex)
        const uniqueTags = new Set<string>()
        for (const match of matches) {
          if (match[1]) uniqueTags.add(match[1])
        }
        fields = Array.from(uniqueTags)
      } else if (type === "FLAT") {
        fields = []
      }
    } catch (error) {
      console.error("Error extracting fields:", error)
    }
    setFileFields(fields)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Octets"
    const k = 1024
    const sizes = ["Octets", "Ko", "Mo", "Go", "To"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFilePreview = () => fileContent || null

  const addFlatField = () => {
    const lastField = flatFields[flatFields.length - 1]
    const newEndPos = lastField ? lastField.endPos + 10 : 10
    // Initialiser typeLigne à "02" pour les nouveaux champs
    const newFields = [
      ...flatFields,
      {
        id: flatFields.length + 1,
        name: `champ${flatFields.length + 1}`,
        startPos: lastField ? lastField.endPos + 1 : 1,
        endPos: newEndPos,
        typeLigne: "02",
      },
    ]
    setFlatFields(newFields)
    if (fileType === "FLAT") setFileFields(newFields.map((field) => field.name))
  }

  const removeFlatField = (id: number) => {
    if (flatFields.length > 1) {
      const newFields = flatFields.filter((field) => field.id !== id)
      setFlatFields(newFields)
      if (fileType === "FLAT") setFileFields(newFields.map((field) => field.name))
    }
  }

  // Mettre à jour updateFlatField pour gérer typeLigne
  const updateFlatField = (id: number, field: keyof FlatFieldDefinition, value: string | number) => {
    const newFields = flatFields.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    setFlatFields(newFields)
    if (field === "name" && fileType === "FLAT") setFileFields(newFields.map((field) => field.name))
  }

  const applyAutoDetection = () => {
    setFlatFields(autoDetectedFields)
    setFileFields(autoDetectedFields.map((field) => field.name))
    setShowAutoDetection(false)
    toast({
      title: "Détection appliquée",
      description: `${autoDetectedFields.length} champs ont été détectés automatiquement`,
    })
  }

  const resetToDefault = () => {
    // Réinitialiser avec typeLigne
    const defaultFields: FlatFieldDefinition[] = [
      { id: 1, name: "nom", startPos: 1, endPos: 9, typeLigne: "02" },
      { id: 2, name: "prenom", startPos: 10, endPos: 17, typeLigne: "02" },
      { id: 3, name: "age", startPos: 18, endPos: 21, typeLigne: "02" },
      { id: 4, name: "ville", startPos: 22, endPos: 27, typeLigne: "02" },
    ]
    setFlatFields(defaultFields)
    setFileFields(defaultFields.map((field) => field.name))
    setShowAutoDetection(false)
  }

  // Mettre à jour handleUploadToServer pour inclure typeLigne
  const handleUploadToServer = async () => {
    if (!selectedFile) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un fichier", variant: "destructive" })
      return
    }
    if (fileType === "FLAT" && flatFields.some((field) => !field.name || field.startPos >= field.endPos)) {
      toast({
        title: "Erreur",
        description: "Veuillez définir positions et types pour tous les champs",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (fileType === "FLAT") {
        const fieldPositions = {
          fields: flatFields.map((field) => ({
            name: field.name,
            startPos: field.startPos,
            endPos: field.endPos,
            typeLigne: field.typeLigne || "02", // Inclure typeLigne
          })),
        }
        formData.append("fieldPositions", new Blob([JSON.stringify(fieldPositions)], { type: "application/json" }))
      }

      const result = await uploadFile(selectedFile)
      let fileId: number | undefined
      try {
        const jsonResult = JSON.parse(result)
        fileId = jsonResult.id || jsonResult.fileId
      } catch (e) {
        const matches = result.match(/\d+/)
        if (matches) fileId = Number.parseInt(matches[0], 10)
        else fileId = Math.floor(Math.random() * 1000) + 1
      }

      toast({ title: "Succès", description: "Fichier téléchargé" })
      onContinue(fileFields, fileId, selectedFile.name, fileType === "FLAT" ? flatFields : undefined)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur d'upload"
      setFileError(errorMessage)
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTypeInfo = fileTypes.find((type) => type.id === fileType)

  return (
    <div className="space-y-8 text-slate-800 dark:text-white transition-colors duration-500">
      {/* Section de sélection du type de fichier (inchangée) */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <h3 className="text-lg font-medium">Sélectionner le type de fichier</h3>
          <Select
            defaultValue={fileType}
            onValueChange={(value) => {
              setFileType(value)
              if (fileContent) {
                extractFields(fileContent, value)
                if (value === "FLAT") {
                  const detectedFields = autoDetectFlatFields(fileContent)
                  setAutoDetectedFields(detectedFields)
                  setShowAutoDetection(true)
                }
              }
            }}
          >
            <SelectTrigger className="w-full bg-white/50 dark:bg-white/10 border-slate-200 dark:border-white/20 backdrop-blur-lg hover:bg-white/80 dark:hover:bg-white/20 transition-colors duration-300">
              <SelectValue placeholder="Sélectionner un type de fichier">
                {selectedTypeInfo && (
                  <div className="flex items-center gap-2">
                    <selectedTypeInfo.icon className="h-4 w-4 text-[#F55B3B] dark:text-[#F55B3B] transition-colors duration-500" />
                    <span>{selectedTypeInfo.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#17171E]/95 backdrop-blur-xl border-slate-200 dark:border-white/20 transition-colors duration-500">
              <SelectGroup>
                <SelectLabel className="text-slate-500 dark:text-white/60 transition-colors duration-500">
                  Formats disponibles
                </SelectLabel>
                {fileTypes.map((type) => (
                  <SelectItem
                    key={type.id}
                    value={type.id}
                    className="hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 rounded-lg transition-colors duration-300"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <type.icon className="h-4 w-4 text-[#F55B3B] dark:text-[#F55B3B] transition-colors duration-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{type.name}</span>
                        <span className="text-xs text-slate-500 dark:text-white/60 transition-colors duration-500">
                          {type.description} • {type.extensions.join(", ")}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {selectedTypeInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-slate-100/70 dark:bg-white/5 backdrop-blur-sm rounded-xl text-sm border border-slate-200 dark:border-white/10 transition-colors duration-500"
          >
            <div className="flex items-center gap-2">
              <selectedTypeInfo.icon className="h-4 w-4 text-[#F55B3B] dark:text-[#F55B3B] transition-colors duration-500" />
              <span className="font-medium">{selectedTypeInfo.name}</span>
            </div>
            <span className="text-slate-400 dark:text-white/40 transition-colors duration-500">•</span>
            <span className="text-slate-500 dark:text-white/60 transition-colors duration-500">
              {selectedTypeInfo.extensions.join(", ")}
            </span>
          </motion.div>
        )}
      </div>

      {/* Section d'upload de fichier (inchangée) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Télécharger un fichier</h3>
        </div>
        {fileError && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}
        <motion.div
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className={`relative group cursor-pointer rounded-2xl transition-all duration-300 ${
            dragActive ? "bg-[#F55B3B]/20 dark:bg-[#F55B3B]/20" : "bg-slate-100/50 dark:bg-white/5"
          } transition-colors duration-500`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept={selectedTypeInfo?.extensions.join(",")}
          />
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#F55B3B] to-[#FCBD00] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div
            className="relative p-8 rounded-2xl bg-white/80 dark:bg-[#17171E]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center transition-colors duration-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#F55B3B] to-[#ff7b5b] dark:from-[#F55B3B] dark:to-[#ff7b5b] flex items-center justify-center mb-6 shadow-lg shadow-[#F55B3B]/25 dark:shadow-[#F55B3B]/25 transition-colors duration-500"
            >
              <FileUp className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-xl font-medium">Glissez et déposez votre fichier ici</h3>
            <p className="text-slate-500 dark:text-white/60 mt-2 mb-6 transition-colors duration-500">
              ou cliquez pour parcourir vos fichiers
            </p>
            <Button
              className="bg-gradient-to-r from-[#F55B3B] to-[#ff7b5b] dark:from-[#F55B3B] dark:to-[#ff7b5b] hover:opacity-90 transition-opacity text-white shadow-lg shadow-[#F55B3B]/25 dark:shadow-[#F55B3B]/25 transition-colors duration-500"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Parcourir les fichiers
            </Button>
          </div>
        </motion.div>
      </div>

      {isLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Chargement du fichier...</span>
            <span className="text-sm">{loadingProgress}%</span>
          </div>
          <Progress value={loadingProgress} className="h-2 bg-slate-200 dark:bg-white/10" />
          <p className="text-xs text-slate-500 dark:text-white/60">
            Analyse automatique des champs en cours pour les fichiers plats...
          </p>
        </motion.div>
      )}

      {/* Auto-détection pour les fichiers plats */}
      {fileType === "FLAT" && showAutoDetection && autoDetectedFields.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Alert className="bg-[#FCBD00]/10 border-[#FCBD00]/30">
            <Wand2 className="h-4 w-4 text-[#FCBD00]" />
            <AlertTitle className="text-[#FCBD00]">Détection automatique des champs</AlertTitle>
            <AlertDescription>
              {autoDetectedFields.length} champs ont été détectés automatiquement dans votre fichier plat.
            </AlertDescription>
          </Alert>

          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 transition-colors duration-500">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Champs détectés automatiquement</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyAutoDetection}
                  className="border-[#FCBD00] dark:border-[#FCBD00] text-[#FCBD00] dark:text-[#FCBD00] hover:bg-[#FCBD00]/10 dark:hover:bg-[#FCBD00]/10"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Appliquer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAutoDetection(false)}
                  className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-white/70"
                >
                  Ignorer
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {autoDetectedFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-3 items-center p-2 bg-white dark:bg-white/10 rounded"
                >
                  <div className="col-span-4">
                    <Label className="text-xs mb-1 block">Nom suggéré</Label>
                    <div className="text-sm font-medium">{field.name}</div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs mb-1 block">Position début</Label>
                    <div className="text-sm">{field.startPos}</div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs mb-1 block">Position fin</Label>
                    <div className="text-sm">{field.endPos}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs mb-1 block">Aperçu</Label>
                    <div className="text-xs text-slate-500 dark:text-white/60 truncate">
                      {fileContent.split("\n")[0]?.substring(field.startPos - 1, field.endPos) || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Configuration manuelle pour les fichiers plats - MODIFIÉ */}
      {fileType === "FLAT" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Définition des champs du fichier plat</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addFlatField}
                className="border-[#F55B3B] dark:border-[#F55B3B] text-[#F55B3B] dark:text-[#F55B3B] hover:bg-[#F55B3B]/10 dark:hover:bg-[#F55B3B]/10"
              >
                <Plus className="h-4 w-4 mr-2" /> Ajouter un champ
              </Button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10">
            <p className="text-sm text-slate-600 dark:text-white/60 mb-4">
              Définissez les champs, leurs positions et leur type de ligne.
            </p>
            <div className="space-y-4">
              {flatFields.map((field) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_0.5fr_0.5fr_auto] gap-3 items-end"
                >
                  <div>
                    <Label htmlFor={`name-${field.id}`} className="text-xs mb-1 block">
                      Nom du champ
                    </Label>
                    <Input
                      id={`name-${field.id}`}
                      value={field.name}
                      onChange={(e) => updateFlatField(field.id, "name", e.target.value)}
                      className="bg-white/50 dark:bg-white/5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`startPos-${field.id}`} className="text-xs mb-1 block">
                      Début
                    </Label>
                    <Input
                      id={`startPos-${field.id}`}
                      type="number"
                      value={field.startPos}
                      onChange={(e) => updateFlatField(field.id, "startPos", Number.parseInt(e.target.value))}
                      className="bg-white/50 dark:bg-white/5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`endPos-${field.id}`} className="text-xs mb-1 block">
                      Fin
                    </Label>
                    <Input
                      id={`endPos-${field.id}`}
                      type="number"
                      value={field.endPos}
                      onChange={(e) => updateFlatField(field.id, "endPos", Number.parseInt(e.target.value))}
                      className="bg-white/50 dark:bg-white/5"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`typeLigne-${field.id}`} className="text-xs mb-1 block">
                      Type Ligne
                    </Label>
                    <Select
                      value={field.typeLigne || "02"}
                      onValueChange={(value) => updateFlatField(field.id, "typeLigne", value)}
                    >
                      <SelectTrigger id={`typeLigne-${field.id}`} className="bg-white/50 dark:bg-white/5">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
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
                    onClick={() => removeFlatField(field.id)}
                    disabled={flatFields.length === 1}
                    className="text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {selectedFile && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#FCBD00]/20 to-transparent dark:from-[#FCBD00]/20 dark:to-transparent backdrop-blur-sm border border-[#FCBD00]/30 dark:border-[#FCBD00]/30 transition-colors duration-500">
            <div className="h-10 w-10 rounded-lg bg-[#FCBD00] dark:bg-[#FCBD00] flex items-center justify-center transition-colors duration-500">
              <FileUp className="h-5 w-5 text-white dark:text-[#17171E] transition-colors duration-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-slate-500 dark:text-white/60 transition-colors duration-500">
                {fileType} • {formatFileSize(selectedFile.size)}
                {selectedFile.size > 10 * 1024 * 1024 && (
                  <span className="ml-2 text-[#FCBD00] dark:text-[#FCBD00]">(Aperçu limité)</span>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowPreview(!showPreview)
              }}
              className="text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {showPreview && fileContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">Aperçu du fichier</h3>
                <Badge
                  variant="outline"
                  className="bg-[#F55B3B]/10 dark:bg-[#F55B3B]/20 text-[#F55B3B] dark:text-[#F55B3B] border-[#F55B3B]/30 dark:border-[#F55B3B]/30 transition-colors duration-500"
                >
                  {fileFields.length} champs détectés
                </Badge>
              </div>

              <Card className="overflow-hidden border border-slate-200 dark:border-white/10 transition-colors duration-500">
                <CardContent className="p-0">
                  <div className="max-h-[200px] overflow-auto p-4 bg-slate-50 dark:bg-[#17171E]/80 font-mono text-xs text-slate-800 dark:text-white/90 whitespace-pre transition-colors duration-500">
                    {getFilePreview()}
                  </div>
                </CardContent>
              </Card>

              {fileType === "FLAT" && (
                <div className="p-3 rounded-lg bg-[#FCBD00]/10 border border-[#FCBD00]/30 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#FCBD00] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">Fichier plat détecté</p>
                    <p className="text-sm text-slate-600 dark:text-white/70">
                      Les champs seront définis automatiquement via la structure JSON dans l'étape de configuration.
                    </p>
                  </div>
                </div>
              )}

              {fileFields.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Champs détectés</h4>
                  <div className="flex flex-wrap gap-2">
                    {fileFields.map((field, index) => (
                      <Badge
                        key={index}
                        className="bg-[#F55B3B]/10 dark:bg-[#F55B3B]/20 text-[#F55B3B] dark:text-[#F55B3B] border-[#F55B3B]/30 dark:border-[#F55B3B]/30 transition-colors duration-500"
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="bg-gradient-to-r from-[#FCBD00] to-[#ffd747] dark:from-[#FCBD00] dark:to-[#ffd747] hover:opacity-90 transition-opacity text-slate-800 dark:text-[#17171E] font-medium shadow-lg shadow-[#FCBD00]/25 dark:shadow-[#FCBD00]/25 transition-colors duration-500"
                onClick={handleUploadToServer}
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? "Téléchargement..." : "Télécharger et continuer"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  )
}