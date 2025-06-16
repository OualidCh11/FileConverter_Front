import { useState, type ChangeEvent, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileJson, AlertCircle, ArrowRight, Wand2, Save } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Options for line type (consistent with other components)
const lineTypeOptions = [
  { value: "01", label: "01 - Entête" },
  { value: "02", label: "02 - Données" },
  { value: "03", label: "03 - Total" },
  { value: "04", label: "04 - Pied" },
]

interface JsonSourceKey {
  id: string
  keyPath: string
  typeLigne: string // Only keyPath and typeLigne are needed for source JSON definition
  exampleValue?: string // Optional: to show a snippet from the uploaded JSON
}

interface FlatTargetField {
  id: string
  name: string
  startPos: number
  endPos: number
  typeLigne: string
}

interface MappingEntry {
  id: string
  sourceJsonPath: string // keyPath from JsonSourceKey
  targetFlatField: string // name from FlatTargetField
}

type WizardStep = "defineJsonSource" | "defineFlatTarget" | "mapFields" | "previewConvert"

export default function JsonToFlatConverter() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("defineJsonSource")

  // Step 1: Define JSON Source
  const [sourceJsonFile, setSourceJsonFile] = useState<File | null>(null)
  const [sourceJsonContent, setSourceJsonContent] = useState<string>("")
  const [detectedJsonKeys, setDetectedJsonKeys] = useState<JsonSourceKey[]>([])
  const [jsonProcessingError, setJsonProcessingError] = useState<string | null>(null)
  const jsonFileInputRef = useRef<HTMLInputElement>(null)

  // Step 2: Define Flat Target
  const [flatTargetFields, setFlatTargetFields] = useState<FlatTargetField[]>([
    { id: `flat-${Date.now()}`, name: "field1", startPos: 1, endPos: 10, typeLigne: "02" },
  ])

  // Step 3: Map Fields
  const [mappings, setMappings] = useState<MappingEntry[]>([])

  const { toast } = useToast()

  const extractJsonKeysRecursive = (obj: any, prefix = "", depth = 0): { keyPath: string; exampleValue: string }[] => {
    const keys: { keyPath: string; exampleValue: string }[] = []
    const maxDepth = 10 // Prevent infinite recursion for circular structures
    if (depth > maxDepth) return keys

    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        // For arrays, we might want to represent the path to the array itself,
        // and then path to elements within an example item if it's an array of objects.
        // Example: 'items' and 'items[0].property'
        if (prefix) keys.push({ keyPath: prefix, exampleValue: `[Array(${obj.length})]` })
        if (obj.length > 0) {
          // Process the first element to find sub-keys if it's an object or another array
          const firstElement = obj[0]
          const arrayItemPrefix = prefix ? `${prefix}[*]` : `[*]` // Use [*] to denote any item
          if (typeof firstElement === "object" && firstElement !== null) {
            keys.push(...extractJsonKeysRecursive(firstElement, arrayItemPrefix, depth + 1))
          } else if (typeof firstElement !== "undefined") {
            // If array of primitives, add path to the primitive type
            keys.push({ keyPath: arrayItemPrefix, exampleValue: String(firstElement).substring(0, 50) })
          }
        }
      } else {
        // It's an object
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key
          if (typeof obj[key] === "object" && obj[key] !== null) {
            // It's a nested object or array
            keys.push(...extractJsonKeysRecursive(obj[key], fullKey, depth + 1))
          } else {
            // It's a primitive value
            keys.push({ keyPath: fullKey, exampleValue: String(obj[key]).substring(0, 50) })
          }
        })
      }
    }
    // Remove duplicates that might arise from array processing logic
    const uniqueKeys = Array.from(new Map(keys.map((item) => [item.keyPath, item])).values())
    return uniqueKeys
  }

  const handleSourceJsonFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      setJsonProcessingError("Veuillez sélectionner un fichier JSON valide.")
      setSourceJsonFile(null)
      setSourceJsonContent("")
      setDetectedJsonKeys([])
      return
    }

    setSourceJsonFile(file)
    setJsonProcessingError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        setSourceJsonContent(content)
        const parsedJson = JSON.parse(content)
        const extracted = extractJsonKeysRecursive(parsedJson)
        setDetectedJsonKeys(
          extracted.map((k, index) => ({
            id: `json-key-${index}-${Date.now()}`,
            keyPath: k.keyPath,
            typeLigne: "02", // Default line type
            exampleValue: k.exampleValue,
          })),
        )
        toast({ title: "Fichier JSON analysé", description: `${extracted.length} chemins de clés détectés.` })
      } catch (parseError) {
        setJsonProcessingError("Erreur d'analyse du fichier JSON. Vérifiez le format.")
        console.error("JSON parse error:", parseError)
        setDetectedJsonKeys([])
      }
    }
    reader.onerror = () => {
      setJsonProcessingError("Erreur de lecture du fichier.")
      setDetectedJsonKeys([])
    }
    reader.readAsText(file)
  }

  const updateJsonKeyTypeLigne = (id: string, typeLigne: string) => {
    setDetectedJsonKeys((prevKeys) => prevKeys.map((key) => (key.id === id ? { ...key, typeLigne } : key)))
  }

  const renderDefineJsonSourceStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-primary" />
          Étape 1: Définir la Structure JSON Source
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {jsonProcessingError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{jsonProcessingError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="json-file-input">Télécharger un fichier JSON exemple</Label>
          <div className="flex gap-2">
            <input
              id="json-file-input"
              ref={jsonFileInputRef}
              type="file"
              accept=".json"
              onChange={handleSourceJsonFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => jsonFileInputRef.current?.click()}
              className="flex-1 border-dashed"
            >
              <Upload className="h-4 w-4 mr-2" />{" "}
              {sourceJsonFile ? sourceJsonFile.name : "Sélectionner un fichier JSON"}
            </Button>
          </div>
        </div>

        {detectedJsonKeys.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Clés JSON détectées et leurs Types de Ligne</h3>
            <Alert>
              <Wand2 className="h-4 w-4" />
              <AlertTitle>Configurez les Types de Ligne</AlertTitle>
              <AlertDescription>
                Assignez un "Type de ligne" à chaque clé JSON détectée. Ceci est crucial pour le mapping. Les positions
                de début/fin ne sont pas nécessaires pour les clés JSON source.
              </AlertDescription>
            </Alert>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {detectedJsonKeys.map((key) => (
                <motion.div
                  key={key.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border grid grid-cols-[2fr_1fr_2fr] gap-3 items-center"
                >
                  <div>
                    <Label className="text-xs text-muted-foreground">Chemin de la clé</Label>
                    <p className="font-mono text-sm truncate" title={key.keyPath}>
                      {key.keyPath}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor={`type-${key.id}`} className="text-xs text-muted-foreground mb-1 block">
                      Type Ligne
                    </Label>
                    <Select value={key.typeLigne} onValueChange={(value) => updateJsonKeyTypeLigne(key.id, value)}>
                      <SelectTrigger id={`type-${key.id}`} className="bg-white dark:bg-white/10 h-9">
                        <SelectValue />
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
                  <div>
                    <Label className="text-xs text-muted-foreground">Exemple de valeur</Label>
                    <p
                      className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate"
                      title={key.exampleValue}
                    >
                      {key.exampleValue || <span className="italic">N/A</span>}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={() => setCurrentStep("defineFlatTarget")} disabled={detectedJsonKeys.length === 0}>
            Suivant: Définir Cible Fichier Plat <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Placeholder for other steps
  const renderDefineFlatTargetStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Étape 2: Définir la Structure Cible Fichier Plat</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Configuration des champs du fichier plat de destination...</p>
        {/* TODO: Implement UI for defining flat file fields (name, startPos, endPos, typeLigne) */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep("defineJsonSource")}>
            Précédent
          </Button>
          <Button onClick={() => setCurrentStep("mapFields")}>
            Suivant: Mapper les Champs <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderMapFieldsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Étape 3: Mapper les Champs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Interface de mapping entre les clés JSON et les champs plats...</p>
        {/* TODO: Implement mapping UI */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep("defineFlatTarget")}>
            Précédent
          </Button>
          <Button onClick={() => setCurrentStep("previewConvert")}>
            Suivant: Aperçu et Conversion <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderPreviewConvertStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Étape 4: Aperçu et Conversion</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Affichage de l'aperçu et bouton de conversion finale...</p>
        {/* TODO: Implement preview and conversion logic */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep("mapFields")}>
            Précédent
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" /> Convertir et Télécharger
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: currentStep === "defineJsonSource" ? 0 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === "defineJsonSource" && renderDefineJsonSourceStep()}
          {currentStep === "defineFlatTarget" && renderDefineFlatTargetStep()}
          {currentStep === "mapFields" && renderMapFieldsStep()}
          {currentStep === "previewConvert" && renderPreviewConvertStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}