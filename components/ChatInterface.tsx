
import React, { useRef, useEffect, useState } from 'react';
import { Send, Copy, Bot, User, Check, RefreshCw, Sparkles, Cpu, BookOpen } from 'lucide-react';
import { Message, UploadedFile } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import PromptLibraryModal from './PromptLibraryModal';

interface ChatInterfaceProps {
  files: UploadedFile[];
  messages: Message[];
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ files, messages, isGenerating, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSend = () => {
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertPrompt = (content: string) => {
    setInputValue(prev => (prev.trim().length > 0 ? `${prev}\n\n${content}` : content));
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-200 relative overflow-hidden">
      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onInsert={handleInsertPrompt}
      />
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-5 flex justify-between items-center z-10 sticky top-0 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
            <Sparkles className="w-6 h-6 text-indigo-600 fill-indigo-100" />
            Virginia AI 保險顧問
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
             <span className={files.length > 0 ? "text-green-600 font-bold" : "text-gray-400"}>
               {files.length > 0 ? `已就緒 (${files.length} 份知識庫文件)` : "請先於側邊欄上傳知識庫；本模型較適合簡單文件讀取/解釋，不適合複雜推理或大量內容處理"}
             </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPromptLibraryOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-bold transition-colors shadow-sm"
          title="常用 Prompt 範本"
        >
          <BookOpen className="w-4 h-4" />
          常用 Prompt
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
             <Bot size={64} className="mb-4 text-indigo-200" />
             <p className="text-xl font-medium">請上傳文件並開始提問</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex max-w-[90%] md:max-w-[85%] gap-4 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-indigo-600 border border-indigo-100'
                }`}
              >
                {msg.role === 'user' ? <User size={24} /> : <Bot size={28} />}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative group p-6 rounded-3xl shadow-sm text-lg leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <>
                    <MarkdownRenderer content={msg.text} />
                    
                    {/* Citations Display - Only show if files are currently uploaded */}
                    {files.length > 0 && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm">
                           <BookOpen className="w-4 h-4" />
                           <span>參考來源 (References)</span>
                        </div>
                        <ul className="space-y-1">
                           {msg.citations.map((citation, idx) => (
                             <li key={idx} className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-start">
                                <span className="mr-2 text-indigo-400 font-mono text-xs mt-0.5">{idx + 1}.</span>
                                {citation}
                             </li>
                           ))}
                        </ul>
                      </div>
                    )}

                    {/* Token Usage Display */}
                    {msg.usage && (
                      <div className="mt-2 pt-2 flex items-center justify-end text-xs text-gray-400 font-mono gap-3 opacity-80 hover:opacity-100 transition-opacity">
                        <Cpu className="w-3 h-3" />
                        <span>Input: {msg.usage.promptTokens}</span>
                        <span>•</span>
                        <span>Output: {msg.usage.responseTokens}</span>
                        <span>•</span>
                        <span className="font-semibold text-gray-500">Total: {msg.usage.totalTokens}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(msg.text, msg.id)}
                  className={`absolute top-4 ${msg.role === 'user' ? 'left-[-48px] text-gray-400 hover:text-indigo-600' : 'right-4 text-gray-400 hover:text-indigo-600'} opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-gray-100/80 hover:bg-indigo-50 backdrop-blur-sm shadow-sm`}
                  title="複製內容"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start w-full animate-pulse">
            <div className="flex gap-4 max-w-[80%]">
               <div className="w-12 h-12 rounded-full bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-md">
                 <Bot size={28} />
               </div>
               <div className="bg-white border border-gray-200 p-6 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-3">
                 <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                 <span className="text-base text-gray-600 font-medium">Virginia 正在分析文件並撰寫回答...</span>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto relative flex items-end gap-3 bg-gray-50 border border-gray-300 rounded-2xl p-2 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all shadow-inner">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={files.length === 0 ? "⚠️ 請先在左側上傳知識庫文件 (PDF/MD/TXT)" : "請輸入關於保險條款的問題..."}
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-40 min-h-[60px] py-4 px-4 text-gray-800 text-lg placeholder-gray-400 scrollbar-hide leading-relaxed"
            rows={1}
            style={{ height: 'auto', minHeight: '60px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating}
            className={`p-4 rounded-xl flex-shrink-0 mb-1 transition-all duration-200 transform ${
              !inputValue.trim() || isGenerating
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-md active:scale-95'
            }`}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <div className="text-center mt-3">
            <p className="text-sm text-gray-400 font-normal">
                Virginia AI 回答僅供參考，請以原始保單條款為準。
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
