import React, { useState } from 'react';
import { DataRow, ColumnConfig } from '../types';
import { Search, ChevronDown, Download } from 'lucide-react';
import Papa from 'papaparse';

interface Props {
  data: DataRow[];
  columns: ColumnConfig[];
}

export const DataTable: React.FC<Props> = ({ 
  data, 
  columns
}) => {
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumn, setSearchColumn] = useState<string>('all');
  
  const selectedColumns = columns.filter(col => col.selected);

  const filteredData = data.filter(row => {
    if (!searchQuery) return true;
    
    if (searchColumn === 'all') {
      return Object.entries(row).some(([_, value]) => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return String(row[searchColumn]).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const displayData = showMore ? filteredData : filteredData.slice(0, 5);

  const handleExport = () => {
    const exportData = filteredData.map(row => {
      const exportRow: { [key: string]: any } = {};
      selectedColumns.forEach(col => {
        exportRow[col.name] = row[col.name];
      });
      return exportRow;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'exported_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Advanced Search and Export */}
      <div className="bg-white p-4 rounded-t-lg border-b flex gap-4 items-center">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Columns</option>
            {selectedColumns.map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectedColumns.map((column) => (
                <th
                  key={column.name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, idx) => (
              <tr key={idx}>
                {selectedColumns.map((column) => (
                  <td
                    key={column.name}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[column.name]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredData.length > 5 && (
        <div className="py-4 px-6 bg-gray-50 rounded-b-lg flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {showMore ? filteredData.length : 5} of {filteredData.length} rows
          </span>
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showMore ? 'Show Less' : 'Show More'}
            <ChevronDown className={`w-4 h-4 transform transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};