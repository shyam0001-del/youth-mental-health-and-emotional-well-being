import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";

export default function StudentPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [latestMood, setLatestMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name") || "Student";

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/chat-history", {
        headers: getHeaders(),
      });
      setMessages(res.data.messages || []);
      setLatestMood(res.data.latestMood || null);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to load chat history");
      if (error?.response?.status === 401) {
        logout();
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setLoading(true);

    const optimisticUserMessage = {
      _id: `temp-${Date.now()}`,
      sender: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const res = await api.post(
        "/chat",
        { message: userText },
        { headers: getHeaders() }
      );

      const aiMessage = {
        _id: `ai-${Date.now()}`,
        sender: "ai",
        text: res.data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLatestMood(res.data.mood || null);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to send message");
      if (error?.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <Layout title="MindMitra Student Support">
      <div className="student-chat-layout">
        <div className="student-left-panel">
          <div className="student-card">
            <h2>Welcome, {name}</h2>
            <p>This AI companion can talk with you, save your chat history, and help track your mood patterns over time.</p>
          </div>

          <div className="student-card">
            <h3>Quick check-in</h3>
            <div className="quick-moods">
              {["Calm", "Stressed", "Anxious", "Sad", "Overwhelmed"].map((mood) => (
                <button
                  key={mood}
                  type="button"
                  className="quick-mood-btn"
                  onClick={() => setInput(`I am feeling ${mood.toLowerCase()} today.`)}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div className="student-card">
            <h3>Latest mood insight</h3>
            {latestMood ? (
              <>
                <p><b>Mood:</b> {latestMood.mood}</p>
                <p>{latestMood.summary}</p>
              </>
            ) : (
              <p>No mood insight yet. Start chatting to generate one.</p>
            )}
          </div>

          <div className="student-card">
            <button onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="student-chat-panel">
          <div className="chat-header">
            <h2>AI Support Chat</h2>
            <p>Talk openly. Your recent chat is saved for future mood evaluation.</p>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                Start with something simple, like “I feel stressed about exams.”
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg._id || index}
                  className={`chat-bubble ${msg.sender === "user" ? "user-bubble" : "ai-bubble"}`}
                >
                  <div className="chat-sender">{msg.sender === "user" ? "You" : "MindMitra AI"}</div>
                  <div>{msg.text}</div>
                </div>
              ))
            )}

            {loading && (
              <div className="chat-bubble ai-bubble">
                <div className="chat-sender">MindMitra AI</div>
                <div>Typing...</div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              rows="3"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}