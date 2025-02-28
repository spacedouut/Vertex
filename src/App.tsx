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
import { ModelManager } from "./utils/ModelManager";
import { db, Message, Chat, Model } from "./utils/Dexie";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SettingsModal } from "./components/SettingsModal/SettingsModal";
import { Layout } from "./components/Layout/Layout";
import { getAPITypeFromString } from "./utils/modelUtils";

function ChatWrapper() {
  const { uuid } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const messagesRef = useRef<Message[]>(messages);
<<<<<<< HEAD
  const initialLoadRef = useRef(true);
  const initialMessageState = useRef(false);

  const handleInitialMessage = async () => {
    if (
      messagesRef.current.length == 1 &&
      messagesRef.current[0].role == "user"
    ) {
      console.debug("[ChatWrapper] Processing initial message");
      await handleSendMessage(messagesRef.current[0].content, true);
    }
  };
=======

  // runs when messages are loaded
  const handleInitialMessage = async () => {
    if (messagesRef.current.length === 1 && messagesRef.current[0].role === "user") {
      console.debug("[ChatWrapper] Processing initial message");
      await handleSendMessage(messagesRef.current[0].content, true);
    }
  };

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

        if (chat.modelId) {
          const model = await db.models.get(chat.modelId);
          if (model) {
            setSelectedModel(model);
          }
        }

        const storedMessages = await db.messages
          .where("chatId")
          .equals(chat.id!)
          .sortBy("timestamp");

        console.debug(
          `[ChatWrapper] Loaded ${storedMessages.length} messages for chat`
        );
        setMessages(storedMessages);
        messagesRef.current = storedMessages;
        
        // Always check for initial message when messages are loaded
        await handleInitialMessage();
      } catch (error) {
        console.error("[ChatWrapper] Error loading chat and messages:", error);
      }
    };

    loadChats();
    loadChatAndMessages();
  }, [uuid, location.state]);
>>>>>>> c9e4072595be51611fa148d063bc4694eddb366c

  const handleModelChange = async (modelId: string) => {
    if (!uuid) return;

    try {
      const model = await db.models.where("modelId").equals(modelId).first();
      if (!model) {
        console.error("[ChatWrapper] Model not found!");
        return;
      }

      setSelectedModel(model);

      const chat = await db.chats.get({ uuid });
      if (chat) {
        await db.chats.update(chat.id!, { modelId: model.id });
        console.debug(`[ChatWrapper] Updated chat ${chat.id} with new model`);
      }
    } catch (error) {
      console.error("[ChatWrapper] Error changing model:", error);
    }
  };

  const handleSendMessage = async (
    message: string,
    isInitial: boolean = false
  ) => {
    if (!uuid || !selectedModel) return;
    console.debug("=== HANDLING SEND MESSAGE ===");
    console.debug(`UUID: ${uuid}`);
    console.debug(`Selected Model: ${selectedModel.modelId}`);
    console.debug(`Message: ${message}`);

    try {
      const chat = await db.chats.get({ uuid });
      if (!chat || !chat.id) {
        console.error("[ChatWrapper] Chat not found or invalid");
        return;
      }

      let updatedMessages = messagesRef.current;
      if (!isInitial) {
        // Add user message to the database and state
        const userMessage: Message = {
          chatId: chat.id,
          content: message,
          role: "user",
          timestamp: new Date(),
        };

        const userMessageId = await db.messages.add(userMessage);
        let updatedMessages = [...messagesRef.current, userMessage];
        setMessages(updatedMessages);
        messagesRef.current = updatedMessages;
      }

      // Initialize model manager and get response
      const modelManager = new ModelManager({
        provider: getAPITypeFromString(selectedModel.provider),
        key: selectedModel.apiKey,
        endpoint: selectedModel.baseUrl,
      });

      // Get model response
      // Initialize an empty assistant message and add it to the state
      let modelResponse = "";
      const assistantMessage: Message = {
        chatId: chat.id,
        content: modelResponse,
        role: "assistant",
        timestamp: new Date(),
      };

      const assistantMessageId = await db.messages.add(assistantMessage);
      const initialMessages = [...updatedMessages, assistantMessage];
      setMessages(initialMessages);
      messagesRef.current = initialMessages;

      // Stream the response and update the message content in real-time
      const responseStream = await modelManager.stream(
        updatedMessages,
        selectedModel.modelId
      );

      for await (const chunk of responseStream) {
        modelResponse += chunk;
        // Update the assistant message content in the state
        const updatedAssistantMessage = {
          ...assistantMessage,
          content: modelResponse,
        };
        const currentMessages = [...updatedMessages, updatedAssistantMessage];
        setMessages(currentMessages);
        messagesRef.current = currentMessages;

        // Update the assistant message content in the database
        await db.messages.update(assistantMessageId, {
          content: modelResponse,
        });
      }

      if (!modelResponse) {
        console.error("[ChatWrapper] No response from model");
        return;
      }

      // Update chat timestamp
      await db.chats.update(chat.id, { timestamp: new Date() });

      // Generate title for new chats
      if (isInitial) {
        await generateChatTitle(messagesRef.current, chat.id);
      }
    } catch (error) {
      console.error("[ChatWrapper] Error in handleSendMessage:", error);
    }
  };

  const generateChatTitle = async (
    currentChatContent: Message[],
    chatId: number
  ) => {
    console.debug("=== GENERATING CHAT TITLE ===");
    console.debug(`Chat ID: ${chatId}`);
    if (!selectedModel) return;

    try {
      if (currentChatContent.length === 0) return;

      // Initialize model manager for title generation
      const modelManager = new ModelManager({
        provider: getAPITypeFromString(selectedModel.provider),
        key: selectedModel.apiKey,
        endpoint: selectedModel.baseUrl,
      });

      // Create a prompt for title generation
      const titlePrompt = `Based on this conversation, generate a very brief and concise title (max 6 words):
        ${currentChatContent[0].content.substring(0, 200)}`;

      const titleMessage: Message = {
        chatId: chatId,
        content: titlePrompt,
        role: "user",
        timestamp: new Date(),
      };

      // Get title from model
      const response = await modelManager.generate(
        [titleMessage],
        selectedModel.modelId
      );
      const title = response.toString();

      if (!title) {
        console.error("[ChatWrapper] Failed to generate title");
        return;
      }

      // Clean and truncate the title
      const cleanTitle = title
        .replace(/["']/g, "")
        .replace(/^Title: /i, "")
        .replace(/^\d+\. /, "")
        .trim()
        .substring(0, 50);

      // Update chat with new title
      await db.chats.update(chatId, { name: cleanTitle });

      // Update chats state to reflect the new title
      const updatedChat = await db.chats.get(chatId);
      if (updatedChat) {
        setChats((prevChats) =>
          prevChats.map((chat) => (chat.id === chatId ? updatedChat : chat))
        );
      }
    } catch (error) {
      console.error("[ChatWrapper] Error generating chat title:", error);
    }
  };
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

      if (chat.modelId) {
        const model = await db.models.get(chat.modelId);
        if (model) {
          setSelectedModel(model);
        }
      }

      const storedMessages = await db.messages
        .where("chatId")
        .equals(chat.id!)
        .sortBy("timestamp");

      console.debug(
        `[ChatWrapper] Loaded ${storedMessages.length} messages for chat`
      );
      setMessages(storedMessages);
      messagesRef.current = storedMessages;
      handleInitialMessage();
    } catch (error) {
      console.error("[ChatWrapper] Error loading chat and messages:", error);
    }
  };
  useEffect(() => {
    loadChats();
    loadChatAndMessages();
  }, []);

  return (
    <div className="chat-wrapper">
      <Sidebar chats={chats} showGreeting={true} />
      <ChatPage
        messages={messages}
        onSendMessage={handleSendMessage}
        selectedModel={selectedModel?.modelId || ""}
        onModelChange={handleModelChange}
      />
    </div>
  );
}

function NewChatWrapper() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadModels = async () => {
    const lastUsedModelId = localStorage.getItem("lastUsedModel");
    if (lastUsedModelId) {
      const model = await db.models
        .where("modelId")
        .equals(lastUsedModelId)
        .first();
      if (model) {
        setSelectedModel(model);
      }
    }
  };

  const loadChats = async () => {
    const allChats = await db.chats.toArray();
    const sortedChats = allChats.sort(
      (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
    );
    setChats(sortedChats);
  };

  useEffect(() => {
    loadModels();
    loadChats();
  }, []);

  const handleModelChange = async (modelId: string) => {
    const model = await db.models.where("modelId").equals(modelId).first();
    if (model) {
      setSelectedModel(model);
      localStorage.setItem("lastUsedModel", modelId);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedModel) {
      setIsSettingsOpen(true);
      alert(
        "You don't have any models configured! Configure a model here in settings, reload the page, then try again."
      );
      return;
    }

    const newUuid = uuidv4();
    console.debug(`=== CREATING NEW CHAT ===`);
    console.debug(`UUID: ${newUuid}`);
    console.debug(`Model ID: ${selectedModel.modelId}`);
    console.debug(`Message: ${message}`);

    const chatId = await db.chats.add({
      uuid: newUuid,
      name: "New Chat",
      modelId: selectedModel.id,
      timestamp: new Date(Date.now()),
    });

    const initialMessage: Message = {
      chatId,
      content: message,
      role: "user",
      timestamp: new Date(Date.now()),
    };

    await db.messages.add(initialMessage);

    navigate(`/chat/${newUuid}`, { state: { initialMessages: true } });
  };

  return (
    <div className="chat-wrapper">
      <Sidebar chats={chats} showGreeting={false} />
      <NewChatPage
        onSendMessage={handleSendMessage}
        selectedModel={selectedModel?.modelId || ""}
        onModelChange={handleModelChange}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        temperature={0.7}
        onTemperatureChange={() => {}}
      />
    </div>
  );
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [temperature, setTemperature] = useState(() => {
    const stored = localStorage.getItem("temperature");
    return stored ? parseFloat(stored) : 0.7;
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
