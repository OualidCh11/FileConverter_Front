"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { FileUploader } from "./file-uploader"
import { ConfigurationPanel } from "./configuration-panel"
import { ResultsPanel } from "./results-panel"
import { StatsPanel } from "./stats-panel"
import { motion, AnimatePresence } from "framer-motion"
import JsonToFlatConverter from "./json-to-flat-converter" // Import the new component
import { Toaster } from "@/components/ui/toaster"
import type { FlatFieldDefinition } from "./file-uploader"

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [detectedFields, setDetectedFields] = useState<string[]>([])
  const [currentFileId, setCurrentFileId] = useState<number | undefined>(undefined)
  const [currentConfigId, setCurrentConfigId] = useState<number | undefined>(undefined)
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined)
  const [fieldDefinitions, setFieldDefinitions] = useState<FlatFieldDefinition[] | undefined>(undefined)

  // Log des changements d'état pour le débogage
  useEffect(() => {
    console.log("État actuel:", {
      activeSection,
      detectedFields,
      currentFileId,
      currentConfigId,
      currentFileName,
      fieldDefinitions,
    })
  }, [activeSection, detectedFields, currentFileId, currentConfigId, currentFileName, fieldDefinitions])

  const handleSectionChange = (section: string) => {
    console.log("Changement de section:", section)
    setActiveSection(section)
  }

  const handleFileUploadComplete = (
    fields: string[],
    fileId?: number,
    fileName?: string,
    fieldDefs?: FlatFieldDefinition[],
  ) => {
    console.log("Upload terminé:", { fields, fileId, fileName, fieldDefs })
    setDetectedFields(fields)
    setCurrentFileId(fileId)
    setCurrentFileName(fileName)
    setFieldDefinitions(fieldDefs)
    setActiveSection("configure")
  }

  const handleConfigurationComplete = (configId?: number) => {
    console.log("Configuration terminée:", { configId })
    setCurrentConfigId(configId)
    setActiveSection("result")
  }

  const handleReset = () => {
    console.log("Réinitialisation de l'application")
    setActiveSection("upload")
    setDetectedFields([])
    setCurrentFileId(undefined)
    setCurrentConfigId(undefined)
    setCurrentFileName(undefined)
    setFieldDefinitions(undefined)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />

      <motion.div
        className="flex-1 backdrop-blur-xl bg-white/80 dark:bg-white/10 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 overflow-hidden transition-colors duration-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-[#F55B3B]/10 to-[#FCBD00]/10 dark:from-[#F55B3B]/20 dark:to-[#FCBD00]/20 p-6 transition-colors duration-500">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors duration-500">
            {activeSection === "dashboard" && "Tableau de bord"}
            {activeSection === "upload" && "Téléchargement de fichier"}
            {activeSection === "configure" && "Configuration"}
            {activeSection === "result" && "Résultat de conversion"}
            {activeSection === "json-to-flat" && "Conversion JSON vers Fichier Plat"}
          </h2>
          <p className="text-slate-600 dark:text-white/60 text-sm mt-1 transition-colors duration-500">
            {activeSection === "dashboard" && "Visualisez les statistiques et les conversions récentes"}
            {activeSection === "upload" && "Téléchargez votre fichier pour commencer la conversion"}
            {activeSection === "configure" && "Configurez les paramètres de mappage"}
            {activeSection === "result" && "Visualisez et téléchargez votre fichier converti"}
            {activeSection === "json-to-flat" && "Configurez la conversion de votre fichier JSON en fichier plat"}
          </p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === "dashboard" && <StatsPanel />}
              {activeSection === "upload" && <FileUploader onContinue={handleFileUploadComplete} />}
              {activeSection === "configure" && (
                <ConfigurationPanel
                  onContinue={handleConfigurationComplete}
                  detectedFields={detectedFields}
                  fileId={currentFileId}
                  fileName={currentFileName}
                  fieldDefinitions={fieldDefinitions}
                />
              )}
              {activeSection === "result" && <ResultsPanel onReset={handleReset} configId={currentConfigId} />}
              {activeSection === "json-to-flat" && <JsonToFlatConverter />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      <Toaster />
    </div>
  )
}
