import { useRef, useState } from 'react';
import { PaperClipIcon, CameraIcon } from '@heroicons/react/24/outline';

const BASIC_EMOJIS = ['😊','😂','😍','👍','🔥','🎉','👏','🙌','🤝','❤️','🥳','😎','🤩','😇','🤔','😉','😅'];

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef(null);

  // prevent quick double-sends
  const sendingRef = useRef(false);

  const sendOnce = () => {
    const value = text.trim();
    if (!value) return;
    if (sendingRef.current) return;          // lock
    sendingRef.current = true;
    setTimeout(() => { sendingRef.current = false; }, 250);

    onSend(value);
    setText('');
    setShowEmojis(false);
  };

  const onKeyDown = (e) => {
    // ignore IME/composition and allow Shift+Enter for multiline if you add it later
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendOnce();
    }
  };

  const openFile = () => fileInputRef.current?.click();

  const openCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      openFile();
    } catch {
      openFile();
    }
  };

  return (
    <div className="p-3 border-t border-gray-700 relative bg-gray-900">
      {showEmojis && (
        <div className="absolute bottom-12 left-2 z-10 bg-gray-800 border border-gray-700 rounded p-2 max-w-xs">
          <div className="grid grid-cols-8 gap-1 text-lg">
            {BASIC_EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                className="hover:scale-110"
                onClick={(evt) => {
                  evt.preventDefault();      // never submit
                  setText(t => t + e);       // append exactly one emoji
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowEmojis(v => !v)}
          className="text-gray-300 hover:text-white"
          title="Emoji"
        >
          😊
        </button>

        <button type="button" onClick={openFile} className="text-gray-300 hover:text-white" title="Attach file">
          <PaperClipIcon className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) alert(`Selected file: ${f.name}`);
          }}
        />

        <button type="button" onClick={openCamera} className="text-gray-300 hover:text-white" title="Camera">
          <CameraIcon className="w-5 h-5" />
        </button>

        <input
          className="flex-1 bg-gray-800 p-2 rounded text-white focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          onKeyDown={onKeyDown}
        />

        <button
          type="button"
          onClick={sendOnce}
          className="text-green-500 hover:text-green-300"
          title="Send"
        >
          Send
        </button>
      </div>
    </div>
  );
}
