import { useEffect, useState } from 'react';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MessageInput from './MessageInput';

const API_BASE = 'http://localhost:5001';

export default function ChatWindow({ chat, onSend, onBack, actions }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  useEffect(() => {
    const box = document.getElementById('chat-box');
    if (box) box.scrollTop = box.scrollHeight;
  }, [chat]);

  if (!chat) {
    return (
      <div className="flex-1 bg-gray-900 text-white flex items-center justify-center h-screen md:h-full">
        Select a chat to start messaging
      </div>
    );
  }

  const Tick = ({ status }) => {
    if (!status) return <span className="ml-1 text-gray-400">✓</span>;
    if (status === 'sent') return <span className="ml-1 text-gray-400">✓</span>;
    if (status === 'delivered') return <span className="ml-1 text-gray-400">✓✓</span>;
    if (status === 'read') return <span className="ml-1 text-sky-400">✓✓</span>;
    return <span className="ml-1 text-gray-400">✓</span>;
  };

  const getLastMine = () => {
    if (!chat?.messages?.length) return null;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].fromSelf) return { idx: i, msg: chat.messages[i] };
    }
    return null;
  };

  const patchLastMineStatus = (newStatus) => {
    const found = getLastMine();
    if (!found) return;
    const { idx } = found;
    chat.messages[idx] = { ...chat.messages[idx], status: newStatus };
  };

  const postStatus = async (msg_id, statusPath) => {
    let res = await fetch(`${API_BASE}/${statusPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_id })
    });
    if (res.ok) return true;

    res = await fetch(`${API_BASE}/messages/${encodeURIComponent(msg_id)}/${statusPath}`, {
      method: 'POST'
    });
    return res.ok;
  };

  const handleDelivered = async () => {
    const found = getLastMine();
    if (!found) return alert('No outgoing message found.');
    const { msg } = found;

    const msgId = msg.backendId || msg.msg_id;
    if (!msgId) {
      alert('Message id not yet available. Try again after a second.');
      return;
    }

    patchLastMineStatus('delivered');
    try {
      const ok = await postStatus(msgId, 'delivered');
      if (!ok) alert('Server did not accept delivered update (404/500).');
    } catch {
      alert('Network error updating delivered.');
    }
  };

  const handleRead = async () => {
    const found = getLastMine();
    if (!found) return alert('No outgoing message found.');
    const { msg } = found;

    const msgId = msg.backendId || msg.msg_id;
    if (!msgId) {
      alert('Message id not yet available. Try again after a second.');
      return;
    }

    patchLastMineStatus('read');
    try {
      const ok = await postStatus(msgId, 'read');
      if (!ok) alert('Server did not accept read update (404/500).');
    } catch {
      alert('Network error updating read.');
    }
  };

  return (
    <div className="flex-1 flex min-h-0 flex-col bg-gray-900 text-white relative h-screen md:h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          <button
            className="md:hidden text-xl -ml-2 mr-1 px-2 py-1 rounded hover:bg-gray-800"
            onClick={onBack}
            title="Back"
          >
            ←
          </button>

          <div className="flex items-center cursor-pointer" onClick={() => setShowProfile(true)}>
            <img src={chat.avatar} alt="avatar" className="w-10 h-10 rounded-full mr-3 object-cover" />
            <div>
              <div className="font-semibold">{chat.name}</div>
              <div className="text-xs text-gray-400">{chat.lastSeen || 'Last seen just now'}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* tiny status demo buttons */}
          <button
            onClick={actions?.markDelivered || handleDelivered}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
            title="Mark last sent as delivered"
          >
            ✓ delivered
          </button>
          <button
            onClick={actions?.markRead || handleRead}
            className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
            title="Mark last sent as read"
          >
            ✓✓ read
          </button>

          <button className="hover:text-green-400" title="Audio call" onClick={() => setShowAudioCall(true)}>
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button className="hover:text-green-400" title="Video call" onClick={() => setShowVideoCall(true)}>
            <VideoCameraIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div id="chat-box" className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
        {chat.messages.map((m, i) => {
          const mine = !!m.fromSelf;
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-3 py-2 max-w-xs ${mine ? 'bg-green-600' : 'bg-gray-800'}`}>
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? 'text-white/80 justify-end' : 'text-gray-300/80 justify-end'}`}>
                  <span>{m.time}</span>
                  {mine && <Tick status={m.status} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input (now sticky) */}
      <div className="sticky bottom-0">
        <MessageInput onSend={onSend} />
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="bg-white text-black rounded-lg p-6 w-80 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowProfile(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
            <img src={chat.avatar} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
            <div className="text-center">
              <div className="font-semibold text-lg">{chat.name}</div>
              <div className="text-gray-600">{chat.id}</div>
            </div>
          </div>
        </div>
      )}

      {/* Demo call overlays kept as-is */}
      {showAudioCall && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-80 relative">
            <button className="absolute top-2 right-2 text-gray-300 hover:text-white" onClick={() => setShowAudioCall(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <img src={chat.avatar} alt="" className="w-16 h-16 rounded-full mb-3 object-cover" />
              <div className="font-semibold">{chat.name}</div>
              <div className="text-sm text-gray-400 mb-4">Audio call (demo)</div>
              <button className="px-4 py-2 bg-green-600 rounded hover:bg-green-500" onClick={() => setShowAudioCall(false)}>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoCall && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-[22rem] relative">
            <button className="absolute top-2 right-2 text-gray-300 hover:text-white" onClick={() => setShowVideoCall(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <div className="w-48 h-28 bg-black/60 rounded mb-3 flex items-center justify-center">
                <span className="text-xs text-gray-400">Video stream (demo)</span>
              </div>
              <div className="font-semibold">{chat.name}</div>
              <div className="text-sm text-gray-400 mb-4">Video call (demo)</div>
              <button className="px-4 py-2 bg-green-600 rounded hover:bg-green-500" onClick={() => setShowVideoCall(false)}>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
