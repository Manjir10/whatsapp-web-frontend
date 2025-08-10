
//// trigger redeploy

import { useEffect, useMemo, useRef, useState } from 'react';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { io } from 'socket.io-client';

const API_BASE = 'https://whatsapp-web-backend-2omx.onrender.com'; // your backend URL (HTTPS)


// Stable per-tab id to ignore our own socket echo
const CLIENT_ID = (() => {
  const k = 'wa_client_id';
  let v = sessionStorage.getItem(k);
  if (!v) {
    v = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(k, v);
  }
  return v;
})();

const initialChats = [
  { id: '929967673820', name: 'dedew', avatar: `https://i.pravatar.cc/150?u=929967673820`, lastSeen: 'Last seen 03:57', messages: [] },
  { id: '919937320320', name: 'Ravi',  avatar: `https://i.pravatar.cc/150?u=919937320320`, lastSeen: 'Last seen 2 hours ago', messages: [] }
];

export default function App() {
  const [chats, setChats] = useState(initialChats);
  const [selectedId, setSelectedId] = useState(null);
  const socketRef = useRef(null);

  const selectedChat = chats.find(c => c.id === selectedId) || null;

  // Socket wiring (ignore our own echo via clientId)
  useEffect(() => {
    if (socketRef.current) return; // guard against accidental double-wiring
    const s = io(API_BASE, { transports: ['websocket'], path: '/socket.io' });
    socketRef.current = s;

    s.on('message:status', (payload) => {
      if (!payload?.wa_id || !payload?.msg_id || !payload?.status) return;
      setChats(prev =>
        prev.map(chat => {
          if (chat.id !== payload.wa_id) return chat;
          const messages = (chat.messages || []).map(m =>
            m.backendId === payload.msg_id ? { ...m, status: payload.status } : m
          );
          return { ...chat, messages };
        })
      );
    });

    s.on('message:new', (doc) => {
      if (!doc?.wa_id) return;
      // ⬇️ Ignore our own echo
      if (doc.clientId && doc.clientId === CLIENT_ID) return;

      const backendId = doc.msg_id || doc._id || undefined;
      setChats(prev =>
        prev.map(chat => {
          if (chat.id !== doc.wa_id) return chat;
          const list = [...(chat.messages || [])];

          // If already have this backendId, update in-place
          if (backendId) {
            const idx = list.findIndex(m => m.backendId === backendId);
            if (idx !== -1) {
              list[idx] = {
                ...list[idx],
                text: doc.text ?? list[idx].text,
                time: new Date(doc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                fromSelf: !!doc.fromSelf,
                status: doc.status || list[idx].status,
                backendId
              };
              return { ...chat, messages: list };
            }
          }

          // Otherwise append as a new incoming
          list.push({
            text: doc.text || '',
            time: new Date(doc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fromSelf: !!doc.fromSelf,
            status: doc.status || 'sent',
            backendId
          });
          return { ...chat, messages: list };
        })
      );
    });

    return () => { s.disconnect(); socketRef.current = null; };
  }, []);

  // New chat hook — SAME as yours + persist a tiny placeholder so it survives reloads
  useEffect(() => {
    const handleNewChat = (e) => {
      const { name = '', number = '' } = e.detail || {};
      const id = (number && number.replace(/\D/g, '')) || String(Date.now());
      const avatar = `https://i.pravatar.cc/150?u=${id}`;

      // UI first (unchanged)
      setChats(prev => [
        { id, name: name || id, avatar, lastSeen: 'Last seen just now', messages: [] },
        ...prev.filter(c => c.id !== id)
      ]);
      setSelectedId(id);

      // NEW: store a harmless placeholder so /conversations includes it after reload
      fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wa_id: id,
          text: 'Chat started',
          timestamp: new Date().toISOString(),
          fromSelf: true,
          clientId: CLIENT_ID
        })
      }).catch(() => {
        // non-fatal; chat still shows locally
      });
    };

    window.addEventListener('new-chat-requested', handleNewChat);
    return () => window.removeEventListener('new-chat-requested', handleNewChat);
  }, []);

  // Load messages for selected chat (unchanged logic)
  useEffect(() => {
    if (!selectedId) return;
    fetch(`${API_BASE}/messages/${selectedId}`)
      .then(res => res.json())
      .then(data => {
        const mapped = Array.isArray(data)
          ? data.map(m => ({
              text: m.text || '',
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fromSelf: !!m.fromSelf,
              status: m.status || 'sent',
              backendId: m.msg_id || m._id
            }))
          : [];
        const last = mapped[mapped.length - 1];
        setChats(prev =>
          prev.map(chat =>
            chat.id === selectedId
              ? { ...chat, messages: mapped, lastMessage: last ? last.text : chat.lastMessage, time: last ? last.time : chat.time }
              : chat
          )
        );
      })
      .catch(err => console.error('Error fetching messages:', err));
  }, [selectedId]);

  const handleSelect = id => setSelectedId(id);

  // Send (keep optimistic UI; add clientId in POST)
  const handleSend = (text) => {
    if (!selectedId) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChats(prev =>
      prev.map(chat =>
        chat.id === selectedId
          ? {
              ...chat,
              lastSeen: 'Last seen just now',
              messages: [...(chat.messages || []), { text, time, fromSelf: true, status: 'sent' }],
              lastMessage: text,
              time
            }
          : chat
      )
    );

    fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wa_id: selectedId,
        text,
        timestamp: now.toISOString(),
        fromSelf: true,
        clientId: CLIENT_ID
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(doc => {
        if (!doc) return;
        const backendId = doc.msg_id || doc._id;
        setChats(prev =>
          prev.map(chat => {
            if (chat.id !== selectedId) return chat;
            const msgs = [...(chat.messages || [])];
            for (let i = msgs.length - 1; i >= 0; i--) {
              if (msgs[i].fromSelf && !msgs[i].backendId) {
                msgs[i] = { ...msgs[i], backendId };
                break;
              }
            }
            return { ...chat, messages: msgs };
          })
        );
      })
      .catch(err => console.error('Error saving message:', err));
  };

  // Demo status actions (unchanged)
  const markLastMine = async (status) => {
    if (!selectedChat) return;
    const lastMine = [...(selectedChat.messages || [])].reverse().find(m => m.fromSelf && m.backendId);
    if (!lastMine) { alert('No sent message with backend id found yet.'); return; }
    const endpoint = status === 'delivered' ? '/delivered' : '/read';
    await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_id: lastMine.backendId, wa_id: selectedChat.id })
    }).catch(() => {});
  };

  const actions = useMemo(() => ({
    markDelivered: () => markLastMine('delivered'),
    markRead: () => markLastMine('read')
  }), [selectedChat]);

  const handleBack = () => setSelectedId(null);

  return (
    <div className="h-screen flex bg-gray-900 text-gray-100">
      <ChatList chats={chats} activeId={selectedId} onSelect={handleSelect} />
      <div className="flex-1 min-w-0">
        <ChatWindow chat={selectedChat} onSend={handleSend} onBack={handleBack} actions={actions} />
      </div>
    </div>
  );
}
