import { useEffect, useRef, useState } from "react";

const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

import logo from "/assets/logo.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import EgyptPanel from "./EgyptPanel";
import JobSpecification from "./JobSpecification";
import APIKeyInput from "./APIKeyInput";
import APIErrorAlert from "./APIErrorAlert";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const [topic, setTopic] = useState(".NET Core");
  const [role, setRole] = useState("Senior");
  const [jobSpec, setJobSpec] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyError, setApiKeyError] = useState(null);

  // Add a timer state
  const [timer, setTimer] = useState(SESSION_DURATION_MS);
  const timerRef = useRef(null);

  // Countdown effect
  useEffect(() => {
    if (isSessionActive) {
      setTimer(SESSION_DURATION_MS);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1000) {
            clearInterval(timerRef.current);
            stopSession();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setTimer(SESSION_DURATION_MS);
    }
    return () => clearInterval(timerRef.current);
  }, [isSessionActive]);

  // Helper to format mm:ss
  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  async function startSession() {
    try {
      // Clear any previous API key errors
      setApiKeyError(null);
      
      // Get a session token for OpenAI Realtime API
      const tokenUrl = apiKey ? `/token?key=${encodeURIComponent(apiKey)}` : "/token";
      const tokenResponse = await fetch(tokenUrl);
      const data = await tokenResponse.json();
      
      // Check for API key errors
      if (!tokenResponse.ok) {
        setApiKeyError({
          type: data.errorType || 'UNKNOWN_ERROR',
          message: data.message || data.error || 'Failed to authenticate with OpenAI'
        });
        return;
      }
      
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
      //const model = "gpt-realtime-mini-2025-10-06";
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
    } catch (error) {
      console.error("Session start error:", error);
      setApiKeyError({
        type: 'SESSION_ERROR',
        message: error.message || 'Failed to start interview session'
      });
    }
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
          let briefingText = `You are an interviewer on the subject of ${topic}, the role is: ${role}.`;
          
          if (jobSpec && jobSpec.trim()) {
            briefingText += `\n\nHere is the specific job specification you should focus on during this interview:\n\n${jobSpec.trim()}\n\nPlease tailor your questions to assess the candidate's fit for this specific role and requirements.`;
          }
          
          briefingText += ` Please start the conversation and ask me questions to test my knowledge.`;

          const event = {
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: briefingText,
                },
              ],
            },
          };

          console.log(event);

          dataChannel.send(JSON.stringify(event));
          dataChannel.send(JSON.stringify({ type: "response.create" }));
        }
      });
    }
  }, [dataChannel, topic, role, jobSpec]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 flex items-center bg-white z-50 shadow-sm">
        <div className="flex items-center gap-2 w-full mx-2 px-2 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} alt="Logo" />
          <h1 className="text-sm sm:text-base font-semibold">AI Interviewer DEMO by Karl Lilje</h1>          
        </div>
      </nav>

      <main className="fixed top-16 left-0 right-0 bottom-0 bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <div className="flex-1 min-w-0">
              <label htmlFor="topic-select" className="block text-xs font-semibold text-gray-700 mb-1">
                Interview Topic
              </label>
              <select
                id="topic-select"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={topic}
                onChange={(e) => {
                  if (e.target.value) {
                    setTopic(e.target.value);
                    console.log("Selected topic:", e.target.value);
                  }
                }}
              >
                <option value="" disabled>
                  Select a topic
                </option>
                <option value="dotnet-sore">.NET Core</option>
                <option value="dotnet">.NET</option>
                <option value="react">React</option>
                <option value="sql">SQL</option>
                <option value="nodejs-and-express">NodeJS and Express</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="devops">DevOps</option>
                <option value="system-design">System Design</option>
                <option value="system-design">LEET Code</option>
                <option value="cto-role">CTO Role</option>
                <option value="qa-role">QA Role</option>
                <option value="asset-management">Asset Management</option>                
                <option value="finance">Finance</option>
                <option value="mechatronics">Mechatronics</option>
                <option value="brics-trade-group">BRICS Trade Group</option>
                <option value="g7-trade-group">G7 Trade Group</option>
                <option value="human-resources">Human Resources</option>                
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label htmlFor="role-select" className="block text-xs font-semibold text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                id="role-select"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  console.log("Selected role:", e.target.value);
                }}
              >
                <option value="" disabled>
                  Select a role
                </option>
                <option value="senior">Senior</option>
                <option value="junior">Junior</option>
                <option value="manager">Manager</option>
                <option value="project-manager">Project Manager</option>
                <option value="team-lead">Team Lead</option>
                <option value="tech-lead">Tech Lead</option>
                <option value="cto">CTO</option>
                <option value="ceo">CEO</option>
                <option value="director">Director</option>
              </select>
            </div>
          </div>
          
          {/* Job Specification and API Key Components */}
          <div className="mt-4 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <JobSpecification 
              jobSpec={jobSpec} 
              setJobSpec={setJobSpec} 
              isSessionActive={isSessionActive}
            />
            <APIKeyInput 
              apiKey={apiKey} 
              setApiKey={(newKey) => {
                setApiKey(newKey);
                // Clear any API key errors when a new key is set
                if (apiKeyError) {
                  setApiKeyError(null);
                }
              }}
              isSessionActive={isSessionActive}
            />
          </div>
        </div>

        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 scrollable">
            {/* API Key Error Alert */}
            {apiKeyError && (
              <APIErrorAlert 
                error={apiKeyError}
                onClose={() => setApiKeyError(null)}
                onRetry={() => {
                  setApiKeyError(null);
                  startSession();
                }}
              />
            )}
            <EventLog events={events} />
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 p-3 sm:p-4 bg-white">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
              topic={topic}
              role={role}
            />
          </div>
        </section>
        {/* Uncomment and adjust below for side panels on desktop */}
        {/* <section className="hidden sm:block sm:relative sm:w-[380px] sm:min-w-[280px] sm:max-w-[580px] sm:overflow-y-auto sm:bg-white sm:border-l sm:border-gray-200">
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
