// App.tsx
import { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "./App.css"

import { NewChatPage } from "./pages/NewChat/NewChat";
import { ChatPage } from "./pages/Chat/Chat";
import { ModelManager, APIType } from "./utils/ModelManager";
import { db, Message, Chat } from "./utils/Dexie";
import { Sidebar } from "./components/Sidebar/Sidebar";

function ChatWrapper() {
  const { uuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const messagesRef = useRef<Message[]>(messages);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const loadChats = async () => {
      setChats(await db.chats.toArray());
    };

    const loadChatAndMessages = async () => {
      if (!uuid) return;

      try {
        const chat = await db.chats.get({ uuid });
        if (!chat) {
          console.error("Chat not found!");
          return;
        }

        const storedMessages = await db.messages
          .where("chatId")
          .equals(chat.id!)
          .sortBy("timestamp");

        setMessages(storedMessages);
        messagesRef.current = storedMessages;

        if (initialLoadRef.current && location.state?.initialMessages) {
          initialLoadRef.current = false;
          if (
            storedMessages.length === 1 &&
            storedMessages[0].role === "user"
          ) {
            await handleSendMessage(storedMessages[0].content, true);
          }
        }
      } catch (error) {
        console.error("Error loading chat and messages:", error);
      }
    };

    loadChats();
    loadChatAndMessages();
  }, [uuid, location.state]);

  const handleSendMessage = async (message: string, isInitial: boolean = false) => {
    if (!uuid) return;

    try {
      let chat = await db.chats.get({ uuid });
      if (!chat) {
        const chatId = await db.chats.add({ uuid });
        chat = await db.chats.get(chatId);
      }

      let newMessage: Message;

      if (!isInitial) {
        newMessage = {
          chatId: chat!.id!,
          content: message,
          role: "user",
          timestamp: new Date(),
        };

        await db.messages.add(newMessage);

        const updatedMessages = [...messagesRef.current, newMessage];
        setMessages(updatedMessages);
        messagesRef.current = updatedMessages;
      }

      const modelManager = new ModelManager({
        provider: APIType.OpenAI,
        key: (import.meta.env.VITE_API_KEY as string) || "",
        endpoint: "https://openrouter.ai/api/v1",
      });

      const stream = await modelManager.stream(
        messagesRef.current,
        "qwen/qwen-vl-plus:free",
        {
          max_tokens: 16384,
          temperature: 0.8,
        }
      );

      let responseMessage: Message = {
        chatId: chat!.id!,
        content: "",
        role: "assistant",
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, responseMessage]);
      messagesRef.current = [...messagesRef.current, responseMessage];
  
      for await (const chunk of stream) {
        responseMessage.content += chunk;
        setMessages([...messagesRef.current]);
      }
  
      await db.messages.add(responseMessage);

    } catch (error) {
      console.error("Streaming error:", error);
    }
  };

  return (
    <div className="chat-wrapper">
      <Sidebar chats={chats} showGreeting={true} />
      <ChatPage messages={messages} onSendMessage={handleSendMessage} />
    </div>
  );
}

function NewChatWrapper() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const loadChats = async () => {
      setChats(await db.chats.toArray());
    };

    loadChats();
  }, []);

  const handleSendMessage = async (message: string) => {
    const newUuid = uuidv4();

    const chatId = await db.chats.add({
      uuid: newUuid,
      name: "New Chat",
    });

    const initialMessage: Message = {
      chatId,
      content: message,
      role: "user",
      timestamp: new Date(),
    };

    await db.messages.add(initialMessage);
    setMessages([initialMessage]);

    navigate(`/chat/${newUuid}`, { state: { initialMessages: true } });
  };

  return (
    <div className="chat-wrapper">
      <Sidebar chats={chats} showGreeting={true} />
      <NewChatPage onSendMessage={handleSendMessage} />
    </div>
  );
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
