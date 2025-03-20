import SocketService from '../services/SocketService';
import imageCompression from 'browser-image-compression';

// 发送文本消息
export const sendTextMessage = (content: string, clipRegIndex?: number) => {
  const trimmedContent = content.trim();
  if (trimmedContent) {
    // 如果指定了剪切板寄存器索引，则传递给SocketService
    if (clipRegIndex !== undefined) {
      SocketService.sendMessage('text', trimmedContent, clipRegIndex);
    } else {
      SocketService.sendMessage('text', trimmedContent);
    }
  } else {
    throw new Error('Message content cannot be empty.');
  }
};

// 发送图片消息
export const sendImageMessage = async (file: File) => {
  const maxOriginalSize = 10 * 1024 * 1024; // 原始图片最大10MB
  if (file.size > maxOriginalSize) {
    throw new Error('Image size should not exceed 10MB.');
  }

  try {
    // 压缩图片
    const options = {
      maxSizeMB: 5, // 压缩后最大5MB
      maxWidthOrHeight: 4500, // 压缩后最大宽度或高度
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);
    const base64Image = await imageCompression.getDataUrlFromFile(compressedFile);
    const imageSizeMB = compressedFile.size / (1024 * 1024);
    console.log(`Compressed image size: ${imageSizeMB.toFixed(2)} MB`);

    // 发送图片消息
    SocketService.sendMessage('image', base64Image);
  } catch (error) {
    throw new Error('Failed to compress or send image.');
  }
};

