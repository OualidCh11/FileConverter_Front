"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileJson,
  AlertCircle,
  Save,
  Loader2,
  Wand2,
  ChevronDown,
  ChevronRight,
  Type,
  FileText,
  List,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { uploadJsonStructureWithPositions } from "@/lib/api-service"
import type { JsonUploadRequest, PositionJsonDto } from "@/lib/api-service" // PositionJsonDto now uses keyPath and typeLine

// Options for line type
const lineTypeOptions = [
  { value: "01", label: "01 - Entête" },
  { value: "02", label: "02 - Données" },
  { value: "03", label: "03 - Total" },
  { value: "04", label: "04 - Pied" },
]

// Interface for tree nodes
export interface JsonTreeNode {
  id: string
  name: string // The key name (e.g., "street", "0" for array index)
  path: string // Full dot-notation path (e.g., "address.street", "items[*].productName")
  nodeType: "object" | "array" | "leaf"
  children?: JsonTreeNode[]
  typeLigne?: string // Stays as typeLigne for frontend state, will be mapped to typeLine for API
  exampleValue?: string // Only for 'leaf' nodes
  isExpanded?: boolean
}

interface JsonStructureUploaderProps {
  onComplete?: (fileDestination: string, uploadedLeafKeys?: { keyPath: string; typeLine?: string }[]) => void
  defaultFileDestination?: string
}

// Recursive component to display tree nodes
const JsonTreeNodeDisplay: React.FC<{
  node: JsonTreeNode
  onToggleExpand: (nodeId: string) => void
  onUpdateTypeLigne: (nodeId: string, typeLigne: string) => void
  level: number
}> = ({ node, onToggleExpand, onUpdateTypeLigne, level }) => {
  const Icon =
    node.nodeType === "object"
      ? FileJson
      : node.nodeType === "array"
        ? List
        : node.nodeType === "leaf"
          ? FileText
          : Type

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-1"
    >
      <div
        className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-white/10"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {(node.nodeType === "object" || node.nodeType === "array") && node.children && node.children.length > 0 && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onToggleExpand(node.id)}>
            {node.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        {!((node.nodeType === "object" || node.nodeType === "array") && node.children && node.children.length > 0) && (
          <span className="w-6 inline-block"></span>
        )}

        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
        <span className="font-medium text-sm text-slate-700 dark:text-slate-300 flex-grow truncate" title={node.path}>
          {node.name} <span className="text-xs text-muted-foreground">({node.path})</span>
        </span>

        {node.nodeType === "leaf" && (
          <div className="flex items-center gap-2 ml-auto">
            {node.exampleValue && (
              <span
                className="text-xs text-slate-500 dark:text-slate-400 italic truncate max-w-[100px]"
                title={node.exampleValue}
              >
                Ex: {node.exampleValue}
              </span>
            )}
            <Select value={node.typeLigne || "02"} onValueChange={(value) => onUpdateTypeLigne(node.id, value)}>
              <SelectTrigger className="h-8 w-[150px] text-xs bg-white dark:bg-slate-800">
                <SelectValue placeholder="Type Ligne" />
              </SelectTrigger>
              <SelectContent>
                {lineTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {node.isExpanded && node.children && (
        <div className="pl-0">
          {node.children.map((child) => (
            <JsonTreeNodeDisplay
              key={child.id}
              node={child}
              onToggleExpand={onToggleExpand}
              onUpdateTypeLigne={onUpdateTypeLigne}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export function JsonStructureUploader({ onComplete, defaultFileDestination }: JsonStructureUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jsonTree, setJsonTree] = useState<JsonTreeNode | null>(null)
  const [fileDestination, setFileDestination] = useState(defaultFileDestination || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const parseJsonToTreeData = useCallback(
    (jsonData: any, currentPath = "", currentName = "root", depth = 0): JsonTreeNode => {
      const MAX_DEPTH = 20
      const id = `${currentPath || currentName}-${depth}-${Math.random().toString(36).substring(2, 7)}`

      if (depth > MAX_DEPTH) {
        return {
          id,
          name: currentName,
          path: currentPath || currentName,
          nodeType: "leaf",
          exampleValue: "[Max depth reached]",
          typeLigne: "02",
          isExpanded: false,
        }
      }

      if (Array.isArray(jsonData)) {
        const arrayNode: JsonTreeNode = {
          id,
          name: currentName,
          path: currentPath || currentName,
          nodeType: "array",
          isExpanded: depth < 2,
          children: [],
        }
        if (jsonData.length > 0) {
          const itemPathPrefix = `${currentPath || currentName}[*]`
          arrayNode.children = [parseJsonToTreeData(jsonData[0], itemPathPrefix, "[*]", depth + 1)]
        }
        return arrayNode
      } else if (typeof jsonData === "object" && jsonData !== null) {
        const objectNode: JsonTreeNode = {
          id,
          name: currentName,
          path: currentPath || currentName,
          nodeType: "object",
          isExpanded: depth < 2,
          children: Object.keys(jsonData).map((key) => {
            const newPath = currentPath ? `${currentPath}.${key}` : key
            return parseJsonToTreeData(jsonData[key], newPath, key, depth + 1)
          }),
        }
        return objectNode
      } else {
        return {
          id,
          name: currentName,
          path: currentPath || currentName,
          nodeType: "leaf",
          exampleValue: String(jsonData).substring(0, 30),
          typeLigne: "02",
          isExpanded: false,
        }
      }
    },
    [],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith(".json")) {
      setError("Veuillez sélectionner un fichier JSON.")
      setJsonTree(null)
      return
    }
    setSelectedFile(file)
    setError(null)
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedJson = JSON.parse(content)
        const tree = parseJsonToTreeData(parsedJson, "", file.name.replace(".json", ""))
        setJsonTree(tree)
        toast({ title: "Fichier analysé", description: "Structure JSON prête à être configurée." })
      } catch (parseError) {
        setError("Erreur d'analyse JSON. Vérifiez le format du fichier.")
        console.error("JSON parse error:", parseError)
        setJsonTree(null)
      } finally {
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      setError("Erreur de lecture du fichier.")
      setIsLoading(false)
      setJsonTree(null)
    }
    reader.readAsText(file)
  }

  const updateNodeRecursively = (
    node: JsonTreeNode,
    nodeId: string,
    updateFn: (node: JsonTreeNode) => JsonTreeNode,
  ): JsonTreeNode => {
    if (node.id === nodeId) {
      return updateFn(node)
    }
    if (node.children) {
      return { ...node, children: node.children.map((child) => updateNodeRecursively(child, nodeId, updateFn)) }
    }
    return node
  }

  const handleToggleExpand = (nodeId: string) => {
    if (!jsonTree) return
    setJsonTree((prevTree) => {
      if (!prevTree) return null
      return updateNodeRecursively(prevTree, nodeId, (node) => ({ ...node, isExpanded: !node.isExpanded }))
    })
  }

  const handleUpdateTypeLigne = (nodeId: string, typeLigne: string) => {
    if (!jsonTree) return
    setJsonTree((prevTree) => {
      if (!prevTree) return null
      return updateNodeRecursively(prevTree, nodeId, (node) => ({ ...node, typeLigne }))
    })
  }

  // Collects only leaf nodes as per UI constraint for assigning typeLigne
  const collectLeafNodesWithTypes = (node: JsonTreeNode, leaves: { keyPath: string; typeLine?: string }[] = []) => {
    if (node.nodeType === "leaf") {
      leaves.push({ keyPath: node.path, typeLine: node.typeLigne }) // Map typeLigne to typeLine
    }
    if (node.children) {
      node.children.forEach((child) => collectLeafNodesWithTypes(child, leaves))
    }
    return leaves
  }

  const handleSave = async () => {
    if (!selectedFile || !fileDestination.trim() || !jsonTree) {
      toast({ title: "Erreur", description: "Veuillez compléter tous les champs requis.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    setError(null)

    const leafNodesForApi = collectLeafNodesWithTypes(jsonTree)

    // Filter out nodes where typeLine might be undefined if not set, though UI defaults to "02"
    const positionJsonDtos: PositionJsonDto[] = leafNodesForApi
      .filter((leaf) => leaf.typeLine) // Ensure typeLine is set
      .map((leaf) => ({
        keyPath: leaf.keyPath,
        typeLine: leaf.typeLine,
      }))

    if (positionJsonDtos.length === 0 && leafNodesForApi.length > 0) {
      toast({
        title: "Avertissement",
        description:
          "Aucun type de ligne n'a été explicitement défini pour les champs feuilles. Utilisation des valeurs par défaut.",
        variant: "default",
      })
      // If you still want to proceed with default types, ensure all leaves are included:
      // positionJsonDtos = leafNodesForApi.map(leaf => ({ keyPath: leaf.keyPath, typeLine: leaf.typeLine || "02" }));
    }

    // Backend validates if keyPath from DTO exists in the uploaded file.
    // Backend also checks if fileDestination already exists.

    try {
      const metadata: JsonUploadRequest = {
        fileDestination: fileDestination.trim(),
        positionJsonDtos,
      }

      await uploadJsonStructureWithPositions(selectedFile, metadata)

      toast({ title: "Succès", description: "Structure JSON sauvegardée." })
      if (onComplete) {
        // Pass back the keyPath and their assigned typeLine
        const savedKeys = positionJsonDtos.map((p) => ({ keyPath: p.keyPath, typeLine: p.typeLine }))
        onComplete(fileDestination.trim(), savedKeys)
      }
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
            <Label htmlFor="json-upload-input-structure">Fichier JSON de structure</Label>
            <div className="flex gap-2">
              <input
                id="json-upload-input-structure"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 border-dashed">
                <Upload className="h-4 w-4 mr-2" /> {selectedFile ? selectedFile.name : "Sélectionner un fichier"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-destination-input">Nom du fichier de destination (pour cette structure)</Label>
            <Input
              id="file-destination-input"
              value={fileDestination}
              onChange={(e) => setFileDestination(e.target.value)}
              placeholder="ex: StructureClientV2"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && !jsonTree && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Analyse du fichier JSON...</span>
        </div>
      )}

      {jsonTree && (
        <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Configuration des Types de Ligne pour les Champs JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-[#FCBD00]/10 border-[#FCBD00]/30 mb-4">
              <Wand2 className="h-4 w-4 text-[#FCBD00]" />
              <AlertTitle className="text-[#FCBD00]">Assigner les Types de Ligne</AlertTitle>
              <AlertDescription>
                Pour chaque champ de données (feuille) dans la structure JSON, sélectionnez le type de ligne
                correspondant. Ceci est utilisé pour le mappage avec les données du fichier plat.
              </AlertDescription>
            </Alert>
            <div className="border rounded-md p-2 max-h-[500px] overflow-auto bg-slate-50 dark:bg-slate-900/30">
              <AnimatePresence>
                <JsonTreeNodeDisplay
                  node={jsonTree}
                  onToggleExpand={handleToggleExpand}
                  onUpdateTypeLigne={handleUpdateTypeLigne}
                  level={0}
                />
              </AnimatePresence>
            </div>
            <div className="mt-6 flex justify-end">
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
                    Sauvegarder Structure
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
