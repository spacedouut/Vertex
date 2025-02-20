import { useState } from "react";
import { ModelSelector } from "../ModelSelector/ModelSelector";
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

interface InputBoxProps {
    onSend: (message: string) => void;
    selectedModel: string;
    onModelChange: (modelId: string) => void;
}

function InputBox({ onSend, selectedModel, onModelChange }: InputBoxProps) {
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
            <div className={styles["input-actions"]}>
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                />
                <button className={styles["message-send"]} onClick={handleSend}>
                    Send
                </button>
            </div>
        </div>
    );
}

interface MessageBoxProps {
    onSend: (message: string) => void;
    selectedModel: string;
    onModelChange: (modelId: string) => void;
}

export function MessageBox({ onSend, selectedModel, onModelChange }: MessageBoxProps) {
    const tools = [
        { name: "tool1" },
        { name: "tool2" },
        { name: "tool3" },
    ];

    return (
        <div className={styles["message-box-container"]}>
            <InputBox 
                onSend={onSend}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
            />
            <Tools tools={tools} />
        </div>
    );
}