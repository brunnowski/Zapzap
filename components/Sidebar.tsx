
import React from 'react';

interface SidebarProps {
  partnerName: string;
  onImport: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ partnerName, onImport, onAnalyze, isAnalyzing }) => {
  return (
    <div className="hidden md:flex w-[350px] lg:w-[400px] bg-[#111b21] border-r border-[#222d34] flex-col h-full overflow-hidden flex-shrink-0">
      {/* Sidebar Header */}
      <div className="bg-[#202c33] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6a7175] overflow-hidden flex items-center justify-center border border-white/5">
            <span className="text-lg">👤</span>
          </div>
        </div>
        <div className="flex gap-4 text-[#aebac1]">
          <button className="hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="p-2">
        <div className="bg-[#202c33] flex items-center gap-4 px-4 py-2 rounded-lg">
          <svg className="w-5 h-5 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-transparent border-none focus:ring-0 text-[#d1d7db] text-sm w-full placeholder-[#8696a0]"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-[#2a3942] p-3 flex gap-4 cursor-pointer hover:bg-[#202c33] transition-colors">
          <div className="w-12 h-12 rounded-full bg-[#374151] flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 shadow-sm">
             <span className="text-white text-xl">❤️</span>
          </div>
          <div className="flex-1 border-b border-[#222d34] pb-2 overflow-hidden">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#e9edef] font-medium">{partnerName}</span>
              <span className="text-[12px] text-[#8197a4]">agora</span>
            </div>
            <p className="text-[#8696a0] text-sm truncate italic">Cápsula de memórias ativa...</p>
          </div>
        </div>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="p-4 border-t border-[#222d34] flex flex-col gap-3 bg-[#111b21]">
        <button 
          onClick={onImport}
          className="w-full bg-[#00a884] text-[#111b21] py-2.5 px-4 rounded-full font-bold hover:bg-[#06cf9c] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importar Chat (.txt)
        </button>
        <button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full bg-white/5 text-white py-2.5 px-4 rounded-full font-semibold hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Analisando...</span>
            </div>
          ) : (
            <>
               <svg className="w-5 h-5 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Insights da História
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
