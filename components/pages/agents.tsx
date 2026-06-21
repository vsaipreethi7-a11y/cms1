'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Bot, Link2, Zap, BarChart3, Play, RefreshCw,
  CheckCircle, AlertCircle, Loader2, ChevronDown,
  ChevronLeft, FileText, ExternalLink, Hash,
  TrendingUp, AlertTriangle, Info, Sparkles,
  Globe, Clock, BookOpen, Database, Settings2,
  List, Grid3X3, ArrowRight, Image as ImageIcon, Users, Layers,
  Search, ShieldCheck, Share2, MousePointerClick, Target, Code,
  BookText, Copy, Link, UserCircle, Calendar, Type, Rocket,
  Dna, UserCheck, FolderTree, Cpu, Activity, Brain, 
  Settings as SettingsIcon, MessageSquare, Terminal, 
  History, LayoutDashboard, Filter, Check, Download, Plug
} from 'lucide-react';
import { useGroq } from '@/hooks/use-groq';
import { useCMS } from '@/hooks/use-cms';
import { apiJson } from '@/lib/api';
import type { CMSConnection, CMSType } from '@/lib/types';
import { AI_AGENTS, AIAgent } from '@/lib/agents-config';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'idle' | 'running' | 'success' | 'error';

interface AIAgentResult {
  agentId: string;
  agentName: string;
  contentId: string;
  contentTitle: string;
  result: any;
  timestamp: string;
  connectionId: string;
}

const CMS_CONFIGS: Record<CMSType, { color: string; accentColor: string; icon: string; endpoint: string }> = {
  wordpress: { color: '#21759B', accentColor: '#00A0D2', icon: 'WP', endpoint: '/api/agents/wordpress' },
  drupal: { color: '#0077C0', accentColor: '#009DDB', icon: 'DR', endpoint: '/api/agents/drupal' },
  joomla: { color: '#F4460F', accentColor: '#FF6B35', icon: 'JM', endpoint: '/api/agents/joomla' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface AgentsProps {
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  connections?: CMSConnection[];
}

export function Agents({ showToast, connections }: AgentsProps) {
  const cms = useCMS();
  const content = cms.content;
  const connectionsList = connections ?? cms.connections;
  const { completeJSON } = useGroq();
  const toast = useCallback<NonNullable<AgentsProps['showToast']>>(
    (msg, type) => {
      if (showToast) return showToast(msg, type);
      console.log(`[Agents] ${type || 'info'}: ${msg}`);
    },
    [showToast],
  );

  const [selectedConnId, setSelectedConnId] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [batchSize, setBatchSize] = useState<number>(2);
  const [runMode, setRunMode] = useState<'top' | 'drafts' | 'published'>('top');
  
  const [agentStatus, setAgentStatus] = useState<Record<string, AgentStatus>>({});
  const [agentResults, setAgentResults] = useState<AIAgentResult[]>([]);

  const activeConnection = useMemo(() => connectionsList.find(c => c.id === selectedConnId), [connectionsList, selectedConnId]);

  useEffect(() => {
    (async () => {
      try {
        const reports = await fetch('/api/cms/agent-reports').then(r => r.json());
        if (Array.isArray(reports)) {
          const mapped: AIAgentResult[] = reports.map((r: any) => ({
            agentId: r.agentId,
            agentName: r.agentName,
            contentId: r.contentId,
            contentTitle: r.contentTitle,
            result: r.result,
            timestamp: r.createdAt,
            connectionId: r.connectionId,
          }));
          setAgentResults(mapped);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;
    setBatchSize(selectedAgent.defaultBatchSize ?? 2);
  }, [selectedAgent]);

  const visibleReports = useMemo(() => {
    if (!selectedAgent) return [];
    return agentResults.filter(r =>
      r.agentId === selectedAgent.id &&
      (!selectedConnId || r.connectionId === selectedConnId)
    );
  }, [agentResults, selectedAgent, selectedConnId]);

  const runAIAgent = useCallback(async (agent: AIAgent) => {
    if (!selectedConnId) {
      toast('Please select a CMS connection first', 'error');
      return;
    }
    const cmsContent = content.filter(c => c.cmsId === selectedConnId);
    if (cmsContent.length === 0) {
      toast('No content found for this connection. Synchronize data first.', 'error');
      return;
    }

    const newStatus: Record<string, AgentStatus> = { ...agentStatus, [agent.id]: 'running' };
    setAgentStatus(newStatus);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_agent_status_v1', JSON.stringify(newStatus));
      const times = JSON.parse(localStorage.getItem('ai_agent_time_v1') || '{}');
      times[agent.id] = { ...times[agent.id], start: Date.now() };
      localStorage.setItem('ai_agent_time_v1', JSON.stringify(times));
    }
    try {
      const results: AIAgentResult[] = [];
      const filtered =
        runMode === 'drafts' ? cmsContent.filter(i => i.status === 'draft') :
        runMode === 'published' ? cmsContent.filter(i => i.status === 'published') :
        cmsContent;

      const effectiveBatchSize = Math.max(1, Math.min(10, batchSize || agent.defaultBatchSize || 2));
      const itemsToProcess = filtered.slice(0, effectiveBatchSize);
      
      if (itemsToProcess.length === 0) {
        toast('No matching content for the selected run mode', 'error');
        setAgentStatus(prev => ({ ...prev, [agent.id]: 'idle' }));
        return;
      }
      
      for (const item of itemsToProcess) {
        const outputHint = agent.outputFormatHint ? `\n\n### OUTPUT FORMAT HINT\nReturn JSON matching this shape:\n${agent.outputFormatHint}\n` : '';
        const prompt = `### TARGET CONTENT
Title: ${item.title}
Body: ${item.body.substring(0, 1500)}

### EXECUTION CONTEXT
Other Content Titles: ${JSON.stringify(cmsContent.map(c => c.title).slice(0, 8))}

### INSTRUCTIONS
Deploy your specialized capability as the "${agent.name}" on the TARGET CONTENT.
Return the results in a concise, valid JSON format. Focus only on high-value insights.${outputHint}`;
        
        const startTime = Date.now();
        const res = await completeJSON<any>(
          prompt,
          agent.systemPrompt + " You must respond ONLY with valid JSON."
        );
        const durationMs = Date.now() - startTime;
        
        if (res) {
          const resultWithMeta = { ...res, _durationMs: durationMs };
          try {
            await apiJson('/api/cms/agent-reports', 'POST', {
              agentId: agent.id,
              agentName: agent.name,
              connectionId: selectedConnId,
              contentId: item.id,
              contentTitle: item.title,
              result: resultWithMeta,
            });
          } catch { /* ignore */ }
          
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            contentId: item.id,
            contentTitle: item.title,
            result: resultWithMeta,
            timestamp: new Date().toISOString(),
            connectionId: selectedConnId
          });
        }
      }
      setAgentResults(prev => [...results, ...prev]);
      const newStatus: Record<string, AgentStatus> = { ...agentStatus, [agent.id]: 'success' };
      setAgentStatus(newStatus);
      if (typeof window !== 'undefined') localStorage.setItem('ai_agent_status_v1', JSON.stringify(newStatus));
      toast(`${agent.name} deployed successfully!`, 'success');
    } catch (err) {
      const newStatus: Record<string, AgentStatus> = { ...agentStatus, [agent.id]: 'error' };
      setAgentStatus(newStatus);
      if (typeof window !== 'undefined') localStorage.setItem('ai_agent_status_v1', JSON.stringify(newStatus));
      toast(`${agent.name} execution failed`, 'error');
    }
  }, [selectedConnId, content, completeJSON, toast, batchSize, runMode]);

  return (
    <div className="min-h-screen space-y-12 max-w-[1200px] mx-auto animate-in fade-in duration-500 py-12 px-6">
      {!selectedAgent && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 bg-card border border-border/40 p-10 rounded-[48px] shadow-2xl">
          <div className="flex items-center gap-8">
            <div className="p-5 bg-primary/10 rounded-[32px]">
              <Cpu className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tighter">AI Agents</h1>
              <p className="text-muted-foreground font-medium mt-1">Autonomous intelligence for your content network</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            {connectionsList.map(conn => (
              <button
                key={conn.id}
                onClick={() => setSelectedConnId(conn.id)}
                className={`flex items-center gap-5 px-8 py-5 rounded-[28px] border transition-all shrink-0 ${selectedConnId === conn.id ? 'bg-primary/10 border-primary shadow-xl shadow-primary/5' : 'bg-background border-border hover:bg-muted/50'}`}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: CMS_CONFIGS[conn.type]?.color || '#888' }}>
                  {CMS_CONFIGS[conn.type]?.icon || '?'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black">{conn.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!selectedAgent ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {AI_AGENTS.map((agent) => (
            <button
              key={agent.id}
              disabled={!selectedConnId}
              onClick={() => setSelectedAgent(agent)}
              className={`group flex flex-col items-center justify-center p-8 rounded-[40px] border transition-all text-center h-full ${!selectedConnId ? 'opacity-25 grayscale cursor-not-allowed' : 'bg-card border-border hover:border-primary hover:shadow-2xl hover:-translate-y-2'}`}
            >
              <div className="w-16 h-16 rounded-[28px] bg-muted flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <agent.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-foreground tracking-tight line-clamp-2 px-2">{agent.name}</h3>
            </button>
          ))}
          {!selectedConnId && (
            <div className="col-span-full py-20 text-center opacity-40">
               <p className="text-xs font-black uppercase tracking-[0.4em]">Node Connection Required</p>
            </div>
          )}
        </div>
      ) : (
        /* ─── Simplified Professional Agent Workspace ─── */
        <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
          <Button 
              variant="ghost" 
              onClick={() => setSelectedAgent(null)}
              className="mb-8 rounded-full hover:bg-muted group px-6 py-4 h-auto"
          >
              <ChevronLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold text-sm tracking-tight">Return to Fleet</span>
          </Button>

          <div className="space-y-16">
            {/* Header Identity */}
            <div className="flex flex-col md:flex-row items-start gap-8 border-b border-border/40 pb-12">
                <div className="w-20 h-20 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-xl shadow-primary/5">
                    <selectedAgent.icon className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">{selectedAgent.name}</h2>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xl">
                        {selectedAgent.description}
                    </p>
                    <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-[0.4em]">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Status: Optimized for {activeConnection?.name}
                    </div>
                </div>
            </div>

            {/* Run Matrix */}
            <div className="flex flex-col md:flex-row items-center gap-8 bg-muted/20 p-6 rounded-[32px] border border-border/40">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Scan Range</label>
                    <Select value={runMode} onValueChange={(v) => setRunMode(v as any)}>
                        <SelectTrigger className="w-full rounded-2xl bg-background border-none h-11 px-4 text-xs font-bold shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                            <SelectItem value="top">Global Stream</SelectItem>
                            <SelectItem value="drafts">Internal Only</SelectItem>
                            <SelectItem value="published">Production Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 w-full space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">
                        <label>Concurrency</label>
                        <span className="text-primary font-bold">{batchSize} Nodes</span>
                    </div>
                    <Slider value={[batchSize]} min={1} max={10} step={1} onValueChange={(v) => setBatchSize(v[0] ?? 2)} className="py-1" />
                </div>

                <div className="w-full md:w-auto pt-4 md:pt-0">
                    <Button 
                        className="w-full md:w-[180px] h-12 rounded-2xl text-sm font-black tracking-tight bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all active:scale-95"
                        onClick={() => runAIAgent(selectedAgent)}
                        disabled={agentStatus[selectedAgent.id] === 'running'}
                    >
                        {agentStatus[selectedAgent.id] === 'running' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Launch Agent"
                        )}
                    </Button>
                </div>
            </div>

            {/* Analysis Log */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tighter uppercase italic opacity-20">Intelligence Feed</h3>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-black uppercase tracking-widest hover:text-red-500"
                        onClick={async () => {
                            try {
                                await apiJson(`/api/cms/agent-reports?agentId=${selectedAgent.id}&connectionId=${selectedConnId}`, "DELETE");
                                setAgentResults(prev => prev.filter(r => !(r.agentId === selectedAgent.id && r.connectionId === selectedConnId)));
                                toast("Logs Purged", "success");
                            } catch { toast("Failed to purge", "error"); }
                        }}
                    >
                        Clear History
                    </Button>
                </div>

                <div className="space-y-6">
                    {visibleReports.length > 0 ? (
                        visibleReports.map((report, idx) => (
                            <div key={idx} className="bg-card border border-border p-10 rounded-[48px] shadow-sm hover:border-primary/40 transition-all group">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black tracking-tight">{report.contentTitle}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-3">
                                            {new Date(report.timestamp).toLocaleDateString()} — {new Date(report.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="p-5 bg-muted rounded-3xl group-hover:bg-primary/5 transition-colors">
                                        <History className="w-8 h-8 text-primary/40" />
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-[40px] p-10 font-mono text-sm leading-relaxed overflow-x-auto max-h-[600px] border border-border/20 text-foreground/80">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(report.result, null, 2)}</pre>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-48 text-center border-2 border-dashed border-border/20 rounded-[64px]">
                            <p className="text-xl font-black text-muted-foreground/20 uppercase tracking-[0.4em]">Listening for Data Nodes</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}