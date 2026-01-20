
import React from 'react';

interface SidebarProps {
  partnerName: string;
  fileInputId: string;
  folderInputId: string;
  backupInputId: string;
  onExportBackup: () => void;
  isImportingBackup: boolean;
  onAnalyze: () => void;
  onClear: () => void;
  isAnalyzing: boolean;
  mediaCount: number;
  isPersistent: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  partnerName, 
  fileInputId,
  folderInputId,
  backupInputId,
  onExportBackup,
  isImportingBackup,
  onAnalyze, 
  onClear,
  isAnalyzing, 
  mediaCount,
  isPersistent 
}) => {
  return (
    <div className="hidden md:flex w-[350px] lg:w-[400px] bg-[#111b21] border-r border-[#222d34] flex-col h-full overflow-hidden flex-shrink-0">
      {/* Sidebar Header */}
      <div className="bg-[#202c33] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6a7175] overflow-hidden flex items-center justify-center border border-white/5">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#e9edef] text-sm font-medium">Meu Perfil</span>
            <span className="text-[10px] text-[#00a884] font-bold uppercase tracking-tighter">Cápsula Ativa</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={onClear}
            className="p-2 text-[#8696a0] hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
            title="Limpar Memória"
           >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Memory Status */}
      <div className="px-4 py-3 bg-[#182229]/50 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[#8696a0] uppercase font-bold tracking-widest">Status da Memória</span>
          {isPersistent ? (
             <span className="flex items-center gap-1 text-[10px] text-[#00a884] font-bold">
               <div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-pulse" />
               SALVO NO NAVEGADOR
             </span>
          ) : (
             <span className="text-[10px] text-yellow-500 font-bold italic">NÃO SINCRONIZADO</span>
          )}
        </div>
        <p className="text-[12px] text-[#d1d7db] font-medium">
          {mediaCount > 0 ? `${mediaCount.toLocaleString('pt-BR')} mídias eternizadas` : 'Nenhuma mídia carregada'}
        </p>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-[#2a3942] p-4 flex gap-4 cursor-pointer hover:bg-[#202c33] transition-all">
          <div className="w-12 h-12 rounded-full bg-[#374151] flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 shadow-lg ring-2 ring-[#00a884]/20">
             <span className="text-white text-2xl">❤️</span>
          </div>
          <div className="flex-1 border-b border-[#222d34] pb-3 overflow-hidden">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#e9edef] font-bold text-[15px]">{partnerName}</span>
              <span className="text-[11px] text-[#00a884] font-black">ONLINE</span>
            </div>
            <p className="text-[#8696a0] text-sm truncate italic font-serif">"Onde nossas histórias vivem para sempre..."</p>
          </div>
        </div>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="p-5 border-t border-[#222d34] flex flex-col gap-4 bg-[#111b21]">
        <label 
          htmlFor={folderInputId}
          role="button"
          tabIndex={0}
          className="w-full bg-[#00a884] text-[#111b21] py-3.5 px-4 rounded-xl font-black hover:bg-[#06cf9c] transition-all flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(0,168,132,0.3)] active:scale-[0.97] cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          Importar Pasta Completa
        </label>
        <label 
          htmlFor={fileInputId}
          role="button"
          tabIndex={0}
          className="w-full bg-white/5 text-white py-2.5 px-4 rounded-xl font-bold hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-3 active:scale-[0.97] cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Selecionar Arquivos
        </label>
        <button 
          onClick={onAnalyze}
          disabled={isAnalyzing || mediaCount === 0}
          className="w-full bg-white/5 text-white py-3 px-4 rounded-xl font-bold hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-30 active:scale-[0.97]"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Lendo Estrelas...</span>
            </div>
          ) : (
            <>
               <span className="text-lg">✨</span>
              Insights da História
            </>
          )}
        </button>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onExportBackup}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80 hover:text-white transition-colors"
          >
            Salvar Backup
          </button>
          <label
            htmlFor={backupInputId}
            role="button"
            tabIndex={0}
            className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00a884] hover:text-[#06cf9c] transition-colors cursor-pointer"
          >
            Restaurar Backup
          </label>
          {isImportingBackup && (
            <span className="text-[10px] text-[#8696a0] uppercase tracking-[0.2em]">
              Importando...
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#8696a0] text-center italic opacity-50 px-4">
          Privacidade garantida: seus dados nunca saem deste navegador.
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
