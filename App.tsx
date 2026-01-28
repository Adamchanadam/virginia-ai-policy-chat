
import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, MessageSquare, Menu, X, Trash2 } from 'lucide-react';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import FileUploader from './components/FileUploader';
import ConfirmationModal from './components/ConfirmationModal';
import { AppView, UploadedFile, Message, ChatThread } from './types';
import { getAllFilesFromDB, saveThreadToDB, getAllThreadsFromDB, removeFileFromDB, deleteThreadFromDB } from './services/storage';
import { generateResponse } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  
  // Files State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  
  // Chat State
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<ChatThread | null>(null);

  // 1. Initial Data Load
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const [loadedFiles, loadedThreads] = await Promise.all([
        getAllFilesFromDB(),
        getAllThreadsFromDB()
      ]);
      setFiles(loadedFiles);
      setThreads(loadedThreads);
      
      if (!activeThreadId && loadedThreads.length > 0) {
          selectThread(loadedThreads[0]);
      } else if (!activeThreadId && loadedThreads.length === 0) {
          startNewChat();
      }
    } catch (error) {
      console.error("Init Error:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 2. Chat Logic
  const startNewChat = () => {
    setActiveThreadId(null);
    setCurrentMessages([{
      id: 'welcome',
      role: 'model',
      text: '您好！我是 Virginia AI，專門負責解答 AXA 安盛保險條款的智能顧問。\n\n請先確認左側已上傳知識庫文件 (PDF/MD/TXT)，然後隨時向我提問。',
      timestamp: Date.now()
    }]);
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  const selectThread = (thread: ChatThread) => {
    setActiveThreadId(thread.id);
    setCurrentMessages(thread.messages);
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  // Handle Thread Deletion
  const requestDeleteThread = (e: React.MouseEvent, thread: ChatThread) => {
      e.stopPropagation(); // Prevent selecting the thread
      setThreadToDelete(thread);
  };

  const confirmDeleteThread = async () => {
      if (!threadToDelete) return;

      try {
          await deleteThreadFromDB(threadToDelete.id);
          
          // If we deleted the active thread, start a new chat
          if (activeThreadId === threadToDelete.id) {
              startNewChat();
          }
          
          // Refresh list
          const reloadedThreads = await getAllThreadsFromDB();
          setThreads(reloadedThreads);
          
          // If we deleted the active thread but there are other threads, 
          // logic above (startNewChat) handles it, or we could select the first available one:
          // if (activeThreadId === threadToDelete.id && reloadedThreads.length > 0) { selectThread(reloadedThreads[0]); }

      } catch (error) {
          console.error("Failed to delete thread", error);
          alert("刪除對話失敗，請重試。");
      } finally {
          setThreadToDelete(null);
      }
  };

  // 3. File Logic
  const handleDeleteFile = async (id: string, name: string) => {
    // REMOVED window.confirm to prevent browser blocking issues
    // The UI update (file disappearing) will be the feedback
    
    try {
        await removeFileFromDB(id);
        const freshFiles = await getAllFilesFromDB();
        setFiles(freshFiles);
    } catch (error) {
        console.error("Delete file failed", error);
        alert("刪除文件失敗，請重試。");
    }
  };

  const handleUploadSuccess = async () => {
      const freshFiles = await getAllFilesFromDB();
      setFiles(freshFiles);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: Date.now()
    };
    
    const updatedMessages = [...currentMessages, userMsg];
    setCurrentMessages(updatedMessages);
    setIsGenerating(true);

    try {
        const historyForAi = updatedMessages.filter(m => m.id !== 'welcome');
        const { text: aiResponseText, usage, citations } = await generateResponse(text, historyForAi, files);
        
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: aiResponseText,
            timestamp: Date.now(),
            usage: usage, // Store token usage
            citations: citations // Store parsed citations
        };

        const finalMessages = [...updatedMessages, aiMsg];
        setCurrentMessages(finalMessages);

        let threadId = activeThreadId;
        if (!threadId) {
            threadId = Date.now().toString();
            setActiveThreadId(threadId);
        }

        const newThread: ChatThread = {
            id: threadId,
            title: text.length > 15 ? text.substring(0, 15) + "..." : text,
            messages: finalMessages,
            updatedAt: Date.now()
        };

        await saveThreadToDB(newThread);
        const reloadedThreads = await getAllThreadsFromDB();
        setThreads(reloadedThreads);

    } catch (e) {
        console.error(e);
        setCurrentMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "抱歉，系統暫時無法處理您的請求。",
            timestamp: Date.now()
        }]);
    } finally {
        setIsGenerating(false);
    }
  };

  if (currentView === AppView.LOGIN) {
    return <Login onLogin={() => setCurrentView(AppView.CHAT)} />;
  }

  return (
    <div className="fixed inset-0 w-full flex overflow-hidden font-sans bg-gray-100">
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!threadToDelete}
        title="刪除對話紀錄"
        message={`您確定要刪除 "${threadToDelete?.title}" 嗎？此動作無法復原。`}
        onConfirm={confirmDeleteThread}
        onCancel={() => setThreadToDelete(null)}
      />

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white rounded-lg shadow-md border border-gray-200">
           {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 
        w-[85vw] md:w-[28rem]
        bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 z-40 flex flex-col h-full
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
         {/* Top: Actions & History */}
         <div className="flex-none flex flex-col p-4 overflow-hidden min-h-0">
            <button 
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm mb-6 mt-12 md:mt-0 flex-shrink-0 text-lg"
            >
                <MessageSquarePlus className="w-6 h-6" />
                開啟新對話
            </button>

            <div className="overflow-y-auto mb-2 pr-1 custom-scrollbar max-h-[40vh]">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1 sticky top-0 bg-gray-50 pb-2">最近對話</h3>
                <div className="space-y-2 pb-2">
                    {threads.length === 0 && (
                        <p className="text-base text-gray-400 px-2 italic">暫無歷史紀錄</p>
                    )}
                    {threads.map(thread => (
                        <div 
                           key={thread.id}
                           className={`group relative flex items-center rounded-xl p-1.5 border transition-colors ${
                               activeThreadId === thread.id 
                               ? 'bg-white border-indigo-300 shadow-sm' 
                               : 'hover:bg-gray-100 border-transparent hover:border-gray-200'
                           }`}
                        >
                            <button 
                                onClick={() => selectThread(thread)}
                                className="flex-1 flex items-center gap-3 overflow-hidden text-left p-1 min-w-0"
                            >
                                <MessageSquare className={`w-5 h-5 flex-shrink-0 ${activeThreadId === thread.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                <span className={`truncate text-base font-medium ${activeThreadId === thread.id ? 'text-gray-800' : 'text-gray-600'}`}>
                                    {thread.title}
                                </span>
                            </button>

                            {/* Delete Button - Visible on Hover or if Active */}
                            <button
                                onClick={(e) => requestDeleteThread(e, thread)}
                                className={`
                                    p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0
                                    md:opacity-0 md:group-hover:opacity-100 opacity-100
                                `}
                                title="刪除此對話"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
         </div>

         {/* Bottom: File Uploader */}
         <div className="flex-1 border-t border-gray-200 p-4 pb-24 md:pb-8 bg-gray-50 flex flex-col min-h-0 relative">
             <FileUploader 
                files={files} 
                onUploadSuccess={handleUploadSuccess}
                onDeleteFile={handleDeleteFile}
                isLoading={isLoadingFiles} 
             />
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full p-2 md:p-4 bg-gray-100 min-w-0">
        <ChatInterface 
            files={files} 
            messages={currentMessages}
            isGenerating={isGenerating}
            onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default App;
