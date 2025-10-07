import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";

function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isClient = event.event_id && !event.event_id.startsWith("event_");

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-lg bg-white shadow-sm border border-gray-200">
      <div
        className="flex items-center gap-2 cursor-pointer touch-manipulation min-h-[44px] py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className="text-blue-500 flex-shrink-0" size={18} />
        ) : (
          <ArrowUp className="text-green-500 flex-shrink-0" size={18} />
        )}
        <div className="text-sm text-gray-600 flex-1 min-w-0">
          <span className="font-medium">
            {isClient ? "You:" : "AI:"}
          </span>
          <span className="ml-2">{event.type}</span>
          <span className="block sm:inline sm:ml-2 text-xs text-gray-400">
            {timestamp}
          </span>
        </div>
      </div>
      <div
        className={`text-gray-600 bg-gray-50 p-3 rounded-md overflow-x-auto ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
}

export default function EventLog({ events }) {
  const eventsToDisplay = [];
  let deltaEvents = {};

  events.forEach((event) => {
    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        // for now just log a single event per render pass
        return;
      } else {
        deltaEvents[event.type] = event;
      }
    }

    // If event has a transcript, show it instead of JSON
    console.log(event);
    const content = event?.transcript ? (
      <div className="text-gray-800 bg-gray-50 p-3 rounded-md overflow-x-auto">
        <pre className="text-sm whitespace-pre-wrap break-words">{event.transcript}</pre>
      </div>
    ) : (
      <div
        className={`text-gray-600 bg-gray-50 p-3 rounded-md overflow-x-auto hidden`}
      >
        <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(event, null, 2)}</pre>
      </div>
    );

    eventsToDisplay.push(
      <div key={event.event_id}>
        <Event event={event} timestamp={event.timestamp} />
        {event.transcript && content}
      </div>
    );
  });

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {events.length === 0 ? (
        <div className="text-center text-gray-500 py-8 sm:py-12">
          <div className="text-lg sm:text-xl mb-2">Ready to start your interview</div>
          <div className="text-sm">Select a topic and difficulty level above, then click start to begin</div>
          <div className="text-sm">I will ask you questions, but if you don't know the answer, I will explain!</div>
          <div className="text-sm">Say "Next Question" to move on.</div>
          <div className="text-sm">DEMO Only. Session expires in 5 minutes.</div>
        </div>
      ) : (
        eventsToDisplay
      )}
    </div>
  );
}
