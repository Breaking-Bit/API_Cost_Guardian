'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface ServiceUsageSimulatorProps {
  projectId: string;
  onSimulate: (service: string) => void;
  costData: any[];
}

export default function ServiceUsageSimulator({ projectId, onSimulate, costData }: ServiceUsageSimulatorProps) {
  const [selectedService, setSelectedService] = useState('');
  const services = ['GPT-4', 'DALL-E', 'Gemini', 'Claude'];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Simulate API Usage</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Service</label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select a service...</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={() => selectedService && onSimulate(selectedService)}
          disabled={!selectedService}
          className="w-full"
        >
          Simulate Usage
        </Button>
      </div>
    </div>
  );
}