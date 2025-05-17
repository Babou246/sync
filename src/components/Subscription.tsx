import React, { useState } from 'react';
import { CreditCard, X, Wallet } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const Subscription: React.FC<Props> = ({ onClose }) => {
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'orange' | 'wave' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPayment === 'wave') {
      window.location.href = 'https://pay.wave.com/m/M_sn_aTes0wMaqRVA/c/sn/?amount=500';
    } else {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold mb-6">Choisissez votre abonnement</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-4">Abonnement Premium</h3>
            <p className="text-gray-600 mb-4">
              Accès illimité à l'assistant d'analyse de données
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Questions illimitées
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Analyses approfondies
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Support prioritaire
              </li>
            </ul>
            <p className="text-2xl font-bold mb-4">5000 FCFA/mois</p>
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayment('card')}
                  className={`w-full py-2 rounded-md flex items-center justify-center gap-2 ${
                    selectedPayment === 'card'
                      ? 'bg-blue-600 text-white'
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Carte Bancaire
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedPayment('orange')}
                  className={`w-full py-2 rounded-md flex items-center justify-center gap-2 ${
                    selectedPayment === 'orange'
                      ? 'bg-orange-500 text-white'
                      : 'border border-orange-500 text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  <img
                    src="https://www.orange.sn/mobile-money.html/media/k2/items/cache/c889234799e865bbe90cee71f6cd2e53_XL.jpg"
                    alt="Orange Money"
                    className="w-4 h-4 object-contain"
                  />
                  Orange Money
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedPayment('wave')}
                  className={`w-full py-2 rounded-md flex items-center justify-center gap-2 ${
                    selectedPayment === 'wave'
                      ? 'bg-blue-500 text-white'
                      : 'border border-blue-500 text-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <img
                    src="https://wave.com/static/wave-logo.svg"
                    alt="Wave"
                    className="w-4 h-4 object-contain"
                  />
                  Wave
                </button>
              </div>

              {selectedPayment && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedPayment === 'card' ? 'Numéro de carte' : 'Numéro de téléphone'}
                    </label>
                    <input
                      type={selectedPayment === 'card' ? 'text' : 'tel'}
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      placeholder={
                        selectedPayment === 'card'
                          ? '4242 4242 4242 4242'
                          : '77 123 45 67'
                      }
                      className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {selectedPayment === 'card' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date d'expiration
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={processing}
                    className={`w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 ${
                      processing ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Payer maintenant
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Version Gratuite</h3>
            <p className="text-gray-600 mb-4">
              Essayez gratuitement avec des fonctionnalités limitées
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                4 questions gratuites
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Analyses de base
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span>×</span>
                Support prioritaire
              </li>
            </ul>
            <p className="text-2xl font-bold mb-4">Gratuit</p>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Continuer gratuitement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};