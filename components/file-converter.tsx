"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "./file-uploader"
import { ConfigurationPanel } from "./configuration-panel"
import { ResultsPanel } from "./results-panel"
import { motion, AnimatePresence } from "framer-motion"

export default function FileConverter() {
  const [activeTab, setActiveTab] = useState("upload")
  // Ajouter un état pour stocker les champs détectés
  const [detectedFields, setDetectedFields] = useState<string[]>([])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="backdrop-blur-xl bg-white/80 dark:bg-white/10 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/20 overflow-hidden transition-colors duration-500"
    >
      <div className="bg-gradient-to-r from-blue-500/10 to-amber-400/10 dark:from-[#F55B3B]/20 dark:to-[#FCBD00]/20 p-6 transition-colors duration-500">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors duration-500">
          File Format Converter
        </h2>
        <p className="text-slate-600 dark:text-white/60 text-sm mt-1 transition-colors duration-500">
          Transform your files into standardized JSON format
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 dark:bg-white/5 backdrop-blur-lg rounded-xl p-1 transition-colors duration-500">
          <TabsTrigger
            value="upload"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-[#F55B3B] dark:data-[state=active]:to-[#ff7b5b] data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Upload
          </TabsTrigger>
          <TabsTrigger
            value="configure"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-[#F55B3B] dark:data-[state=active]:to-[#ff7b5b] data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Configure
          </TabsTrigger>
          <TabsTrigger
            value="result"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-[#F55B3B] dark:data-[state=active]:to-[#ff7b5b] data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Result
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="upload">
              <FileUploader
                onContinue={(fields) => {
                  setDetectedFields(fields)
                  setActiveTab("configure")
                }}
              />
            </TabsContent>

            <TabsContent value="configure">
              <ConfigurationPanel onContinue={() => setActiveTab("result")} detectedFields={detectedFields} />
            </TabsContent>

            <TabsContent value="result">
              <ResultsPanel onReset={() => setActiveTab("upload")} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}

