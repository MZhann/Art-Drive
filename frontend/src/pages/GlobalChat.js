import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI, getImageUrl } from '../services/api.service';
import { API_CONFIG } from '../config/api.config';
import { toast } from 'react-hot-toast';
import {
  Send,
  MessageCircle,
  Users,
  Loader,
  ArrowDown
} from 'lucide-react';
import './GlobalChat.css';

const GlobalChat = () => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await chatAPI.getMessages({ page: 1, limit: 100 });
        if (response.data.success) {
          setMessages(response.data.data.messages);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    const socket = io(API_CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-global-chat');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new-chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('chat-user-count', (count) => {
      setOnlineCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated || !socketRef.current) return;

    socketRef.current.emit('chat-message', {
      userId: user.id || user._id,
      text: newMessage.trim()
    });

    setNewMessage('');
    inputRef.current?.focus();
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (msg) => {
    const msgUserId = msg.user?._id || msg.user;
    return msgUserId === (user?.id || user?._id);
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-page">
        <div className="container">
          <div className="chat-auth-prompt">
            <MessageCircle size={48} />
            <h2>Global Chat</h2>
            <p>Please log in to join the conversation</p>
            <Link to="/login" className="btn btn-primary">Log In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="container">
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-title">
              <MessageCircle size={24} />
              <h1>Global Chat</h1>
            </div>
            <div className="chat-status">
              <span className={`connection-dot ${isConnected ? 'connected' : ''}`} />
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              {onlineCount > 0 && (
                <span className="online-count">
                  <Users size={14} />
                  {onlineCount}
                </span>
              )}
            </div>
          </div>

          <div
            className="chat-messages"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            {isLoading ? (
              <div className="chat-loading">
                <Loader size={32} className="spin" />
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <MessageCircle size={48} />
                <p>No messages yet. Be the first to say hi!</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  const own = isOwnMessage(msg);
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const prevUserId = prevMsg?.user?._id || prevMsg?.user;
                  const currUserId = msg.user?._id || msg.user;
                  const showAvatar = !prevMsg || prevUserId !== currUserId;

                  return (
                    <motion.div
                      key={msg._id || index}
                      className={`chat-message ${own ? 'own' : ''} ${!showAvatar ? 'grouped' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {!own && showAvatar && (
                        <Link to={`/profile/${msg.user?.username}`} className="message-avatar">
                          {msg.user?.avatar ? (
                            <img src={getImageUrl(msg.user.avatar)} alt={msg.user.fullName} />
                          ) : (
                            <span>{msg.user?.fullName?.charAt(0) || '?'}</span>
                          )}
                        </Link>
                      )}
                      <div className="message-content">
                        {!own && showAvatar && (
                          <div className="message-meta">
                            <Link to={`/profile/${msg.user?.username}`} className="message-author">
                              {msg.user?.fullName}
                            </Link>
                            <span className="message-role">{msg.user?.role}</span>
                          </div>
                        )}
                        <div className="message-bubble">
                          <p>{msg.text}</p>
                          <span className="message-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showScrollBtn && (
            <button className="scroll-bottom-btn" onClick={() => scrollToBottom()}>
              <ArrowDown size={18} />
            </button>
          )}

          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={1000}
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="btn btn-primary send-btn"
              disabled={!newMessage.trim() || !isConnected}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GlobalChat;
