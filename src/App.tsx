import { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { NewChat } from "./pages/NewChat/NewChat";
import { Chat } from "./pages/Chat/Chat";
import { ModelManager, APIType } from "./utils/ModelManager";

function ChatWrapper() {
  const { uuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ content: string; role: string }[]>([]);
  const messagesRef = useRef(messages);
  const initialLoadRef = useRef(true);

  const modelManager = new ModelManager({
    provider: APIType.OpenAI,
    key: (import.meta.env.VITE_API_KEY as string) || "",
    endpoint: "https://api.groq.com/openai/v1",
  });

  useEffect(() => {
    const loadMessages = async () => {
      if (!uuid) return;

      // Load messages from localStorage
      const storedMessages = JSON.parse(localStorage.getItem(`chat_${uuid}`) || "[]");
      
      if (storedMessages?.length > 0) {
        setMessages(storedMessages);
        messagesRef.current = storedMessages;

        // Check if this is a new chat that needs an initial response
        const isNewChat = location.state?.initialMessages !== undefined;
        const hasOnlyUserMessage = 
          storedMessages.length === 1 && 
          storedMessages[0].role === "user";

        if (initialLoadRef.current && isNewChat && hasOnlyUserMessage) {
          initialLoadRef.current = false;
          await handleSendMessage(storedMessages[0].content, true);
        }
      }
    };

    loadMessages();
  }, [uuid, location.state]);

  const handleSendMessage = async (message: string, isInitial: boolean = false) => {
    if (!uuid) return;

    try {
      // Only update messages and local storage if it's not an initial message
      if (!isInitial) {
        const newMessage = { content: message, role: "user" };
        const updatedMessages = [...messagesRef.current, newMessage];
        setMessages(updatedMessages);
        messagesRef.current = updatedMessages;
        localStorage.setItem(`chat_${uuid}`, JSON.stringify(updatedMessages));
      }

      const stream = await modelManager.stream(
        messagesRef.current,
        "deepseek-r1-distill-llama-70b",
        {
          max_tokens: 16384,
          temperature: 0.8,
        }
      );

      let response = "";

      for await (const chunk of stream) {
        response += chunk;
        const updatedMessages = [
          ...messagesRef.current,
          { content: response, role: "assistant" }
        ];
        setMessages(updatedMessages);
        localStorage.setItem(`chat_${uuid}`, JSON.stringify(updatedMessages));
      }

      // Update the messages ref after streaming is complete
      messagesRef.current = [
        ...messagesRef.current,
        { content: response, role: "assistant" }
      ];

    } catch (error) {
      console.error("Streaming error:", error);
      const errorMessage = { 
        content: `Error: ${error}`, 
        role: "assistant" 
      };
      const updatedMessages = [...messagesRef.current, errorMessage];
      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;
      localStorage.setItem(`chat_${uuid}`, JSON.stringify(updatedMessages));
    }
  };

  return <Chat messages={messages} onSendMessage={handleSendMessage} />;
}

function NewChatWrapper() {
  const navigate = useNavigate();

  const handleSendMessage = (message: string) => {
    const newUuid = uuidv4();
    const initialMessages = [{ content: message, role: "user" }];

    // Save the first message immediately
    localStorage.setItem(`chat_${newUuid}`, JSON.stringify(initialMessages));

    // Navigate to chat while passing the initial messages via state
    navigate(`/chat/${newUuid}`, { state: { initialMessages } });
  };

  return <NewChat onSendMessage={handleSendMessage} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<NewChatWrapper />} />
        <Route path="/chat/:uuid" element={<ChatWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
