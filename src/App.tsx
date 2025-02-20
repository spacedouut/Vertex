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
import "./App.css";

import { NewChatPage } from "./pages/NewChat/NewChat";
import { ChatPage } from "./pages/Chat/Chat";
import { ModelManager, APIType } from "./utils/ModelManager";
import { db, Message, Chat } from "./utils/Dexie";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ModelSelector } from "./components/ModelSelector/ModelSelector";
import { SettingsModal } from "./components/SettingsModal/SettingsModal";
import { Layout } from "./components/Layout/Layout";

function ChatWrapper() {
  const { uuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedModel, setSelectedModel] = useState("qwen/qwen-vl-plus:free");
  const messagesRef = useRef<Message[]>(messages);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const loadChats = async () => {
      const allChats = await db.chats.toArray();
      // Sort chats by timestamp in descending order
      const sortedChats = allChats.sort(
        (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      setChats(sortedChats);
    };

    const loadChatAndMessages = async () => {
      if (!uuid) return;

      try {
        const chat = await db.chats.get({ uuid });
        if (!chat) {
          console.error("Chat not found!");
          return;
        }

        // Set the selected model from the chat if it exists
        if (chat.model) {
          setSelectedModel(chat.model);
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

  // Function to generate chat title
  const generateChatTitle = async (
    currentChatContent: Message[],
    chatId: number
  ) => {
    try {
      const modelManager = new ModelManager({
        provider: APIType.OpenAI,
        key: (import.meta.env.VITE_API_KEY as string) || "",
        endpoint: "https://openrouter.ai/api/v1",
      });

      // Create temporary messages for title generation (not saved to database)
      const titleRequest: Message[] = [
        ...currentChatContent,
        {
          chatId: 0, // IDs  dont matter when the chats arent saved
          content: "Provide a title of the chat. No more than 5 words, should be immediately relevant, and be directly descriptive about the content. Output the title only; No quotes or formatting..",
          role: "user",
          timestamp: new Date(),
        },
      ];

      // Get title from AI
      const titleStream = await modelManager.stream(
        titleRequest,
        "google/learnlm-1.5-pro-experimental:free",
        {
          max_tokens: 100,
          temperature: 0.7,
        }
      );

      let title = "";
      for await (const chunk of titleStream) {
        title += chunk;
      }

      // Trim and limit title length
      title = title.trim();
      if (title.length > 50) {
        title = title.substring(0, 47) + "...";
      }

      // Update chat with generated title
      await db.chats.update(chatId, { name: title });

      // Refresh chats list
      const allChats = await db.chats.toArray();
      const sortedChats = allChats.sort(
        (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      setChats(sortedChats);
    } catch (error) {
      console.error("Error generating chat title:", error);
    }
  };

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    if (uuid) {
      const chat = await db.chats.get({ uuid });
      if (chat) {
        await db.chats.update(chat.id!, { model: modelId });
      }
    }
  };

  const handleSendMessage = async (
    message: string,
    isInitial: boolean = false
  ) => {
    if (!uuid) return;

    try {
      let chat = await db.chats.get({ uuid });
      if (!chat) {
        const chatId = await db.chats.add({
          uuid,
          name: "New Chat",
          timestamp: new Date(),
          model: selectedModel,
        });
        chat = await db.chats.get(chatId);
      }

      // Update chat timestamp
      await db.chats.update(chat!.id!, { timestamp: new Date() });

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
        selectedModel,
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

      for await (const chunk of stream) {
        responseMessage.content += chunk;
        setMessages([...messagesRef.current, responseMessage]);
      }
      messagesRef.current = [...messagesRef.current, responseMessage];

      await db.messages.add(responseMessage);

      // Generate title if this is the first message/response pair
      const chatMessages = await db.messages
        .where("chatId")
        .equals(chat!.id!)
        .toArray();

      if (
        chatMessages.length === 2 &&
        chatMessages[0].role === "user" &&
        chatMessages[1].role === "assistant"
      ) {
        await generateChatTitle(chatMessages, chat!.id!);
      }

      // Update chat timestamp after assistant response
      await db.chats.update(chat!.id!, { timestamp: new Date() });

      // Refresh chat list to show updated order
      const allChats = await db.chats.toArray();
      const sortedChats = allChats.sort(
        (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      setChats(sortedChats);
    } catch (error) {
      console.error("Streaming error:", error);
    }
  };

  return (
    <div className="chat-wrapper">
      <Sidebar chats={chats} showGreeting={true} />
      <ChatPage 
        messages={messages} 
        onSendMessage={handleSendMessage}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
    </div>
  );
}

function NewChatWrapper() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem('lastUsedModel');
    return stored || "qwen/qwen-vl-plus:free";
  });

  useEffect(() => {
    const loadChats = async () => {
      const allChats = await db.chats.toArray();
      const sortedChats = allChats.sort(
        (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      setChats(sortedChats);
    };

    loadChats();
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('lastUsedModel', modelId);
  };

  const handleSendMessage = async (message: string) => {
    const newUuid = uuidv4();

    const chatId = await db.chats.add({
      uuid: newUuid,
      name: "New Chat",
      timestamp: new Date(),
      model: selectedModel,
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
      <Sidebar chats={chats} showGreeting={false} />
      <NewChatPage 
        onSendMessage={handleSendMessage}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
    </div>
  );
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [temperature, setTemperature] = useState(() => {
    const stored = localStorage.getItem('temperature');
    return stored ? parseFloat(stored) : 0.8;
  });

  const handleTemperatureChange = (newTemp: number) => {
    setTemperature(newTemp);
    localStorage.setItem('temperature', newTemp.toString());
  };

  return (
    <Router>
      <Layout isSettingsOpen={isSettingsOpen} onOpenSettings={() => setIsSettingsOpen(true)}>
        <Routes>
          <Route path="/chat" element={<NewChatWrapper />} />
          <Route path="/chat/:uuid" element={<ChatWrapper />} />
          <Route path="/" element={<NewChatWrapper />} />
        </Routes>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          temperature={temperature}
          onTemperatureChange={handleTemperatureChange}
        />
      </Layout>
    </Router>
  );
}

export default App;
