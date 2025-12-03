'use client';

import { useState, useEffect } from 'react';
import { X, Database, FileText, BarChart3, Table } from 'lucide-react';
import Papa from 'papaparse';
import ChartBuilder from './ChartBuilder';

interface DataChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertChart: (chartCode: string) => void;
}

type Step = 'datasets' | 'resources' | 'preview' | 'builder';

interface Dataset {
  id: string;
  name: string;
  title: string;
  notes?: string;
  num_resources: number;
}

interface Resource {
  id: string;
  name: string;
  format: string;
  url: string;
  size?: number;
}

interface CSVData {
  columns: string[];
  rows: any[];
  sampleData: any[];
}

export default function DataChartModal({ isOpen, onClose, onInsertChart }: DataChartModalProps) {
  const [step, setStep] = useState<Step>('datasets');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch datasets from CKAN
  useEffect(() => {
    if (isOpen && step === 'datasets') {
      fetchDatasets();
    }
  }, [isOpen, step]);

  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CKAN_URL}/api/3/action/package_list`);
      const data = await response.json();
      
      if (data.success) {
        // Fetch details for each dataset
        const datasetPromises = data.result.map(async (name: string) => {
          const detailResponse = await fetch(`${process.env.NEXT_PUBLIC_CKAN_URL}/api/3/action/package_show?id=${name}`);
          const detailData = await detailResponse.json();
          return detailData.result;
        });
        
        const datasetsData = await Promise.all(datasetPromises);
        setDatasets(datasetsData);
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
      setError('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCSVData = async (resource: Resource) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the CSV file
      const response = await fetch(resource.url);
      const csvText = await response.text();
      
      // Parse CSV
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const columns = results.meta.fields || [];
          const rows = results.data;
          const sampleData = rows.slice(0, 10); // First 10 rows for preview
          
          setCsvData({
            columns,
            rows,
            sampleData
          });
          
          setLoading(false);
        },
        error: (err: Error) => {
          console.error('CSV parsing error:', err);
          setError('Failed to parse CSV file');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Failed to fetch CSV:', err);
      setError('Failed to load CSV data');
      setLoading(false);
    }
  };

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    
    // Filter CSV resources only
    const csvResources = (dataset as any).resources?.filter(
      (r: Resource) => r.format?.toLowerCase() === 'csv'
    ) || [];
    
    setResources(csvResources);
    setStep('resources');
  };

  const handleSelectResource = async (resource: Resource) => {
    setSelectedResource(resource);
    setStep('preview');
    await fetchCSVData(resource);
  };

  const handleBack = () => {
    if (step === 'resources') {
      setStep('datasets');
      setSelectedDataset(null);
    } else if (step === 'preview') {
      setStep('resources');
      setSelectedResource(null);
    } else if (step === 'builder') {
      setStep('preview');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Insert Data Chart</h2>
            <p className="text-sm text-gray-400 mt-1">
              {step === 'datasets' && 'Select a dataset'}
              {step === 'resources' && 'Choose a CSV resource'}
              {step === 'preview' && 'Preview data and select columns'}
              {step === 'builder' && 'Configure your chart'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Datasets List */}
          {step === 'datasets' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-400">Loading datasets...</span>
                </div>
              ) : error ? (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <p className="text-red-200">{error}</p>
                </div>
              ) : datasets.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No datasets found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {datasets.map((dataset) => (
                    <button
                      key={dataset.id}
                      onClick={() => handleSelectDataset(dataset)}
                      className="text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">{dataset.title || dataset.name}</h3>
                          {dataset.notes && (
                            <p className="text-sm text-gray-400 line-clamp-2">{dataset.notes}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {dataset.num_resources} resource{dataset.num_resources !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Database className="w-5 h-5 text-blue-400 ml-3 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Resources List */}
          {step === 'resources' && (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-gray-400 hover:text-white text-sm flex items-center gap-2"
              >
                ← Back to datasets
              </button>

              {resources.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No CSV resources found in this dataset</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {resources.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => handleSelectResource(resource)}
                      className="text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">{resource.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                            <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded">
                              {resource.format}
                            </span>
                            {resource.size && (
                              <span>{(resource.size / 1024).toFixed(2)} KB</span>
                            )}
                          </div>
                        </div>
                        <FileText className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Data Preview */}
          {step === 'preview' && (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-gray-400 hover:text-white text-sm flex items-center gap-2"
              >
                ← Back to resources
              </button>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-400">Loading CSV data...</span>
                </div>
              ) : error ? (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <p className="text-red-200">{error}</p>
                </div>
              ) : csvData ? (
                <div className="space-y-6">
                  {/* Columns List */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      Available Columns ({csvData.columns.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {csvData.columns.map((column, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm border border-blue-800"
                        >
                          {column}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Data Preview Table */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      Data Preview (First {csvData.sampleData.length} rows)
                    </h3>
                    <div className="overflow-x-auto border border-gray-700 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                          <tr>
                            {csvData.columns.map((column, idx) => (
                              <th
                                key={idx}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {csvData.sampleData.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-gray-750">
                              {csvData.columns.map((column, colIdx) => (
                                <td
                                  key={colIdx}
                                  className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap"
                                >
                                  {row[column]?.toString() || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400">
                      Total rows: <span className="text-white font-medium">{csvData.rows.length}</span>
                      {' • '}
                      Columns: <span className="text-white font-medium">{csvData.columns.length}</span>
                    </p>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setStep('builder')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Continue to Chart Builder
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Step 4: Chart Builder */}
          {step === 'builder' && csvData && selectedResource && (
            <ChartBuilder
              csvData={csvData}
              resourceUrl={selectedResource.url}
              onBack={handleBack}
              onGenerate={(chartCode) => onInsertChart(chartCode)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedDataset && <span>Dataset: {selectedDataset.title}</span>}
            {selectedResource && <span className="ml-4">• Resource: {selectedResource.name}</span>}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}