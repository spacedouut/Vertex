import { Greeting } from "../../components/Greeting/Greeting";
import { MessageBox } from "../../components/MessageBox/MessageBox";
import { Sidebar } from "../../components/Sidebar/Sidebar";

import styles from "./NewChat.module.css";

export function NewChat({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) {
  return (
    <div className={styles["new-chat-container"]}>
      <Sidebar />
      <div className={styles["new-chat-content"]}>
        <Greeting username="user" />
        <MessageBox onSend={onSendMessage} />
      </div>
    </div>
  );
}
