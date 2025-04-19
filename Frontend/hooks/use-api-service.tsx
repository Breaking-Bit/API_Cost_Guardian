import { useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from '@/components/ui/use-toast';
import { callExternalAPI, getServiceUsage } from '@/lib/api';
import type { APIServiceResponse, APIUsageStats } from '@/lib/types';

interface APIServiceConfig {
  service: string;
  defaultModel?: string;
  apiKeyRequired?: boolean;
}

export function useAPIService(projectId: string, config: APIServiceConfig) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const callService = async (
    payload: any,
    options?: {
      model?: string;
      apiKey?: string;
    }
  ): Promise<APIServiceResponse | null> => {
    setIsLoading(true);
    try {
      if (config.apiKeyRequired && !options?.apiKey) {
        throw new Error(`API key is required for ${config.service}`);
      }

      const response = await callExternalAPI(
        token,
        projectId,
        config.service,
        payload,
        {
          model: options?.model || config.defaultModel,
          apiKey: options?.apiKey
        }
      );
      return response;
    } catch (error) {
      toast({
        title: "API Error",
        description: `Failed to call ${config.service} API. Please try again.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getUsageStats = async (timeframe?: string): Promise<APIUsageStats[]> => {
    try {
      return await getServiceUsage(token, projectId, config.service, timeframe);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${config.service} usage stats.`,
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    callService,
    getUsageStats,
    isLoading
  };
}