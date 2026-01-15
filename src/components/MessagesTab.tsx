import React, { useState, useEffect } from 'react';
import './MessagesTab.css';
import { api } from '../config/api';
interface Message {
  id: number;
  created_at: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  attachments: string[] | null;
  done: boolean;
}

const MessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'undone'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(api('/messages'));
      if (!response.ok) throw new Error('Failed to fetch messages');
      const { data } = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, done: boolean) => {
    try {
      const response = await fetch(api(`/messages/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ done }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, done } : msg
      ));
      
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, done } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.phone.includes(searchQuery) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = filterDate 
      ? new Date(msg.created_at).toISOString().split('T')[0] === filterDate
      : true;

    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'done' ? msg.done :
      !msg.done;

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="messages-tab">
      <div className="messages-list-container">
        <div className="list-header">
          <div className="header-text">
            <h2>Messages</h2>
            <p>Manage customer inquiries</p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search by email, phone or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <div className="filter-toggle">
              <button 
                className={`filter-toggle-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button 
                className={`filter-toggle-btn ${filterStatus === 'undone' ? 'active' : ''}`}
                onClick={() => setFilterStatus('undone')}
              >
                Undone
              </button>
              <button 
                className={`filter-toggle-btn ${filterStatus === 'done' ? 'active' : ''}`}
                onClick={() => setFilterStatus('done')}
              >
                Done
              </button>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="date-input"
            />
            {filterDate && (
              <button 
                className="clear-filter-btn"
                onClick={() => setFilterDate('')}
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading messages...</div>
        ) : (
          <div className="messages-content">
            <div className="messages-list">
              {filteredMessages.length === 0 ? (
                <div className="empty-state">No messages found</div>
              ) : (
                filteredMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`message-item ${selectedMessage?.id === msg.id ? 'selected' : ''} ${msg.done ? 'done' : ''}`}
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <div className="message-item-header">
                      <span className="message-sender">{msg.email}</span>
                      <span className="message-date">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="message-subject">{msg.subject || '(No Subject)'}</div>
                    <div className="message-preview">
                      {msg.message.substring(0, 60)}...
                    </div>
                    {msg.done && <span className="status-badge done">Done</span>}
                  </div>
                ))
              )}
            </div>

            {selectedMessage ? (
              <div className="message-detail">
                <div className="detail-header">
                  <div className="detail-info">
                    <h3>{selectedMessage.subject || '(No Subject)'}</h3>
                    <div className="sender-info">
                      <p><strong>From:</strong> {selectedMessage.email}</p>
                      <p><strong>Phone:</strong> {selectedMessage.phone || 'N/A'}</p>
                      <p><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button 
                      className={`status-btn ${selectedMessage.done ? 'undo' : 'done'}`}
                      onClick={() => handleStatusUpdate(selectedMessage.id, !selectedMessage.done)}
                    >
                      {selectedMessage.done ? 'Mark as Undone' : 'Mark as Done'}
                    </button>
                  </div>
                </div>

                <div className="detail-body">
                  <p>{selectedMessage.message}</p>
                </div>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="detail-attachments">
                    <h4>Attachments</h4>
                    <div className="attachments-grid">
                      {selectedMessage.attachments.map((url, index) => (
                        <a 
                          key={index} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="attachment-link"
                        >
                          <img src={url} alt={`Attachment ${index + 1}`} className="attachment-thumb" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="message-detail-placeholder">
                Select a message to view details
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
