// lib/ckan-api.ts
// CKAN API helper functions

const CKAN_API_URL = '/api/ckan';

export interface CKANResponse<T> {
  success: boolean;
  result: T;
  error?: {
    message: string;
    __type: string;
  };
}

export interface Dataset {
  name: string;
  title: string;
  author?: string;
  author_email?: string;
  notes?: string;
  tags?: Array<{ name: string }>;
  groups?: Array<{ name: string }>;
  owner_org?: string;
  private?: boolean;
  extras?: Array<{ key: string; value: string }>;
}

export interface Resource {
  package_id: string;
  url: string;
  name: string;
  description?: string;
  format?: string;
}

export interface CreatedDataset extends Dataset {
  id: string;
  resources: any[];
  state: string;
}

/**
 * Create a new dataset in CKAN
 */
export async function createDataset(dataset: Dataset): Promise<CKANResponse<CreatedDataset>> {
  const response = await fetch(`${CKAN_API_URL}/package_create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataset),
  });

  return response.json();
}

/**
 * Add a resource to an existing dataset
 */
export async function createResource(resource: Resource): Promise<CKANResponse<any>> {
  const response = await fetch(`${CKAN_API_URL}/resource_create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resource),
  });

  return response.json();
}

/**
 * Upload a file and return its URL
 * This will need to be implemented based on your storage solution (R2, S3, local, etc.)
 */
export async function uploadFile(file: File): Promise<string> {
  // TODO: Implement file upload to your storage
  // For now, returning a placeholder
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Get list of organizations
 */
export async function getOrganizations(): Promise<CKANResponse<any[]>> {
  const response = await fetch(`${CKAN_API_URL}/organization_list?all_fields=true`);
  return response.json();
}

/**
 * Get list of groups
 */
export async function getGroups(): Promise<CKANResponse<any[]>> {
  const response = await fetch(`${CKAN_API_URL}/group_list?all_fields=true`);
  return response.json();
}

/**
 * Check if dataset name is available
 */
export async function checkDatasetNameAvailable(name: string): Promise<boolean> {
  try {
    const response = await fetch(`${CKAN_API_URL}/package_show?id=${name}`);
    const data = await response.json();
    // If we get a result, the name is taken
    return !data.success;
  } catch {
    // If it errors, the name is available
    return true;
  }
}

/**
 * Convert title to slug-safe name
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
