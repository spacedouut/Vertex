import { Greeting } from "../../components/Greeting/Greeting";
import { MessageBox } from "../../components/MessageBox/MessageBox";

import styles from "./NewChat.module.css";

interface NewChatPageProps {
  onSendMessage: (message: string) => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function NewChatPage({
  onSendMessage,
  selectedModel,
  onModelChange,
}: NewChatPageProps) {
  return (
    <div className={styles["new-chat-container"]}>
      <Greeting username="user" />
      <MessageBox 
        onSend={onSendMessage}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />
    </div>
  );
}
