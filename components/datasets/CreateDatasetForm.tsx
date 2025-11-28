'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast, { Toaster } from 'react-hot-toast';
import { createDataset, createResource, uploadFileToCKAN, titleToSlug } from '@/lib/ckan-api';

// Validation schema
const datasetSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  name: z.string().min(3, 'Name must be at least 3 characters').regex(/^[a-z0-9-_]+$/, 'Name can only contain lowercase letters, numbers, hyphens, and underscores'),
  author: z.string().optional(),
  author_email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  owner_org: z.string().min(1, 'Organization is required'),
  private: z.boolean().default(false),
  
  // Resources
  files: z.array(z.instanceof(File)).optional(),
  urls: z.array(z.object({
    url: z.string().url('Invalid URL'),
    name: z.string().min(1, 'Resource name required'),
    description: z.string().optional(),
  })).optional(),
});

type DatasetFormData = z.infer<typeof datasetSchema>;

export default function CreateDatasetForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<DatasetFormData>({
    resolver: zodResolver(datasetSchema),
    defaultValues: {
      private: false,
      urls: [],
    },
  });

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/ckan/organization_list?all_fields=true');
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.result);
        // Set first org as default if available
        if (data.result.length > 0) {
          setValue('owner_org', data.result[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  // Dynamic URL fields
  const { fields: urlFields, append: appendUrl, remove: removeUrl } = useFieldArray({
    control,
    name: 'urls',
  });

  const title = watch('title');

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);
    setValue('name', titleToSlug(newTitle));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: DatasetFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Prepare dataset data
      const datasetPayload = {
        name: data.name,
        title: data.title,
        author: data.author,
        author_email: data.author_email,
        notes: data.notes,
        private: data.private,
        owner_org: data.owner_org,
        tags: data.tags
          ? data.tags.split(',').map(tag => ({ name: tag.trim() }))
          : [],
      };

      // 2. Create dataset
      const datasetResponse = await createDataset(datasetPayload);

      if (!datasetResponse.success) {
        const errorMsg = datasetResponse.error?.message || 'Failed to create dataset';
        
        // Handle specific errors
        if (errorMsg.includes('That URL is already in use')) {
          throw new Error('This dataset name is already in use. Please choose another name.');
        }
        throw new Error(errorMsg);
      }

      const datasetId = datasetResponse.result.id;

      // 3. Upload files and create file resources
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            // Upload file directly to CKAN (creates resource automatically)
            const fileUrl = await uploadFileToCKAN(file,datasetId);
          } catch (err) {
            console.error('Failed to upload file:', file.name, err);
            // Continue with other files
          }
        }
      }

      // 4. Create URL resources
      if (data.urls && data.urls.length > 0) {
        for (const urlResource of data.urls) {
          if (urlResource.url && urlResource.name) {
            try {
              await createResource({
                package_id: datasetId,
                url: urlResource.url,
                name: urlResource.name,
                description: urlResource.description,
                format: 'URL',
              });
            } catch (err) {
              console.error('Failed to add URL resource:', urlResource.url, err);
            }
          }
        }
      }

      // 5. Success - show toast and redirect
      toast.success('Dataset created successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Basic Information</h2>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              onChange={handleTitleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Dataset Title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Name (slug) */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              URL Name (slug) <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="my-dataset-name"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be used in the URL. Auto-generated from title.
            </p>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="author@example.com"
              />
              {errors.author_email && (
                <p className="mt-1 text-sm text-red-600">{errors.author_email.message}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="economy, health, education (comma-separated)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Organization Dropdown */}
          <div>
            <label htmlFor="owner_org" className="block text-sm font-medium mb-2">
              Organization <span className="text-red-500">*</span>
            </label>
            <select
              id="owner_org"
              {...register('owner_org')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {organizations.length === 0 ? (
                <option value="">Loading organizations...</option>
              ) : (
                organizations.map((org) => (
                  <option key={org.id} value={org.name} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {org.title || org.name}
                  </option>
                ))
              )}
            </select>
            {errors.owner_org && (
              <p className="mt-1 text-sm text-red-600">{errors.owner_org.message}</p>
            )}
          </div>

          {/* Private */}
          <div className="flex items-center">
            <input
              id="private"
              type="checkbox"
              {...register('private')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="private" className="ml-2 block text-sm">
              Private (only visible to organization members)
            </label>
          </div>
        </div>

        {/* Resources Section */}
        <div className="space-y-6 border-t pt-8">
          <h2 className="text-xl font-semibold">Resources</h2>

          {/* File Upload */}
          <div>
            <label htmlFor="files" className="block text-sm font-medium mb-2">
              Upload Files
            </label>
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: CSV, Excel, JSON, GeoJSON, etc.
            </p>
            {uploadedFiles.length > 0 && (
              <ul className="mt-2 text-sm text-gray-600">
                {uploadedFiles.map((file, idx) => (
                  <li key={idx}>• {file.name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* URL Resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                External URLs
              </label>
              <button
                type="button"
                onClick={() => appendUrl({ url: '', name: '', description: '' })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add URL
              </button>
            </div>

            {urlFields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 mb-3 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium">URL Resource #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeUrl(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    {...register(`urls.${index}.url`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="https://example.com/data.csv"
                  />
                  {errors.urls?.[index]?.url && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.urls[index]?.url?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register(`urls.${index}.name`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Resource name"
                  />
                  {errors.urls?.[index]?.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.urls[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    {...register(`urls.${index}.description`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Optional description"
                  />
                </div>
              </div>
            ))}

            {urlFields.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No external URLs added yet
              </p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 border-t pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Dataset'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}



