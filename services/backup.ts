import JSZip from 'jszip';
import { Message } from '../types';
import { loadChatFromDisk, saveChatToDisk, saveMediaToDisk } from './storage';

type SerializedMessage = Omit<Message, 'timestamp'> & { timestamp: string };

type BackupMetadata = {
  version: 1;
  partnerName: string;
  createdAt: string;
  messageCount: number;
  mediaCount: number;
};

export const exportMemoryBackup = async (): Promise<Blob | null> => {
  const stored = await loadChatFromDisk();
  if (!stored) return null;

  const { messages, partnerName, mediaMap } = stored;
  const zip = new JSZip();

  const serializedMessages: SerializedMessage[] = messages.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp.toISOString(),
  }));

  const metadata: BackupMetadata = {
    version: 1,
    partnerName,
    createdAt: new Date().toISOString(),
    messageCount: messages.length,
    mediaCount: mediaMap.size,
  };

  zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  zip.file('messages.json', JSON.stringify(serializedMessages, null, 2));

  const mediaFolder = zip.folder('media');
  if (mediaFolder) {
    for (const [name, file] of mediaMap.entries()) {
      mediaFolder.file(name, file);
    }
  }

  return zip.generateAsync({ type: 'blob' });
};

export const importMemoryBackup = async (
  file: File
): Promise<{ messages: Message[]; partnerName: string; mediaMap: Map<string, File> }> => {
  const zip = await JSZip.loadAsync(file);

  const metadataEntry = zip.file('metadata.json');
  const messagesEntry = zip.file('messages.json');
  if (!messagesEntry) {
    throw new Error('Backup inválido: arquivo messages.json não encontrado.');
  }

  const metadataText = metadataEntry ? await metadataEntry.async('text') : null;
  const partnerName =
    metadataText && JSON.parse(metadataText).partnerName
      ? JSON.parse(metadataText).partnerName
      : 'Brunno Rossetti';

  const messagesText = await messagesEntry.async('text');
  const serializedMessages: SerializedMessage[] = JSON.parse(messagesText);
  const messages: Message[] = serializedMessages.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));

  const mediaMap = new Map<string, File>();
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir || !entry.name.startsWith('media/')) continue;
    const name = entry.name.replace(/^media\//, '');
    if (!name) continue;
    const blob = await entry.async('blob');
    const fileType = blob.type || undefined;
    mediaMap.set(name, new File([blob], name, { type: fileType }));
  }

  await saveMediaToDisk(mediaMap);
  await saveChatToDisk(messages, partnerName);

  return { messages, partnerName, mediaMap };
};

export const downloadBackup = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
