
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatBubble from './components/ChatBubble';
import { Message } from './types';
import { parseWhatsAppExport } from './services/parser';
import { analyzeChatHistory } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaMap, setMediaMap] = useState<Map<string, File>>(new Map());
  const [partnerName, setPartnerName] = useState('Brunno Rossetti');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const txtFile = fileArray.find(f => f.name.endsWith('.txt'));
    const mediaFiles = fileArray.filter(f => !f.name.endsWith('.txt'));

    // Update media library
    const newMediaMap = new Map(mediaMap);
    mediaFiles.forEach(file => {
      newMediaMap.set(file.name, file);
    });
    setMediaMap(newMediaMap);

    // If a text file was part of the selection, parse it
    if (txtFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const myName = "Raquel"; 
        const parsedMessages = parseWhatsAppExport(text, myName);
        
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
          const otherSender = parsedMessages.find(m => !m.isMe && m.sender !== 'System')?.sender;
          if (otherSender) {
            setPartnerName(otherSender.toLowerCase().includes('brunno') ? 'Brunno Rossetti' : otherSender);
          }
        }
      };
      reader.readAsText(txtFile);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
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
          <p className="text-3xl font-bold text-white tracking-tight">Solte a história e as mídias aqui</p>
          <p className="text-[#8696a0] mt-2">Você pode soltar o .txt e a pasta de mídia juntos</p>
        </div>
      )}

      <input 
        type="file" 
        multiple
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden"
      />

      <Sidebar 
        partnerName={partnerName} 
        onImport={() => fileInputRef.current?.click()}
        onAnalyze={handleAiAnalysis}
        isAnalyzing={isAnalyzing}
      />

      <main className="flex-1 flex flex-col relative bg-[#0b141a] min-w-0 h-full">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_tyC1_t_n.png')] bg-repeat z-0" />

        <header className="bg-[#202c33] p-3 flex items-center justify-between z-20 shadow-md border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-xl shadow-inner border border-white/10 ring-1 ring-black/20">
              ❤️
            </div>
            <div className="cursor-pointer">
              <h2 className="text-[#e9edef] font-semibold leading-tight tracking-wide">{partnerName}</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse"></div>
                <p className="text-[#00a884] text-[11.5px] font-medium">online</p>
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-[#aebac1] mr-4">
             <div className="text-xs bg-white/5 px-2 py-1 rounded border border-white/10 hidden lg:block">
               {mediaMap.size} arquivos de mídia carregados
             </div>
             <svg className="w-5 h-5 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <svg className="w-5 h-5 cursor-pointer hover:text-white transition-all active:scale-90" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 00-2-2z" /></svg>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:px-12 lg:px-24 xl:px-48 flex flex-col z-10 custom-scrollbar scroll-smooth relative">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-90 animate-in fade-in duration-1000">
              <div className="w-56 h-56 mb-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
                 <span className="text-8xl animate-pulse drop-shadow-lg">✨</span>
              </div>
              <h1 className="text-4xl font-black mb-4 text-white tracking-tighter">Memória Digital</h1>
              <p className="max-w-md text-[#8696a0] leading-relaxed mb-10 text-lg">
                Selecione o arquivo <strong>_chat.txt</strong> e todos os arquivos de mídia da sua exportação para começar.
              </p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#00a884] text-[#111b21] px-12 py-4 rounded-full font-black text-lg hover:bg-[#06cf9c] hover:scale-105 active:scale-95 transition-all shadow-2xl ring-4 ring-[#00a884]/20"
              >
                Carregar Chat e Mídias
              </button>
            </div>
          ) : (
            <div className="flex flex-col min-w-0 w-full">
              <div className="mx-auto bg-[#182229] text-[#8696a0] text-[11px] py-2 px-5 rounded-full uppercase tracking-[0.2em] mb-12 shadow-md border border-white/5 text-center mt-6 font-bold">
                Cápsula carregada com {mediaMap.size} arquivos de mídia
              </div>
              {messages.map((msg, idx) => {
                const showDate = idx === 0 || 
                  messages[idx-1].timestamp.toDateString() !== msg.timestamp.toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="sticky top-2 z-20 flex justify-center my-8">
                        <div className="bg-[#182229] text-[#8696a0] text-[12px] py-2 px-5 rounded-lg shadow-xl border border-white/10 backdrop-blur-lg font-bold uppercase tracking-wide">
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
              <div ref={chatEndRef} className="h-16 shrink-0" />
            </div>
          )}
        </div>

        {aiAnalysis && (
          <div className="absolute right-6 top-20 w-[340px] bg-[#202c33] border border-white/10 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right fade-in overflow-hidden max-h-[80vh] flex flex-col ring-1 ring-white/10 backdrop-blur-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#2a3942]">
              <div className="flex items-center gap-3">
                <span className="text-xl">✨</span>
                <h3 className="font-bold text-[#e9edef] tracking-tight">Coração da IA</h3>
              </div>
              <button onClick={() => setAiAnalysis(null)} className="text-[#8696a0] hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex flex-col gap-8 text-sm custom-scrollbar">
              <section>
                <h4 className="text-[#00a884] font-black mb-3 uppercase text-[10px] tracking-widest border-b border-[#00a884]/20 pb-1">Essência do Chat</h4>
                <p className="text-[#d1d7db] italic leading-relaxed text-[15px] font-serif">"{aiAnalysis.sentiment}"</p>
              </section>
              <section>
                <h4 className="text-[#00a884] font-black mb-3 uppercase text-[10px] tracking-widest border-b border-[#00a884]/20 pb-1">Conexões</h4>
                <ul className="space-y-3">
                  {aiAnalysis.themes.map((t: string, i: number) => (
                    <li key={i} className="flex gap-3 leading-snug items-start">
                      <span className="text-[#00a884] text-lg leading-none mt-0.5">•</span> 
                      <span className="text-[#d1d7db] text-[13.5px]">{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h4 className="text-[#00a884] font-black mb-3 uppercase text-[10px] tracking-widest border-b border-[#00a884]/20 pb-1">Cronologia Afetiva</h4>
                <div className="space-y-3">
                  {aiAnalysis.milestones.map((m: string, i: number) => (
                    <div key={i} className="bg-white/5 p-4 rounded-xl border-l-4 border-[#00a884] text-[#d1d7db] text-[13px] leading-relaxed shadow-lg font-medium">
                      {m}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300" onClick={() => setSelectedMessage(null)}>
            <div className="bg-[#202c33] p-10 rounded-[2.5rem] max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 rounded-full bg-[#374151] flex items-center justify-center text-4xl shadow-inner border border-white/10 ring-2 ring-white/5">
                  {selectedMessage.isMe ? '👤' : '❤️'}
                </div>
                <div>
                  <h3 className="text-[#e9edef] text-2xl font-black tracking-tight">{selectedMessage.sender}</h3>
                  <p className="text-[#8696a0] text-[14px] font-bold mt-1 uppercase tracking-widest">
                    {selectedMessage.timestamp.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} • {selectedMessage.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="bg-[#0b141a] p-10 rounded-[2rem] text-[#e9edef] mb-10 whitespace-pre-wrap italic border border-white/5 text-[20px] leading-relaxed shadow-inner max-h-[50vh] overflow-y-auto custom-scrollbar font-serif">
                "{selectedMessage.content.replace('‎', '')}"
              </div>
              <div className="flex justify-end gap-6 items-center">
                 <button onClick={() => setSelectedMessage(null)} className="text-[#8696a0] font-bold transition-all uppercase text-xs tracking-[0.2em]">Voltar</button>
                 <button className="bg-[#00a884] text-[#111b21] py-4 px-12 rounded-full font-black hover:bg-[#06cf9c] transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest">
                   Eternizar
                 </button>
              </div>
            </div>
          </div>
        )}

        <footer className="bg-[#202c33] p-3 flex items-center gap-4 z-20 shadow-2xl border-t border-white/5 shrink-0">
          <div className="flex gap-6 text-[#8696a0] ml-4">
            <svg className="w-6 h-6 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <svg className="w-6 h-6 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <input 
              type="text" 
              placeholder="Pesquise lembranças..." 
              className="w-full bg-[#2a3942] border-none rounded-2xl text-[#d1d7db] text-[15px] py-3.5 px-6 focus:ring-1 focus:ring-[#00a884] placeholder-[#8696a0] shadow-inner transition-all truncate"
            />
          </div>
          <div className="text-[#8696a0] mr-4 ml-2">
             <svg className="w-6 h-6 cursor-pointer hover:text-white transition-all active:scale-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
