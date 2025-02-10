import { Greeting } from "../../components/Greeting/Greeting";
import { MessageBox } from "../../components/MessageBox/MessageBox";

import styles from "./NewChat.module.css";

export function NewChat({ onSendMessage }: { onSendMessage: (message: string) => void }) {
    return (
        <div className={styles["new-chat-container"]}>
            <Greeting username="user"/>
            <MessageBox onSend={onSendMessage} />
        </div>
    );
}
