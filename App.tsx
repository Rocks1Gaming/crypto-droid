
import React, { useState, useEffect, useCallback } from 'react';
import { CoinData, AppTab, MarketAnalysis, Currency, DataSource } from './types';
import { getInitialData, fetchCryptoData } from './services/cryptoService';
import { analyzeMarket } from './services/geminiService';
import CryptoCard from './components/CryptoCard';
import { LayoutDashboard, BrainCircuit, Settings, RefreshCw, Loader2, Plus, X, Search, Globe, ShieldCheck, Share2, Copy, Check, Smartphone, QrCode, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [activeSymbols, setActiveSymbols] = useState<string[]>(['BTC', 'ETH', 'XRP']);
  const [coins, setCoins] = useState<CoinData[]>(getInitialData('USD', ['BTC', 'ETH', 'XRP']));
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MARKET);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [dataSource, setDataSource] = useState<DataSource>('BINANCE');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newCoinInput, setNewCoinInput] = useState('');
  const [addError, setAddError] = useState('');
  
  // URL Copy State
  const [initialUrl, setInitialUrl] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get current URL for sharing
    if (typeof window !== 'undefined') {
        // Remove trailing slash for cleaner URL
        const url = window.location.href.replace(/\/$/, "");
        setAppUrl(url);
        setInitialUrl(url);
    }
  }, []);

  // Fetch real-time data
  useEffect(() => {
    const loadRealData = async () => {
        const data = await fetchCryptoData(currency, activeSymbols, dataSource);
        setCoins(data);
    };

    loadRealData();
    // Refresh slightly less frequently if on Kraken to be nice to API limits if fetching many individual pairs
    const refreshRate = dataSource === 'BINANCE' ? 5000 : 10000; 
    const interval = setInterval(loadRealData, refreshRate); 

    return () => clearInterval(interval);
  }, [currency, activeSymbols, dataSource]);

  // Handle Gemini Analysis
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    const result = await analyzeMarket(coins, currency);
    setAnalysis(result);
    setIsAnalyzing(false);
  }, [coins, currency]);

  // Reset analysis when currency or source changes
  useEffect(() => {
      setAnalysis(null);
  }, [currency, dataSource]);

  // Initial analysis on load
  useEffect(() => {
    if (activeTab === AppTab.ANALYSIS && !analysis && !isAnalyzing && coins.length > 0) {
        handleAnalyze();
    }
  }, [activeTab, analysis, handleAnalyze, isAnalyzing, coins.length]);

  const handleAddCoin = () => {
    const symbol = newCoinInput.trim().toUpperCase();
    if (!symbol) return;
    if (activeSymbols.includes(symbol)) {
        setAddError('Esta moneda ya está en la lista.');
        return;
    }
    
    setActiveSymbols([...activeSymbols, symbol]);
    setNewCoinInput('');
    setIsAddModalOpen(false);
    setAddError('');
  };

  const removeCoin = (symbolToRemove: string) => {
    setActiveSymbols(activeSymbols.filter(s => s !== symbolToRemove));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetUrl = () => {
      setAppUrl(initialUrl);
  };

  // Ensure the QR data is a valid URL format so Android recognizes it as a link
  const getQrData = () => {
      let url = appUrl.trim();
      if (!url) return '';
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${url}`;
      }
      return url;
  };

  return (
    <div className="min-h-screen bg-android-bg text-white flex justify-center">
      <div className="w-full max-w-md h-full min-h-screen flex flex-col relative bg-android-bg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-gradient-to-b from-slate-900 to-android-bg z-10 sticky top-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CryptoDroid</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${dataSource === 'BINANCE' ? 'bg-yellow-400' : 'bg-purple-500'}`}></span>
              Fuente: {dataSource === 'BINANCE' ? 'Binance' : 'Kraken'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Mobile/Share Button */}
             <button 
                onClick={() => setIsShareModalOpen(true)}
                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-all active:scale-95"
                title="Instalar en Móvil"
             >
                <Smartphone size={20} />
             </button>

             {/* Currency Toggle */}
             <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button 
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'USD' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                >USD</button>
                <button 
                  onClick={() => setCurrency('EUR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'EUR' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                >EUR</button>
             </div>
             
             {/* Add Button */}
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 border border-blue-400"
             >
               <Plus size={20} />
             </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-4 pb-24 overflow-y-auto no-scrollbar">
          
          {activeTab === AppTab.MARKET && (
            <div className="space-y-2 animate-fade-in pb-4">
              {coins.length === 0 && (
                 <div className="text-center py-10 text-slate-500">
                    <p>No hay monedas para mostrar.</p>
                 </div>
              )}
              
              {coins.map(coin => (
                <div key={coin.id} className="relative group">
                    <CryptoCard coin={coin} currency={currency} />
                    {/* Delete button logic */}
                    {activeSymbols.length > 1 && (
                        <button 
                            onClick={() => removeCoin(coin.symbol)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                            title="Remover"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
              ))}
              
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <BrainCircuit className="text-blue-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm text-blue-200">¿Necesitas consejo?</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Usa nuestra pestaña de Análisis impulsada por Gemini para obtener una visión profunda del mercado actual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === AppTab.ANALYSIS && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Análisis Gemini</h2>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="p-2 rounded-full bg-slate-800 text-blue-400 hover:bg-slate-700 active:scale-95 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                </button>
              </div>

              {isAnalyzing ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                        <BrainCircuit className="w-16 h-16 text-blue-500 animate-pulse relative z-10" />
                    </div>
                    <p className="animate-pulse">Analizando tendencias en {currency}...</p>
                 </div>
              ) : analysis ? (
                <>
                  <div className={`p-6 rounded-3xl border-l-4 shadow-lg ${
                    analysis.sentiment === 'bullish' ? 'bg-emerald-900/20 border-emerald-500' :
                    analysis.sentiment === 'bearish' ? 'bg-red-900/20 border-red-500' :
                    'bg-slate-800 border-slate-500'
                  }`}>
                    <h3 className="text-sm font-uppercase tracking-wider text-slate-400 mb-2">SENTIMIENTO DEL MERCADO</h3>
                    <div className={`text-3xl font-bold capitalize ${
                       analysis.sentiment === 'bullish' ? 'text-emerald-400' :
                       analysis.sentiment === 'bearish' ? 'text-red-400' :
                       'text-slate-200'
                    }`}>
                      {analysis.sentiment}
                    </div>
                  </div>

                  <div className="bg-android-surface rounded-3xl p-6 shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-blue-300">Resumen Ejecutivo</h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {analysis.summary}
                    </p>
                  </div>

                  <div className="bg-android-surface rounded-3xl p-6 shadow-md border border-slate-700/50">
                    <h3 className="font-bold text-lg mb-3 text-orange-300">Niveles Clave</h3>
                    <p className="text-slate-400 text-sm font-mono bg-black/20 p-4 rounded-xl">
                      {analysis.keyLevels}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 mt-20">
                  <p>Toca el botón de refrescar para generar un nuevo análisis.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.SETTINGS && (
            <div className="space-y-6 animate-fade-in p-2">
               <h2 className="text-xl font-bold px-2">Configuración</h2>

               <div className="bg-android-surface rounded-3xl p-5 shadow-lg border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4 text-slate-300">
                    <Globe className="w-5 h-5" />
                    <h3 className="font-bold">Fuente de Datos</h3>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-4">
                    Selecciona el exchange principal para obtener los precios. Si una moneda no se encuentra, intentaremos buscarla en el otro exchange automáticamente.
                  </p>

                  <div className="flex gap-3">
                    <button 
                        onClick={() => setDataSource('BINANCE')}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                            dataSource === 'BINANCE' 
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        <span>Binance</span>
                        {dataSource === 'BINANCE' && <span className="text-[10px] text-yellow-500/80">● Activo</span>}
                    </button>
                    <button 
                        onClick={() => setDataSource('KRAKEN')}
                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                            dataSource === 'KRAKEN' 
                            ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        <span>Kraken</span>
                        {dataSource === 'KRAKEN' && <span className="text-[10px] text-purple-400/80">● Activo</span>}
                    </button>
                  </div>
               </div>

                {/* Share / URL Section */}
               <div className="bg-android-surface rounded-3xl p-5 shadow-lg border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4 text-slate-300">
                    <Share2 className="w-5 h-5" />
                    <h3 className="font-bold">Compartir</h3>
                  </div>
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode size={18} />
                    <span>Mostrar Código QR</span>
                  </button>
               </div>

               <div className="bg-android-surface rounded-3xl p-5 shadow-lg border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4 text-slate-300">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-bold">Acerca de</h3>
                  </div>
                  <div className="space-y-2 text-xs text-slate-400">
                     <div className="flex justify-between py-2 border-b border-slate-700">
                        <span>Versión</span>
                        <span>1.0.4 Beta</span>
                     </div>
                     <div className="flex justify-between py-2 border-b border-slate-700">
                        <span>Desarrollador</span>
                        <span>Gemini Engineer</span>
                     </div>
                     <div className="flex justify-between py-2">
                        <span>API Status</span>
                        <span className="text-emerald-500">Online</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 pb-6 pt-2 px-6 z-10">
          <ul className="flex justify-between items-center">
            <li>
              <button 
                onClick={() => setActiveTab(AppTab.MARKET)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === AppTab.MARKET ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutDashboard size={24} strokeWidth={activeTab === AppTab.MARKET ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Mercado</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab(AppTab.ANALYSIS)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === AppTab.ANALYSIS ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <BrainCircuit size={24} strokeWidth={activeTab === AppTab.ANALYSIS ? 2.5 : 2} />
                <span className="text-[10px] font-medium">IA Análisis</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab(AppTab.SETTINGS)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === AppTab.SETTINGS ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Settings size={24} strokeWidth={activeTab === AppTab.SETTINGS ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Ajustes</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Add Coin Modal */}
        {isAddModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-android-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Agregar Cripto</h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-xs text-slate-400 mb-2 font-medium uppercase">Símbolo (Ticker)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={newCoinInput}
                                onChange={(e) => {
                                    setNewCoinInput(e.target.value);
                                    setAddError('');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCoin()}
                                placeholder="Ej: SOL, ADA, DOT" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                        </div>
                        {addError && <p className="text-red-400 text-xs mt-2">{addError}</p>}
                    </div>

                    <button 
                        onClick={handleAddCoin}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                    >
                        Agregar
                    </button>
                </div>
            </div>
        )}

        {/* Share / QR Modal */}
        {isShareModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                <div className="bg-android-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-700 flex flex-col items-center text-center">
                    <div className="w-full flex justify-end mb-2">
                        <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <Smartphone className="w-12 h-12 text-blue-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Instalar en Móvil</h3>
                    <p className="text-slate-400 text-xs mb-4 max-w-[280px]">
                        Escanea el QR para abrir la app. Si la URL es incorrecta, puedes editarla abajo.
                    </p>

                    <div className="bg-white p-4 rounded-xl mb-6 shadow-inner">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getQrData())}`} 
                            alt="QR Code" 
                            className="w-40 h-40"
                        />
                    </div>

                    <div className="w-full flex items-center gap-2 mb-2">
                         <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 flex items-center px-3 py-2 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                            <input 
                                type="text" 
                                value={appUrl}
                                onChange={(e) => setAppUrl(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-xs text-slate-300 font-mono w-full"
                                placeholder="https://..."
                            />
                         </div>
                         <button 
                            onClick={copyToClipboard}
                            className={`p-2 rounded-xl border border-slate-700 bg-slate-800 ${copied ? 'text-emerald-500' : 'text-white'}`}
                            title="Copiar URL"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                         <button 
                            onClick={resetUrl}
                            className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                            title="Resetear URL"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                        *El QR añade automáticamente 'https://' si falta.
                    </p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;
