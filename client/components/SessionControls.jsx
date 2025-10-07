import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";

function SessionStopped({ startSession, topic, role }) {
  const [isActivating, setIsActivating] = useState(false);  

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession(topic);
  }

  return (
    <div className="flex items-center justify-center w-full">
      <Button
        onClick={handleStartSession}
        className={`px-6 py-3 text-sm sm:text-base min-h-[44px] ${isActivating ? "bg-gray-600" : "bg-red-600"}`}
        icon={<CloudLightning height={16} />}
      >
        {isActivating ? `Starting ${topic} interview...` : `Start ${topic} (${role}) interview`}
      </Button>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage, topic, role }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full">
      <div className="flex-1 flex gap-2">
        <input
          onKeyDown={(e) => {
            if (e.key === "Enter" && message.trim()) {
              handleSendClientEvent();
            }
          }}
          type="text"
          placeholder="Send a text message..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          onClick={() => {
            if (message.trim()) {
              handleSendClientEvent();
            }
          }}
          icon={<MessageSquare height={16} />}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-3 min-h-[44px]"
        >
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
      <Button 
        onClick={stopSession} 
        icon={<CloudOff height={16} />}
        className="bg-gray-500 hover:bg-gray-600 px-4 py-3 min-h-[44px]"
      >
        Disconnect
      </Button>
    </div>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
  topic,
  role
}) {
  return (
    <div className="w-full">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
          topic={topic}
        />
      ) : (
        <SessionStopped startSession={startSession} topic={topic} role={role} />
      )}
    </div>
  );
}
