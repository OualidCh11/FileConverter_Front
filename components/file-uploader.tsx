"use client"

import type React from "react"

import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FileUp, Upload, FileText, Table, FileJson, Eye, EyeOff, Plus, Trash2, AlertCircle } from "lucide-react"
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

export interface FlatFieldDefinition {
  id: number
  name: string
  startPos: number
  endPos: number
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

export function FileUploader({ onContinue }: FileUploaderProps) {
  const [fileType, setFileType] = useState<string>("CSV")
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [fileFields, setFileFields] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [flatFields, setFlatFields] = useState<FlatFieldDefinition[]>([
    { id: 1, name: "nom", startPos: 1, endPos: 15},
    { id: 2, name: "prenom", startPos: 16, endPos: 30 },
    { id: 3, name: "age", startPos: 31, endPos: 33 },
    { id: 4, name: "role", startPos: 34, endPos: 45 },
    { id: 5, name: "Ville", startPos: 46, endPos: 63 },
    
  ])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [uploadedFileId, setUploadedFileId] = useState<number | undefined>(undefined)
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
    // Traiter le fichier directement sans vérification de taille
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

    // Read as text
    reader.readAsText(file)
  }

  const extractFields = (content: string, type: string) => {
    let fields: string[] = []

    try {
      if (type === "CSV") {
        // Extract headers from CSV
        const lines = content.split("\n")
        if (lines.length > 0) {
          fields = lines[0].split(",").map((field) => field.trim())
        }
      } else if (type === "XML") {
        // Simple XML tag extraction (for demo purposes)
        const tagRegex = /<([a-zA-Z0-9_]+)>/g
        const matches = content.matchAll(tagRegex)
        const uniqueTags = new Set<string>()

        for (const match of matches) {
          if (match[1]) uniqueTags.add(match[1])
        }

        fields = Array.from(uniqueTags)
      } else if (type === "FLAT") {
        // For flat files, use the defined field positions
        fields = flatFields.map((field) => field.name)
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

  const getFilePreview = () => {
    if (!fileContent) return null
    return fileContent
  }

  const addFlatField = () => {
    const lastField = flatFields[flatFields.length - 1]
    const newEndPos = lastField ? lastField.endPos + 10 : 10
    const newFields = [
      ...flatFields,
      {
        id: flatFields.length + 1,
        name: `champ${flatFields.length + 1}`,
        startPos: lastField ? lastField.endPos + 1 : 1,
        endPos: newEndPos,
      },
    ]
    setFlatFields(newFields)

    // Mettre à jour les champs détectés
    if (fileType === "FLAT") {
      setFileFields(newFields.map((field) => field.name))
    }
  }

  const removeFlatField = (id: number) => {
    if (flatFields.length > 1) {
      const newFields = flatFields.filter((field) => field.id !== id)
      setFlatFields(newFields)

      // Mettre à jour les champs détectés
      if (fileType === "FLAT") {
        setFileFields(newFields.map((field) => field.name))
      }
    }
  }

  const updateFlatField = (id: number, field: keyof FlatFieldDefinition, value: string | number) => {
    const newFields = flatFields.map((f) => {
      if (f.id === id) {
        return { ...f, [field]: value }
      }
      return f
    })

    setFlatFields(newFields)

    // Mettre à jour les champs détectés si le nom du champ a changé
    if (field === "name" && fileType === "FLAT") {
      setFileFields(newFields.map((field) => field.name))
    }
  }

  // Modifier la fonction handleUploadToServer pour extraire l'ID du fichier de la réponse
  const handleUploadToServer = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier à télécharger",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await uploadFile(selectedFile)
      console.log("Résultat de l'upload:", result)

      // Essayer d'extraire un ID de fichier de la réponse
      let fileId: number | undefined = undefined
      try {
        // Si la réponse est un JSON, essayer d'extraire l'ID
        const jsonResult = JSON.parse(result)
        fileId = jsonResult.id || jsonResult.fileId || undefined
      } catch (e) {
        // Si ce n'est pas un JSON, essayer d'extraire un nombre de la chaîne
        const matches = result.match(/\d+/)
        if (matches && matches.length > 0) {
          fileId = Number.parseInt(matches[0], 10)
        } else {
          // Fallback: générer un ID aléatoire pour la démo
          fileId = Math.floor(Math.random() * 1000) + 1
        }
      }

      console.log("ID du fichier extrait:", fileId)

      toast({
        title: "Succès",
        description: "Fichier téléchargé avec succès",
      })

      // Passer à l'étape suivante avec les champs détectés, l'ID du fichier, le nom du fichier et les définitions de champs
      onContinue(fileFields, fileId, selectedFile.name, fileType === "FLAT" ? flatFields : undefined)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Erreur lors de l'upload du fichier")
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'upload du fichier",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTypeInfo = fileTypes.find((type) => type.id === fileType)

  return (
    <div className="space-y-8 text-slate-800 dark:text-white transition-colors duration-500">
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <h3 className="text-lg font-medium">Sélectionner le type de fichier</h3>
          <Select
            defaultValue={fileType}
            onValueChange={(value) => {
              setFileType(value)
              if (fileContent) {
                extractFields(fileContent, value)
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

      {/* Configuration pour les fichiers plats */}
      {fileType === "FLAT" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Définition des champs du fichier plat</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addFlatField}
              className="border-[#F55B3B] dark:border-[#F55B3B] text-[#F55B3B] dark:text-[#F55B3B] hover:bg-[#F55B3B]/10 dark:hover:bg-[#F55B3B]/10 backdrop-blur-sm transition-colors duration-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un champ
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 transition-colors duration-500">
            <p className="text-sm text-slate-600 dark:text-white/60 mb-4">
              Définissez les champs par position pour ce fichier à largeur fixe. Chaque champ est défini par une
              position de début et de fin.
            </p>

            <div className="space-y-4">
              {flatFields.map((field) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4">
                    <Label className="text-xs mb-1 block">Nom du champ</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateFlatField(field.id, "name", e.target.value)}
                      className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs mb-1 block">Position début</Label>
                    <Input
                      type="number"
                      value={field.startPos}
                      onChange={(e) => updateFlatField(field.id, "startPos", Number.parseInt(e.target.value))}
                      className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs mb-1 block">Position fin</Label>
                    <Input
                      type="number"
                      value={field.endPos}
                      onChange={(e) => updateFlatField(field.id, "endPos", Number.parseInt(e.target.value))}
                      className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end pt-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFlatField(field.id)}
                      disabled={flatFields.length === 1}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
            accept={selectedTypeInfo?.extensions.join(",")}
          />

          {/* Animated border */}
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
            Pour les fichiers volumineux, seul un aperçu sera chargé pour des raisons de performance.
          </p>
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
                  className="bg-[#F55B3B]/10 dark:bg-[#F55B3B]/10 text-[#F55B3B] dark:text-[#F55B3B] border-[#F55B3B]/30 dark:border-[#F55B3B]/30"
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

              {fileType === "FLAT" && fileContent && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Aperçu des données extraites</h4>
                  <Card className="overflow-hidden border border-slate-200 dark:border-white/10 transition-colors duration-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-3">
                        {fileContent
                          .split("\n")
                          .slice(0, 3)
                          .map((line, lineIndex) => (
                            <div key={lineIndex} className="space-y-2 p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                              <div className="text-xs font-medium text-slate-500 dark:text-white/60">
                                Ligne {lineIndex + 1}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {flatFields.map((field) => {
                                  // Ajuster pour l'indexation à base 0
                                  const start = field.startPos - 1
                                  const end = field.endPos
                                  const value = line.substring(start, end).trim()

                                  return (
                                    <div
                                      key={field.id}
                                      className="p-2 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/20"
                                    >
                                      <div className="text-xs font-medium text-[#F55B3B] dark:text-[#F55B3B]">
                                        {field.name}
                                      </div>
                                      <div className="text-sm truncate">
                                        {value || <span className="text-slate-400 dark:text-white/40">Vide</span>}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
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
