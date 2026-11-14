import { useState } from 'react';
import { Activity, Layers, CheckCircle2, AlertCircle, Clock, Database, RefreshCw } from 'lucide-react';
import type { Trace } from '@hindsight/shared';

const DEMO_TRACES: Trace[] = [
  {
    id: 'trace_01j8a2b3c4',
    name: 'weather-research-agent',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 120000).toISOString(),
    endTime: new Date(Date.now() - 117550).toISOString(),
    totalTokens: 1420,
    totalCost: 0.0071,
    metadata: { model: 'gpt-4o', environment: 'production' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trace_01j8a2b3c5',
    name: 'customer-support-refund',
    status: 'ERROR',
    startTime: new Date(Date.now() - 360000).toISOString(),
    endTime: new Date(Date.now() - 356200).toISOString(),
    totalTokens: 2150,
    totalCost: 0.0108,
    metadata: { model: 'claude-3-5-sonnet', error: 'PaymentGatewayTimeout' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trace_01j8a2b3c6',
    name: 'github-pr-review-bot',
    status: 'RUNNING',
    startTime: new Date(Date.now() - 15000).toISOString(),
    endTime: null,
    totalTokens: 890,
    totalCost: 0.0044,
    metadata: { model: 'gemini-1.5-pro' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function App() {
  const [traces] = useState<Trace[]>(DEMO_TRACES);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              H
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-white">Hindsight</span>
              <span className="ml-2 text-xs font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                v0.1.0-alpha
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>API: Ready</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Redis: Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Total Agent Runs</span>
              <Activity className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">1,248</div>
            <div className="text-xs text-slate-500 mt-1">+14% from last hour</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Avg Step Latency</span>
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">412 ms</div>
            <div className="text-xs text-slate-500 mt-1">p95: 1,840 ms</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Token Consumption</span>
              <Database className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">4.82 M</div>
            <div className="text-xs text-slate-500 mt-1">Est. cost: $24.10</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Error Rate</span>
              <AlertCircle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">0.8%</div>
            <div className="text-xs text-emerald-400 mt-1">Within normal threshold</div>
          </div>
        </div>

        {/* Traces List Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Recent Traces</h2>
            </div>
            <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase font-medium text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Trace Name / ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tokens</th>
                  <th className="px-6 py-3">Cost</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {traces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{trace.name}</div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">{trace.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {trace.status === 'SUCCESS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                        </span>
                      )}
                      {trace.status === 'ERROR' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800/60">
                          <AlertCircle className="w-3 h-3 mr-1" /> Failed
                        </span>
                      )}
                      {trace.status === 'RUNNING' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800/60">
                          <Clock className="w-3 h-3 mr-1" /> Running
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{trace.totalTokens.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-xs">${trace.totalCost.toFixed(4)}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(trace.startTime).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
