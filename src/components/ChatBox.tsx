import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMessagesByRoomIdWithSenders,
  sendMessage,
  subscribeToMessages,
  type Message as SupabaseMessage
} from '../services/supabaseClient';

interface Message extends SupabaseMessage {
  isCurrentUser?: boolean;
}

interface ChatBoxProps {
  roomId: string;
  className?: string;
  darkMode?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ roomId, className = '', darkMode = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Récupération des messages existants
  useEffect(() => {
    if (!roomId || !user) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        const result = await getMessagesByRoomIdWithSenders(roomId);
        
        if (result.error) {
          throw result.error;
        }
        
        const formattedMessages = (result.messages || []).map((msg) => ({
          ...msg,
          isCurrentUser: msg.sender_id === user?.id,
        }));
        
        setMessages(formattedMessages);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la récupération des messages');
        console.error('Erreur lors de la récupération des messages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Abonnement aux nouveaux messages
    const subscription = subscribeToMessages(roomId, (payload) => {
      const newMsg = payload.new as SupabaseMessage;
      
      if (newMsg && user) {
        setMessages((prev) => [...prev, {
          ...newMsg,
          isCurrentUser: newMsg.sender_id === user.id,
          sender_name: newMsg.sender_name || 'Utilisateur'
        }]);
      }
    });
    
    // Nettoyage de l'abonnement
    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [roomId, user]);
  
  // Scroll vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Envoi d'un nouveau message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !roomId || !user) return;
    
    try {
      await sendMessage(roomId, user.id, newMessage);
      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du message');
      console.error('Erreur lors de l\'envoi du message:', err);
    }
  };
  
  // Obtenir le nom d'utilisateur à partir de l'email
  const getUserName = (email: string | undefined) => {
    if (!email) return 'Utilisateur';
    return email.split('@')[0];
  };
  
  return (
    <div className={`flex flex-col ${className} ${darkMode ? 'bg-gray-800 text-white' : 'bg-white dark:bg-dark-light'}`}>
      <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
        <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Discussion</h2>
      </div>
      
      <div className={`flex-grow p-4 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50 dark:bg-dark'}`}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className={`p-3 rounded-md ${darkMode ? 'bg-red-800 text-white' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Aucun message pour le moment
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 break-words 
                    ${message.isCurrentUser 
                      ? (darkMode ? 'bg-blue-600' : 'bg-primary text-white') 
                      : (darkMode ? 'bg-gray-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white')
                    }`}
                >
                  {!message.isCurrentUser && (
                    <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                      {message.sender_name || getUserName(undefined)}
                    </div>
                  )}
                  <p>{message.content}</p>
                  <div className={`text-xs text-right mt-1 ${darkMode ? 'text-gray-300 opacity-70' : 'text-gray-500 dark:text-gray-400'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className={`p-3 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200 dark:border-gray-700'}`}>
        <div className="flex rounded-md overflow-hidden shadow-sm">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez un message..."
            className={`flex-grow px-4 py-2 ${
              darkMode 
                ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:outline-none' 
                : 'bg-white dark:bg-gray-800 border-0 focus:ring-2 focus:ring-primary focus:outline-none'
            }`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-4 py-2 ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                : 'bg-primary hover:bg-blue-600 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700'
            } transition-colors`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox; 