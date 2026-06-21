'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Brain, CheckCircle, Clock, Layers, Play, Network, Zap, Settings, ArrowRight, BarChart3 } from 'lucide-react';
import type { CMSConnection } from '@/lib/types';
import { apiGet } from '@/lib/api';
import { AI_AGENTS } from '@/lib/agents-config';

type AgentStatus = 'idle' | 'running' | 'success' | 'error';

type AIAgentResult = {
  agentId: string;
  agentName: string;
  contentId: string;
  contentTitle: string;
  result: any;
  timestamp: string;
  connectionId: string;
};

function fmtDate(ts?: string) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function AgentDashboard({ connections }: { connections: CMSConnection[] }) {
  const [reports, setReports] = useState<AIAgentResult[]>([]);
  const [statusByAgent, setStatusByAgent] = useState<Record<string, AgentStatus>>({});
  const [agentTimes, setAgentTimes] = useState<Record<string, { start?: number }>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const fetchReports = async () => {
      try {
        const dbReports = await apiGet<any[]>('/api/cms/agent-reports');
        const mapped: AIAgentResult[] = (dbReports || []).map((r: any) => ({
          agentId: r.agentId,
          agentName: r.agentName,
          contentId: r.contentId,
          contentTitle: r.contentTitle,
          result: r.result,
          timestamp: r.createdAt,
          connectionId: r.connectionId,
        }));
        setReports(mapped);
      } catch {
        setReports([]);
      }
    };
    fetchReports();
    const interval = setInterval(fetchReports, 10000); // refresh every 10s

    const updateStatus = () => {
      try {
        const raw = localStorage.getItem('ai_agent_status_v1');
        const parsed = raw ? (JSON.parse(raw) as Record<string, AgentStatus>) : {};
        setStatusByAgent(parsed && typeof parsed === 'object' ? parsed : {});
        
        const rawTimes = localStorage.getItem('ai_agent_time_v1');
        const parsedTimes = rawTimes ? JSON.parse(rawTimes) : {};
        setAgentTimes(parsedTimes);
      } catch {
        setStatusByAgent({});
      }
    };
    updateStatus();
    const statusInterval = setInterval(updateStatus, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, []);

  const runningAgents = useMemo(
    () => Object.entries(statusByAgent).filter(([_, s]) => s === 'running').map(([id]) => id),
    [statusByAgent],
  );

  const utilizedAgentsCount = useMemo(
    () => new Set(reports.map(r => r.agentId)).size,
    [reports],
  );

  const lastRun = useMemo(() => {
    const sorted = [...reports].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return sorted[0]?.timestamp;
  }, [reports]);

  const agentUsageStats = useMemo(() => {
    const stats: Record<string, { count: number, totalTime: number, name: string, category: string, description: string }> = {};
    for (const report of reports) {
      if (!stats[report.agentId]) {
        const agInfo = AI_AGENTS.find(a => a.id === report.agentId);
        stats[report.agentId] = { 
           count: 0, 
           totalTime: 0, 
           name: report.agentName,
           category: agInfo?.category || 'General',
           description: agInfo?.description || 'AI node for content processing',
        };
      }
      stats[report.agentId].count += 1;
      
      // If duration is stored in the result JSON it will be here
      if (report.result && typeof report.result._durationMs === 'number') {
        stats[report.agentId].totalTime += report.result._durationMs;
      } else {
        // Fallback estimate if duration wasn't tracked (1.5 seconds per report)
        stats[report.agentId].totalTime += 1500;
      }
    }
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [reports]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">AI Agent Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitoring, workflow, and utilization metrics</p>
      </div>
      
      {/* Workflow Visualization */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Agent Workflow</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 px-4 text-center relative">
           <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden md:block"></div>
           
           <div className="bg-background border-2 border-border p-6 rounded-2xl w-full md:w-1/4 z-10 shadow-lg group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                 <Settings className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">1. Configuration</h3>
              <p className="text-xs text-muted-foreground mt-2">Connecting to CMS Nodes and scanning data</p>
           </div>
           
           <ArrowRight className="w-8 h-8 text-primary/40 hidden md:block z-10" />
           
           <div className="bg-background border-2 border-primary p-6 rounded-2xl w-full md:w-1/4 z-10 shadow-primary/10 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 relative z-10">
                 <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg relative z-10">2. Execution</h3>
              <p className="text-xs text-muted-foreground mt-2 relative z-10">AI models process content blocks concurrently</p>
           </div>
           
           <ArrowRight className="w-8 h-8 text-primary/40 hidden md:block z-10" />
           
           <div className="bg-background border-2 border-border p-6 rounded-2xl w-full md:w-1/4 z-10 shadow-lg group hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                 <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">3. Aggregation</h3>
              <p className="text-xs text-muted-foreground mt-2">Synthesizing insights and outputting valid JSON</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Running Agents', value: runningAgents.length, icon: Play, color: 'text-primary' },
          { label: 'Total Reports', value: reports.length, icon: Layers, color: 'text-emerald-500' },
          { label: 'Agents Utilized', value: utilizedAgentsCount, icon: CheckCircle, color: 'text-amber-500' },
          { label: 'Last Run', value: fmtDate(lastRun), icon: Clock, color: 'text-muted-foreground', textSm: true },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className={`${stat.textSm ? 'text-lg' : 'text-3xl'} font-black ${stat.color} truncate mt-1`}>{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${stat.color.replace('text-', 'bg-')}/10`}>
                 <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active & Running */}
        <div className="bg-card border border-border rounded-3xl p-6 xl:col-span-1 shadow-sm flex flex-col">
           <div className="flex items-center gap-3 mb-6">
             <Activity className="w-5 h-5 text-primary" />
             <h2 className="text-xl font-bold tracking-tight">Active Matrix</h2>
           </div>
           
           <div className="flex-1 space-y-4">
             {runningAgents.length > 0 ? (
                runningAgents.map((id) => {
                  const agentInfo = AI_AGENTS.find(a => a.id === id);
                  const agentName = agentInfo?.name || id;
                  const Icon = agentInfo?.icon || Brain;
                  const startTime = agentTimes[id]?.start;
                  const elapsed = startTime ? Date.now() - startTime : 0;
                  
                  return (
                     <div key={id} className="flex items-center gap-4 bg-muted/40 border border-primary/20 rounded-2xl p-4 animate-in slide-in-from-left-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center relative">
                           <div className="absolute inset-0 border-2 border-primary rounded-xl animate-ping opacity-20"></div>
                           <Icon className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-sm truncate">{agentName}</p>
                           <p className="text-[10px] text-primary uppercase font-bold tracking-wider mt-1">
                              Processing {elapsed > 0 ? `(${Math.floor(elapsed/1000)}s)` : ''}...
                           </p>
                        </div>
                     </div>
                  );
                })
             ) : (
                <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
                   <Brain className="w-12 h-12 mb-4" />
                   <p className="text-sm font-bold uppercase tracking-widest">No Active Pursuits</p>
                </div>
             )}
           </div>
        </div>

        {/* Global Usage Stats */}
        <div className="bg-card border border-border rounded-3xl p-6 xl:col-span-2 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Usage Diagnostics</h2>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-border/60">
                      <th className="pb-3 text-xs font-bold uppercase text-muted-foreground tracking-wider">Agent Details</th>
                      <th className="pb-3 text-xs font-bold uppercase text-muted-foreground tracking-wider">Deployments</th>
                      <th className="pb-3 text-xs font-bold uppercase text-muted-foreground tracking-wider">Total / Avg Compute</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                   {agentUsageStats.length > 0 ? (
                      agentUsageStats.map((stat, idx) => (
                         <tr key={stat.name} className="hover:bg-muted/30 transition-colors">
                            <td className="py-4 text-sm font-bold flex flex-col gap-1 max-w-[280px]">
                               <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-[9px] text-muted-foreground font-black shrink-0">
                                     {idx + 1}
                                  </div>
                                  <span className="truncate">{stat.name}</span>
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest font-black shrink-0">
                                     {stat.category}
                                  </span>
                               </div>
                               <p className="text-xs text-muted-foreground font-normal leading-relaxed truncate px-7">
                                  {stat.description}
                               </p>
                            </td>
                            <td className="py-4 text-sm font-medium align-middle">
                               <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{stat.count}</span>
                            </td>
                            <td className="py-4 text-sm font-mono text-muted-foreground align-middle">
                               <div>{formatDuration(stat.totalTime)}</div>
                               <div className="text-[10px] opacity-60">
                                  ~{formatDuration(stat.totalTime / stat.count)} / run
                               </div>
                            </td>
                         </tr>
                      ))
                   ) : (
                      <tr>
                         <td colSpan={3} className="py-10 text-center text-muted-foreground text-sm">
                            <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            No telemetry data recorded yet
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}


