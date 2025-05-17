import React from 'react';
import { ColumnConfig } from '../types';

interface Props {
  columns: ColumnConfig[];
  onColumnChange: (columns: ColumnConfig[]) => void;
}

export const ColumnSelector: React.FC<Props> = ({ columns, onColumnChange }) => {
  const handleToggle = (name: string) => {
    const updatedColumns = columns.map(col =>
      col.name === name ? { ...col, selected: !col.selected } : col
    );
    onColumnChange(updatedColumns);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Select Columns to Analyze</h3>
      <div className="space-y-2">
        {columns.map((column) => (
          <label key={column.name} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={column.selected}
              onChange={() => handleToggle(column.name)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">{column.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};