import { Messages } from "../../components/Messages/Messages";
import { MessageBox } from "../../components/MessageBox/MessageBox";

import styles from "./Chat.module.css";

interface ChatPageProps {
    messages: { content: string; role: string }[];
    onSendMessage: (message: string) => void;
    selectedModel: string;
    onModelChange: (modelId: string) => void;
}

export function ChatPage({
    messages,
    onSendMessage,
    selectedModel,
    onModelChange,
}: ChatPageProps) {
    return (
        <div className={styles["chat-container"]}>
            <Messages messages={messages} />
            <MessageBox 
                onSend={onSendMessage}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
            />
        </div>
    );
}
