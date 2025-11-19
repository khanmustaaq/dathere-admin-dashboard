// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { Database, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
// import Sidebar from '@/components/Sidebar';

// interface Dataset {
//   id: string;
//   name: string;
//   title: string;
//   notes: string;
//   private: boolean;
//   num_resources: number;
//   metadata_modified: string;
//   organization: {
//     name: string;
//     title: string;
//   };
// }

// export default function DatasetsPage() {
//   const [datasets, setDatasets] = useState<Dataset[]>([]);
//   const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedOrg, setSelectedOrg] = useState('');
//   const [organizations, setOrganizations] = useState<any[]>([]);
//   const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
//   const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

//   useEffect(() => {
//     fetchDatasets();
//     fetchOrganizations();
//   }, []);

//   useEffect(() => {
//     filterDatasets();
//   }, [searchQuery, selectedOrg, datasets]);

//   const fetchDatasets = async () => {
//     try {
//       const response = await fetch('/api/ckan/package_list');
//       const data = await response.json();

//       if (data.success) {
//         const datasetNames = data.result;

//         // Fetch details for each dataset
//         const detailsPromises = datasetNames.map(async (name: string) => {
//           const res = await fetch(`/api/ckan/package_show?id=${name}`);
//           const detailData = await res.json();
//           return detailData.success ? detailData.result : null;
//         });

//         const fetchedDatasets = (await Promise.all(detailsPromises)).filter(Boolean);
//         setDatasets(fetchedDatasets);
//         setFilteredDatasets(fetchedDatasets);
//       }
//     } catch (error) {
//       console.error('Failed to fetch datasets:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchOrganizations = async () => {
//     try {
//       const response = await fetch('/api/ckan/organization_list?all_fields=true');
//       const data = await response.json();
//       if (data.success) {
//         setOrganizations(data.result);
//       }
//     } catch (error) {
//       console.error('Failed to fetch organizations:', error);
//     }
//   };

//   const filterDatasets = () => {
//     let filtered = datasets;

//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(
//         (dataset) =>
//           dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           dataset.notes?.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     // Organization filter
//     if (selectedOrg) {
//       filtered = filtered.filter(
//         (dataset) => dataset.organization?.name === selectedOrg
//       );
//     }

//     setFilteredDatasets(filtered);
//   };

//   const toggleSelectDataset = (id: string) => {
//     setSelectedDatasets((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );
//   };

//   const toggleSelectAll = () => {
//     if (selectedDatasets.length === filteredDatasets.length) {
//       setSelectedDatasets([]);
//     } else {
//       setSelectedDatasets(filteredDatasets.map((d) => d.id));
//     }
//   };

//   const handleDelete = async (datasetId: string, datasetName: string) => {
//     if (!confirm(`Are you sure you want to delete "${datasetName}"?`)) {
//       return;
//     }

//     try {
//       const response = await fetch('/api/ckan/package_delete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ id: datasetId }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         // Refresh datasets list
//         fetchDatasets();
//         setSelectedDatasets([]);
//       } else {
//         alert('Failed to delete dataset');
//       }
//     } catch (error) {
//       console.error('Delete error:', error);
//       alert('Failed to delete dataset');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white dark:bg-[#0f1729]">
//       <Sidebar />

//       <div className="lg:pl-72">
//         <main className="py-10 px-4 sm:px-6 lg:px-8">
//           <div className="mx-auto max-w-7xl">
//             {/* Header */}
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold mb-2">Datasets</h1>
//               <p className="text-gray-400">
//                 A list of all the datasets in your portal including their name, title, description and image.
//               </p>
//             </div>

//             {/* Add Dataset Button */}
//             <Link
//               href="/datasets/create"
//               className="inline-block mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
//             >
//               Add dataset
//             </Link>

//             {/* Search and Filters */}
//             <div className="space-y-4 mb-6">
//               {/* Search */}
//               <div>
//                 <label className="block text-sm font-medium mb-2">Search datasets</label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                   <input
//                     type="text"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     placeholder="Search text"
//                     className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>

//               {/* Organization Filter */}
//               <div>
//                 <label className="block text-sm font-medium mb-2">Organizations</label>
//                 <select
//                   value={selectedOrg}
//                   onChange={(e) => setSelectedOrg(e.target.value)}
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select...</option>
//                   {organizations.map((org) => (
//                     <option key={org.id} value={org.name}>
//                       {org.title || org.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Table */}
//             {loading ? (
//               <div className="text-center py-12 text-gray-400">Loading datasets...</div>
//             ) : filteredDatasets.length === 0 ? (
//               <div className="text-center py-12 text-gray-400">
//                 No datasets found. Create your first dataset!
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="border-b border-gray-700">
//                     <tr>
//                       <th className="text-left py-3 px-4">
//                         <input
//                           type="checkbox"
//                           checked={selectedDatasets.length === filteredDatasets.length}
//                           onChange={toggleSelectAll}
//                           className="rounded border-gray-600"
//                         />
//                       </th>
//                       <th className="text-left py-3 px-4 font-medium">Title</th>
//                       <th className="text-left py-3 px-4 font-medium">Name</th>
//                       <th className="text-left py-3 px-4 font-medium">Description</th>
//                       <th className="text-left py-3 px-4 font-medium">Visibility</th>
//                       <th className="text-left py-3 px-4 font-medium">Resources</th>
//                       <th className="text-left py-3 px-4 font-medium">Published</th>
//                       <th className="text-left py-3 px-4 font-medium">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredDatasets.map((dataset) => (
//                       <tr key={dataset.id} className="border-b border-gray-800 hover:bg-gray-800/50">
//                         <td className="py-3 px-4">
//                           <input
//                             type="checkbox"
//                             checked={selectedDatasets.includes(dataset.id)}
//                             onChange={() => toggleSelectDataset(dataset.id)}
//                             className="rounded border-gray-600"
//                           />
//                         </td>
//                         <td className="py-3 px-4">
//                           <Link href={`/datasets/${dataset.name}`} className="text-blue-400 hover:text-blue-300">
//                             {dataset.title}
//                           </Link>
//                         </td>
//                         <td className="py-3 px-4 text-gray-400">{dataset.name}</td>
//                         <td className="py-3 px-4 text-gray-400 max-w-xs truncate">
//                           {dataset.notes?.substring(0, 100) || 'No description'}
//                         </td>
//                         <td className="py-3 px-4">
//                           <span
//                             className={`inline-block px-2 py-1 rounded text-xs ${
//                               dataset.private
//                                 ? 'bg-yellow-500/20 text-yellow-500'
//                                 : 'bg-green-500/20 text-green-500'
//                             }`}
//                           >
//                             {dataset.private ? 'Private' : 'Public'}
//                           </span>
//                         </td>
//                         <td className="py-3 px-4">
//                           <Link
//                             href={`${process.env.NEXT_PUBLIC_PORTALJS_URL}/@${dataset.organization?.name || 'portaljs'}/${dataset.name}`}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-blue-400 hover:text-blue-300"
//                           >
//                             {dataset.num_resources || 0} Resources
//                           </Link>
//                         </td>
//                         <td className="py-3 px-4 text-gray-400">
//                           <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
//                             <Eye className="w-4 h-4" />
//                             View Online
//                           </button>
//                         </td>
//                         <td className="py-3 px-4 relative">
//                           <button
//                             onClick={() =>
//                               setOpenActionMenu(openActionMenu === dataset.id ? null : dataset.id)
//                             }
//                             className="p-2 hover:bg-gray-700 rounded"
//                           >
//                             <MoreVertical className="w-5 h-5" />
//                           </button>

//                           {openActionMenu === dataset.id && (
//                             <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
//                               <Link
//                                 href={`/datasets/${dataset.name}/edit`}
//                                 className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm"
//                               >
//                                 <Edit className="w-4 h-4" />
//                                 Edit
//                               </Link>
//                               <Link
//                                 href={`/datasets/${dataset.name}/resources`}
//                                 className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm"
//                               >
//                                 <Database className="w-4 h-4" />
//                                 Resources
//                               </Link>
//                               <button
//                                 onClick={() => handleDelete(dataset.id, dataset.title)}
//                                 className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm text-red-500 w-full text-left"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                                 Delete
//                               </button>
//                             </div>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface Dataset {
  id: string;
  name: string;
  title: string;
  notes: string;
  private: boolean;
  num_resources: number;
  metadata_modified: string;
  organization: {
    name: string;
    title: string;
  };
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasets();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    filterDatasets();
  }, [searchQuery, selectedOrg, datasets]);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/ckan/package_list');
      const data = await response.json();

      if (data.success) {
        const datasetNames = data.result;

        // Fetch details for each dataset
        const detailsPromises = datasetNames.map(async (name: string) => {
          const res = await fetch(`/api/ckan/package_show?id=${name}`);
          const detailData = await res.json();
          return detailData.success ? detailData.result : null;
        });

        const fetchedDatasets = (await Promise.all(detailsPromises)).filter(Boolean);
        setDatasets(fetchedDatasets);
        setFilteredDatasets(fetchedDatasets);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/ckan/organization_list?all_fields=true');
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.result);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const filterDatasets = () => {
    let filtered = datasets;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (dataset) =>
          dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dataset.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Organization filter
    if (selectedOrg) {
      filtered = filtered.filter(
        (dataset) => dataset.organization?.name === selectedOrg
      );
    }

    setFilteredDatasets(filtered);
  };

  const toggleSelectDataset = (id: string) => {
    setSelectedDatasets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDatasets.length === filteredDatasets.length) {
      setSelectedDatasets([]);
    } else {
      setSelectedDatasets(filteredDatasets.map((d) => d.id));
    }
  };

  const handleDelete = async (datasetId: string, datasetName: string) => {
    if (!confirm(`Are you sure you want to delete "${datasetName}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/ckan/package_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: datasetId }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh datasets list
        fetchDatasets();
        setSelectedDatasets([]);
      } else {
        alert('Failed to delete dataset');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete dataset');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1729]">
      <Sidebar />

      <div className="lg:pl-72">
        <main className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Datasets</h1>
              <p className="text-gray-400">
                A list of all the datasets in your portal including their name, title, description and image.
              </p>
            </div>

            {/* Add Dataset Button */}
            <Link
              href="/datasets/create"
              className="inline-block mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add dataset
            </Link>

            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search datasets</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search text"
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Organization Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Organizations</label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.name}>
                      {org.title || org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading datasets...</div>
            ) : filteredDatasets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No datasets found. Create your first dataset!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedDatasets.length === filteredDatasets.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-600"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Title</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                      <th className="text-left py-3 px-4 font-medium">Visibility</th>
                      <th className="text-left py-3 px-4 font-medium">Resources</th>
                      <th className="text-left py-3 px-4 font-medium">Published</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDatasets.map((dataset) => (
                      <tr key={dataset.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedDatasets.includes(dataset.id)}
                            onChange={() => toggleSelectDataset(dataset.id)}
                            className="rounded border-gray-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/datasets/${dataset.name}`} className="text-blue-400 hover:text-blue-300">
                            {dataset.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-400">{dataset.name}</td>
                        <td className="py-3 px-4 text-gray-400 max-w-xs truncate">
                          {dataset.notes?.substring(0, 100) || 'No description'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              dataset.private
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-green-500/20 text-green-500'
                            }`}
                          >
                            {dataset.private ? 'Private' : 'Public'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`${process.env.NEXT_PUBLIC_PORTALJS_URL}/@${dataset.organization?.name || 'portaljs'}/${dataset.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {dataset.num_resources || 0} Resources
                          </a>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          <a
                            href={`${process.env.NEXT_PUBLIC_PORTALJS_URL}/@${dataset.organization?.name || 'portaljs'}/${dataset.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                            View Online
                          </a>
                        </td>
                        <td className="py-3 px-4 relative">
                          <button
                            onClick={() =>
                              setOpenActionMenu(openActionMenu === dataset.id ? null : dataset.id)
                            }
                            className="p-2 hover:bg-gray-700 rounded"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openActionMenu === dataset.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                              <Link
                                href={`/datasets/${dataset.name}/edit`}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Link>
                              <Link
                                href={`/datasets/${dataset.name}/resources`}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm"
                              >
                                <Database className="w-4 h-4" />
                                Resources
                              </Link>
                              <button
                                onClick={() => handleDelete(dataset.id, dataset.title)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 text-sm text-red-500 w-full text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}