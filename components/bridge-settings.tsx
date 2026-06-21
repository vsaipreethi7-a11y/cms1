'use client';

import { useState, useEffect } from 'react';
import { Save, MessageSquare, Mail, Terminal, Plus, Trash2, Smartphone, Send, ToggleLeft, ToggleRight, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { apiGet, apiJson } from '@/lib/api';
import type { CMSConnection } from '@/lib/types';

interface BridgeSettingsProps {
  connections: CMSConnection[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function BridgeSettings({ connections, showToast }: BridgeSettingsProps) {
  const [config, setConfig] = useState<any>({
    whatsapp_enabled: false,
    telegram_enabled: false,
    telegram_token: '',
    email_enabled: false,
    email_user: '',
    email_pass: ''
  });
  const [mappings, setMappings] = useState<any[]>([]);
  const [newMapping, setNewMapping] = useState({ hashtag: '', connectionId: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (status !== 'online' || !config.qr_code) {
        fetchData();
      }
    }, 10000); // Poll every 10s if offline/waiting
    return () => clearInterval(interval);
  }, [status, config.qr_code]);


  const fetchData = async () => {
    try {
      const [conf, maps] = await Promise.all([
        apiGet<any>('/api/bridge/config'),
        apiGet<any[]>('/api/bridge/mappings')
      ]);
      
      setMappings(maps);
      
      // Intelligent merge: Only update qr_code and status, don't revert user's local toggles
      setConfig((prev: any) => ({
        ...conf,
        // Keep local toggles/inputs if we are not initial loading
        whatsapp_enabled: loading ? conf.whatsapp_enabled : prev.whatsapp_enabled,
        telegram_enabled: loading ? conf.telegram_enabled : prev.telegram_enabled,
        telegram_token: loading ? conf.telegram_token : prev.telegram_token,
        email_enabled: loading ? conf.email_enabled : prev.email_enabled,
        email_user: loading ? conf.email_user : prev.email_user,
        email_pass: loading ? conf.email_pass : prev.email_pass,
      }));

      // Check worker status
      if (conf.last_heartbeat) {
        const last = new Date(conf.last_heartbeat).getTime();
        const now = new Date().getTime();
        setStatus(now - last < 120000 ? 'online' : 'offline');
      } else {
        setStatus('offline');
      }

    } catch (err) {
      console.error('Failed to fetch bridge data', err);
    } finally {
      if (loading) setLoading(false);
    }
  };


  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await apiJson('/api/bridge/config', 'POST', config);
      showToast('Bridge configuration saved');
    } catch (err) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.hashtag || !newMapping.connectionId) return;
    try {
      await apiJson('/api/bridge/mappings', 'POST', newMapping);
      setNewMapping({ hashtag: '', connectionId: '' });
      fetchData();
      showToast('Hashtag mapping added');
    } catch (err) {
      showToast('Failed to add mapping', 'error');
    }
  };

  const handleDeleteMapping = async (id: number) => {
    try {
      await apiJson('/api/bridge/mappings', 'DELETE', { id });
      fetchData();
      showToast('Mapping removed');
    } catch (err) {
      showToast('Failed to remove mapping', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            Bridge Worker: {status === 'online' ? 'Running' : 'Offline'}
          </span>
        </div>
        <Button onClick={handleSaveConfig} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WhatsApp Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                WhatsApp
              </CardTitle>
              <button onClick={() => setConfig({ ...config, whatsapp_enabled: !config.whatsapp_enabled })}>
                {config.whatsapp_enabled ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
            </div>
            <CardDescription>Receive messages & images via WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            {config.whatsapp_enabled && (
               <div className="p-4 bg-muted/30 rounded-lg text-center border border-emerald-500/20 min-h-[180px] flex flex-col items-center justify-center">
                 {config.qr_code ? (
                   <>
                     <div className="bg-white p-2 rounded-lg mb-2">
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(config.qr_code)}`} 
                         alt="WhatsApp QR Code"
                         className="w-[150px] h-[150px]"
                       />
                     </div>
                     <p className="text-xs text-emerald-500 font-medium">Scan with WhatsApp</p>
                   </>
                 ) : (
                   <>
                     <QrCode className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" />
                     <p className="text-xs text-muted-foreground">
                       {status === 'online' ? 'WhatsApp Connected' : 'Waiting for QR code...'}
                     </p>
                   </>
                 )}
               </div>
            )}
          </CardContent>

        </Card>

        {/* Telegram Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-500" />
                Telegram
              </CardTitle>
              <button onClick={() => setConfig({ ...config, telegram_enabled: !config.telegram_enabled })}>
                {config.telegram_enabled ? <ToggleRight className="w-8 h-8 text-sky-500" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
            </div>
            <CardDescription>Bot for photo & caption publishing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bot Token</label>
              <Input 
                type="password" 
                value={config.telegram_token || ''} 
                onChange={e => setConfig({...config, telegram_token: e.target.value})}
                placeholder="000000:ABCDEF..."
                disabled={!config.telegram_enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-500" />
                Email
              </CardTitle>
              <button onClick={() => setConfig({ ...config, email_enabled: !config.email_enabled })}>
                {config.email_enabled ? <ToggleRight className="w-8 h-8 text-amber-500" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
            </div>
            <CardDescription>Monitor IMAP inbox for posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email User</label>
              <Input 
                value={config.email_user || ''} 
                onChange={e => setConfig({...config, email_user: e.target.value})}
                placeholder="user@gmail.com"
                disabled={!config.email_enabled}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password / App Key</label>
              <Input 
                type="password" 
                value={config.email_pass || ''} 
                onChange={e => setConfig({...config, email_pass: e.target.value})}
                disabled={!config.email_enabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mappings Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Tag-Based Routing</CardTitle>
          <CardDescription>Map hashtags to specific CMS destinations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input 
              placeholder="#Hashtag (e.g. #SiteA)" 
              value={newMapping.hashtag}
              onChange={e => setNewMapping({...newMapping, hashtag: e.target.value})}
            />
            <select
              value={newMapping.connectionId}
              onChange={e => setNewMapping({...newMapping, connectionId: e.target.value})}
              className="h-10 px-3 rounded-md bg-muted border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select CMS Connection</option>
              {connections.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
            <Button onClick={handleAddMapping} variant="secondary">
              <Plus className="w-4 h-4 mr-2" /> Add Mapping
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Hashtag</th>
                  <th className="px-4 py-3 text-left">Internal Destination</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mappings.map(m => {
                  const conn = connections.find(c => c.id === m.connection_id);
                  return (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-primary">#{m.hashtag}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{conn?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-muted-foreground">{conn?.url}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteMapping(m.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {mappings.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No mappings configured. Messages will not be routed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Worker Status & Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
           <div className="p-4 bg-muted rounded-lg font-mono text-xs">
              <p># To start the listeners in background:</p>
              <p className="text-primary">npx tsx lib/listeners/worker.ts</p>
           </div>
           <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
             <li>Enable the channels you want to use above.</li>
             <li>Create mappings for your hashtags to link them to WP/Drupal sites.</li>
             <li>Send messages with the hashtag (e.g. "#SiteA New post content") to the bot or email.</li>
             <li>Images with captions will be automatically uploaded as media.</li>
           </ul>
        </CardContent>
      </Card>
    </div>
  );
}
