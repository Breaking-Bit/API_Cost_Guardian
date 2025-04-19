"use client"

import { useTheme } from "next-themes"
import type { CostBreakdown } from "@/lib/types"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"
import { Pie, Bar } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface CostChartProps {
  data: CostBreakdown[]
  type?: "pie" | "bar"
}

export default function CostChart({ data, type = "pie" }: CostChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No cost data available</p>
      </div>
    )
  }

  const chartColors = [
    "rgba(54, 162, 235, 0.8)",
    "rgba(255, 99, 132, 0.8)",
    "rgba(75, 192, 192, 0.8)",
    "rgba(255, 206, 86, 0.8)",
    "rgba(153, 102, 255, 0.8)",
    "rgba(255, 159, 64, 0.8)",
  ]

  const labels = data.map((item) => item._id)
  const values = data.map((item) => item.total_cost)

  const chartData = {
    labels,
    datasets: [
      {
        label: "Cost ($)",
        data: values,
        backgroundColor: chartColors,
        borderColor: isDark ? "rgba(30, 41, 59, 1)" : "white",
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: isDark ? "white" : "black",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ""
            const value = context.raw || 0
            return `${label}: $${value.toFixed(2)}`
          },
        },
      },
    },
    scales:
      type === "bar"
        ? {
            y: {
              beginAtZero: true,
              ticks: {
                color: isDark ? "white" : "black",
              },
              grid: {
                color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              },
            },
            x: {
              ticks: {
                color: isDark ? "white" : "black",
              },
              grid: {
                color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              },
            },
          }
        : undefined,
  }

  return (
    <div className="h-full w-full">
      {type === "pie" ? <Pie data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
    </div>
  )
}
