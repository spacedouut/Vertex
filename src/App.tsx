import { useState, useCallback } from "react";
import "./App.css";

import { NewChat } from "./pages/NewChat/NewChat";
import { Chat } from "./pages/Chat/Chat";
import { ModelManager, APIType } from "./utils/ModelManager";

function App() {
  const [messages, setMessages] = useState<{ content: string; role: string }[]>(
    []
  );
  const [aiResponse, setAiResponse] = useState<string>("");

  const modelManager = new ModelManager({
    provider: APIType.OpenAI,
    key: (import.meta.env.VITE_API_KEY as string) || "",
    endpoint: "https://api.groq.com/openai/v1/",
  });

  const handleSendMessage = useCallback(
    async (message: string) => {
      const newMessages = [...messages, { content: message, role: "user" }];
      setMessages(newMessages);

      try {
        const stream = await modelManager.stream(
          newMessages,
          "deepseek-r1-distill-llama-70b"
        );
        let response = ""
        for await (const chunk of stream) {
          // Process the chunk
          setAiResponse((prev) => prev + chunk);
          response += chunk;
          setMessages((prevMessages) => [
            ...newMessages,
            { content: response, role: "assistant" },
          ]);
        }
      } catch (error) {
        console.error("Streaming error:", error);
        setAiResponse("Failed to generate response.");
      }
    },
    [messages, modelManager]
  );

  return (
    <>
      {messages.length === 0 ? (
        <NewChat onSendMessage={handleSendMessage} />
      ) : (
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          aiResponse={aiResponse}
        />
      )}
    </>
  );
}

export default App;
