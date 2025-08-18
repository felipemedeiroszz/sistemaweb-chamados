import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, CheckCircle, FileText } from "lucide-react"

interface StatsCardsProps {
  stats: {
    total: number
    abertos: number
    em_andamento: number
    resolvidos: number
  }
  labels?: {
    total?: string
    abertos?: string
    em_andamento?: string
    resolvidos?: string
  }
}

export default function StatsCards({ stats, labels }: StatsCardsProps) {
  const cards = [
    {
      title: labels?.total || "Total de Chamados",
      value: stats.total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: labels?.abertos || "Abertos",
      value: stats.abertos,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: labels?.em_andamento || "Em Andamento",
      value: stats.em_andamento,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: labels?.resolvidos || "Resolvidos",
      value: stats.resolvidos,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { StatsCards }
