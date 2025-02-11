import { useState } from "react";
import styles from "./MessageBox.module.css";

interface ToolChipInterface {
    name: string;
}

function Tool({ name }: ToolChipInterface) {
    return <div className={styles["tool-chip"]}>{name}</div>;
}

function Tools({ tools }: { tools: ToolChipInterface[] }) {
    return (
        <div className={styles["tools-container"]}>
            <span className={styles["tools-label"]}>What tools can I use here?</span>
            <div className={styles["tools-list"]}>
                {tools.map((tool, index) => (
                    <Tool key={index} name={tool.name} />
                ))}
            </div>
        </div>
    );
}

function InputBox({ onSend }: { onSend: (message: string) => void }) {
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (input.trim() === "") return;
        onSend(input);
        setInput(""); // Clear input field after sending
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        // Prevent default behavior to avoid adding new lines
        // Check if Enter key was pressed without Shift
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles["message-input-container"]}>
            <textarea
                className={styles["message-input"]}
                placeholder="Type your message here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1} // This will make the textarea height adjust to content
            />
            <button className={styles["message-send"]} onClick={handleSend}>
                Send
            </button>
        </div>
    );
}

export function MessageBox({ onSend }: { onSend: (message: string) => void }) {
    const tools = [
        { name: "tool1" },
        { name: "tool2" },
        { name: "tool3" },
    ];

    return (
        <div className={styles["message-box-container"]}>
            <InputBox onSend={onSend} />
            <Tools tools={tools} />
        </div>
    );
}