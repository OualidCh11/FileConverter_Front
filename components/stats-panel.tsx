"use client"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, FileJson, CheckCircle, Clock, BarChart3 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function StatsPanel() {
  // Sample data for statistics
  const stats = [
    { id: 1, label: "Total Files", value: 128, icon: FileUp, themeColor: "primary" },
    { id: 2, label: "Converted", value: 98, icon: FileJson, themeColor: "secondary" },
    { id: 3, label: "Success Rate", value: "76%", icon: CheckCircle, twColor: "green-500" },
    { id: 4, label: "Pending", value: 12, icon: Clock, twColor: "purple-500" },
  ]

  // Sample data for recent conversions
  const recentConversions = [
    { id: 1, fileName: "customer_data.csv", status: "Completed", date: "2023-05-15", records: 156 },
    { id: 2, fileName: "inventory.xml", status: "Processing", date: "2023-05-14", records: 89 },
    { id: 3, fileName: "transactions.txt", status: "Failed", date: "2023-05-13", records: 245 },
    { id: 4, fileName: "employees.csv", status: "Completed", date: "2023-05-12", records: 42 },
  ]

  // Sample data for file type distribution
  const fileTypeDistribution = [
    { type: "CSV", percentage: 65 },
    { type: "XML", percentage: 20 },
    { type: "FLAT", percentage: 15 },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: stat.id * 0.1 }}
          >
            <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-white/60">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stat.value}</h3>
                  </div>
                  {(() => {
                    const bgColorClass = stat.themeColor ? `bg-${stat.themeColor}/10` : `bg-${stat.twColor}/10`
                    const textColorClass = stat.themeColor ? `text-${stat.themeColor}` : `text-${stat.twColor}`
                    return (
                      <div className={`h-12 w-12 rounded-full ${bgColorClass} flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${textColorClass}`} />
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* File Type Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#F55B3B]" />
              File Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fileTypeDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-white/90">{item.type}</span>
                    <span className="text-slate-500 dark:text-white/60">{item.percentage}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-2 bg-slate-200 dark:bg-white/10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Conversions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#FCBD00]" />
              Recent Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-white/60">File Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-white/60">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-white/60">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-white/60">Records</th>
                  </tr>
                </thead>
                <tbody>
                  {recentConversions.map((conversion) => (
                    <tr
                      key={conversion.id}
                      className="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-150"
                    >
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-white/90">{conversion.fileName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            conversion.status === "Completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : conversion.status === "Processing"
                                ? "bg-[#FCBD00]/10 text-[#FCBD00] dark:bg-[#FCBD00]/20"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {conversion.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-white/60">{conversion.date}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-white/60">{conversion.records}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
