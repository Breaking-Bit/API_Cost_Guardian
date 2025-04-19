'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { SERVICES } from '@/config/env';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface UsageData {
  service_name: string;
  usage_quantity: number;
  cost: number;
  timestamp: string;
}

interface ServiceUsageSimulatorProps {
  projectId: string;
  onSimulate: (service: string) => Promise<void>;
  costData: UsageData[];
}

export default function ServiceUsageSimulator({ projectId, onSimulate, costData }: ServiceUsageSimulatorProps) {
  const [selectedService, setSelectedService] = useState(SERVICES[0].id);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await onSimulate(selectedService);
    } finally {
      setIsSimulating(false);
    }
  };

  const chartData = {
    labels: costData.map(data => new Date(data.timestamp).toLocaleDateString()),
    datasets: SERVICES.map(service => ({
      label: service.name,
      data: costData
        .filter(data => data.service_name === service.id)
        .map(data => data.cost),
      borderColor: service.color,
      backgroundColor: service.color + '20',
      tension: 0.4,
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Service Usage Cost Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cost (USD)',
        },
      },
    },
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="flex items-center gap-4">
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {SERVICES.map(service => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSimulating ? 'Simulating...' : 'Simulate Usage'}
        </button>
      </div>

      <div className="h-96">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map(service => {
          const serviceData = costData.filter(data => data.service_name === service.id);
          const totalUsage = serviceData.reduce((sum, data) => sum + data.usage_quantity, 0);
          const totalCost = serviceData.reduce((sum, data) => sum + data.cost, 0);
          
          return (
            <div
              key={service.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: service.color + '10' }}
            >
              <h3 className="text-lg font-medium" style={{ color: service.color }}>
                {service.name}
              </h3>
              <dl className="mt-2 space-y-1">
                <div>
                  <dt className="text-sm text-gray-500">Total Usage</dt>
                  <dd className="text-2xl font-semibold">{totalUsage}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Total Cost</dt>
                  <dd className="text-2xl font-semibold">
                    ${totalCost.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}