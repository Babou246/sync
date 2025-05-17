import React from 'react';
import { Mail, Phone, Clock, Brain, Database, Bot } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const Contact: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <h2 className="text-2xl font-semibold mb-6 text-center">Nous Contacter</h2>
        
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Domaines d'Expertise
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Database className="w-4 h-4" />
              <span>Big Data</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <Brain className="w-4 h-4" />
              <span>IA</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <Bot className="w-4 h-4" />
              <span>Deep Learning</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <Bot className="w-4 h-4" />
              <span>Machine Learning</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <Bot className="w-4 h-4" />
              <span>Agent AI</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">Email</h3>
              <a href="mailto:babacardiop79@gmail.com" className="text-blue-600 hover:underline">
                babacardiop79@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">Téléphone</h3>
              <a href="tel:+221771007695" className="text-green-600 hover:underline">
                77 100 76 95
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">Disponibilité</h3>
              <p className="text-gray-600">Disponible 24/7</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};