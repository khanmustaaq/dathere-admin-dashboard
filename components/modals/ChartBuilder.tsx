'use client';

import { useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface ChartBuilderProps {
  csvData: {
    columns: string[];
    rows: any[];
    sampleData: any[];
  };
  resourceUrl: string;
  onBack: () => void;
  onGenerate: (chartCode: string) => void;
}

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'multiline' | 'scatter';

const chartTypes = [
  { id: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { id: 'line', name: 'Line Chart', icon: LineChartIcon, description: 'Show trends over time' },
  { id: 'pie', name: 'Pie Chart', icon: PieChartIcon, description: 'Show proportions' },
  { id: 'area', name: 'Area Chart', icon: TrendingUp, description: 'Filled line chart' },
  { id: 'multiline', name: 'Multi-Line', icon: LineChartIcon, description: 'Compare multiple trends' },
  { id: 'scatter', name: 'Scatter Plot', icon: BarChart3, description: 'Show correlations' },
];

export default function ChartBuilder({ csvData, resourceUrl, onBack, onGenerate }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [yAxisMulti, setYAxisMulti] = useState<string[]>([]);

  const generateChartCode = () => {
    let code = '';

    switch (chartType) {
      case 'bar':
        code = `<DataFetchChart
  dataUrl="${resourceUrl}"
  chartType="bar"
  xKey="${xAxis}"
  yKey="${yAxis}"
  color="#0288D1"
/>`;
        break;

      case 'line':
        code = `<DataFetchChart
  dataUrl="${resourceUrl}"
  chartType="line"
  xKey="${xAxis}"
  yKey="${yAxis}"
  name="${yAxis}"
  color="#0288D1"
/>`;
        break;

      case 'pie':
        code = `<DataFetchChart
  dataUrl="${resourceUrl}"
  chartType="pie"
  xKey="${xAxis}"
  yKey="${yAxis}"
  colors={["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"]}
/>`;
        break;

      case 'area':
        code = `<DataFetchChart
  dataUrl="${resourceUrl}"
  chartType="area"
  xKey="${xAxis}"
  yKey="${yAxis}"
  color="#4CAF50"
/>`;
        break;

      case 'multiline':
        const lines = yAxisMulti.length > 0 ? yAxisMulti : [yAxis];
        const linesSeries = lines.map((col, idx) => {
          const colors = ['#4CAF50', '#FF5722', '#2196F3', '#FF9800'];
          return `    { key: '${col}', name: '${col}', color: '${colors[idx % colors.length]}' }`;
        }).join(',\n');
        
        code = `<DataFetchChart
  dataUrl="${resourceUrl}"
  chartType="multiline"
  xKey="${xAxis}"
  lines={[
${linesSeries}
  ]}
/>`;
        break;

      case 'scatter':
        code = `<DataFetchChart
  dataUrl="${resourceUrl}"
  chartType="scatter"
  xKey="${xAxis}"
  yKey="${yAxis}"
  name="${yAxis}"
  color="#9C27B0"
/>`;
        break;
    }

    return code;
  };

  const handleGenerate = () => {
    if (!xAxis || (!yAxis && yAxisMulti.length === 0)) {
      alert('Please select both X and Y axes');
      return;
    }

    const code = generateChartCode();
    onGenerate(code);
  };

  const needsMultipleY = chartType === 'multiline';

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-gray-400 hover:text-white text-sm flex items-center gap-2"
      >
        ← Back to preview
      </button>

      <div className="space-y-6">
        {/* Chart Type Selection */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Select Chart Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {chartTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id as ChartType)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    chartType === type.id
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-1 ${chartType === type.id ? 'text-blue-400' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-white">{type.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{type.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column Mapping */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Map Columns</h3>

          {/* X-Axis */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              X-Axis (Category/Time)
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select column...</option>
              {csvData.columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Y-Axis */}
          {!needsMultipleY ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Y-Axis (Value)
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {csvData.columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Y-Axes (Multiple Values)
              </label>
              <div className="space-y-2">
                {csvData.columns.map((col) => (
                  <label key={col} className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={yAxisMulti.includes(col)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setYAxisMulti([...yAxisMulti, col]);
                        } else {
                          setYAxisMulti(yAxisMulti.filter((c) => c !== col));
                        }
                      }}
                      className="rounded border-gray-600"
                    />
                    {col}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Info */}
        {xAxis && (yAxis || yAxisMulti.length > 0) && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <p className="text-green-200 text-sm">
              ✓ Ready to generate: <strong>{chartTypes.find(t => t.id === chartType)?.name}</strong>
              {' with '}
              <strong>{xAxis}</strong> vs{' '}
              <strong>{needsMultipleY ? yAxisMulti.join(', ') : yAxis}</strong>
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!xAxis || (!yAxis && yAxisMulti.length === 0)}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Generate Chart Code
        </button>
      </div>
    </div>
  );
}