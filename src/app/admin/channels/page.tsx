'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Power, 
  PowerOff,
  Activity,
  TrendingUp,
  Server,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Channel {
  id: string;
  channelName: string;
  channelArn: string;
  channelId: string;
  ingestEndpoint: string;
  playbackUrl: string;
  isActive: boolean;
  isEnabled: boolean;
  assignedToSessionId: string | null;
  totalUsageHours: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface ChannelStats {
  total: number;
  active: number;
  free: number;
  disabled: number;
}

export default function ChannelManagementPage() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchChannels = async () => {
    try {
      const token = (session?.user as any)?.accessToken;
      const response = await fetch(`${API_URL}/admin/channels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch channels');

      const data = await response.json();
      setChannels(data.data.channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to load channels');
    }
  };

  const fetchStats = async () => {
    try {
      const token = (session?.user as any)?.accessToken;
      const response = await fetch(`${API_URL}/admin/channels/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchChannels(), fetchStats()]);
    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const createChannel = async () => {
    setCreating(true);
    try {
      const token = (session?.user as any)?.accessToken;
      const response = await fetch(`${API_URL}/admin/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Channel-${Date.now()}`,
          type: 'STANDARD',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create channel');
      }

      toast.success('Channel created successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error creating channel:', error);
      toast.error(error.message || 'Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  const toggleChannel = async (channelId: string, currentState: boolean) => {
    try {
      const token = (session?.user as any)?.accessToken;
      const response = await fetch(`${API_URL}/admin/channels/${channelId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled: !currentState }),
      });

      if (!response.ok) throw new Error('Failed to toggle channel');

      toast.success(`Channel ${!currentState ? 'enabled' : 'disabled'}`);
      await loadData();
    } catch (error) {
      console.error('Error toggling channel:', error);
      toast.error('Failed to toggle channel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Channel Management</h1>
          <p className="text-gray-600 mt-1">Manage IVS streaming channels</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={createChannel}
            disabled={creating}
          >
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creating...' : 'Create Channel'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All channels in pool
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently streaming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.free}</div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disabled</CardTitle>
              <PowerOff className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.disabled}</div>
              <p className="text-xs text-muted-foreground">
                Not in use
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning if no free channels */}
      {stats && stats.free === 0 && stats.active > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">All Channels In Use</CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              All channels are currently active. Consider creating more channels to handle additional sessions.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Channels List */}
      <Card>
        <CardHeader>
          <CardTitle>Channels ({channels.length})</CardTitle>
          <CardDescription>
            Manage your IVS streaming channel pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Channels Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first channel to enable live streaming
              </p>
              <Button onClick={createChannel} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Channel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{channel.channelName}</h3>
                        <Badge
                          variant={channel.isActive ? 'destructive' : 'default'}
                          className={channel.isActive ? 'bg-red-500' : 'bg-green-500'}
                        >
                          {channel.isActive ? '🔴 Active' : '🟢 Free'}
                        </Badge>
                        {!channel.isEnabled && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Channel ID:</span>{' '}
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {channel.channelId}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Ingest:</span>{' '}
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {channel.ingestEndpoint}
                          </code>
                        </div>
                        {channel.assignedToSessionId && (
                          <div className="col-span-2">
                            <span className="font-medium">Assigned to Session:</span>{' '}
                            <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">
                              {channel.assignedToSessionId}
                            </code>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(channel.createdAt).toLocaleDateString()}
                        </div>
                        {channel.lastUsedAt && (
                          <div>
                            <span className="font-medium">Last Used:</span>{' '}
                            {new Date(channel.lastUsedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleChannel(channel.id, channel.isEnabled)}
                        disabled={channel.isActive}
                        title={channel.isActive ? 'Cannot disable active channel' : ''}
                      >
                        {channel.isEnabled ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Channel Pool</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • <strong>Active channels</strong> are currently being used for live streaming sessions
          </p>
          <p>
            • <strong>Free channels</strong> are available for new sessions
          </p>
          <p>
            • <strong>Disabled channels</strong> won't be assigned to new sessions
          </p>
          <p>
            • Channels are automatically released when sessions end
          </p>
          <p>
            • Each channel can only be used by one session at a time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
