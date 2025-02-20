import { useRef, useEffect, useState } from "react";
import styles from "./Messages.module.css";
import ReactMarkdown from "react-markdown";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // Optional: include a theme
import "prismjs/plugins/autoloader/prism-autoloader.min.js"; // Load the auto loader

// Load common languages
Prism.plugins.autoloader.languages_path =
  "https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/components/";
Prism.plugins.autoloader.loadLanguages([
  "python",
  "javascript",
  "html",
  "json",
  "typescript",
]);

interface Message {
  content: string;
  role: string;
  id?: string;
}

function Message({ content, role }: { content: string; role: string }) {
  useEffect(() => {
    // Highlight all code blocks after the markdown is rendered
    Prism.highlightAll();
  }, [content]);

  const [showThought, setShowThought] = useState(false);
  const openingThinkTag = /<think>/g;
  const closingThinkTag = /<\/think>/g;

  let thoughtMatches: string[] | null = null;
  let filteredContent = content;

  // Only apply thinking system if role is 'assistant'
  if (role === "assistant") {
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
  }

  const handleToggleThought = () => {
    setShowThought(!showThought);
  };

  return (
    <div className={styles[`message-${role}`]}>
      {role === "assistant" && thoughtMatches && (
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
      <ReactMarkdown className={styles["message-content"]}>
        {filteredContent || ""}
      </ReactMarkdown>
    </div>
  );
}

export function Messages({ messages }: { messages: Message[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Scroll the container to the bottom and re-enable autoScroll.
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  // Check if the user is at the bottom (within a threshold).
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      setAutoScroll(isAtBottom);
    }
  };

  // Whenever messages update, scroll to bottom if autoScroll is enabled.
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll]);

  return (
      <div
        className={styles["messages-container"]}
        ref={containerRef}
        onScroll={handleScroll}
        // Ensure the container is scrollable
      >
        {messages.map((message, index) => (
          <Message
            key={message.id || index}
            content={message.content}
            role={message.role}
          />
        ))}
      {/* Render a button when auto-scroll is disabled */}
      {!autoScroll && (
        <button onClick={scrollToBottom} className={styles["scroll-button"]}>
          Scroll Down
        </button>
      )}
    </div>
  );
}