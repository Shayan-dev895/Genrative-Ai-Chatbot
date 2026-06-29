import { useState, useRef } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sirf ek dafa unique user id generate hogi
  const userId = useRef(
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  );

  const handleSend = async () => {
    if (!input.trim()) return;

    // Message id for React key
    const msgId =
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 8);

    // User message
    const userMessage = {
      id: msgId,
      text: input,
      sender: "user",
    };

    console.log("User ID:", userId.current);

    // UI pe message show karo
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      // Backend call
      const response = await fetch("http://localhost:2001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: userId.current, // same id har baar
          message: currentInput,
        }),
      });

      const data = await response.json();
      console.log("AI response:", data);

      // Bot response
      const botMessage = {
        id:
          Date.now().toString(36) +
          Math.random().toString(36).substring(2, 8),
        text: data.result || "No response from AI",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          id:
            Date.now().toString(36) +
            Math.random().toString(36).substring(2, 8),
          text: "Something went wrong",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="h-screen bg-[#0d0d0f] flex justify-center items-center p-4">
      <div className="w-full max-w-4xl h-[95vh] bg-[#111113] rounded-3xl border border-neutral-800 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="border-b border-neutral-800 p-4 text-white text-xl font-semibold">
          AI Chat
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-3xl max-w-[75%] text-sm ${
                  msg.sender === "user"
                    ? "bg-white text-black"
                    : "bg-[#1b1b1f] whitespace-pre-wrap break-words text-white border border-neutral-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-neutral-400 text-sm">
              AI is thinking...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 bg-[#1b1b1f] rounded-full px-4 py-3 border border-neutral-700">

            <input
              type="text"
              value={input}
              placeholder="Ask anything..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-500"
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-white text-black px-5 py-2 rounded-full font-medium disabled:opacity-50"
            >
              {loading ? "..." : "Send"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}