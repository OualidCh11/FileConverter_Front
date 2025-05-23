// api-service.ts

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
  startPos: number
  endPos: number
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
  fileDestinationName: string
}

export interface ConfigMappingDTO {
  keySource: string
  typeFile: string
  keyDistination: string
  startPos: number
  endPos: number
  nrLineFiles?: number
  configMappingId?: number
  fileDetailId?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"

// --- Upload d’un fichier
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || "Erreur upload")
  }

  return await response.text()
}

// --- Obtenir les lignes du fichier
export async function getFileDetails(fileId: number): Promise<FileDetail[]> {
  const response = await fetch(`${API_BASE_URL}/file-details/${fileId}`)
  if (!response.ok) {
    throw new Error("Erreur récupération détails fichier")
  }
  return await response.json()
}

// --- Enregistrer un mapping de base (fileSource et fileDestination)
export async function saveMapping(mapping: MappingDTO): Promise<ConfigMapping> {
  const response = await fetch(`${API_BASE_URL}/api/mapping/save-map`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapping),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

// --- Enregistrer un ou plusieurs détails de mapping
export async function saveConfigMapping(details: ConfigMappingDTO[]): Promise<ConfigMappingDetail[]> {
  const response = await fetch(`${API_BASE_URL}/api/conf-map/save_confmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

// --- Générer le fichier JSON final à partir du dernier mapping
export async function generateJsonFile(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/output/jsonFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.text()
}

// --- Lire le contenu du fichier JSON généré
export async function getJsonFileContent(fileName?: string): Promise<string> {
  if (fileName) {
    const response = await fetch(`${API_BASE_URL}/api/output/content?fileName=${encodeURIComponent(fileName)}`)
    if (response.ok) return await response.text()
  }

  // fallback : dernier mapping si pas de nom fourni
  const response = await fetch(`${API_BASE_URL}/api/output/last-mapping`)
  if (response.ok) {
    const data = await response.json()
    if (data?.contentMapper) return data.contentMapper
  }

  throw new Error("Impossible de lire le fichier JSON généré.")
}
