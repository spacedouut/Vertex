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
    key: import.meta.env.VITE_API_KEY as string || "",
    endpoint: "https://api.groq.com/openai/v1/",
  });

  const handleSendMessage = useCallback(
    async (message: string) => {
      const newMessages = [...messages, { content: message, role: "user" }];
      setMessages(newMessages);

      // In app.tsx, inside the try block:
      try {
        const response = await modelManager.generate(
          newMessages,
          "deepseek-r1-distill-llama-70b"
        );
        console.log(response); // Inspect the response in the console.
        if (
          typeof response === "object" &&
          response !== null &&
          "text" in response
        ) {
          setAiResponse(response.text);
          setMessages((prevMessages) => [
            ...prevMessages,
            { content: response.text, role: "assistant" },
          ]);
        } else {
          // Handle the case where the response isn't an object or doesn't have a 'text' property
          console.error("Unexpected response format:", response);
          setAiResponse("Failed to generate response.");
        }
      } catch (error) {
        console.error("Error generating AI response:", error);
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
