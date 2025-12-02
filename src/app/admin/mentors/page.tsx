'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Search,
  UserX,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Calendar,
  BookOpen,
  Shield,
  MoreVertical,
  RefreshCcw,
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { mentorService, MentorProfile } from '@/services/mentorService';

interface MentorWithUser extends MentorProfile {
  coursesCount?: number;
}

export default function MentorsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mentors, setMentors] = useState<MentorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDecommissionModal, setShowDecommissionModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorWithUser | null>(null);
  const [reassignMentorId, setReassignMentorId] = useState('');

  // Fetch mentors
  const fetchMentors = async () => {
    setLoading(true);
    setError('');

    try {
      const token = session?.user?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await mentorService.getMentors({ page: 1, limit: 100 });
      if (response.status === 'success') {
        setMentors(response.data.mentors || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchMentors();
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

  const handleDecommission = async () => {
    if (!selectedMentor) return;

    setActionLoading(selectedMentor.userId);
    setError('');
    setSuccess('');

    try {
      const token = session?.user?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      await mentorService.decommissionMentor(selectedMentor.userId, token);
      setSuccess(`Successfully decommissioned ${selectedMentor.user.fullName || selectedMentor.user.email}`);
      setShowDecommissionModal(false);
      setSelectedMentor(null);
      await fetchMentors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decommission mentor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedMentor) return;

    setActionLoading(selectedMentor.userId);
    setError('');
    setSuccess('');

    try {
      const token = session?.user?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      await mentorService.deleteMentor(
        selectedMentor.userId,
        token,
        reassignMentorId || undefined
      );
      
      setSuccess(`Successfully deleted ${selectedMentor.user.fullName || selectedMentor.user.email}`);
      setShowDeleteModal(false);
      setSelectedMentor(null);
      setReassignMentorId('');
      await fetchMentors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mentor');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter mentors
  const filteredMentors = mentors.filter((mentor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.user.fullName?.toLowerCase().includes(searchLower) ||
      mentor.user.email?.toLowerCase().includes(searchLower) ||
      mentor.expertise.some((exp) => exp.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Mentors</h1>
        <p className="text-gray-600">View, decommission, or delete mentor accounts</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Actions */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search mentors by name, email, or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button onClick={fetchMentors} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Mentors List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredMentors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No mentors found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMentors.map((mentor) => (
            <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {mentor.user.image ? (
                      <img
                        src={mentor.user.image}
                        alt={mentor.user.fullName || 'Mentor'}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {mentor.user.fullName || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{mentor.user.email}</span>
                    </div>

                    {/* Expertise */}
                    {mentor.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {mentor.expertise.slice(0, 3).map((exp, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                        {mentor.expertise.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{mentor.expertise.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      {mentor.experience && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          <span>{mentor.experience} years</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(mentor.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowDecommissionModal(true);
                        }}
                        disabled={!!actionLoading}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Decommission
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowDeleteModal(true);
                        }}
                        disabled={!!actionLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Decommission Modal */}
      {showDecommissionModal && selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-500" />
                Decommission Mentor
              </CardTitle>
              <CardDescription>
                This will change the mentor's user type to STUDENT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>{selectedMentor.user.fullName || selectedMentor.user.email}</strong> will
                  no longer have mentor privileges, but their courses will remain assigned to them.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDecommissionModal(false);
                    setSelectedMentor(null);
                  }}
                  className="flex-1"
                  disabled={!!actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDecommission}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!!actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Decommission'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Mentor
              </CardTitle>
              <CardDescription>This action cannot be undone</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Warning:</strong> This will permanently delete{' '}
                  <strong>{selectedMentor.user.fullName || selectedMentor.user.email}</strong> and
                  all their data. Their courses will be reassigned.
                </AlertDescription>
              </Alert>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reassign courses to (optional):
                </label>
                <select
                  value={reassignMentorId}
                  onChange={(e) => setReassignMentorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Admin (Default)</option>
                  {mentors
                    .filter((m) => m.userId !== selectedMentor.userId)
                    .map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.fullName || m.user.email}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMentor(null);
                    setReassignMentorId('');
                  }}
                  className="flex-1"
                  disabled={!!actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                  disabled={!!actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Permanently'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mentors</p>
                <p className="text-2xl font-bold text-gray-900">{mentors.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredMentors.length}</p>
              </div>
              <Search className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actions Available</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
              <UserCog className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
