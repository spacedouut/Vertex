import { Messages } from "../../components/Messages/Messages";
import { MessageBox } from "../../components/MessageBox/MessageBox";

import styles from "./Chat.module.css";

export function Chat({
    messages,
    onSendMessage,
}: {
    messages: { content: string; role: string }[];
    onSendMessage: (message: string) => void;
}) {
    return (
        <div className={styles["chat-container"]}>
            <Messages messages={messages} />
            <MessageBox onSend={onSendMessage} />
        </div>
    );
}
