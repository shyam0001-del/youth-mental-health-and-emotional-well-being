import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const feelings = [
  "Stress","Anxiety","Depression","Lonely","Happy","Calm",
  "Angry","Overwhelmed","Tired","Confused","Hopeful","Relaxed",
  "Worried","Fear","Panic","Sad","Excited","Motivated",
  "Peaceful","Burnout","Pressure","Insecure","Loved","Grateful",
  "Frustrated","Nervous","Empty","Strong","Healing","Brave"
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const list = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      text: feelings[Math.floor(Math.random() * feelings.length)],
      size: Math.random() * 80 + 40,
      left: Math.random() * 90,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      duration: Math.random() * 15 + 10,
    }));
    setBubbles(list);
  }, []);

  return (
    <div className="welcome-page">
      <h1 className="welcome-title">How are you feeling today?</h1>
      <h2 className="welcome-subtitle">Click your bubble to burst your feelings</h2>

      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            background: bubble.color,
            animationDuration: `${bubble.duration}s`,
          }}
          onClick={() => navigate("/login")}
        >
          {bubble.text}
        </div>
      ))}
    </div>
  );
}