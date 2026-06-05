'use client';

import { ChatMessage } from '@/lib/types';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
        style={{
          backgroundColor: isUser
            ? 'rgba(99, 102, 241, 0.2)'
            : 'rgba(100, 116, 139, 0.15)',
          border: `1px solid ${isUser ? 'rgba(99, 102, 241, 0.3)' : '#2a2a3c'}`,
        }}
      >
        {isUser ? (
          <User size={14} style={{ color: '#6366f1' }} />
        ) : (
          <Bot size={14} style={{ color: '#64748b' }} />
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed message-content"
          style={{
            backgroundColor: isUser
              ? '#6366f1'
              : '#16161f',
            color: isUser ? 'white' : '#f1f5f9',
            border: isUser ? 'none' : '1px solid #2a2a3c',
            borderRadius: isUser
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
          }}
        >
          {message.content}
        </div>
        <span className="text-xs px-1" style={{ color: '#64748b' }}>
          {time}
        </span>
      </div>
    </div>
  );
}
