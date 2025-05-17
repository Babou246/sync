import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertTriangle, CreditCard, HelpCircle } from 'lucide-react';
import { ChatMessage, DataRow, ColumnConfig } from '../types';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { Subscription } from './Subscription';

interface Props {
  data: DataRow[];
  columns: ColumnConfig[];
  onQuestionAsked: () => void;
  questionCount: number;
}

class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs: number = 60000;
  private readonly maxRequests: number = 20;

  isRateLimited(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    if (this.requests.length >= this.maxRequests) {
      return true;
    }
    this.requests.push(now);
    return false;
  }
}

const rateLimiter = new RateLimiter();

export const AIChat: React.FC<Props> = ({ data, columns, onQuestionAsked, questionCount }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Je suis un assistant d\'analyse de données spécialisé dans l\'analyse des documents chargés.'
    },
    {
      role: 'assistant',
      content: 'Je peux vous aider à analyser vos données. Voici quelques questions suggérées :'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDetached, setIsDetached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastRequestTime = useRef<number>(0);
  const chatMemory = useRef<ChatMessage[]>([]);
  const minRequestInterval = 1000;

  const openRouterApiKey = "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";

  const generateSuggestedQuestions = () => {
    const dataContext = prepareDataContext();
    const questions = [
      `Quelle est la distribution des valeurs dans la colonne ${columns[0]?.name || 'principale'}?`,
      `Y a-t-il des tendances notables dans les données?`,
      `Pouvez-vous identifier des valeurs aberrantes?`,
      `Quelle est la relation entre les différentes colonnes?`
    ];
    setSuggestedQuestions(questions);
  };

  useEffect(() => {
    generateSuggestedQuestions();
  }, [data, columns]);

  useEffect(() => {
    chatMemory.current = messages;
  }, [messages]);

  const handleDoubleClick = () => {
    if (!isDetached) {
      setIsDetached(true);
      setPosition({ x: window.innerWidth / 4, y: window.innerHeight / 4 });
    } else {
      setIsDetached(false);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDetached) return;
    setIsDragging(true);
    const startX = e.pageX - position.x;
    const startY = e.pageY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.pageX - startX,
        y: e.pageY - startY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .slice(0, 500);
  };

  const validateRequest = (input: string): boolean => {
    if (!input.trim()) return false;
    if (input.length > 500) return false;
    if (/^[<>{}]/.test(input)) return false;
    return true;
  };

  const prepareDataContext = () => {
    const selectedColumns = columns.filter(col => col.selected);
    const numRows = data.length;
    const numCols = selectedColumns.length;
    
    const sampleData = data.slice(0, 5).map(row => {
      const sampleRow: Record<string, any> = {};
      selectedColumns.forEach(col => {
        sampleRow[col.name] = row[col.name];
      });
      return sampleRow;
    });
    
    const columnSummary = selectedColumns.map(col => {
      if (col.type === 'numeric') {
        const values = data.map(row => Number(row[col.name])).filter(val => !isNaN(val));
        if (values.length === 0) return `${col.name} (numérique): pas de valeurs numériques valides`;
        
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return `${col.name} (numérique): min=${min}, max=${max}, moyenne=${avg.toFixed(2)}`;
      } else {
        const valueCount: Record<string, number> = {};
        data.forEach(row => {
          const val = String(row[col.name] || '');
          if (val.trim()) {
            valueCount[val] = (valueCount[val] || 0) + 1;
          }
        });
        
        const topValues = Object.entries(valueCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([val, count]) => `${val} (${count})`);
          
        return `${col.name} (catégorielle): valeurs fréquentes=${topValues.join(', ')}`;
      }
    });

    return {
      summary: `Dataset avec ${numRows} lignes et ${numCols} colonnes.`,
      columns: columnSummary,
      sample: JSON.stringify(sampleData, null, 2)
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectAutomation = (): boolean => {
    const now = Date.now();
    if (now - lastRequestTime.current < minRequestInterval) {
      return true;
    }
    lastRequestTime.current = now;
    return false;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || questionCount >= 4) return;
    
    if (detectAutomation()) {
      setApiError("Veuillez patienter entre les requêtes.");
      return;
    }

    if (rateLimiter.isRateLimited()) {
      setApiError("Trop de requêtes. Veuillez réessayer plus tard.");
      return;
    }

    if (!validateRequest(input)) {
      setApiError("Entrée invalide. Veuillez réessayer.");
      return;
    }

    const sanitizedInput = sanitizeInput(input);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: sanitizedInput
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setApiError(null);
    onQuestionAsked();
    
    try {
      const dataContext = prepareDataContext();
      
      const model = new ChatOpenAI({
        openAIApiKey: openRouterApiKey,
        modelName: "mistralai/mistral-7b-instruct",
        temperature: 0,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": "",
            "X-Title": "",
          },
        },
      });

      const template = `Tu es un assistant d'analyse de données expert qui se concentre uniquement sur les données fournies.
      Réponds uniquement en te basant sur les informations présentes dans le contexte des données.
      Si une question sort du cadre des données fournies, indique poliment que tu ne peux répondre qu'aux questions concernant les données présentes.

      Contexte des données :
      Résumé du Dataset: {summary}

      Colonnes et leurs statistiques:
      {columns}

      Échantillon de données:
      {sample}

      Historique des questions:
      ${chatMemory.current.filter(msg => msg.role !== 'system').map(msg => `${msg.role}: ${msg.content}`).join('\n')}

      Question de l'utilisateur: {question}

      Réponds de manière claire et concise, en te basant uniquement sur les données fournies.
      Limite ta réponse à 3-4 phrases maximum.`;

      const prompt = PromptTemplate.fromTemplate(template);

      const chain = RunnableSequence.from([
        prompt,
        model,
        new StringOutputParser(),
      ]);

      const response = await chain.invoke({
        summary: dataContext.summary,
        columns: dataContext.columns.join('\n'),
        sample: dataContext.sample,
        question: sanitizedInput,
      });
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      generateSuggestedQuestions();
    } catch (error: any) {
      console.error('Error calling LangChain:', error);
      
      let errorMessage = "Désolé, une erreur s'est produite lors de l'analyse de vos données.";
      
      if (error.status === 401) {
        errorMessage = "Erreur d'authentification avec l'API.";
      } else if (error.status === 429) {
        errorMessage = "Limite de requêtes atteinte. Veuillez réessayer plus tard.";
      } else if (error.status === 500) {
        errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    handleSendMessage();
  };

  const chatStyle = isDetached ? {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 1000,
    width: '400px',
    cursor: isDragging ? 'grabbing' : 'grab',
  } as React.CSSProperties : {};

  return (
    <div 
      className={`bg-white rounded-lg shadow overflow-hidden flex flex-col ${isDetached ? 'h-[500px]' : 'h-full'}`}
      style={chatStyle}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-medium">Assistant d'Analyse de Données</h3>
        </div>
        {questionCount < 4 && (
          <span className="text-sm bg-blue-500 px-2 py-1 rounded">
            {4 - questionCount} questions restantes
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Erreur d'API</p>
              <p>{apiError}</p>
            </div>
          </div>
        )}
        
        {messages.filter(msg => msg.role !== 'system').map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.role === 'user' ? (
                  <>
                    <span className="font-medium">Vous</span>
                    <User className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span className="font-medium">Assistant</span>
                  </>
                )}
              </div>
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {suggestedQuestions.length > 0 && !loading && messages.length < 3 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-blue-700">Questions suggérées :</span>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span className="font-medium">Assistant</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyse en cours...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        {questionCount >= 4 ? (
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              Vous avez atteint la limite de questions gratuites.
            </div>
            <button
              onClick={() => setShowSubscription(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <CreditCard className="w-4 h-4" />
              S'abonner maintenant
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question sur vos données..."
              className="flex-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              rows={2}
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                !input.trim() || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
        )}
      </div>
      
      {showSubscription && (
        <Subscription onClose={() => setShowSubscription(false)} />
      )}
    </div>
  );
};