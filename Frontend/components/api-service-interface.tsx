import { useState } from 'react';
import { useAPIService } from '@/hooks/use-api-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface APIServiceInterfaceProps {
  projectId: string;
  service: string;
  defaultModel?: string;
  apiKeyRequired?: boolean;
  inputLabel?: string;
  placeholder?: string;
}

export function APIServiceInterface({
  projectId,
  service,
  defaultModel,
  apiKeyRequired,
  inputLabel = "Input",
  placeholder = "Enter your request..."
}: APIServiceInterfaceProps) {
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [response, setResponse] = useState<any>(null);

  const { callService, isLoading } = useAPIService(projectId, {
    service,
    defaultModel,
    apiKeyRequired
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const result = await callService(
      { contents: [{ text: input }] },
      { apiKey }
    );
    if (result) {
      setResponse(result);
      setInput('');
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <CardHeader>
        <CardTitle>{service} API Interface</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiKeyRequired && (
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter ${service} API Key`}
              required
            />
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px]"
            required
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Send Request'
            )}
          </Button>
        </form>

        {response && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Response:</h3>
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
              {JSON.stringify(response, null, 2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}