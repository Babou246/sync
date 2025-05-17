import React, { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { Label } from '../types';

interface Props {
  onBulkLabel: (label: Label) => void;
}

export const BulkLabeling: React.FC<Props> = ({ onBulkLabel }) => {
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#3B82F6');

  const handleAddLabel = () => {
    if (labelName.trim()) {
      const label: Label = {
        id: Date.now().toString(),
        name: labelName,
        color: labelColor
      };
      onBulkLabel(label);
      setLabelName('');
      setLabelColor('#3B82F6');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5" />
        Bulk Labeling
      </h3>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={labelName}
          onChange={(e) => setLabelName(e.target.value)}
          placeholder="Enter label name..."
          className="flex-1 border rounded-md px-3 py-2 text-sm"
        />
        <input
          type="color"
          value={labelColor}
          onChange={(e) => setLabelColor(e.target.value)}
          className="w-8 h-8 p-0 border-0"
        />
        <button
          onClick={handleAddLabel}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add to All
        </button>
      </div>
    </div>
  );
};