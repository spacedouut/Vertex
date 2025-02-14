import styles from "./Sidebar.module.css";
import { Greeting } from "../Greeting/Greeting";

function SidebarChatItem({ title, id }: { title: string; id: string }) {
  return <div className={styles["sidebar-chat-item"]}>{title}</div>;
}

export function Sidebar({
  chats,
  showGreeting,
}: {
  chats: any[];
  showGreeting: boolean;
}) {
  return (
    <div className={styles["sidebar"]}>
      {showGreeting && <Greeting username="user" />}
      <span className={styles["sidebar-title"]}>Chats</span>
      {chats.map((chat) => (
        <SidebarChatItem key={chat.id} title={chat.title} id={chat.id} />
      ))}
    </div>
  );
}
