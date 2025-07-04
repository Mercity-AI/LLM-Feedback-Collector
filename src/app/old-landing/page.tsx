'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HealthStatus {
  status: string;
  message?: string;
  timestamp?: string;
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const testHealthAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch {
      setHealthStatus({ status: 'error', message: 'Failed to connect to API' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            LLM Feedback Collector
          </h1>
          <p className="text-xl text-gray-600">
            A Next.js application for collecting feedback on LLM responses
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ✅ Project Setup Complete
                <Badge variant="secondary">Ready</Badge>
              </CardTitle>
              <CardDescription>
                Your Next.js project with shadcn/ui is ready to go
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">Next.js 14 with App Router</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">TypeScript configured</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">Tailwind CSS ready</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">shadcn/ui components installed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Health Check</CardTitle>
              <CardDescription>
                Test the backend API to ensure everything is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testHealthAPI} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Health API'}
              </Button>
              
              {healthStatus && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      healthStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="font-medium">
                      Status: {healthStatus.status}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(healthStatus, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

                  <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>
                Explore the implemented features of your LLM feedback system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">🤖 Chat Interface</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Interactive chat with multiple LLM models via OpenRouter featuring model selection, markdown rendering, LaTeX support, and real-time streaming
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/">Try Chat Interface</Link>
                  </Button>
                </div>
                <div className="p-4 border rounded-lg opacity-60">
                  <h3 className="font-semibold mb-2">⭐ Feedback System</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Rate and comment on LLM responses (Coming Soon)
                  </p>
                  <Button size="sm" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </div>
                <div className="p-4 border rounded-lg opacity-60">
                  <h3 className="font-semibold mb-2">💾 Database Setup</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Persistent storage with Prisma + SQLite (Coming Soon)
                  </p>
                  <Button size="sm" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </main>
  );
}
