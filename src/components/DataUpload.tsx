import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle, FileText, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataRow } from '../types';

interface Props {
  onDataLoaded: (data: DataRow[], headers: string[]) => void;
}

export const DataUpload: React.FC<Props> = ({ onDataLoaded }) => {
  const [error, setError] = useState<string | null>(null);

  const processCSV = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.data && results.data.length > 1) {
          const headers = results.data[0] as string[];
          const data = results.data.slice(1).map((row: any) => {
            const obj: DataRow = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          }).filter(row => Object.values(row).some(val => val !== undefined && val !== ''));
          onDataLoaded(data, headers);
        } else {
          setError("Le fichier CSV ne contient pas de données valides.");
        }
      },
      header: false,
      error: () => {
        setError("Erreur lors de l'analyse du fichier CSV.");
      }
    });
  };

  const processExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        if (jsonData && jsonData.length > 1) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map((row: any) => {
            const obj: DataRow = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          }).filter(row => Object.values(row).some(val => val !== undefined && val !== ''));
          onDataLoaded(rows, headers);
        } else {
          setError("Le fichier Excel ne contient pas de données valides.");
        }
      } catch (err) {
        setError("Erreur lors de l'analyse du fichier Excel.");
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier Excel.");
    };
    reader.readAsBinaryString(file);
  };

  const processTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        
        if (lines.length > 1) {
          // Try to detect delimiter (tab, comma, semicolon)
          const firstLine = lines[0];
          let delimiter = '\t';
          if (firstLine.includes(',')) delimiter = ',';
          else if (firstLine.includes(';')) delimiter = ';';
          
          const headers = lines[0].split(delimiter).map(h => h.trim());
          const data = lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
              const values = line.split(delimiter);
              const obj: DataRow = {};
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || '';
              });
              return obj;
            });
          onDataLoaded(data, headers);
        } else {
          setError("Le fichier texte ne contient pas de données valides.");
        }
      } catch (err) {
        setError("Erreur lors de l'analyse du fichier texte.");
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier texte.");
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (fileType === 'csv') {
      processCSV(file);
    } else if (['xlsx', 'xls'].includes(fileType || '')) {
      processExcel(file);
    } else if (['txt', 'text'].includes(fileType || '')) {
      processTextFile(file);
    } else {
      setError("Format de fichier non pris en charge. Veuillez utiliser CSV, Excel ou TXT.");
    }
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt']
    }
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg text-gray-600">Déposez votre fichier ici...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-2">
              Glissez-déposez votre fichier ici, ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-gray-500">
              Formats pris en charge: CSV, Excel (XLSX, XLS), Texte (TXT)
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>CSV</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>TXT</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800 mb-1">Erreur de fichier</h4>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              Veuillez utiliser un fichier au format CSV, Excel (XLSX, XLS) ou Texte (TXT).
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};