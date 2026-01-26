
import React, { useMemo } from 'react';
import { Message } from '../types';
import { extractFilename } from '../services/parser';

interface ChatBubbleProps {
  message: Message;
  onClick: (msg: Message) => void;
  mediaMap: Map<string, File>;
}

const MEDIA_DIR = import.meta.env.VITE_MEDIA_DIR || '';
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || '';

const getMediaUrl = (filename: string, mediaMap: Map<string, File>): string | null => {
  const mediaFile = mediaMap.get(filename);
  if (mediaFile) {
    return URL.createObjectURL(mediaFile);
  }

  if (MEDIA_DIR) {
    const normalizedDir = MEDIA_DIR.replace(/\/$/, '');
    const fullPath = `${normalizedDir}/${filename}`;
    return encodeURI(`/@fs/${fullPath}`);
  }

  if (MEDIA_BASE_URL) {
    const normalizedBase = MEDIA_BASE_URL.replace(/\/$/, '');
    return `${normalizedBase}/${encodeURIComponent(filename)}`;
  }

  return null;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onClick, mediaMap }) => {
  const isMe = message.isMe;

  // Render system messages
  if (message.type === 'system' || message.content.includes('criptografia') || message.content.includes('código de segurança')) {
    return (
      <div className="flex justify-center my-4 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-[#182229] text-[#ffd279] text-[11.5px] py-1.5 px-4 rounded-lg shadow-sm border border-white/5 text-center max-w-[90%] leading-relaxed uppercase tracking-wider font-medium">
          {message.content.replace('‎', '')}
        </div>
      </div>
    );
  }

  const renderMedia = (content: string) => {
    const filename = extractFilename(content);
    const mediaUrl =
      filename
        ? getMediaUrl(filename, mediaMap) ||
          `${import.meta.env.BASE_URL}media/${encodeURIComponent(filename)}`
        : null;
    const mediaFile = filename ? mediaMap.get(filename) : null;

    const isAudio = content.toUpperCase().includes('AUDIO') || (filename?.endsWith('.opus'));
    const isPhoto = content.toUpperCase().includes('PHOTO') || (filename?.match(/\.(jpg|jpeg|png|webp)$/i));
    const isVideo = content.toUpperCase().includes('VIDEO') || (filename?.match(/\.(mp4|mov)$/i));
    const isSticker = content.toUpperCase().includes('STICKER') || (filename?.endsWith('.webp') && content.includes('STICKER'));

    if (isAudio && mediaUrl) {
      return (
        <div className="flex flex-col gap-2 py-2 min-w-[240px]">
          <audio controls className="h-10 w-full accent-[#00a884]">
            <source src={mediaUrl} type={mediaFile?.type} />
          </audio>
          <span className="text-[11px] opacity-60 px-2 italic">Áudio compartilhado</span>
        </div>
      );
    }

    if (isPhoto && mediaUrl) {
      return (
        <div className="py-1">
          <img 
            src={mediaUrl} 
            alt="Mídia" 
            className="rounded-lg max-h-[400px] w-full object-cover shadow-lg border border-white/5 hover:opacity-95 transition-opacity"
            loading="lazy"
          />
        </div>
      );
    }

    if (isVideo && mediaUrl) {
      return (
        <div className="py-1">
          <video 
            controls 
            className="rounded-lg max-h-[400px] w-full shadow-lg border border-white/5"
            poster="https://via.placeholder.com/300x200/0b141a/8696a0?text=Vídeo"
          >
            <source src={mediaUrl} type={mediaFile?.type} />
          </video>
        </div>
      );
    }

    if (isSticker && mediaUrl) {
      return (
        <div className="p-1">
          <img src={mediaUrl} alt="Sticker" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
        </div>
      );
    }

    // Fallback if media is missing from the uploaded set
    if (filename) {
      return (
        <div className="flex items-center gap-3 text-[#8696a0] italic py-2 pr-4">
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13.5px] font-medium">Mídia não carregada</span>
            <span className="text-[10px] opacity-60 truncate max-w-[150px]">{filename}</span>
          </div>
        </div>
      );
    }

    // Normalizing text
    const cleanContent = content.replace('‎', '').trim();

    // Call notifications
    if (cleanContent.includes('Ligação de voz') || cleanContent.includes('Ligação de vídeo')) {
      const isMissed = cleanContent.includes('Não atendida');
      return (
        <div className="flex items-center gap-3 text-[#e9edef] py-1 pr-6">
          <div className={`p-2.5 rounded-full ${isMissed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[14.5px] font-medium">{cleanContent.split('.')[0]}</span>
            <span className="text-[11px] opacity-60 uppercase">{isMissed ? 'Perdida' : 'Realizada'}</span>
          </div>
        </div>
      );
    }

    // Edited message marker
    if (cleanContent.includes('<Mensagem editada>')) {
      const textOnly = cleanContent.replace('<Mensagem editada>', '').trim();
      return (
        <div className="flex flex-col">
          <span className="text-[14.2px] leading-[1.45]">{textOnly}</span>
          <span className="text-[10px] opacity-60 mt-1 text-right italic">editada</span>
        </div>
      );
    }

    return <span className="text-[14.2px] leading-[1.45] block">{cleanContent}</span>;
  };

  return (
    <div className={`flex w-full mb-1 transition-all animate-in fade-in slide-in-from-bottom-1 duration-500 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div 
        onClick={() => onClick(message)}
        className={`max-w-[85%] md:max-w-[70%] lg:max-w-[65%] xl:max-w-[60%] rounded-lg px-2.5 py-1.5 shadow-sm relative cursor-pointer select-none ${
          isMe 
            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
            : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-white/5'
        } hover:brightness-110 active:scale-[0.99] transition-all`}
      >
        {!isMe && (
          <div className="text-[12.5px] font-bold text-[#53bdeb] mb-0.5 ml-0.5">
            {message.sender.split(' ')[0]}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words px-0.5">
          {renderMedia(message.content)}
        </div>
        <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end select-none ${isMe ? 'text-[#aebac1]' : 'text-[#8696a0]'}`}>
          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {isMe && (
            <svg className="w-4 h-4 text-[#53bdeb]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.0002 17.5858L4.7073 10.2929L3.29309 11.7071L12.0002 20.4142L20.7073 11.7071L19.2931 10.2929L12.0002 17.5858Z"/>
              <path d="M12.0002 12.5858L4.7073 5.2929L3.29309 6.7071L12.0002 15.4142L20.7073 6.7071L19.2931 5.2929L12.0002 12.5858Z"/>
            </svg>
          )}
        </div>
        <div className={`absolute top-0 w-2 h-2 ${
          isMe 
            ? 'right-[-8px] border-l-[8px] border-l-[#005c4b] border-b-[8px] border-b-transparent' 
            : 'left-[-8px] border-r-[8px] border-r-[#202c33] border-b-[8px] border-b-transparent'
        }`} />
      </div>
    </div>
  );
};

export default ChatBubble;
