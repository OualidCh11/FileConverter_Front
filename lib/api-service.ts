// Service API pour communiquer avec le backend Spring Boot

// Types basés sur les entités Java
export interface FileEntity {
  id: number
  fileName: string
  localDateTime: string
  typeFile: string
  fileDetails?: FileDetail[]
  configMapping?: ConfigMapping
}

export interface FileDetail {
  id: number
  // id: number // Duplicate id property removed
  nrLines: number
  contentFile: string
  statut: "AT" | "RE" | "TR"
  configMappingDetails?: ConfigMappingDetail[]
  fileEntity?: FileEntity
}

export interface ConfigMapping {
  id: number
  fileSource: string
  fileDestinqtionJson: string // Typo: fileDestinationJson
  status: "AT" | "RE" | "TR"
  localDateTime: string
  fileEntities?: FileEntity[]
  configMappingDetails?: ConfigMappingDetail[]
}

export interface ConfigMappingDetail {
  id: number
  nrLineFiles: number
  keySource: string
  typeFile: string
  keyDistination: string // Typo: keyDestination
  valueDistination: string // Typo: valueDestination
  startPos: number
  endPos: number
  configMapping?: ConfigMapping
  fileDetail?: FileDetail
  outMappings?: OutMapping[]
  typeLigneSource?: string // Added for source line type
  typeLigneDestination?: string // Added for destination line type
}

export interface OutMapping {
  id: number
  contentMapper: string
  dateMapping: string
  configMappingDetail?: ConfigMappingDetail
}

export interface JsonStructure {
  id: number
  keyPath: string
  fileDestination: string
  dateCreated: string
  start_position?: number
  end_position?: number
  typeLigne?: string // Added for JSON key line type
}

export interface MappingDTO {
  fileDestinationName: string
}

export interface ConfigMappingDTO {
  keySource: string
  typeFile: string
  keyDistination: string // Typo: keyDestination
  startPos: number
  endPos: number
  nrLineFiles?: number
  configMappingId?: number
  fileDetailId?: number
  typeLigneSource?: string // Added for source line type
  typeLigneDestination?: string // Added for destination line type
}

// Types pour l'upload de structure JSON
export interface PositionJsonDto {
  keyPayh: string // Note: le backend utilise "keyPayh" avec une faute de frappe
  start_position?: number
  end_position?: number
  typeLigne?: string // Added for JSON key line type
}

export interface JsonUploadRequest {
  fileDestination: string
  positionJsonDtos: PositionJsonDto[]
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"

// Service pour l'upload de fichiers
export async function uploadFile(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de l'upload du fichier")
    }

    return await response.text()
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier:", error)
    throw error
  }
}

// Service pour uploader un fichier JSON de structure avec positions et types de ligne
export async function uploadJsonStructureWithPositions(file: File, metadata: JsonUploadRequest): Promise<string> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))

    const response = await fetch(`${API_BASE_URL}/api/json-keys/saveKeys-withPosition`, {
      // Assuming this endpoint can handle typeLigne
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de l'upload de la structure JSON")
    }

    return await response.text()
  } catch (error) {
    console.error("Erreur lors de l'upload de la structure JSON:", error)
    throw error
  }
}

// Service pour uploader un fichier JSON de structure (ancien endpoint) - Potentially deprecate or update
export async function uploadJsonStructureFile(file: File, fileDestination: string): Promise<string> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("fileDestination", fileDestination)

    // This old endpoint might not support typeLigne for JSON keys.
    // For now, it's kept as is, but ideally, it should be updated or new logic should use uploadJsonStructureWithPositions
    const response = await fetch(`${API_BASE_URL}/api/json-structure/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de l'upload du fichier JSON de structure")
    }

    return await response.text()
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier JSON de structure:", error)
    throw error
  }
}

// Service pour récupérer les structures JSON par destination (should now include typeLigne)
export async function getJsonStructuresByDestination(fileDestination: string): Promise<JsonStructure[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/json-keys/getByDestination?fileDestination=${encodeURIComponent(fileDestination)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la récupération des structures JSON")
    }

    const structures: JsonStructure[] = await response.json() // Assuming backend returns typeLigne
    console.log("Structures récupérées depuis l'API:", structures)
    return structures
  } catch (error) {
    console.error("Erreur lors de la récupération des structures JSON:", error)
    throw error
  }
}

// Service pour récupérer toutes les destinations de structures JSON
export async function getAllJsonDestinations(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/json-keys/getAllDestinations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la récupération des destinations")
    }

    const destinations = await response.json()
    return destinations
  } catch (error) {
    console.error("Erreur lors de la récupération des destinations:", error)
    throw error
  }
}

// Service pour récupérer les clés de structure JSON (ancien endpoint) - Potentially deprecate or update
export async function getJsonStructureKeys(fileDestination: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/json-structure/keys?fileDestination=${encodeURIComponent(fileDestination)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la récupération des clés de structure")
    }

    const jsonStructures: JsonStructure[] = await response.json()
    // This returns only keyPath, not the full structure with typeLigne.
    // Consider returning JsonStructure[] if typeLigne is needed here.
    return jsonStructures.map((structure) => structure.keyPath)
  } catch (error) {
    console.error("Erreur lors de la récupération des clés de structure:", error)
    throw error
  }
}

// Service pour récupérer les détails d'un fichier
export async function getFileDetails(fileId: number): Promise<FileDetail[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/file-details/${fileId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la récupération des détails du fichier")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du fichier:", error)
    throw error
  }
}

// Service pour sauvegarder une configuration de mapping
export async function saveConfigMapping(configMappingDetails: ConfigMappingDTO[]): Promise<ConfigMappingDetail[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conf-map/save_confmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(configMappingDetails),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la sauvegarde de la configuration")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la configuration:", error)
    throw error
  }
}

export async function saveMapping(mapping: MappingDTO): Promise<ConfigMapping> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mapping/save-map`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapping),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la sauvegarde du mapping")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du mapping:", error)
    throw error
  }
}

// Service pour générer le fichier JSON final
export async function generateJsonFile(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/output/jsonFile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la génération du fichier JSON")
    }

    return await response.text()
  } catch (error) {
    console.error("Erreur lors de la génération du fichier JSON:", error)
    throw error
  }
}

// Service pour récupérer le contenu du fichier JSON généré
export async function getJsonFileContent(fileName: string): Promise<string> {
  try {
    // Essayer d'abord de récupérer le dernier OutMapping enregistré
    try {
      const response = await fetch(`${API_BASE_URL}/api/output/last-mapping`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const outMapping = await response.json()
        if (outMapping && outMapping.contentMapper) {
          return outMapping.contentMapper
        }
      }
    } catch (error) {
      console.warn("Endpoint pour récupérer le dernier mapping non disponible, essai alternatif...")
    }

    // Alternative: essayer de récupérer le contenu via un endpoint dédié
    try {
      const response = await fetch(`${API_BASE_URL}/api/output/content?fileName=${encodeURIComponent(fileName)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        return await response.text()
      }
    } catch (error) {
      console.warn("Endpoint pour récupérer le contenu du fichier non disponible, utilisation de l'alternative...")
    }

    // Si tout échoue, essayer de générer le fichier JSON à nouveau
    const generationResponse = await fetch(`${API_BASE_URL}/api/output/jsonFile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (generationResponse.ok) {
      const responseText = await generationResponse.text()
      // Essayer d'extraire le JSON de la réponse
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return jsonMatch[0]
      }
      return responseText
    }

    throw new Error("Impossible de récupérer le contenu du fichier JSON")
  } catch (error) {
    console.error("Erreur lors de la récupération du contenu du fichier JSON:", error)
    throw error
  }
}