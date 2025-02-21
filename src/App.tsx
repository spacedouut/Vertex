import { useState, useEffect, useRef } from "react";
import {
  HashRouter as Router,
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
import { SettingsModal } from "./components/SettingsModal/SettingsModal";
import { Layout } from "./components/Layout/Layout";

function ChatWrapper() {
  const { uuid } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedModel, setSelectedModel] = useState("deepseek-r1-distill-llama-70b");
  const messagesRef = useRef<Message[]>(messages);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const loadChats = async () => {
      console.debug("[ChatWrapper] Loading all chats");
      const allChats = await db.chats.toArray();
      const sortedChats = allChats.sort(
        (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      console.debug(`[ChatWrapper] Loaded ${sortedChats.length} chats`);
      setChats(sortedChats);
    };

    const loadChatAndMessages = async () => {
      if (!uuid) return;

      try {
        console.debug(`[ChatWrapper] Loading chat with UUID: ${uuid}`);
        const chat = await db.chats.get({ uuid });
        if (!chat) {
          console.error("[ChatWrapper] Chat not found!");
          return;
        }

        if (chat.model) {
          console.debug(`[ChatWrapper] Setting model from chat: ${chat.model}`);
          setSelectedModel(chat.model);
        }

        const storedMessages = await db.messages
          .where("chatId")
          .equals(chat.id!)
          .sortBy("timestamp");
        
        console.debug(`[ChatWrapper] Loaded ${storedMessages.length} messages for chat`);
        setMessages(storedMessages);
        messagesRef.current = storedMessages;

        if (initialLoadRef.current && location.state?.initialMessages) {
          initialLoadRef.current = false;
          if (
            storedMessages.length === 1 &&
            storedMessages[0].role === "user"
          ) {
            console.debug("[ChatWrapper] Processing initial message");
            await handleSendMessage(storedMessages[0].content, true);
          }
        }
      } catch (error) {
        console.error("[ChatWrapper] Error loading chat and messages:", error);
      }
    };

    loadChats();
    loadChatAndMessages();
  }, [uuid, location.state]);

  const handleModelChange = async (modelId: string) => {
    console.debug(`[ChatWrapper] Changing model to: ${modelId}`);
    setSelectedModel(modelId);
    if (uuid) {
      const chat = await db.chats.get({ uuid });
      if (chat) {
        await db.chats.update(chat.id!, { model: modelId });
        console.debug(`[ChatWrapper] Updated chat ${chat.id} with new model`);
      }
    }
  };

  const handleSendMessage = async (
    message: string,
    isInitial: boolean = false
  ) => {
    if (!uuid) return;

    try {
      console.debug(`[ChatWrapper] Sending ${isInitial ? 'initial ' : ''}message`);
      let chat = await db.chats.get({ uuid });
      if (!chat) {
        console.debug("[ChatWrapper] Creating new chat");
        const chatId = await db.chats.add({
          uuid,
          name: "New Chat",
          timestamp: new Date(),
          model: selectedModel,
        });
        chat = await db.chats.get(chatId);
      }

      await db.chats.update(chat!.id!, { timestamp: new Date() });

      if (!isInitial) {
        const newMessage = {
          chatId: chat!.id!,
          content: message,
          role: "user",
          timestamp: new Date(),
        };
        await db.messages.add(newMessage);
        console.debug("[ChatWrapper] Added user message to database");

        const updatedMessages = [...messagesRef.current, newMessage];
        setMessages(updatedMessages);
        messagesRef.current = updatedMessages;
      }

      const stored = localStorage.getItem("customModels");
      const customModels = stored ? JSON.parse(stored) : [];
      const modelConfig = customModels.find(
        (m: any) => m.id === selectedModel
      );

      console.debug(`[ChatWrapper] Using model: ${modelConfig ? 'Custom' : 'Default'} - ${selectedModel}`);
      const modelManager = new ModelManager({
        provider: modelConfig ? modelConfig.provider : APIType.OpenAI,
        key: modelConfig
          ? modelConfig.apiKey
          : (import.meta.env.VITE_API_KEY as string) || "",
        endpoint: modelConfig?.baseUrl || "https://api.groq.com/openai/v1",
      });

      console.debug("[ChatWrapper] Starting message stream");
      const stream = await modelManager.stream(
        messagesRef.current,
        modelConfig ? modelConfig.modelId : selectedModel,
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

      console.debug("[ChatWrapper] Processing stream chunks");
      for await (const chunk of stream) {
        responseMessage.content += chunk;
        setMessages([...messagesRef.current, responseMessage]);
      }
      messagesRef.current = [...messagesRef.current, responseMessage];

      await db.messages.add(responseMessage);
      console.debug("[ChatWrapper] Added assistant response to database");

      const chatMessages = await db.messages
        .where("chatId")
        .equals(chat!.id!)
        .toArray();

      if (
        chatMessages.length === 2 &&
        chatMessages[0].role === "user" &&
        chatMessages[1].role === "assistant"
      ) {
        console.debug("[ChatWrapper] Generating chat title");
        await generateChatTitle(chatMessages, chat!.id!);
      }

      await db.chats.update(chat!.id!, { timestamp: new Date() });

      const allChats = await db.chats.toArray();
      const sortedChats = allChats.sort(
        (a, b) =>
          (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      setChats(sortedChats);
      console.debug("[ChatWrapper] Updated chat list");
    } catch (error) {
      console.error("[ChatWrapper] Streaming error:", error);
    }
  };

  const generateChatTitle = async (
    currentChatContent: Message[],
    chatId: number
  ) => {
    try {
      console.debug("[ChatWrapper] Starting title generation");
      const stored = localStorage.getItem("customModels");
      const customModels = stored ? JSON.parse(stored) : [];
      const modelConfig = customModels.find((m: any) => m.id === selectedModel);

      const modelManager = new ModelManager({
        provider: modelConfig ? modelConfig.provider : APIType.OpenAI,
        key: modelConfig
          ? modelConfig.apiKey
          : (import.meta.env.VITE_API_KEY as string) || "",
        endpoint: modelConfig?.baseUrl || "https://api.groq.com/openai/v1",
      });

      const titleRequest: Message[] = [
        ...currentChatContent,
        {
          chatId: 0,
          content:
            "Provide a title of the chat. No more than 5 words, should be immediately relevant, and be directly descriptive about the content. Output the title only; No quotes or formatting..",
          role: "user",
          timestamp: new Date(),
        },
      ];

      console.debug("[ChatWrapper] Requesting title from model");
      const titleStream = await modelManager.stream(
        titleRequest,
        modelConfig ? modelConfig.modelId : selectedModel,
        {
          max_tokens: 100,
          temperature: 0.7,
        }
      );

      let title = "";
      for await (const chunk of titleStream) {
        title += chunk;
      }

      title = title.trim();
      if (title.length > 50) {
        title = title.substring(0, 47) + "...";
      }
      console.debug(`[ChatWrapper] Generated title: ${title}`);

      await db.chats.update(chatId, { name: title });

      const allChats = await db.chats.toArray();
      const sortedChats = allChats.sort(
        (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
      );
      setChats(sortedChats);
      console.debug("[ChatWrapper] Updated chat list with new title");
    } catch (error) {
      console.error("[ChatWrapper] Error generating chat title:", error);
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
  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem("lastUsedModel");
    return stored || "deepseek-r1-distill-llama-70b";
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
    localStorage.setItem("lastUsedModel", modelId);
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
    const stored = localStorage.getItem("temperature");
    return stored ? parseFloat(stored) : 0.8;
  });

  const handleTemperatureChange = (newTemp: number) => {
    setTemperature(newTemp);
    localStorage.setItem("temperature", newTemp.toString());
  };

  return (
    <Router>
      <Layout onOpenSettings={() => setIsSettingsOpen(true)}>
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
