'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { titleToSlug } from '@/lib/ckan-api';

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

export default function EditDatasetPage() {
  const router = useRouter();
  const params = useParams();
  const datasetName = params.name as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<DatasetFormData>({
    resolver: zodResolver(datasetSchema),
  });

  useEffect(() => {
    fetchDataset();
    fetchOrganizations();
  }, []);

  const fetchDataset = async () => {
    try {
      const response = await fetch(`/api/ckan/package_show?id=${datasetName}`);
      const data = await response.json();

      if (data.success) {
        const dataset = data.result;

        // Pre-fill form with existing data
        reset({
          title: dataset.title,
          name: dataset.name,
          author: dataset.author || '',
          author_email: dataset.author_email || '',
          notes: dataset.notes || '',
          tags: dataset.tags?.map((t: any) => t.name).join(', ') || '',
          owner_org: dataset.organization?.name || dataset.owner_org,
          private: dataset.private || false,
        });
      } else {
        setError('Dataset not found');
      }
    } catch (err) {
      console.error('Failed to fetch dataset:', err);
      setError('Failed to load dataset');
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

  const onSubmit = async (data: DatasetFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updatePayload = {
        id: datasetName,
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

      const response = await fetch('/api/ckan/package_patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update dataset');
      }

      toast.success('Dataset updated successfully!');
      setTimeout(() => {
        router.push('/datasets');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1729]">
        <Sidebar />
        <div className="lg:pl-72">
          <main className="py-10 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-400">Loading dataset...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1729]">
      <Sidebar />
      <Toaster position="top-right" />

      <div className="lg:pl-72">
        <main className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Edit Dataset</h1>
              <p className="text-gray-400">Update the dataset information below.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-6 bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold">Basic Information</h2>

                {/* Name (read-only) */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name (slug) <span className="text-gray-500">- cannot be changed</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    disabled
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md font-mono text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Dataset Title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    rows={5}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your dataset..."
                  />
                </div>

                {/* Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium mb-2">
                      Author
                    </label>
                    <input
                      id="author"
                      type="text"
                      {...register('author')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Author Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="author_email" className="block text-sm font-medium mb-2">
                      Author Email
                    </label>
                    <input
                      id="author_email"
                      type="email"
                      {...register('author_email')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="author@example.com"
                    />
                    {errors.author_email && (
                      <p className="mt-1 text-sm text-red-400">{errors.author_email.message}</p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium mb-2">
                    Tags
                  </label>
                  <input
                    id="tags"
                    type="text"
                    {...register('tags')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="economy, health, education (comma-separated)"
                  />
                  <p className="mt-1 text-xs text-gray-400">Separate multiple tags with commas</p>
                </div>

                {/* Organization Dropdown */}
                <div>
                  <label htmlFor="owner_org" className="block text-sm font-medium mb-2">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="owner_org"
                    {...register('owner_org')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.name}>
                        {org.title || org.name}
                      </option>
                    ))}
                  </select>
                  {errors.owner_org && (
                    <p className="mt-1 text-sm text-red-400">{errors.owner_org.message}</p>
                  )}
                </div>

                {/* Private */}
                <div className="flex items-center">
                  <input
                    id="private"
                    type="checkbox"
                    {...register('private')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label htmlFor="private" className="ml-2 block text-sm">
                    Private (only visible to organization members)
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Dataset'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-600 rounded-md hover:bg-gray-700"
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
