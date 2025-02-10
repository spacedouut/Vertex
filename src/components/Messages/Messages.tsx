import styles from "./Messages.module.css";

interface Message {
  content: string;
  role: string;
  id?: string; // Optional ID, if you have it
}

function Message({ content, role }: { content: string; role: string }) {
  return (
    <div className={styles[`message-${role}`]}>{content}</div>
  );
}

export function Messages({ messages }: { messages: Message[] }) {
  return (
    <div className={styles["messages-container"]}>
      {messages.map((message, index) => (
        <Message
          key={message.id || index} // Use message.id if available, otherwise index
          content={message.content}
          role={message.role}
        />
      ))}
    </div>
  );
}
