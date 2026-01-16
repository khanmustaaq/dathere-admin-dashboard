'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Code } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import DataChartModal from '@/components/modals/DataChartModal';

// Import all chart components for preview
import dynamic from 'next/dynamic';

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

interface ChartTemplate {
  name: string;
  code: string;
  description: string;
}

const chartTemplates: ChartTemplate[] = [
  {
    name: 'Bar Chart',
    description: 'Compare categories side by side',
    code: `
<GenericBarChart
  data={[
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 500 }
  ]}
  xKey="name"
  series={[{ key: 'value', name: 'Sales', color: '#0288D1' }]}
/>
`
  },
  {
    name: 'Line Chart',
    description: 'Show trends over time',
    code: `
<GenericLineChart
  data={[
    { month: 'Jan', sales: 400 },
    { month: 'Feb', sales: 300 },
    { month: 'Mar', sales: 500 }
  ]}
  xKey="month"
  yKey="sales"
  name="Revenue"
  color="#0288D1"
/>
`
  },
  {
    name: 'Pie Chart',
    description: 'Show proportions and percentages',
    code: `
<GenericPie
  data={[
    { name: 'Category A', value: 400 },
    { name: 'Category B', value: 300 },
    { name: 'Category C', value: 200 }
  ]}
  nameKey="name"
  valueKey="value"
  colors={["#4CAF50", "#2196F3", "#FF9800"]}
/>
`
  },
  {
    name: 'Area Chart',
    description: 'Filled line chart for trends',
    code: `
<GenericAreaChart
  data={[
    { month: 'Jan', value: 400 },
    { month: 'Feb', value: 300 },
    { month: 'Mar', value: 500 }
  ]}
  xKey="month"
  series={[{ key: 'value', name: 'Growth', color: '#4CAF50' }]}
/>
`
  },
  {
    name: 'Multi-Line Chart',
    description: 'Compare multiple trends',
    code: `
<MultiLineChart
  data={[
    { month: 'Jan', sales: 400, costs: 240 },
    { month: 'Feb', sales: 300, costs: 220 },
    { month: 'Mar', sales: 500, costs: 280 }
  ]}
  xKey="month"
  lines={[
    { key: 'sales', name: 'Sales', color: '#4CAF50' },
    { key: 'costs', name: 'Costs', color: '#FF5722' }
  ]}
/>
`
  },
  {
    name: 'Stacked Bar Chart',
    description: 'Show composition over categories',
    code: `
<StackedBarChart
  data={[
    { category: 'Q1', product_a: 400, product_b: 240 },
    { category: 'Q2', product_a: 300, product_b: 220 },
    { category: 'Q3', product_a: 500, product_b: 280 }
  ]}
  xKey="category"
  series={[
    { key: 'product_a', name: 'Product A', color: '#0288D1' },
    { key: 'product_b', name: 'Product B', color: '#FF9800' }
  ]}
/>
`
  },
  {
    name: 'Combo Chart',
    description: 'Combine bars and lines',
    code: `
<ComboChart
  data={[
    { month: 'Jan', revenue: 400, growth: 20 },
    { month: 'Feb', revenue: 300, growth: 15 },
    { month: 'Mar', revenue: 500, growth: 25 }
  ]}
  xKey="month"
  bars={[{ key: 'revenue', name: 'Revenue', color: '#0288D1' }]}
  lines={[{ key: 'growth', name: 'Growth %', color: '#FF5722' }]}
/>
`
  },
  {
    name: 'Scatter Plot',
    description: 'Show correlation between variables',
    code: `
<ScatterPlot
  data={[
    { x: 100, y: 200 },
    { x: 120, y: 180 },
    { x: 170, y: 240 }
  ]}
  xKey="x"
  yKey="y"
  name="Data Points"
  color="#9C27B0"
/>
`
  },
  {
    name: 'Radar Chart',
    description: 'Compare multiple variables',
    code: `
<RadarChartComponent
  data={[
    { metric: 'Speed', value: 120, benchmark: 110 },
    { metric: 'Quality', value: 98, benchmark: 95 },
    { metric: 'Cost', value: 86, benchmark: 90 }
  ]}
  categories="metric"
  series={[
    { key: 'value', name: 'Actual', color: '#0288D1' },
    { key: 'benchmark', name: 'Benchmark', color: '#FF9800' }
  ]}
/>
`
  },
  {
    name: 'Horizontal Bar',
    description: 'Bars displayed horizontally',
    code: `
<HorizontalBarChart
  data={[
    { name: 'Product A', sales: 400 },
    { name: 'Product B', sales: 300 },
    { name: 'Product C', sales: 500 }
  ]}
  yKey="name"
  series={[{ key: 'sales', name: 'Sales', color: '#4CAF50' }]}
/>
`
  },
  {
    name: 'Funnel Chart',
    description: 'Show conversion stages',
    code: `
<FunnelChartComponent
  data={[
    { stage: 'Visits', value: 1000 },
    { stage: 'Signups', value: 500 },
    { stage: 'Purchases', value: 200 }
  ]}
  nameKey="stage"
  valueKey="value"
/>
`
  },
  {
    name: 'Treemap',
    description: 'Show hierarchical data',
    code: `
<TreemapChart
  data={[
    { name: 'Category A', size: 400 },
    { name: 'Category B', size: 300 },
    { name: 'Category C', size: 200 }
  ]}
  nameKey="name"
  sizeKey="size"
  colors={["#8889DD", "#9597E4", "#8DC77B"]}
/>
`
  }
];

export default function EditStory() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  
  // MDX preview state
  const [MdxContent, setMdxContent] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Data chart modal state
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Ref for the content textarea
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchStory();
  }, [slug]);

  // Compile MDX when switching to preview tab
  useEffect(() => {
    if (activeTab === 'preview') {
      compileMDX();
    }
  }, [activeTab, content]);

  const fetchStory = async () => {
    try {
      const response = await fetch(`/api/stories/get?slug=${slug}`);
      const data = await response.json();

      if (data.success) {
        const { metadata, content: storyContent } = data.result;
        setTitle(metadata.title || '');
        setAuthor(metadata.author || '');
        setDescription(metadata.description || '');
        setDate(metadata.date || '');
        setTags(Array.isArray(metadata.tags) ? metadata.tags.join(', ') : '');
        setContent(storyContent || '');
      } else {
        setError(data.error || 'Story not found');
      }
    } catch (err) {
      setError('Failed to load story');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const compileMDX = async () => {
    setIsCompiling(true);
    setPreviewError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
            DataFetchChart: ({ dataUrl, chartType, xKey, yKey }: any) => (
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-6 my-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="text-blue-200 font-medium">Data Chart (Live on Portal)</h4>
                </div>
                <p className="text-sm text-blue-300 mb-2">
                  <strong>Type:</strong> {chartType} • <strong>X:</strong> {xKey} • <strong>Y:</strong> {yKey}
                </p>
                <p className="text-xs text-blue-400">
                  ℹ️ This chart will fetch and render data when published on the portal
                </p>
              </div>
            ),
            h1: (props: any) => <h1 className="text-4xl font-bold mb-4 mt-6 text-gray-900 dark:text-white" {...props} />,
            h2: (props: any) => <h2 className="text-3xl font-bold mb-3 mt-5 text-gray-900 dark:text-white" {...props} />,
            h3: (props: any) => <h3 className="text-2xl font-bold mb-2 mt-4 text-gray-900 dark:text-white" {...props} />,
            h4: (props: any) => <h4 className="text-xl font-bold mb-2 mt-3 text-gray-900 dark:text-white" {...props} />,
            h5: (props: any) => <h5 className="text-lg font-bold mb-1 mt-2 text-gray-900 dark:text-white" {...props} />,
            h6: (props: any) => <h6 className="text-base font-bold mb-1 mt-2 text-gray-900 dark:text-white" {...props} />,
            p: (props: any) => <p className="mb-4 text-gray-800 dark:text-gray-200" {...props} />,
            ul: (props: any) => <ul className="list-disc ml-6 mb-4" {...props} />,
            ol: (props: any) => <ol className="list-decimal ml-6 mb-4" {...props} />,
            li: (props: any) => <li className="mb-1" {...props} />,
            a: (props: any) => <a className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline" {...props} />,
            img: (props: any) => <img className="max-w-full h-auto rounded-lg my-4" loading="lazy" {...props} />,
            strong: (props: any) => <strong className="font-bold" {...props} />,
            em: (props: any) => <em className="italic" {...props} />,
            blockquote: (props: any) => <blockquote className="border-l-4 border-gray-400 dark:border-gray-500 pl-4 italic my-4" {...props} />,
            pre: (props: any) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-300 dark:border-gray-700" {...props} />,
            code: (props: any) => {
              const { inline } = props;
              if (inline) {
                return <code className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100" {...props} />;
              }
              return <code className="text-sm font-mono text-gray-900 dark:text-gray-100" {...props} />;
            },
            hr: (props: any) => <hr className="my-6 border-gray-300 dark:border-gray-600" {...props} />,
            table: (props: any) => <table className="min-w-full border-collapse mb-4" {...props} />,
            thead: (props: any) => <thead className="bg-gray-100 dark:bg-gray-700" {...props} />,
            tbody: (props: any) => <tbody className="bg-white dark:bg-gray-800" {...props} />,
            tr: (props: any) => <tr className="border-b border-gray-300 dark:border-gray-600" {...props} />,
            th: (props: any) => <th className="px-4 py-2 text-left font-bold" {...props} />,
            td: (props: any) => <td className="px-4 py-2" {...props} />,
          }}
        />
      );
      
      setMdxContent(() => WrappedContent);
    } catch (err: any) {
      console.error('MDX compilation error:', err);
      setPreviewError(err.message || 'Failed to compile MDX');
      setMdxContent(null);
    } finally {
      setIsCompiling(false);
    }
  };

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const insertText = before + selectedText + after;

    textarea.focus();

    if (document.queryCommandSupported('insertText')) {
      if (start !== end) {
        textarea.setSelectionRange(start, end);
        document.execCommand('delete', false);
      }
      document.execCommand('insertText', false, insertText);
    } else {
      const newText = content.substring(0, start) + insertText + content.substring(end);
      setContent(newText);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + insertText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleInsertDataChart = (chartCode: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const insertText = '\n\n' + chartCode + '\n\n';

    textarea.focus();

    if (document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, insertText);
    } else {
      const newText = content.substring(0, start) + insertText + content.substring(start);
      setContent(newText);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + insertText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    setIsDataModalOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = contentTextareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];

      const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (numberedMatch) {
        e.preventDefault();
        const indent = numberedMatch[1];
        const currentNum = parseInt(numberedMatch[2]);
        const nextNum = currentNum + 1;
        const newText = content.substring(0, cursorPos) + `\n${indent}${nextNum}. ` + content.substring(cursorPos);
        setContent(newText);
        
        setTimeout(() => {
          const newPos = cursorPos + indent.length + nextNum.toString().length + 4;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }

      const bulletMatch = currentLine.match(/^(\s*)([-*])\s/);
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const bullet = bulletMatch[2];
        const newText = content.substring(0, cursorPos) + `\n${indent}${bullet} ` + content.substring(cursorPos);
        setContent(newText);
        
        setTimeout(() => {
          const newPos = cursorPos + indent.length + 4;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }
    }
  };

  const insertTemplate = (template: ChartTemplate) => {
    setContent(content + '\n\n' + template.code.trim() + '\n\n');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!author.trim()) {
      setError('Author is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/stories/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          metadata: {
            title,
            author,
            description,
            date: date || new Date().toISOString().split('T')[0],
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
          },
          content
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update story');
        return;
      }

      alert('Story updated successfully!');
      router.push('/stories');
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1729]">
        <Sidebar />
        <div className="lg:pl-72 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1729]">
        <Sidebar />
        <div className="lg:pl-72">
          <main className="py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <Link
                  href="/stories"
                  className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Back to Stories
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1729]">
      <Sidebar />
      
      <div className="lg:pl-72">
        <main className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Edit Story</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Update your data story content and visualizations
                </p>
              </div>
              <Link
                href="/stories"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Stories
              </Link>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Story Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Story Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                        Author *
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                        Date
                      </label>
                      <input
                        type="text"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        placeholder="03 Nov 2025"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="data, analysis, visualization"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Story Content with Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
                    <div className="flex gap-2 mb-0">
                      <button
                        onClick={() => setActiveTab('write')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                          activeTab === 'write'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        Write
                      </button>
                      <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                          activeTab === 'preview'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {activeTab === 'write' ? (
                      <>
                        {/* Formatting Toolbar */}
                        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                          <button
                            onClick={() => insertMarkdown('**', '**', 'bold text')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm font-bold"
                            title="Bold"
                            type="button"
                          >
                            B
                          </button>
                          <button
                            onClick={() => insertMarkdown('*', '*', 'italic text')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm italic"
                            title="Italic"
                            type="button"
                          >
                            I
                          </button>
                          <button
                            onClick={() => insertMarkdown('# ', '', 'Heading')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Heading 1"
                            type="button"
                          >
                            H1
                          </button>
                          <button
                            onClick={() => insertMarkdown('## ', '', 'Heading')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Heading 2"
                            type="button"
                          >
                            H2
                          </button>
                          <button
                            onClick={() => insertMarkdown('### ', '', 'Heading')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Heading 3"
                            type="button"
                          >
                            H3
                          </button>
                          <div className="w-px h-6 bg-gray-400 dark:bg-gray-600"></div>
                          <button
                            onClick={() => insertMarkdown('\n- ', '', 'List item')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Bullet List"
                            type="button"
                          >
                            • List
                          </button>
                          <button
                            onClick={() => insertMarkdown('\n1. ', '', 'Numbered item')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Numbered List"
                            type="button"
                          >
                            1. List
                          </button>
                          <div className="w-px h-6 bg-gray-400 dark:bg-gray-600"></div>
                          <button
                            onClick={() => insertMarkdown('[', '](url)', 'link text')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Link"
                            type="button"
                          >
                            🔗 Link
                          </button>
                          <button
                            onClick={() => insertMarkdown('![', '](image-url)', 'alt text')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Insert Image"
                            type="button"
                          >
                            🖼️ Image
                          </button>
                          <div className="w-px h-6 bg-gray-400 dark:bg-gray-600"></div>
                          <button
                            onClick={() => insertMarkdown('`', '`', 'code')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm font-mono"
                            title="Inline Code"
                            type="button"
                          >
                            {'</>'}
                          </button>
                          <button
                            onClick={() => insertMarkdown('\n```\n', '\n```\n', 'code block')}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded text-sm"
                            title="Code Block"
                            type="button"
                          >
                            Code Block
                          </button>
                          <div className="w-px h-6 bg-gray-400 dark:bg-gray-600"></div>
                          <button
                            onClick={() => setIsDataModalOpen(true)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
                            title="Insert Data Chart"
                            type="button"
                          >
                            📊 Insert Data Chart
                          </button>
                        </div>

                        <textarea
                          ref={contentTextareaRef}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={20}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono text-sm"
                          placeholder="Write your story content using Markdown..."
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Use the toolbar above or Markdown syntax directly. Select text and click a button to format it.
                        </p>
                      </>
                    ) : (
                      <div className="prose dark:prose-invert max-w-none min-h-[500px] p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        {isCompiling ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-400">Compiling preview...</span>
                          </div>
                        ) : previewError ? (
                          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4">
                            <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Preview Error</h3>
                            <pre className="text-red-700 dark:text-red-300 text-sm whitespace-pre-wrap">{previewError}</pre>
                          </div>
                        ) : MdxContent ? (
                          <div className="mdx-preview">
                            <MdxContent />
                          </div>
                        ) : (
                          <div className="text-gray-600 dark:text-gray-400 text-center py-12">
                            Switch to preview to see your content rendered
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <Link
                    href="/stories"
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
                  <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">📊 Insert Chart</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Click to insert chart templates
                  </p>
                  
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {chartTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertTemplate(template)}
                        className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium mb-1 text-gray-900 dark:text-white">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {template.description}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-2">
                      💡 Markdown Tips
                    </h3>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• # Heading 1</li>
                      <li>• ## Heading 2</li>
                      <li>• **bold text**</li>
                      <li>• *italic text*</li>
                      <li>• - List item</li>
                      <li>• [link](url)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Data Chart Modal */}
      <DataChartModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onInsertChart={handleInsertDataChart}
      />
    </div>
  );
}     