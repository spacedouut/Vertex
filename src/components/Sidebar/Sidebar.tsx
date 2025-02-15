// Sidebar.tsx
import styles from "./Sidebar.module.css";
import { Greeting } from "../Greeting/Greeting";
import { useNavigate } from "react-router-dom";

function SidebarChatItem({ title, id }: { title: string; id: string }) {
  const navigate = useNavigate();

  return (
    <div
      className={styles["sidebar-chat-item"]}
      onClick={() => navigate(`/chat/${id}`)}
    >
      {title}
    </div>
  );
}

export function Sidebar({
  chats,
  showGreeting,
}: {
  chats: any[];
  showGreeting: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className={styles["sidebar"]}>
      {showGreeting && <Greeting username="user" />}

      <div className={styles["sidebar-newchat-button"]}
        onClick={() => navigate(`/chat`)}
      >New Chat</div>

      <span className={styles["sidebar-title"]}>Chats</span>
      <div className={styles["sidebar-chat-list"]}>
        {chats.length > 0 ? (
          chats.map((chat) => (
            <SidebarChatItem
              key={chat.id}
              title={chat.name || "Untitled Chat"}
              id={chat.uuid}
            />
          ))
        ) : (
          <p>No chats yet. Start a conversation!</p>
        )}
      </div>
    </div>
  );
}
