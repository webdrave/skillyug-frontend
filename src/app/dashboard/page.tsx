'use client'

import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardSelector from '../../components/DashboardSelector';
import Navbar from '../../components/Navbar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
      <Navbar />
      <ProtectedRoute>
        <DashboardSelector />
      </ProtectedRoute>
    </div>
  );
}
