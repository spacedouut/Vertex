import styles from "./Messages.module.css";
import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect } from "react";

interface Message {
  content: string;
  role: string;
  id?: string;
}

function Message({ content, role }: { content: string; role: string }) {
  const [showThought, setShowThought] = useState(false);
  const openingThinkTag = /<think>/g;
  const closingThinkTag = /<\/think>/g;

  let thoughtMatches: string[] | null = null;
  let filteredContent = content;

  if (openingThinkTag.test(content) && !closingThinkTag.test(content)) {
    // Only opening <think> tag found
    thoughtMatches = [content.substring(content.indexOf("<think>"))];
    filteredContent = content.substring(0, content.indexOf("<think>"));
  } else {
    // Both or neither tags found
    const thoughtRegex = /<think>(.*?)<\/think>/gs;
    thoughtMatches = content.match(thoughtRegex);
    filteredContent = content.replace(thoughtRegex, "");
  }

  const handleToggleThought = () => {
    setShowThought(!showThought);
  };

  return (
    <div className={styles[`message-${role}`]}>
      {thoughtMatches && (
        <div>
          <button
            onClick={handleToggleThought}
            className={styles["thought-button"]}
          >
            {showThought ? "Hide Chain-of-thought" : "Show Chain-of-thought"}
          </button>
          {showThought && (
            <div className={styles["thought-content"]}>
              {thoughtMatches.map((match, index) => (
                <ReactMarkdown key={index}>
                  {match.replace(/<\/?think>/g, "")}
                </ReactMarkdown>
              ))}
            </div>
          )}
        </div>
      )}
      <ReactMarkdown>{filteredContent || ""}</ReactMarkdown>
    </div>
  );
}

export function Messages({ messages }: { messages: Message[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles["messages-container"]}>
      {messages.map((message, index) => (
        <Message
          key={message.id || index}
          content={message.content}
          role={message.role}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
