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
  fileDestinqtionJson: string
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
  keyDistination: string
  valueDistination: string
  configMapping?: ConfigMapping
  fileDetail?: FileDetail
  outMappings?: OutMapping[]
}

export interface OutMapping {
  id: number
  contentMapper: string
  dateMapping: string
  configMappingDetail?: ConfigMappingDetail
}

export interface MappingDTO {
  fileSourceName: string
  fileDestinationName: string
}

export interface ConfigMappingDTO {
  nrLineFiles: number
  keySource: string
  typeFile: string
  keyDistination: string
  valueDistination: string
  configMappingId: number // ou string selon ta base
  fileDetailId: number
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
export async function saveConfigMapping(configMappingDetail: Partial<ConfigMappingDTO>): Promise<ConfigMappingDetail> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conf-map/save_confmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(configMappingDetail),
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

export async function saveMapping(mapping: { fileDestinationName: string }): Promise<ConfigMapping> {
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

// Service pour récupérer les résultats de conversion
export async function getConversionResults(configMappingId: number): Promise<OutMapping[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/out-mappings/by-config/${configMappingId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Erreur lors de la récupération des résultats")
    }

    return await response.json()
  } catch (error) {
    console.error("Erreur lors de la récupération des résultats:", error)
    throw error
  }
}

