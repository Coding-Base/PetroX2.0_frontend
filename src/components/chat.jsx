import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const username = localStorage.getItem('username') || 'Anonymous';

  const connectWS = useCallback(() => {
    if (ws.current) ws.current.close();
    
    // Use fallback URL if env variable is missing
    const wsUrl = process.env.REACT_APP_WS_URL || `ws://${window.location.host}`;
    ws.current = new WebSocket(`${wsUrl}/ws/chat/`);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setMessages(m => [...m, data]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      // Retry connection after delay
      setTimeout(connectWS, 3000);
    };
    ws.current.onclose = () => setIsConnected(false);
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connectWS]);

  const sendMsg = (e) => {
    e.preventDefault();
    if (!message.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    
    const payload = JSON.stringify({ username, text: message });
    ws.current.send(payload);
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Group Chat</h2>
      <div className="mb-2 text-sm">
        {isConnected ? (
          <span className="text-green-500">🟢 Connected</span>
        ) : (
          <span className="text-red-500">🔴 Connecting...</span>
        )}
      </div>
      <div className="h-64 overflow-y-auto mb-4 border border-gray-200 rounded p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No messages yet</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="">
              <span className="font-semibold">{msg.username}:</span> {msg.text}
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMsg} className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={!isConnected || !message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}