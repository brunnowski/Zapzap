
import { Message } from '../types';

/**
 * Robust WhatsApp parser tailored for the Raquel/Brunno chat format.
 */
export const parseWhatsAppExport = (text: string, myNameHint: string = 'Raquel'): Message[] => {
  const cleanText = text.replace(/\u200e/g, '').replace(/\u202f/g, ' ').replace(/\r/g, '');
  const lines = cleanText.split('\n');
  const messages: Message[] = [];
  
  const lineRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?)\]\s+([^:]+):\s+(.*)$/;
  const systemRegex = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+(.+)$/;

  let lastMessage: Message | null = null;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine && !lastMessage) return;

    const match = line.match(lineRegex);

    if (match) {
      const [_, dateStr, timeStr, sender, content] = match;
      const isMe = myNameHint ? sender.toLowerCase().includes(myNameHint.toLowerCase()) : false;
      
      const parts = dateStr.split('/');
      let timestamp = new Date();
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
        const timeParts = timeStr.split(':');
        timestamp = new Date(year, month, day, parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), timeParts[2] ? parseInt(timeParts[2], 10) : 0);
      }

      const msg: Message = {
        id: `msg-${messages.length}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
        sender: sender.trim(),
        content: content.trim(),
        isMe,
        type: (content.includes('<anexado:') || content.includes('imagem ocultada') || content.includes('vídeo omitido')) ? 'image' : 'text',
      };
      
      messages.push(msg);
      lastMessage = msg;
    } else {
      const sysMatch = line.match(systemRegex);
      const isActuallyNewMessage = line.includes(': ');

      if (sysMatch && !isActuallyNewMessage) {
        const [_, dateStr, timeStr, content] = sysMatch;
        const parts = dateStr.split('/');
        const timestamp = parts.length === 3 ? new Date(2000 + parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)) : new Date();

        messages.push({
          id: `sys-${messages.length}`,
          timestamp,
          sender: 'System',
          content: content.trim(),
          isMe: false,
          type: 'system'
        });
        lastMessage = null;
      } else if (lastMessage) {
        lastMessage.content += `\n${line}`;
      }
    }
  });

  return messages;
};

/**
 * Extracts a filename from WhatsApp's media tag format: <anexado: filename>
 */
export const extractFilename = (content: string): string | null => {
  const match = content.match(/<anexado:\s*([^>]+)>/i);
  return match ? match[1].trim() : null;
};
