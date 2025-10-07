import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import EgyptPanel from "./EgyptPanel";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const [topic, setTopic] = useState("Technical Interview");

  async function startSession() {
    // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    console.log("stopsession", peerConnection.current);
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    console.log("sendclientevent", message);
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        //message.timestamp = timestamp;
      }
      // create a deep copy of message for storage, as the original message might not be sent when we add timestamp
      const messageCopy = JSON.parse(JSON.stringify(message));
      messageCopy.timestamp = timestamp;
      setEvents((prev) => [messageCopy, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    console.log("dataChannel", dataChannel);
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
        //  event.timestamp = new Date().toLocaleTimeString();
        
        }

        const timestamp = new Date().toLocaleTimeString();
        const messageCopy = JSON.parse(JSON.stringify(event));
        messageCopy.timestamp = timestamp;
        setEvents((prev) => [messageCopy, ...prev]);

//        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);

        // Send initial topic instruction to model
      if (topic) {
        const event = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `You are an interviewer on the subject of ${topic}. Please start the conversation and ask me questions to test my knowledge.`,
              },
            ],
          },
        };

        dataChannel.send(JSON.stringify(event));
        dataChannel.send(JSON.stringify({ type: "response.create" }));
      }
      });
    }
  }, [dataChannel, topic]);

  return (
    <>
    
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>Virtual Interview Assistant</h1>
          <h1>I will ask you questions, but if you don't know the answer, I will explain!</h1>
        </div>
      </nav>
      
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <div className="absolute top-4 right-8 z-50">
      <label htmlFor="topic-select" className="mr-2 font-semibold">
        Technical Interview AI
      </label>
      <select
        id="topic-select"
        className="border rounded px-2 py-1"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            setTopic(e.target.value);
            // You can handle topic selection here if needed
            console.log("Selected topic:", e.target.value);
          }
        }}
      >
        <option value="" disabled>
          Select a topic
        </option>
        <option value="dotnet">.NET</option>
        <option value="react">React</option>
        <option value="sql">SQL</option>
        <option value="nodejs-and-express">NodeJS and Express</option>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="devops">DevOps</option>
        <option value="system-design">System Design</option>
        <option value="cto-role">CTO Role</option>
        <option value="qa-role">QA Role</option>
        <option value="asset-management">Asset Management</option>
        <option value="finance">Finance</option>
        
      </select>
      {topic}
    </div>
        <section className="absolute top-0 left-0 right-[580px] bottom-0 flex">
          
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
              topic={topic}
            />
          </section>
        </section>
        {/* <section className="absolute top-0 w-[580px] right-0 bottom-0 p-24 pt-0 overflow-y-auto">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
          <EgyptPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section> */}
      </main>
    </>
  );
}
