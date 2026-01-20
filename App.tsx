
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatBubble from './components/ChatBubble';
import { Message } from './types';
import { parseWhatsAppExport } from './services/parser';
import { analyzeChatHistory } from './services/geminiService';
import { saveChatToDisk, saveMediaToDisk, loadChatFromDisk, clearAllData } from './services/storage';
import { exportMemoryBackup, importMemoryBackup, downloadBackup } from './services/backup';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<string, File>>(new Map());
  const [partnerName, setPartnerName] = useState('Brunno Rossetti');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = 'file-upload';
  const folderInputId = 'folder-upload';
  const backupInputId = 'backup-upload';
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hiddenInputStyle: React.CSSProperties = {
    position: 'fixed',
    top: '-1000px',
    left: '-1000px',
    width: '1px',
    height: '1px',
    opacity: 0,
  };

  // Load persistent memory on mount
  useEffect(() => {
    const initMemory = async () => {
      try {
        const stored = await loadChatFromDisk();
        if (stored) {
          setMessages(stored.messages);
          setPartnerName(stored.partnerName);
          setMediaMap(stored.mediaMap);
          setIsPersistent(true);
        }
      } catch (err) {
        console.error("Failed to load digital memory", err);
      } finally {
        setIsLoading(false);
      }
    };
    initMemory();
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const txtFile = fileArray.find(f => f.name.endsWith('.txt'));
    const mediaFiles = fileArray.filter(f => !f.name.endsWith('.txt'));

    // Update media library locally and on disk
    // Fix: Explicitly type the Map constructor to resolve 'Map<unknown, unknown>' error on state update
    const newMediaMap = new Map<string, File>(mediaMap);
    mediaFiles.forEach(file => {
      newMediaMap.set(file.name, file);
    });
    setMediaMap(newMediaMap);
    await saveMediaToDisk(newMediaMap);

    // If a text file was part of the selection, parse it
    if (txtFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const myName = "Raquel"; 
        const parsedMessages = parseWhatsAppExport(text, myName);
        
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
          const otherSender = parsedMessages.find(m => !m.isMe && m.sender !== 'System')?.sender;
          const detectedName = otherSender?.toLowerCase().includes('brunno') ? 'Brunno Rossetti' : (otherSender || partnerName);
          setPartnerName(detectedName);
          
          // Commit to permanent storage
          await saveChatToDisk(parsedMessages, detectedName);
          setIsPersistent(true);
        }
      };
      reader.readAsText(txtFile);
    }
  };

  const handleClearMemory = async () => {
    if (window.confirm("Isso apagará todas as mensagens e mídias salvas neste navegador. Tem certeza?")) {
      await clearAllData();
      setMessages([]);
      setMediaMap(new Map());
      setPartnerName('Brunno Rossetti');
      setIsPersistent(false);
      setAiAnalysis(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // Allow re-selecting the same files/folder in a single session
    e.target.value = '';
  };

  const handleExportBackup = async () => {
    const blob = await exportMemoryBackup();
    if (!blob) {
      alert('Nenhuma memória encontrada para exportar.');
      return;
    }
    const filename = `chatmemory-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    downloadBackup(blob, filename);
  };

  const handleBackupImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportingBackup(true);
    try {
      const restored = await importMemoryBackup(file);
      setMessages(restored.messages);
      setPartnerName(restored.partnerName);
      setMediaMap(restored.mediaMap);
      setIsPersistent(true);
    } catch (err) {
      console.error('Backup import failed', err);
      alert('Falha ao importar o backup. Verifique se o arquivo está correto.');
    } finally {
      setIsImportingBackup(false);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleAiAnalysis = async () => {
    if (messages.length === 0) return;
    setIsAnalyzing(true);
    const result = await analyzeChatHistory(messages);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0b141a] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00a884]/20 border-t-[#00a884] rounded-full animate-spin mb-6"></div>
        <p className="text-[#8696a0] font-medium tracking-widest uppercase text-xs animate-pulse">Abrindo Cápsula do Tempo...</p>
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen w-screen bg-[#0b141a] overflow-hidden text-[#d1d7db] relative font-sans select-none"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-[#0b141a]/95 z-[100] flex flex-col items-center justify-center border-4 border-dashed border-[#00a884] m-4 rounded-3xl pointer-events-none transition-all duration-300">
          <div className="bg-[#00a884]/10 p-10 rounded-full animate-bounce mb-6 border border-[#00a884]/30 shadow-2xl">
            <svg className="w-24 h-24 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight text-center px-10">Solte a história e as mídias para eternizá-las</p>
        </div>
      )}

      <input 
        id={fileInputId}
        type="file" 
        multiple
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        style={hiddenInputStyle}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input 
        id={folderInputId}
        type="file"
        multiple
        // @ts-expect-error - non-standard attribute supported by Chromium/WebKit
        webkitdirectory="true"
        // @ts-expect-error - non-standard attribute supported by Chromium/WebKit
        directory="true"
        // @ts-expect-error - non-standard attribute supported by Firefox
        mozdirectory="true"
        ref={folderInputRef}
        onChange={handleFileUpload}
        style={hiddenInputStyle}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input 
        id={backupInputId}
        type="file"
        accept=".zip,application/zip"
        ref={backupInputRef}
        onChange={handleBackupImport}
        style={hiddenInputStyle}
        tabIndex={-1}
        aria-hidden="true"
      />

      <Sidebar 
        partnerName={partnerName} 
        fileInputId={fileInputId}
        folderInputId={folderInputId}
        backupInputId={backupInputId}
        onExportBackup={handleExportBackup}
        isImportingBackup={isImportingBackup}
        onAnalyze={handleAiAnalysis}
        onClear={handleClearMemory}
        isAnalyzing={isAnalyzing}
        mediaCount={mediaMap.size}
        isPersistent={isPersistent}
      />

      <main className="flex-1 flex flex-col relative bg-[#0b141a] min-w-0 h-full">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_tyC1_t_n.png')] bg-repeat z-0" />

        <header className="bg-[#202c33] p-3 flex items-center justify-between z-20 shadow-md border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4 ml-2">
            <div className="w-11 h-11 rounded-full bg-[#6a7175] flex items-center justify-center text-2xl shadow-inner border border-white/10 ring-1 ring-black/20 overflow-hidden">
               ❤️
            </div>
            <div className="cursor-pointer">
              <h2 className="text-[#e9edef] font-bold leading-tight tracking-wide text-lg">{partnerName}</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse"></div>
                <p className="text-[#00a884] text-[12px] font-bold uppercase tracking-wider">Memória Ativa</p>
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-[#aebac1] mr-4 items-center">
             <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-[11px] font-bold">
               <span className="text-[#00a884]">{mediaMap.size}</span> ARQUIVOS ETERNIZADOS
             </div>
             <svg className="w-5 h-5 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <svg className="w-5 h-5 cursor-pointer hover:text-white transition-all active:scale-90" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 00-2-2z" /></svg>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:px-12 lg:px-24 xl:px-48 flex flex-col z-10 custom-scrollbar scroll-smooth relative">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-90 animate-in fade-in duration-1000">
              <div className="w-64 h-64 mb-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
                 <span className="text-9xl animate-pulse drop-shadow-lg">✨</span>
              </div>
              <h1 className="text-5xl font-black mb-4 text-white tracking-tighter uppercase italic">Cápsula Digital</h1>
              <p className="max-w-md text-[#8696a0] leading-relaxed mb-10 text-xl font-light">
                Arraste suas mensagens e todas as <strong>{mediaMap.size || '1000+'}</strong> mídias aqui para que elas nunca sejam esquecidas.
              </p>
              <label 
                htmlFor={folderInputId}
                role="button"
                tabIndex={0}
                className="bg-[#00a884] text-[#111b21] px-14 py-5 rounded-2xl font-black text-xl hover:bg-[#06cf9c] hover:scale-105 active:scale-95 transition-all shadow-2xl ring-4 ring-[#00a884]/20 uppercase tracking-widest cursor-pointer"
              >
                Importar Pasta Completa
              </label>
              <label 
                htmlFor={fileInputId}
                role="button"
                tabIndex={0}
                className="mt-4 text-[#00a884] text-xs font-black uppercase tracking-widest hover:text-[#06cf9c] transition-colors cursor-pointer"
              >
                ou selecionar arquivos manualmente
              </label>
              <div className="mt-10 flex flex-col items-center gap-3">
                <button
                  onClick={handleExportBackup}
                  className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80 hover:text-white transition-colors"
                >
                  Salvar Backup da Memória
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
            </div>
          ) : (
            <div className="flex flex-col min-w-0 w-full">
              <div className="mx-auto bg-[#182229] text-[#8696a0] text-[10px] py-2.5 px-6 rounded-full uppercase tracking-[0.3em] mb-12 shadow-md border border-white/5 text-center mt-6 font-black">
                {isPersistent ? 'Memória Sincronizada com o Navegador' : 'Memória Temporária (Sincronize para Salvar)'}
              </div>
              {messages.map((msg, idx) => {
                const showDate = idx === 0 || 
                  messages[idx-1].timestamp.toDateString() !== msg.timestamp.toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="sticky top-2 z-20 flex justify-center my-8">
                        <div className="bg-[#182229] text-[#8696a0] text-[12px] py-2 px-6 rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl font-black uppercase tracking-widest">
                          {msg.timestamp.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    )}
                    <ChatBubble 
                      message={msg} 
                      onClick={(m) => setSelectedMessage(m)}
                      mediaMap={mediaMap}
                    />
                  </React.Fragment>
                );
              })}
              <div ref={chatEndRef} className="h-20 shrink-0" />
            </div>
          )}
        </div>

        {aiAnalysis && (
          <div className="absolute right-8 top-24 w-[360px] bg-[#202c33] border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 animate-in slide-in-from-right fade-in overflow-hidden max-h-[80vh] flex flex-col ring-1 ring-white/10 backdrop-blur-3xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#2a3942]/80">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪄</span>
                <h3 className="font-black text-[#e9edef] tracking-tighter uppercase italic">Vibe da História</h3>
              </div>
              <button onClick={() => setAiAnalysis(null)} className="text-[#8696a0] hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-7 overflow-y-auto flex flex-col gap-9 text-sm custom-scrollbar">
              <section>
                <h4 className="text-[#00a884] font-black mb-3 uppercase text-[10px] tracking-widest border-b border-[#00a884]/20 pb-1">Análise da Alma</h4>
                <p className="text-[#d1d7db] italic leading-relaxed text-[16px] font-serif">"{aiAnalysis.sentiment}"</p>
              </section>
              <section>
                <h4 className="text-[#00a884] font-black mb-3 uppercase text-[10px] tracking-widest border-b border-[#00a884]/20 pb-1">Linhas de Conexão</h4>
                <ul className="space-y-4">
                  {aiAnalysis.themes.map((t: string, i: number) => (
                    <li key={i} className="flex gap-4 items-start bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-[#00a884] text-xl leading-none">•</span> 
                      <span className="text-[#d1d7db] text-[14px] leading-tight font-medium">{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="bg-[#00a884]/20 p-6 rounded-[2rem] border border-[#00a884]/40 shadow-inner">
                 <h4 className="text-[#00a884] font-black mb-2 uppercase text-[10px] tracking-widest">Dica Para o Futuro</h4>
                 <p className="text-[#e9edef] text-[14px] italic leading-relaxed font-serif">"{aiAnalysis.advice}"</p>
              </section>
            </div>
          </div>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-md transition-all duration-500" onClick={() => setSelectedMessage(null)}>
            <div className="bg-[#202c33] p-12 rounded-[3rem] max-w-2xl w-full shadow-[0_0_150px_rgba(0,168,132,0.15)] animate-in zoom-in-95 duration-500 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-full bg-[#374151] flex items-center justify-center text-5xl shadow-inner border border-white/10 ring-4 ring-white/5 overflow-hidden">
                  {selectedMessage.isMe ? '👤' : '❤️'}
                </div>
                <div>
                  <h3 className="text-[#e9edef] text-3xl font-black tracking-tighter uppercase italic">{selectedMessage.sender}</h3>
                  <p className="text-[#8696a0] text-[15px] font-black mt-1 uppercase tracking-[0.25em] opacity-80">
                    {selectedMessage.timestamp.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} • {selectedMessage.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="bg-[#0b141a] p-12 rounded-[2.5rem] text-[#e9edef] mb-12 whitespace-pre-wrap italic border border-white/10 text-[22px] leading-relaxed shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)] max-h-[50vh] overflow-y-auto custom-scrollbar font-serif">
                "{selectedMessage.content.replace('‎', '')}"
              </div>
              <div className="flex justify-end gap-8 items-center">
                 <button onClick={() => setSelectedMessage(null)} className="text-[#8696a0] font-black transition-all uppercase text-xs tracking-[0.3em] hover:text-white">Voltar</button>
                 <button className="bg-[#00a884] text-[#111b21] py-5 px-14 rounded-2xl font-black hover:bg-[#06cf9c] transition-all shadow-2xl active:scale-95 text-sm uppercase tracking-widest ring-4 ring-[#00a884]/20">
                   Eternizar Agora
                 </button>
              </div>
            </div>
          </div>
        )}

        <footer className="bg-[#202c33] p-4 flex items-center gap-5 z-20 shadow-2xl border-t border-white/5 shrink-0">
          <div className="flex gap-7 text-[#8696a0] ml-4">
            <svg className="w-7 h-7 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <svg className="w-7 h-7 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <input 
              type="text" 
              placeholder="Pesquise por palavras ou sentimentos..." 
              className="w-full bg-[#2a3942] border-none rounded-[1.25rem] text-[#d1d7db] text-[16px] py-4 px-7 focus:ring-2 focus:ring-[#00a884] placeholder-[#8696a0]/50 shadow-inner transition-all truncate font-medium"
            />
          </div>
          <div className="text-[#8696a0] mr-5 ml-2">
             <svg className="w-7 h-7 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
