import React, { useState, useMemo } from 'react';
import { DataRow, ColumnConfig } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { AlertTriangle, Copy, AlertCircle, BarChart2, FileText, ChevronDown, ArrowRightLeft as ArrowsRightLeft } from 'lucide-react';

interface Props {
  data: DataRow[];
  columns: ColumnConfig[];
}

type ChartType = 'bar' | 'line' | 'pie';

interface AggregatedData {
  name: string;
  value: number;
  count: number;
}

interface DataSummary {
  totalRows: number;
  numericColumns: {
    name: string;
    min: number;
    max: number;
    average: number;
    sum: number;
    occurrences: { [key: string]: number };
  }[];
  categoricalColumns: {
    name: string;
    uniqueValues: number;
    mostCommon: { value: string; count: number };
    occurrences: { [key: string]: number };
  }[];
}

export const DataAnalytics: React.FC<Props> = ({ data, columns }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [showAllSummary, setShowAllSummary] = useState(false);
  const [swapAxes, setSwapAxes] = useState(false);
  
  const selectedColumns = columns.filter(col => col.selected);

  // Calculate data summary with occurrences
  const dataSummary: DataSummary = useMemo(() => {
    const summary: DataSummary = {
      totalRows: data.length,
      numericColumns: [],
      categoricalColumns: []
    };

    selectedColumns.forEach(column => {
      if (column.type === 'numeric') {
        const values = data
          .map(row => Number(row[column.name]))
          .filter(val => !isNaN(val));
        
        const sum = values.reduce((acc, val) => acc + val, 0);
        const occurrences: { [key: string]: number } = {};
        values.forEach(val => {
          const key = val.toString();
          occurrences[key] = (occurrences[key] || 0) + 1;
        });

        summary.numericColumns.push({
          name: column.name,
          min: Math.min(...values),
          max: Math.max(...values),
          average: sum / values.length,
          sum: sum,
          occurrences
        });
      } else {
        const valueCount: { [key: string]: number } = {};
        data.forEach(row => {
          const value = String(row[column.name]);
          if (value.trim()) {
            valueCount[value] = (valueCount[value] || 0) + 1;
          }
        });

        const mostCommon = Object.entries(valueCount)
          .reduce((a, b) => a[1] > b[1] ? a : b);

        summary.categoricalColumns.push({
          name: column.name,
          uniqueValues: Object.keys(valueCount).length,
          mostCommon: { value: mostCommon[0], count: mostCommon[1] },
          occurrences: valueCount
        });
      }
    });

    return summary;
  }, [data, selectedColumns]);

  // Analyze missing values
  const missingValues = selectedColumns.map(column => {
    const missing = data.filter(row => !row[column.name]).length;
    return {
      column: column.name,
      missing,
      percentage: (missing / data.length) * 100
    };
  });

  // Analyze duplicates
  const duplicates = selectedColumns.map(column => {
    const values = data.map(row => row[column.name]);
    const uniqueValues = new Set(values);
    const duplicateCount = values.length - uniqueValues.size;
    return {
      column: column.name,
      duplicates: duplicateCount,
      percentage: (duplicateCount / values.length) * 100
    };
  });

  // Aggregate data function with improved occurrence tracking
  const aggregateData = (data: DataRow[], xAxis: string, yAxis: string, swap: boolean = false): AggregatedData[] => {
    if (!xAxis || !yAxis) return [];

    const actualXAxis = swap ? yAxis : xAxis;
    const actualYAxis = swap ? xAxis : yAxis;

    const aggregated = data.reduce<{ [key: string]: { value: number; count: number } }>((acc, row) => {
      const key = String(row[actualXAxis]);
      const value = Number(row[actualYAxis]) || 0;
      
      if (!acc[key]) {
        acc[key] = { value: 0, count: 0 };
      }
      acc[key].value += value;
      acc[key].count += 1;
      
      return acc;
    }, {});

    return Object.entries(aggregated)
      .map(([name, { value, count }]) => ({ 
        name, 
        value: columns.find(col => col.name === actualYAxis)?.type === 'numeric' ? value : count,
        count 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Prepare chart data
  const chartData = xAxis && yAxis ? aggregateData(data, xAxis, yAxis, swapAxes) : [];

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  const handleSwapAxes = () => {
    setSwapAxes(!swapAxes);
  };

  // Get column type
  const getColumnType = (columnName: string) => {
    return columns.find(col => col.name === columnName)?.type || 'categorical';
  };

  // Render the selected chart type
  const renderChart = () => {
    if (!xAxis || !yAxis || chartData.length === 0) return null;

    const actualXAxis = swapAxes ? yAxis : xAxis;
    const actualYAxis = swapAxes ? xAxis : yAxis;
    const xAxisType = getColumnType(actualXAxis);
    const yAxisType = getColumnType(actualYAxis);

    const tooltipFormatter = (value: number, name: string, props: any) => {
      const item = chartData.find(d => d.name === props.payload.name);
      return [
        `${actualYAxis}: ${value}`,
        `Occurrences: ${item?.count || 0}`,
        `${actualXAxis}: ${props.payload.name}`
      ];
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              label={{ 
                value: actualYAxis,
                position: 'bottom',
                offset: 0
              }}
            />
            <YAxis 
              dataKey="name" 
              type="category"
              width={100}
              label={{ 
                value: actualXAxis,
                angle: -90,
                position: 'left',
                offset: 10
              }}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Bar 
              dataKey="value" 
              fill="#8884d8"
              name={yAxisType === 'numeric' ? 'Somme' : 'Occurrences'}
            />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 50, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ 
                value: actualXAxis,
                position: 'bottom',
                offset: 30
              }}
            />
            <YAxis 
              label={{ 
                value: actualYAxis,
                angle: -90,
                position: 'insideLeft',
                offset: -10
              }}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8"
              strokeWidth={2}
              name={yAxisType === 'numeric' ? 'Somme' : 'Occurrences'}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value, percent }) => 
                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
          </PieChart>
        );
    }
  };

  const displayedNumericColumns = showAllSummary 
    ? dataSummary.numericColumns 
    : dataSummary.numericColumns.slice(0, 4);

  const displayedCategoricalColumns = showAllSummary 
    ? dataSummary.categoricalColumns 
    : dataSummary.categoricalColumns.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Data Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="text-green-500" />
          Résumé des Données
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Nombre total de lignes: <span className="font-medium">{dataSummary.totalRows}</span>
          </p>
          
          {dataSummary.numericColumns.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Colonnes Numériques:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedNumericColumns.map(col => (
                  <div key={col.name} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium mb-1">{col.name}</p>
                    <div className="text-sm space-y-1">
                      <p>Min: {col.min.toFixed(2)}</p>
                      <p>Max: {col.max.toFixed(2)}</p>
                      <p>Moyenne: {col.average.toFixed(2)}</p>
                      <p>Somme: {col.sum.toFixed(2)}</p>
                      <p>Valeurs uniques: {Object.keys(col.occurrences).length}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dataSummary.categoricalColumns.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Colonnes Catégorielles:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedCategoricalColumns.map(col => (
                  <div key={col.name} className="p-3 bg-gray-50 rounded">
                    <p className="font-medium mb-1">{col.name}</p>
                    <div className="text-sm space-y-1">
                      <p>Valeurs uniques: {col.uniqueValues}</p>
                      <p>Valeur la plus fréquente: {col.mostCommon.value} ({col.mostCommon.count} occurrences)</p>
                      <p>Distribution: {Object.entries(col.occurrences)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([val, count]) => `${val} (${count})`)
                        .join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dataSummary.numericColumns.length > 4 || dataSummary.categoricalColumns.length > 4) && (
            <button
              onClick={() => setShowAllSummary(!showAllSummary)}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAllSummary ? 'Voir moins' : 'Voir plus'}
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showAllSummary ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Chart Configuration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="text-blue-500" />
          Configuration de l'Analyse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Graphique
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="bar">Diagramme en Barres</option>
              <option value="line">Graphique Linéaire</option>
              <option value="pie">Diagramme Circulaire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Axe X {swapAxes ? '(Valeurs)' : '(Catégories)'}
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Sélectionner une colonne...</option>
              {selectedColumns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Axe Y {swapAxes ? '(Catégories)' : '(Valeurs)'}
            </label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Sélectionner une colonne...</option>
              {selectedColumns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSwapAxes}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              title="Inverser les axes X et Y"
            >
              <ArrowsRightLeft className="w-4 h-4" />
              Inverser les axes
            </button>
          </div>
        </div>

        {xAxis && yAxis && (
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Relation :</span> {swapAxes ? yAxis : xAxis} = f({swapAxes ? xAxis : yAxis})
            </p>
            <p className="text-xs">
              {swapAxes 
                ? `Analyse de l'impact de ${xAxis} sur ${yAxis}`
                : `Analyse de l'impact de ${yAxis} sur ${xAxis}`}
            </p>
          </div>
        )}
      </div>

      {/* Chart Display */}
      {xAxis && yAxis && chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 - Analyse Graphique</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {chartData.map(item => (
              <p key={item.name}>
                {item.name}: {getColumnType(swapAxes ? xAxis : yAxis) === 'numeric' 
                  ? `Somme = ${item.value}` 
                  : `Occurrences = ${item.count}`}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Values Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="text-yellow-500" />
            Analyse des Valeurs Manquantes
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingValues.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="column" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="missing" fill="#FCD34D" name="Valeurs manquantes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duplicates Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Copy className="text-blue-500" />
            Analyse des Valeurs Dupliquées
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={duplicates.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="column" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="duplicates" fill="#60A5FA" name="Valeurs dupliquées" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Quality Alerts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-500" />
          Alertes de Qualité des Données
        </h3>
        <div className="space-y-4">
          {missingValues
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5)
            .map(({ column, percentage }) => (
              percentage > 5 && (
                <div key={column} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-1" />
                  <p>
                    <span className="font-medium">{column}</span> a {percentage.toFixed(1)}% de valeurs manquantes.
                    Considérez le traitement des données manquantes avant l'analyse.
                  </p>
                </div>
              )
            ))}
          {duplicates
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5)
            .map(({ column, percentage }) => (
              percentage > 10 && (
                <div key={column} className="flex items-start gap-2 text-sm">
                  <Copy className="w-4 h-4 text-blue-500 mt-1" />
                  <p>
                    <span className="font-medium">{column}</span> a {percentage.toFixed(1)}% de valeurs dupliquées.
                    Cela pourrait affecter la qualité de votre analyse.
                  </p>
                </div>
              )
            ))}
        </div>
      </div>
    </div>
  );
};