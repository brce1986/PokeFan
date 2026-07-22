import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MOCK_SETS } from '../services/pokemonApi';
import { Scan, Search, TrendingUp, ChevronRight, BookOpen, Sparkles, Award } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    collection, 
    formatPrice, 
    setActiveTab, 
    setSelectedCardId, 
    setSelectedSetId 
  } = useApp();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Ref e estado para largura dinâmica do gráfico
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(500);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.getBoundingClientRect().width);
      }
    };
    const timer = setTimeout(updateWidth, 50);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Calcular valor total da coleção
  const getCollectionValue = () => {
    return collection.reduce((acc, item) => {
      const prices = item.cardDetails.tcgplayer?.prices;
      let price = 0;

      if (prices) {
        if (item.variant === 'holo' && prices.holofoil?.market) {
          price = prices.holofoil.market;
        } else if (item.variant === 'reverse' && prices.reverseHolofoil?.market) {
          price = prices.reverseHolofoil.market;
        } else if (prices.normal?.market) {
          price = prices.normal.market;
        } else {
          // Fallback se não achar a variante específica
          price = prices.holofoil?.market || prices.normal?.market || prices.reverseHolofoil?.market || 0;
        }
      }

      return acc + (price * item.quantity);
    }, 0);
  };

  const totalValue = getCollectionValue();


  // Dados mockados para o gráfico com base no timeframe
  const chartData = {
    '7d': [
      { date: '16/07', value: totalValue * 0.95 },
      { date: '17/07', value: totalValue * 0.962 },
      { date: '18/07', value: totalValue * 0.958 },
      { date: '19/07', value: totalValue * 0.975 },
      { date: '20/07', value: totalValue * 0.97 },
      { date: '21/07', value: totalValue * 0.988 },
      { date: '22/07', value: totalValue }
    ],
    '30d': [
      { date: '22/06', value: totalValue * 0.88 },
      { date: '29/06', value: totalValue * 0.91 },
      { date: '06/07', value: totalValue * 0.93 },
      { date: '13/07', value: totalValue * 0.96 },
      { date: '22/07', value: totalValue }
    ],
    'all': [
      { date: 'Jan', value: totalValue * 0.65 },
      { date: 'Fev', value: totalValue * 0.72 },
      { date: 'Mar', value: totalValue * 0.79 },
      { date: 'Abr', value: totalValue * 0.82 },
      { date: 'Mai', value: totalValue * 0.88 },
      { date: 'Jun', value: totalValue * 0.92 },
      { date: 'Jul', value: totalValue }
    ]
  };

  const activePoints = chartData[timeframe];
  const minVal = Math.min(...activePoints.map(p => p.value)) * 0.99;
  const maxVal = Math.max(...activePoints.map(p => p.value)) * 1.01;
  const valRange = maxVal - minVal || 1;

  // Gerar path do SVG para o gráfico de linha e de área
  const height = 120;
  
  const points = activePoints.map((point, index) => {
    const x = (index / (activePoints.length - 1)) * chartWidth;
    const y = height - ((point.value - minVal) / valRange) * (height - 16) - 8; // Margem para os círculos não cortarem
    return { x, y, ...point };
  });

  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  // Calcular progresso por set
  const getSetProgress = (setId: string, printedTotal: number) => {
    // Apenas cartas únicas do set pertencentes à coleção
    const uniqueCardsInSet = collection.filter(item => item.cardDetails.id.startsWith(setId));
    const uniqueCount = uniqueCardsInSet.length;
    const percentage = printedTotal > 0 ? Math.round((uniqueCount / printedTotal) * 100) : 0;
    return {
      percentage,
      count: uniqueCount
    };
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Resumo da Coleção (Estilo Flowbite Area Chart Card) */}
      <section className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-3xl shadow-ambient-lvl1 p-4 md:p-6 flex flex-col justify-between relative">
        <div className="flex justify-between items-start">
          <div className="text-left">
            <h5 className="text-3xl font-extrabold text-on-surface tracking-tight leading-none">
              {formatPrice(totalValue)}
            </h5>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mt-1.5">
              Valor da Coleção TCG
            </p>
          </div>
          <div className="flex items-center gap-0.5 px-2.5 py-1 rounded-full font-bold text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 text-center shadow-inner">
            <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v13m0-13 4 4m-4-4-4 4"/>
            </svg>
            3.8%
          </div>
        </div>

        {/* Gráfico Dinâmico SVG (Estilo Area Chart) */}
        <div ref={chartContainerRef} className="w-full mt-6 h-28 relative">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${height}`}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bc000a" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#bc000a" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Linhas de Grade Horizontais */}
            <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="rgba(0,0,0,0.03)" strokeDasharray="3 3" />
            <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="rgba(0,0,0,0.03)" strokeDasharray="3 3" />
            <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="rgba(0,0,0,0.03)" strokeDasharray="3 3" />
            <line x1="0" y1="120" x2={chartWidth} y2="120" stroke="rgba(0,0,0,0.06)" />
            
            {/* Gráfico de Área */}
            {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
            
            {/* Linha do Gráfico */}
            {linePath && <path d={linePath} fill="none" stroke="#bc000a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            
            {/* Pontos de Destaque */}
            {points.map((p, i) => (
              <g key={i}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="#ffffff" 
                  stroke="#bc000a" 
                  strokeWidth="2.5" 
                  className="transition-all duration-200 hover:r-6 cursor-pointer"
                />
              </g>
            ))}
          </svg>
          
          {/* Rótulos do Gráfico */}
          <div className="flex justify-between w-full mt-2 text-[9px] font-bold text-on-surface-variant px-1">
            {points.map((p, idx) => (
              <span key={idx}>{p.date}</span>
            ))}
          </div>
        </div>

        {/* Rodapé do Painel (Estilo Flowbite Footer) */}
        <div className="grid grid-cols-1 items-center border-t border-outline-variant/10 justify-between mt-6">
          <div className="flex justify-between items-center pt-4">
            
            {/* Dropdown Button */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-xs font-bold text-on-surface-variant hover:text-on-surface text-center inline-flex items-center gap-1 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/10 shadow-sm transition-all" 
                type="button"
              >
                {timeframe === '7d' ? 'Últimos 7 dias' : timeframe === '30d' ? 'Últimos 30 dias' : 'Todo o período'}
                <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m19 9-7 7-7-7"/>
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-2 z-50 bg-white border border-outline-variant/20 rounded-2xl shadow-xl w-44 select-none overflow-hidden animate-fade-in text-left">
                  <ul className="p-1.5 text-xs text-on-surface-variant font-bold">
                    <li>
                      <button 
                        onClick={() => {
                          setTimeframe('7d');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full p-2.5 hover:bg-surface-container-low hover:text-primary rounded-xl transition-all"
                      >
                        Últimos 7 dias
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          setTimeframe('30d');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full p-2.5 hover:bg-surface-container-low hover:text-primary rounded-xl transition-all"
                      >
                        Últimos 30 dias
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          setTimeframe('all');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center w-full p-2.5 hover:bg-surface-container-low hover:text-primary rounded-xl transition-all"
                      >
                        Todo o período
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Link Ver Tudo / Relatório */}
            <button 
              onClick={() => setActiveTab('collection')}
              className="inline-flex items-center text-xs font-bold text-primary hover:underline hover:text-primary-container leading-5 transition-colors"
            >
              Relatório de Valor
              <svg className="w-3.5 h-3.5 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Ações Rápidas */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveTab('scan')}
          className="bg-primary hover:bg-primary-container text-white rounded-2xl py-4 px-4 flex items-center justify-center gap-2 font-bold text-sm shadow-md active:scale-95 duration-200 transition-all border border-primary/10"
        >
          <Scan size={18} />
          Escanear Carta
        </button>
        
        <button 
          onClick={() => setActiveTab('search')}
          className="bg-surface-container-lowest border border-tertiary/20 text-tertiary hover:bg-surface-container-low rounded-2xl py-4 px-4 flex items-center justify-center gap-2 font-bold text-sm shadow-sm active:scale-95 duration-200 transition-all"
        >
          <Search size={18} />
          Buscar no Banco
        </button>
      </section>

      {/* Adições Recentes (Carrossel Horizontal) */}
      <section>
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-base font-extrabold text-on-surface flex items-center gap-1.5">
            <Sparkles size={18} className="text-amber-500 animate-pulse" />
            Adições Recentes
          </h3>
          <button 
            onClick={() => setActiveTab('collection')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            Ver Tudo
            <ChevronRight size={14} />
          </button>
        </div>

        {collection.length === 0 ? (
          <div className="bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-2xl p-8 text-center text-on-surface-variant text-sm">
            <BookOpen size={28} className="mx-auto mb-2 opacity-40 text-primary" />
            Sua coleção está vazia. Comece escaneando!
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-4 snap-x scrollbar-hide no-scrollbar">
            {collection.slice(0, 5).map((item) => {
              const prices = item.cardDetails.tcgplayer?.prices;
              const marketPrice = item.variant === 'holo' && prices?.holofoil?.market
                ? prices.holofoil.market
                : prices?.normal?.market || 10.00;

              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    setSelectedCardId(item.cardDetails.id);
                    setActiveTab('search');
                  }}
                  className="min-w-[145px] w-[145px] bg-surface-container-lowest rounded-2xl p-2.5 shadow-ambient-lvl1 border border-outline-variant/10 snap-start flex-shrink-0 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="relative w-full aspect-[63/88] rounded-xl bg-surface-container overflow-hidden mb-2 shadow-sm">
                    <img 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      src={item.cardDetails.images.small} 
                      alt={item.cardDetails.name}
                    />
                    <div className="absolute bottom-1 left-1 right-1 flex justify-between items-end">
                      <span className="bg-black/75 text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider">
                        #{item.cardDetails.number}
                      </span>
                      <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-xs text-on-surface truncate pr-1">
                    {item.cardDetails.name}
                  </div>
                  <div className="text-[9px] font-bold text-on-surface-variant/80 uppercase mt-0.5">
                    {item.cardDetails.rarity || 'Comum'}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-outline-variant/10">
                    <span className="font-extrabold text-[11px] text-on-surface">
                      {formatPrice(marketPrice)}
                    </span>
                    <TrendingUp size={12} className="text-emerald-600" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Progresso do Conjunto (Binder Set Completeness) */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Award size={18} className="text-primary" />
          <h3 className="text-base font-extrabold text-on-surface">Progresso do Conjunto</h3>
        </div>
        
        <div className="space-y-3">
          {MOCK_SETS.map((set) => {
            const { percentage, count } = getSetProgress(set.id, set.printedTotal);
            
            return (
              <div 
                key={set.id}
                onClick={() => {
                  setSelectedSetId(set.id);
                  setActiveTab('collection');
                }}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-ambient-lvl1 border border-outline-variant/10 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low hover:border-primary/10 transition-all active:scale-[0.99]"
              >
                <div className="w-14 h-10 bg-white rounded-lg flex items-center justify-center border border-outline-variant/20 overflow-hidden p-1 flex-shrink-0 shadow-sm">
                  <img 
                    className="w-full h-full object-contain"
                    src={set.images.logo} 
                    alt={set.name}
                  />
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-extrabold text-xs text-on-surface truncate">{set.name}</h4>
                    <span className="text-[10px] font-bold text-on-surface-variant">{count}/{set.printedTotal}</span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-medium mt-0.5">{set.series}</div>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-grow h-2 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage > 75 ? 'bg-emerald-500' : percentage > 30 ? 'bg-secondary-container' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-[9px] text-on-surface-variant w-8 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
                
                <ChevronRight size={18} className="text-on-surface-variant/60 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
