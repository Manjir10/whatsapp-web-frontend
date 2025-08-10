import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function ChatList({ chats, onSelect, activeId, onNewChat }) {
  const handleNewChat = async () => {
    if (onNewChat) return onNewChat();
    const name = window.prompt('Enter name');
    if (!name) return;
    const number = window.prompt('Enter phone number (optional)') || '';
    window.dispatchEvent(new CustomEvent('new-chat-requested', { detail: { name, number } }));
    alert('New chat requested. Hook this event in App to add it to the list.');
  };

  return (
    // ⬇️ Only change: prevent shrinking + enforce a minimum width
    <div className="shrink-0 min-w-[260px] w-72 md:w-80 lg:w-96 bg-gray-900 border-r border-gray-700 text-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Chats</h2>
        <button
          onClick={handleNewChat}
          title="Start new chat"
          className="p-1 rounded hover:bg-gray-800"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="p-2 overflow-y-auto flex-1">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center p-2 cursor-pointer hover:bg-gray-800 rounded ${
              activeId === chat.id ? 'bg-gray-800' : ''
            }`}
            onClick={() => onSelect(chat.id)}
          >
            <img
              src={chat.avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full mr-2 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{chat.name}</div>
              <div className="text-xs text-gray-400 truncate">
                {chat.lastMessage || ''}
              </div>
            </div>
            {chat.time && <div className="text-xs text-gray-400 ml-2">{chat.time}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
