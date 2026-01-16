'use client';

import React, { useState, useEffect } from 'react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';

// Import chart components
const GenericBarChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.GenericBarChart })), { ssr: false });
const GenericLineChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.GenericLineChart })), { ssr: false });
const GenericPie = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.GenericPie })), { ssr: false });
const GenericAreaChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.GenericAreaChart })), { ssr: false });
const MultiLineChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.MultiLineChart })), { ssr: false });
const StackedBarChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.StackedBarChart })), { ssr: false });
const ComboChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.ComboChart })), { ssr: false });
const ScatterPlot = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.ScatterPlot })), { ssr: false });
const RadarChartComponent = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.RadarChartComponent })), { ssr: false });
const HorizontalBarChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.HorizontalBarChart })), { ssr: false });
const FunnelChartComponent = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.FunnelChartComponent })), { ssr: false });
const TreemapChart = dynamic(() => import('@/components/charts').then(mod => ({ default: mod.TreemapChart })), { ssr: false });

// Live DataFetchChart that fetches and renders data
function LiveDataFetchChart({ dataUrl, chartType, xKey, yKey, title, series, lines, bars, colors, nameKey, valueKey, sizeKey, categories }: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data);
            setLoading(false);
          },
          error: (err: Error) => {
            setError(err.message);
            setLoading(false);
          }
        });
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (dataUrl) {
      fetchData();
    }
  }, [dataUrl]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 my-6 flex items-center justify-center border border-gray-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Loading chart data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 my-6">
        <h4 className="text-red-200 font-medium mb-1">Error loading chart</h4>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 my-6">
        <p className="text-yellow-200">No data available</p>
      </div>
    );
  }

  // Render the chart
  return (
    <div className="my-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
      {title && <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>}
      
      {chartType === 'bar' && (
        <GenericBarChart
          data={data}
          xKey={xKey}
          series={series || [{ key: yKey, name: yKey || 'Value', color: '#3B82F6' }]}
        />
      )}
      
      {chartType === 'line' && (
        <GenericLineChart
          data={data}
          xKey={xKey}
          yKey={yKey}
          name={yKey || 'Value'}
          color="#10B981"
        />
      )}
      
      {chartType === 'pie' && (
        <GenericPie
          data={data}
          nameKey={nameKey || xKey}
          valueKey={valueKey || yKey}
          colors={colors || ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]}
        />
      )}
      
      {chartType === 'area' && (
        <GenericAreaChart
          data={data}
          xKey={xKey}
          series={series || [{ key: yKey, name: yKey || 'Value', color: '#3B82F6' }]}
        />
      )}

      {chartType === 'multi-line' && (
        <MultiLineChart
          data={data}
          xKey={xKey}
          lines={lines || []}
        />
      )}

      {chartType === 'stacked-bar' && (
        <StackedBarChart
          data={data}
          xKey={xKey}
          series={series || []}
        />
      )}

      {chartType === 'combo' && (
        <ComboChart
          data={data}
          xKey={xKey}
          bars={bars || []}
          lines={lines || []}
        />
      )}

      {chartType === 'scatter' && (
        <ScatterPlot
          data={data}
          xKey={xKey}
          yKey={yKey}
          name={yKey || 'Data'}
          color="#9C27B0"
        />
      )}

      {chartType === 'radar' && (
        <RadarChartComponent
          data={data}
          categories={categories}
          series={series || []}
        />
      )}

      {chartType === 'horizontal-bar' && (
        <HorizontalBarChart
          data={data}
          yKey={xKey}
          series={series || [{ key: yKey, name: yKey || 'Value', color: '#4CAF50' }]}
        />
      )}

      {chartType === 'funnel' && (
        <FunnelChartComponent
          data={data}
          nameKey={nameKey || xKey}
          valueKey={valueKey || yKey}
        />
      )}

      {chartType === 'treemap' && (
        <TreemapChart
          data={data}
          nameKey={nameKey || xKey}
          sizeKey={sizeKey || yKey}
          colors={colors || ["#8889DD", "#9597E4", "#8DC77B", "#A5D297", "#E8C3B9", "#C45850"]}
        />
      )}
    </div>
  );
}

interface LiveMDXPreviewProps {
  content: string;
}

export function LiveMDXPreview({ content }: LiveMDXPreviewProps) {
  const [MdxContent, setMdxContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    compileMDX();
  }, [content]);

  const compileMDX = async () => {
    setIsCompiling(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const { default: MDXContent } = await evaluate(content, {
        ...runtime,
        development: false,
      });
      
      const WrappedContent = () => (
        <MDXContent 
          components={{
            GenericBarChart,
            GenericLineChart,
            GenericPie,
            GenericAreaChart,
            MultiLineChart,
            StackedBarChart,
            ComboChart,
            ScatterPlot,
            RadarChartComponent,
            HorizontalBarChart,
            FunnelChartComponent,
            TreemapChart,
            DataFetchChart: LiveDataFetchChart,
            h1: (props: any) => <h1 className="text-4xl font-bold mb-4 mt-6 text-white" {...props} />,
            h2: (props: any) => <h2 className="text-3xl font-bold mb-3 mt-5 text-white" {...props} />,
            h3: (props: any) => <h3 className="text-2xl font-bold mb-2 mt-4 text-white" {...props} />,
            h4: (props: any) => <h4 className="text-xl font-bold mb-2 mt-3 text-white" {...props} />,
            p: (props: any) => <p className="mb-4 text-gray-300 leading-relaxed" {...props} />,
            ul: (props: any) => <ul className="list-disc ml-6 mb-4 text-gray-300" {...props} />,
            ol: (props: any) => <ol className="list-decimal ml-6 mb-4 text-gray-300" {...props} />,
            li: (props: any) => <li className="mb-1" {...props} />,
            a: (props: any) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
            strong: (props: any) => <strong className="font-bold text-white" {...props} />,
            em: (props: any) => <em className="italic" {...props} />,
            code: (props: any) => {
              const { inline } = props;
              if (inline) {
                return <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-100" {...props} />;
              }
              return <code className="text-sm font-mono text-gray-100" {...props} />;
            },
            pre: (props: any) => (
              <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700" {...props} />
            ),
            blockquote: (props: any) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-400" {...props} />
            ),
            hr: (props: any) => <hr className="my-6 border-gray-600" {...props} />,
          }}
        />
      );
      
      setMdxContent(() => WrappedContent);
    } catch (err: any) {
      console.error('MDX compilation error:', err);
      setError(err.message || 'Failed to compile MDX');
      setMdxContent(null);
    } finally {
      setIsCompiling(false);
    }
  };

  if (isCompiling) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Rendering preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
        <h3 className="text-red-200 font-medium mb-2">Preview Error</h3>
        <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono">{error}</pre>
      </div>
    );
  }

  if (!MdxContent) {
    return (
      <div className="text-gray-400 text-center py-12">
        <p>Write content to see preview</p>
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none">
      <MdxContent />
    </div>
  );
}
