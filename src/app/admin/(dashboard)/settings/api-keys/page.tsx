'use client';

// API Keys Management Page
// Create, view, and manage API keys for external access

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Clock,
  BarChart3,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// =============================================================================
// Types
// =============================================================================

interface ApiKeyStats {
  requestsToday: number;
  rateLimitPerDay: number;
  lastUsedAt: string | null;
  percentUsed: number;
}

interface ApiKeyWithStats {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  rateLimitPerDay: number;
  createdAt: string;
  stats: ApiKeyStats;
}

interface NewKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey: string;
  rateLimitPerDay: number;
  isActive: boolean;
  createdAt: string;
}

// =============================================================================
// Component
// =============================================================================

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState<string | null>(null);

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [isCreating, setIsCreating] = useState(false);

  // New key display state (shown only once after creation)
  const [newKeyData, setNewKeyData] = useState<NewKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete dialog state
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // =============================================================================
  // Data Fetching
  // =============================================================================

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys || []);
        setProjectName(data.projectName || null);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // Create Key
  // =============================================================================

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          rateLimitPerDay: newKeyRateLimit,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKeyData(data.key);
        setShowCreateDialog(false);
        setNewKeyName('');
        setNewKeyRateLimit(100);
        await fetchKeys();
        toast.success('API key created');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  // =============================================================================
  // Copy Key
  // =============================================================================

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // =============================================================================
  // Toggle Key Active Status
  // =============================================================================

  const handleToggleActive = async (key: ApiKeyWithStats) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !key.isActive }),
      });

      if (response.ok) {
        await fetchKeys();
        toast.success(key.isActive ? 'API key deactivated' : 'API key activated');
      } else {
        toast.error('Failed to update API key');
      }
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      toast.error('Failed to update API key');
    }
  };

  // =============================================================================
  // Delete Key
  // =============================================================================

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/api-keys/${keyToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchKeys();
        toast.success('API key deleted');
      } else {
        toast.error('Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setIsDeleting(false);
      setKeyToDelete(null);
    }
  };

  // =============================================================================
  // Render
  // =============================================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for external access to lead enrichment
            {projectName && <span className="ml-1">({projectName})</span>}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create API Key
        </Button>
      </div>

      {/* API Usage Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">API Usage</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Endpoint:</strong> <code className="bg-blue-100 px-1 rounded">POST /api/v1/enrich</code></p>
          <p><strong>Auth Header:</strong> <code className="bg-blue-100 px-1 rounded">Authorization: Bearer le_prod_xxx...</code></p>
          <p><strong>Get Results:</strong> <code className="bg-blue-100 px-1 rounded">GET /api/v1/leads/[id]</code></p>
        </div>
      </div>

      {/* Keys List */}
      {keys.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
          <p className="text-muted-foreground mb-4">
            Create an API key to access the enrichment API programmatically
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create First Key
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`border rounded-lg p-4 ${
                key.isActive ? 'bg-white' : 'bg-gray-50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{key.name}</span>
                    {!key.isActive && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <code className="text-sm text-muted-foreground font-mono">
                    {key.keyPrefix}
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(key)}
                    title={key.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {key.isActive ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setKeyToDelete(key)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 pt-3 border-t flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>
                    {key.stats.requestsToday} / {key.stats.rateLimitPerDay} today
                  </span>
                  <span className="text-xs">
                    ({key.stats.percentUsed}%)
                  </span>
                </div>
                {key.stats.lastUsedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Last used: {new Date(key.stats.lastUsedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external access. The full key will only be shown once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rateLimit">Daily Rate Limit</Label>
              <Input
                id="rateLimit"
                type="number"
                min={1}
                max={10000}
                value={newKeyRateLimit}
                onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value) || 100)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum requests per day (1-10,000)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Display Dialog */}
      <Dialog open={!!newKeyData} onOpenChange={() => setNewKeyData(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy your API key now. It will not be shown again!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Important:</strong> This is the only time you will see the full API key.
                  Store it securely - you cannot retrieve it later.
                </div>
              </div>
            </div>

            <Label>Your API Key</Label>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {newKeyData?.fullKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyKey(newKeyData?.fullKey || '')}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setNewKeyData(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{keyToDelete?.name}</strong>?
              Any applications using this key will no longer be able to access the API.
              <br /><br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
