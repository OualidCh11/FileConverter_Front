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
  typeLigneDestination?: string // This should align with JsonStructure's typeLine if it's from there
}

export interface OutMapping {
  id: number
  contentMapper: string
  dateMapping: string
  configMappingDetail?: ConfigMappingDetail
}

// Corrected JsonStructure to match backend entity (typeLine)
export interface JsonStructure {
  id: number
  keyPath: string
  fileDestination: string
  dateCreated: string // Assuming backend sends string representation
  typeLine?: string // Corrected from typeLigne, and optional as it can be null
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
  typeLigneSource?: string
  typeLigneDestination?: string // This should align with JsonStructure's typeLine
}

// Types pour l'upload de structure JSON
// Corrected PositionJsonDto to match backend Java DTO
export interface PositionJsonDto {
  keyPath: string // Corrected from keyPayh
  typeLine?: string // Corrected from typeLigne, and matches backend DTO
}

export interface JsonUploadRequest {
  fileDestination: string
  positionJsonDtos: PositionJsonDto[]
}

// URL de base de l'API
// Ensure NEXT_PUBLIC_API_URL is used if set and not empty, otherwise fallback to localhost:8082
const envApiUrl =
  typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.trim()
    : ""
const API_BASE_URL = envApiUrl !== "" ? envApiUrl : "http://localhost:8082"

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

export async function uploadJsonStructureWithPositions(file: File, metadata: JsonUploadRequest): Promise<string> {
  try {
    const formData = new FormData()
    formData.append("file", file) // The actual JSON file
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))

    const response = await fetch(`${API_BASE_URL}/api/json-keys/saveKeys-withPosition`, {
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
    // The backend should return JsonStructure objects which include keyPath and typeLigne for leaves.
    // And potentially start_position/end_position if they were ever saved (though we won't save them from here).
    const structures: JsonStructure[] = await response.json()
    return structures
  } catch (error) {
    console.error("Erreur lors de la récupération des structures JSON:", error)
    throw error
  }
}

// Corrected endpoint to match backend controller
export async function getAllJsonDestinations(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/json-keys/getAllFileDestinations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la récupération des destinations")
    }
    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des destinations:", error)
    throw error
  }
}

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

export async function getJsonFileContent(fileName: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/output/last-mapping`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (response.ok) {
      const outMapping = await response.json()
      if (outMapping && outMapping.contentMapper) return outMapping.contentMapper
    }
  } catch (e) {
    /* ignore */
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/output/content?fileName=${encodeURIComponent(fileName)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (response.ok) return await response.text()
  } catch (e) {
    /* ignore */
  }

  const generationResponse = await fetch(`${API_BASE_URL}/api/output/jsonFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (generationResponse.ok) {
    const text = await generationResponse.text()
    const jsonMatch = text.match(/\[[\s\S]*\]|{[\s\S]*}/)
    return jsonMatch ? jsonMatch[0] : text
  }
  throw new Error("Impossible de récupérer le contenu du fichier JSON")
}