// lib/ckan-client.ts
export class CKANClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey?: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey || '';
  }

  async request(action: string, data?: any, method: 'GET' | 'POST' = 'POST') {
    const url = `${this.apiUrl}/api/3/action/${action}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': this.apiKey }),
      },
    };

    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error?.message || 'CKAN request failed');
    }

    return json.result;
  }

  // Dataset operations
  async listDatasets() {
    return this.request('package_list', null, 'GET');
  }

  async getDataset(id: string) {
    return this.request('package_show', { id }, 'GET');
  }

  async createDataset(data: any) {
    return this.request('package_create', data);
  }

  async updateDataset(data: any) {
    return this.request('package_update', data);
  }

  async deleteDataset(id: string) {
    return this.request('package_delete', { id });
  }

  // Organization operations
  async listOrganizations() {
    return this.request('organization_list', null, 'GET');
  }
}

// Export singleton instance
export const ckanClient = new CKANClient(
  process.env.NEXT_PUBLIC_CKAN_URL || 'http://localhost:5050',
  process.env.CKAN_API_KEY
);
