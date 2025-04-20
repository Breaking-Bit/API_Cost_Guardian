'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import ServiceUsageSimulator from '@/components/ServiceUsageSimulator';
import ChartComponent from "@/components/ChartComponent";

interface CostData {
  service_name: string;
  cost: number;
  usage_quantity: number;
  timestamp: string;
  region: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function ProjectDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (service: string) => {
    try {
      await api.simulateUsage(params.id, service);
      const newCostData = await api.getCostData(params.id);
      setCostData(newCostData);
    } catch (err) {
      setError('Failed to simulate usage');
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, costData] = await Promise.all([
          api.getProjectDetails(params.id),
          api.getCostData(params.id)
        ]);
        setProject(projectData);
        setCostData(costData);
        setError(null);
      } catch (err) {
        setError('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && params.id) {
      fetchData();
    }
  }, [isAuthenticated, params.id]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Project not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="mt-2 text-gray-600">{project.description}</p>
        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" 
          style={{
            backgroundColor: project.status === 'active' ? '#DEF7EC' : '#FDE8E8',
            color: project.status === 'active' ? '#03543F' : '#9B1C1C'
          }}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </div>
      </div>

      {/* Updated chart grid with fixed heights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6" style={{ height: '400px' }}>
          <ChartComponent
            data={costData}
            title="Cost Distribution by Service"
            type="pie"
          />
        </div>
        <div className="bg-white shadow rounded-lg p-6" style={{ height: '400px' }}>
          <ChartComponent
            data={costData}
            title="Service Usage Comparison"
            type="bar"
          />
        </div>
      </div>

      {/* Updated line chart container */}
      <div className="bg-white shadow rounded-lg p-6" style={{ height: '400px' }}>
        <ChartComponent
          data={costData}
          title="Cost Trends Over Time"
          type="line"
        />
      </div>

      <ServiceUsageSimulator
        projectId={params.id}
        onSimulate={handleSimulate}
        costData={costData}
      />
    </div>
  );
}

// Remove the duplicate ProjectDetailsPage component as it's not needed