'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { mentorService } from '@/services/mentorService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCcw, XCircle, Clock, CheckCircle, AlertCircle, Mail, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

interface MentorInvitation {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    fullName: string;
    email: string;
  };
}

export default function InvitationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    setError('');

    try {
      const token = session?.user?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await mentorService.getInvitations(token);
      setInvitations(response.data.invitations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.accessToken]);

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.userType !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  const handleCancelInvitation = async (invitationToken: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    setActionLoading(invitationToken);
    try {
      const authToken = session?.user?.accessToken;
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      await mentorService.cancelInvitation(invitationToken, authToken);
      await fetchInvitations(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredInvitations = selectedStatus === 'all'
    ? invitations
    : invitations.filter(inv => inv.status === selectedStatus);

  const stats = {
    total: invitations.length,
    pending: invitations.filter(inv => inv.status === 'PENDING').length,
    accepted: invitations.filter(inv => inv.status === 'ACCEPTED').length,
    expired: invitations.filter(inv => inv.status === 'EXPIRED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mentor Invitations</h1>
            <p className="text-gray-600 mt-1">Manage and track all mentor invitations</p>
          </div>
          <Button onClick={() => router.push('/admin/invite-mentor')}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Mentor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-gray-600">Total Invitations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <p className="text-sm text-gray-600">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
              <p className="text-sm text-gray-600">Expired</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Invitations</CardTitle>
                <CardDescription>View and manage mentor invitation status</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchInvitations} disabled={loading}>
                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={selectedStatus === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('PENDING')}
              >
                Pending ({stats.pending})
              </Button>
              <Button
                variant={selectedStatus === 'ACCEPTED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('ACCEPTED')}
              >
                Accepted ({stats.accepted})
              </Button>
              <Button
                variant={selectedStatus === 'EXPIRED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('EXPIRED')}
              >
                Expired ({stats.expired})
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No invitations found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/admin/invite-mentor')}
                >
                  Send an Invitation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{invitation.email}</span>
                        {getStatusBadge(invitation.status)}
                      </div>
                      <div className="text-sm text-gray-600 ml-7">
                        <p>Invited by: {invitation.invitedBy.fullName}</p>
                        <p>Sent: {formatDate(invitation.createdAt)}</p>
                        <p>Expires: {formatDate(invitation.expiresAt)}</p>
                      </div>
                    </div>

                    {invitation.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.token)}
                        disabled={actionLoading === invitation.token}
                      >
                        {actionLoading === invitation.token ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
