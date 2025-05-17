import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { DataUpload } from './components/DataUpload';
import { ColumnSelector } from './components/ColumnSelector';
import { DataTable } from './components/DataTable';
import { DataAnalytics } from './components/DataAnalytics';
import { AIChat } from './components/AIChat';
import { Profile } from './components/Profile';
import { Contact } from './components/Contact';
import { Subscription } from './components/Subscription';
import { DataRow, ColumnConfig } from './types';
import { User, Mail } from 'lucide-react';

function App() {
  const [started, setStarted] = useState(false);
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  const handleDataLoaded = (newData: DataRow[], headers: string[]) => {
    setData(newData);
    setColumns(
      headers.map(header => ({
        name: header,
        selected: true,
        type: isNumeric(newData[0][header]) ? 'numeric' : 'categorical'
      }))
    );
  };

  const isNumeric = (value: any): boolean => {
    return !isNaN(value) && !isNaN(parseFloat(value));
  };

  const handleQuestionAsked = () => {
    setQuestionCount(prev => {
      const newCount = prev + 1;
      if (newCount === 4) {
        setShowSubscription(true);
      }
      return newCount;
    });
  };

  if (!started) {
    return <LandingPage onStart={() => setStarted(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SYNC DATA FLOWS</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowContact(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Mail className="w-5 h-5 text-green-600" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <User className="w-5 h-5 text-blue-600" />
              <span>Profil</span>
            </button>
          </div>
        </div>
        
        {data.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <DataUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-6">
                <ColumnSelector
                  columns={columns}
                  onColumnChange={setColumns}
                />
                {data.length > 0 && (
                  <div className="h-[600px]">
                    <AIChat
                      data={data}
                      columns={columns}
                      onQuestionAsked={handleQuestionAsked}
                      questionCount={questionCount}
                    />
                  </div>
                )}
              </div>
              <div className="md:col-span-3">
                <div className="bg-white rounded-lg shadow mb-6">
                  <DataTable
                    data={data}
                    columns={columns}
                  />
                </div>
                <DataAnalytics
                  data={data}
                  columns={columns}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}

      {showContact && (
        <Contact onClose={() => setShowContact(false)} />
      )}

      {showSubscription && (
        <Subscription onClose={() => setShowSubscription(false)} />
      )}
    </div>
  );
}

export default App;