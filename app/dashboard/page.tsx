'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface DashboardStats {
  totalDatasets: number;
  publicDatasets: number;
  privateDatasets: number;
  recentDatasets: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDatasets: 0,
    publicDatasets: 0,
    privateDatasets: 0,
    recentDatasets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all datasets
      const response = await fetch('/api/ckan/package_list');
      const data = await response.json();
      
      if (data.success) {
        const datasetNames = data.result;
        
        // Fetch details for each dataset to count public/private
        const detailsPromises = datasetNames.slice(0, 10).map(async (name: string) => {
          const res = await fetch(`/api/ckan/package_show?id=${name}`);
          const detailData = await res.json();
          return detailData.success ? detailData.result : null;
        });

        const datasets = (await Promise.all(detailsPromises)).filter(Boolean);
        
        const publicCount = datasets.filter(d => !d.private).length;
        const privateCount = datasets.filter(d => d.private).length;

        setStats({
          totalDatasets: datasetNames.length,
          publicDatasets: publicCount,
          privateDatasets: privateCount,
          recentDatasets: datasets.slice(0, 5),
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1729]">
      <Sidebar />
      
      <div className="lg:pl-72">
        <main className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400">
                  Welcome to datHere! Here's what's happening with your data portal today.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Datasets */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <Database className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Datasets</p>
                      <p className="text-3xl font-bold">
                        {loading ? '...' : stats.totalDatasets}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Public Datasets */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500/10 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Public Datasets</p>
                      <p className="text-3xl font-bold">
                        {loading ? '...' : stats.publicDatasets}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/datasets/create"
                    className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5" />
                      <h3 className="font-semibold">Add Dataset</h3>
                    </div>
                    <p className="text-sm text-blue-100">
                      Upload new data with AI metadata
                    </p>
                  </Link>

                  <Link
                    href="/datasets"
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5" />
                      <h3 className="font-semibold">Manage Datasets</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      View and edit all datasets
                    </p>
                  </Link>

                  <Link
                    href="/users"
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5" />
                      <h3 className="font-semibold">Manage Users</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Add or remove team members
                    </p>
                  </Link>
                </div>
              </div>

              {/* My Datasets Summary */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">My Datasets</h2>
                  <Link href="/datasets" className="text-blue-500 hover:text-blue-400 text-sm">
                    View all
                  </Link>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <Database className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{loading ? '...' : stats.totalDatasets}</span>
                        <span className="text-gray-400">All</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {loading ? (
                    <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                      Loading recent datasets...
                    </div>
                  ) : stats.recentDatasets.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                      No datasets yet. Create your first dataset!
                    </div>
                  ) : (
                    stats.recentDatasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-500 rounded-full p-2 mt-1">
                            <Database className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium mb-1">
                              <Link href={`/datasets/${dataset.name}`} className="hover:text-blue-400">
                                {dataset.title || dataset.name}
                              </Link>
                            </p>
                            <p className="text-sm text-gray-400 mb-2">
                              {dataset.notes?.substring(0, 100) || 'No description'}
                              {dataset.notes?.length > 100 ? '...' : ''}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Last modified: {formatDate(dataset.metadata_modified)}</span>
                              <span>Resources: {dataset.resources?.length || 0}</span>
                              <span className={dataset.private ? 'text-yellow-500' : 'text-green-500'}>
                                {dataset.private ? 'Private' : 'Public'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}