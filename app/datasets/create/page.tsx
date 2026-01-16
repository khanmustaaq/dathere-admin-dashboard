// import CreateDatasetForm from '@/components/datasets/CreateDatasetForm';

// export default function CreateDatasetPage() {
//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2">Create Dataset</h1>
//         <p className="text-gray-600">
//           Add a new dataset to your data portal. Fill in the information below and upload your resources.
//         </p>
//       </div>

//       <CreateDatasetForm />
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { Plus, Trash2, Upload, Link as LinkIcon } from 'lucide-react';

// Validation schema
const datasetSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  name: z.string().min(3, 'Name must be at least 3 characters').regex(/^[a-z0-9-_]+$/, 'Name can only contain lowercase letters, numbers, hyphens, and underscores'),
  author: z.string().optional(),
  author_email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
  tags: z.string().optional(),
  owner_org: z.string().min(1, 'Organization is required'),
  private: z.boolean().default(false),
});

type DatasetFormData = z.infer<typeof datasetSchema>;

interface Resource {
  name: string;
  description: string;
  format: string;
  url?: string;
  upload?: File | null;
  resource_type: 'file' | 'url';
}

export default function CreateDatasetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DatasetFormData>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      private: false,
    },
  });

  const title = watch('title');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Auto-generate name from title
  useEffect(() => {
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('name', slug);
    }
  }, [title, setValue]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/ckan/organization_list?all_fields=true');
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.result);
        // Set first organization as default
        if (data.result.length > 0) {
          setValue('owner_org', data.result[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  // Add new resource
  const addResource = () => {
    setResources([
      ...resources,
      {
        name: '',
        description: '',
        format: 'CSV',
        resource_type: 'file',
        upload: null,
      },
    ]);
  };

  // Remove resource
  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  // Update resource field
  const updateResource = (index: number, field: keyof Resource, value: any) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  // Handle file upload for resource
  const handleFileUpload = (index: number, file: File | null) => {
    if (file) {
      const updated = [...resources];
      updated[index].upload = file;
      // Auto-detect format from file extension
      const ext = file.name.split('.').pop()?.toUpperCase();
      if (ext) {
        updated[index].format = ext;
      }
      // Set name if empty
      if (!updated[index].name) {
        updated[index].name = file.name.split('.')[0];
      }
      setResources(updated);
    }
  };

  const onSubmit = async (data: DatasetFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create dataset
      const createPayload = {
        title: data.title,
        name: data.name,
        author: data.author,
        author_email: data.author_email,
        notes: data.notes,
        private: data.private,
        owner_org: data.owner_org,
        tags: data.tags
          ? data.tags.split(',').map((tag) => ({ name: tag.trim() }))
          : [],
      };

      const response = await fetch('/api/ckan/package_create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create dataset');
      }

      const createdDataset = result.result;

      // Step 2: Add resources if any
      if (resources.length > 0) {
        for (const resource of resources) {
          // Validate resource
          if (!resource.name) {
            toast.error('All resources must have a name');
            setIsSubmitting(false);
            return;
          }

          if (resource.resource_type === 'file' && !resource.upload) {
            toast.error(`Resource "${resource.name}" must have a file uploaded`);
            setIsSubmitting(false);
            return;
          }

          if (resource.resource_type === 'url' && !resource.url) {
            toast.error(`Resource "${resource.name}" must have a URL`);
            setIsSubmitting(false);
            return;
          }

          // Create resource
          const resourcePayload: any = {
            package_id: createdDataset.id,
            name: resource.name,
            description: resource.description,
            format: resource.format,
          };

          if (resource.resource_type === 'file' && resource.upload) {
            // Upload file
            const formData = new FormData();
            formData.append('upload', resource.upload);
            formData.append('package_id', createdDataset.id);
            formData.append('name', resource.name);
            formData.append('description', resource.description);
            formData.append('format', resource.format);

            const uploadResponse = await fetch('/api/ckan/resource_create', {
              method: 'POST',
              body: formData,
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResult.success) {
              throw new Error(`Failed to upload resource: ${resource.name}`);
            }
          } else if (resource.resource_type === 'url') {
            // URL-based resource
            resourcePayload.url = resource.url;

            const urlResponse = await fetch('/api/ckan/resource_create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resourcePayload),
            });

            const urlResult = await urlResponse.json();
            if (!urlResult.success) {
              throw new Error(`Failed to create resource: ${resource.name}`);
            }
          }
        }
      }

      toast.success('Dataset created successfully!');
      setTimeout(() => {
        router.push('/datasets');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the dataset');
      toast.error(err.message || 'Failed to create dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1729]">
      <Sidebar />
      <Toaster position="top-right" />

      <div className="lg:pl-72">
        <main className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Create Dataset</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Add a new dataset to your data portal. Fill in the information below and add resources.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="My Dataset Title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                {/* Name (auto-generated) */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Name (slug) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="my-dataset-name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Auto-generated from title. Only lowercase letters, numbers, hyphens, and underscores.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Description
                  </label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    rows={5}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Describe your dataset..."
                  />
                </div>

                {/* Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      Author
                    </label>
                    <input
                      id="author"
                      type="text"
                      {...register('author')}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      placeholder="Author Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="author_email" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      Author Email
                    </label>
                    <input
                      id="author_email"
                      type="email"
                      {...register('author_email')}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      placeholder="author@example.com"
                    />
                    {errors.author_email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.author_email.message}</p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Tags
                  </label>
                  <input
                    id="tags"
                    type="text"
                    {...register('tags')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="economy, health, education (comma-separated)"
                  />
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Separate multiple tags with commas</p>
                </div>

                {/* Organization Dropdown */}
                <div>
                  <label htmlFor="owner_org" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="owner_org"
                    {...register('owner_org')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.name}>
                        {org.title || org.name}
                      </option>
                    ))}
                  </select>
                  {errors.owner_org && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.owner_org.message}</p>
                  )}
                </div>

                {/* Private */}
                <div className="flex items-center">
                  <input
                    id="private"
                    type="checkbox"
                    {...register('private')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="private" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Private (only visible to organization members)
                  </label>
                </div>
              </div>

              {/* Resources Section */}
              <div className="space-y-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resources</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Add files or URLs to your dataset (CSV, JSON, Excel, PDF, etc.)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addResource}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Resource
                  </button>
                </div>

                {resources.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400">
                      No resources added yet. Click "Add Resource" to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {resources.map((resource, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">Resource {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeResource(index)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Resource Type Selection */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                            Resource Type
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                checked={resource.resource_type === 'file'}
                                onChange={() => updateResource(index, 'resource_type', 'file')}
                                className="mr-2"
                              />
                              <Upload className="w-4 h-4 mr-1" />
                              <span className="text-gray-900 dark:text-white">File Upload</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                checked={resource.resource_type === 'url'}
                                onChange={() => updateResource(index, 'resource_type', 'url')}
                                className="mr-2"
                              />
                              <LinkIcon className="w-4 h-4 mr-1" />
                              <span className="text-gray-900 dark:text-white">URL</span>
                            </label>
                          </div>
                        </div>

                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={resource.name}
                            onChange={(e) => updateResource(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            placeholder="Resource name"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                            Description
                          </label>
                          <textarea
                            value={resource.description}
                            onChange={(e) => updateResource(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            placeholder="Describe this resource..."
                          />
                        </div>

                        {/* Format */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                            Format
                          </label>
                          <select
                            value={resource.format}
                            onChange={(e) => updateResource(index, 'format', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                          >
                            <option value="CSV">CSV</option>
                            <option value="JSON">JSON</option>
                            <option value="XLSX">XLSX</option>
                            <option value="XLS">XLS</option>
                            <option value="PDF">PDF</option>
                            <option value="XML">XML</option>
                            <option value="TXT">TXT</option>
                            <option value="ZIP">ZIP</option>
                            <option value="GEOJSON">GeoJSON</option>
                            <option value="SHP">Shapefile</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        {/* File Upload or URL */}
                        {resource.resource_type === 'file' ? (
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                              Upload File <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="file"
                              onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 file:cursor-pointer hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                            />
                            {resource.upload && (
                              <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                File selected: {resource.upload.name} ({(resource.upload.size / 1024).toFixed(2)} KB)
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                              Resource URL <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="url"
                              value={resource.url || ''}
                              onChange={(e) => updateResource(index, 'url', e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                              placeholder="https://example.com/data.csv"
                            />
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              Enter the full URL to the resource
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Creating Dataset...' : 'Create Dataset'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}