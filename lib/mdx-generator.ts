// story-beta/lib/mdx-generator.ts

import { StoryState, StoryMetadata, StoryComponent, ChartConfig, TableConfig, TextConfig, HeadingConfig, MetricConfig, ChartType } from '../types/story-builder';

class MDXGenerator {
  generateMDX(story: StoryState): string {
    const frontmatter = this.generateFrontmatter(story.metadata);
    const components = story.components
      .sort((a, b) => {
        // Sort by row, then by column
        if (a.position.row !== b.position.row) {
          return a.position.row - b.position.row;
        }
        return a.position.col - b.position.col;
      })
      .map((comp) => this.generateComponent(comp))
      .filter(Boolean)
      .join('\n\n');

    return `---\n${frontmatter}\n---\n\n${components}`;
  }

  private generateFrontmatter(metadata: StoryMetadata): string {
    const lines: string[] = [];

    lines.push(`title: "${metadata.title}"`);
    
    if (metadata.description) {
      lines.push(`description: "${metadata.description}"`);
    }

    if (metadata.author) {
      lines.push(`author: "${metadata.author}"`);
    }

    if (metadata.tags && metadata.tags.length > 0) {
      lines.push(`tags:`);
      metadata.tags.forEach((tag) => {
        lines.push(`  - "${tag}"`);
      });
    }

    if (metadata.coverImage) {
      lines.push(`coverImage: "${metadata.coverImage}"`);
    }

    if (metadata.publishedAt) {
      lines.push(`publishedAt: "${metadata.publishedAt.toISOString()}"`);
    }

    lines.push(`createdAt: "${metadata.createdAt.toISOString()}"`);
    lines.push(`updatedAt: "${metadata.updatedAt.toISOString()}"`);

    return lines.join('\n');
  }

  private generateComponent(component: StoryComponent): string {
    switch (component.type) {
      case 'text':
        return this.generateTextBlock(component.config as TextConfig);

      case 'heading':
        return this.generateHeading(component.config as HeadingConfig);

      case 'divider':
        return '\n---\n';

      case 'bar-chart':
      case 'line-chart':
      case 'area-chart':
      case 'multi-line-chart':
      case 'stacked-chart':
      case 'combo-chart':
      case 'pie-chart':
      case 'donut-chart':
      case 'scatter-chart':
      case 'radar-chart':
      case 'horizontal-chart':
      case 'funnel-chart':
      case 'treemap-chart':
        return this.generateChart(component.config as ChartConfig);

      case 'table':
        return this.generateTable(component.config as TableConfig);

      case 'metric':
        return this.generateMetric(component.config as MetricConfig);

      default:
        return '';
    }
  }

  private generateTextBlock(config: TextConfig): string {
    return config.content;
  }

  private generateHeading(config: HeadingConfig): string {
    const hashes = '#'.repeat(config.level);
    return `${hashes} ${config.text}`;
  }

  private generateChart(config: ChartConfig): string {
    const { type, dataSource, axes, styling } = config;

    // If data source is from CKAN dataset
    if (dataSource.type === 'dataset' && dataSource.url) {
      return this.generateDataFetchChart(type, config);
    }

    // If data is inline
    if (dataSource.type === 'inline' && dataSource.data) {
      return this.generateInlineChart(type, config);
    }

    return '';
  }

  private generateDataFetchChart(type: ChartType, config: ChartConfig): string {
    const { dataSource, axes, styling } = config;
    const chartComponent = this.getChartComponentName(type);

    const props: string[] = [];
    props.push(`chartType="${this.getChartType(type)}"`);
    props.push(`resourceUrl="${dataSource.url}"`);
    props.push(`xAxisKey="${axes.xAxis.column}"`);
    props.push(`yAxisKey="${axes.yAxis.column}"`);

    if (styling.title) {
      props.push(`chartTitle="${styling.title}"`);
    }

    if (axes.xAxis.label) {
      props.push(`xAxisLabel="${axes.xAxis.label}"`);
    }

    if (axes.yAxis.label) {
      props.push(`yAxisLabel="${axes.yAxis.label}"`);
    }

    if (styling.height) {
      props.push(`height={${styling.height}}`);
    }

    if (dataSource.datasetTitle) {
      props.push(`// Dataset: ${dataSource.datasetTitle}`);
    }

    if (dataSource.resourceName) {
      props.push(`// Resource: ${dataSource.resourceName}`);
    }

    return `<DataFetchChart\n  ${props.join('\n  ')}\n/>`;
  }

  private generateInlineChart(type: ChartType, config: ChartConfig): string {
    const { dataSource, axes, styling } = config;
    const chartComponent = this.getChartComponentName(type);

    const dataStr = JSON.stringify(dataSource.data, null, 2)
      .split('\n')
      .map((line, i) => (i === 0 ? line : `  ${line}`))
      .join('\n');

    const props: string[] = [];
    props.push(`data={${dataStr}}`);
    props.push(`xKey="${axes.xAxis.column}"`);
    props.push(`yKey="${axes.yAxis.column}"`);

    if (styling.title) {
      props.push(`title="${styling.title}"`);
    }

    if (styling.height) {
      props.push(`height={${styling.height}}`);
    }

    if (styling.colors && styling.colors.length > 0) {
      props.push(`colors={${JSON.stringify(styling.colors)}}`);
    }

    return `<${chartComponent}\n  ${props.join('\n  ')}\n/>`;
  }

  private generateTable(config: TableConfig): string {
    const { columns, dataSource } = config;

    const visibleColumns = columns.filter((col) => col.visible);

    const columnsConfig = visibleColumns.map((col) => ({
      key: col.id,
      name: col.name,
      type: col.type,
    }));

    if (dataSource.type === 'inline' && dataSource.data) {
      const dataStr = JSON.stringify(dataSource.data, null, 2);
      const columnsStr = JSON.stringify(columnsConfig, null, 2);

      return `<Table\n  data={${dataStr}}\n  columns={${columnsStr}}\n/>`;
    }

    if (dataSource.type === 'dataset' && dataSource.url) {
      return `<FlatUiTable url="${dataSource.url}" />`;
    }

    return '';
  }

  private generateMetric(config: MetricConfig): string {
    const lines: string[] = [];
    lines.push(`### ${config.label}`);
    lines.push(`**${config.value}${config.unit || ''}**`);

    if (config.trend) {
      const trendIcon = config.trend.direction === 'up' ? '↑' : config.trend.direction === 'down' ? '↓' : '→';
      lines.push(`${trendIcon} ${config.trend.value}% ${config.trend.label || ''}`);
    }

    return lines.join('\n\n');
  }

  private getChartComponentName(type: ChartType): string {
    const componentMap: Record<ChartType, string> = {
      'bar-chart': 'BarChart',
      'line-chart': 'LineChart',
      'area-chart': 'AreaChart',
      'multi-line-chart': 'MultiLineChart',
      'stacked-chart': 'StackedChart',
      'combo-chart': 'ComboChart',
      'pie-chart': 'PieChart',
      'donut-chart': 'DonutChart',
      'scatter-chart': 'ScatterChart',
      'radar-chart': 'RadarChart',
      'horizontal-chart': 'HorizontalChart',
      'funnel-chart': 'FunnelChart',
      'treemap-chart': 'TreemapChart',
    };

    return componentMap[type] || 'BarChart';
  }

  private getChartType(type: ChartType): string {
    // For DataFetchChart component
    const typeMap: Record<ChartType, string> = {
      'bar-chart': 'bar',
      'line-chart': 'line',
      'area-chart': 'area',
      'multi-line-chart': 'multiline',
      'stacked-chart': 'stacked',
      'combo-chart': 'combo',
      'pie-chart': 'pie',
      'donut-chart': 'donut',
      'scatter-chart': 'scatter',
      'radar-chart': 'radar',
      'horizontal-chart': 'horizontal',
      'funnel-chart': 'funnel',
      'treemap-chart': 'treemap',
    };

    return typeMap[type] || 'bar';
  }
}

export const mdxGenerator = new MDXGenerator();
