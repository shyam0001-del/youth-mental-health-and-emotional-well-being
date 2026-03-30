import { useState } from "react";

export default function SocialLinksInput({ value, onChange, max = 5 }) {
  const [input, setInput] = useState("");

  const addSocial = () => {
    const trimmed = input.trim();

    if (!trimmed) {
      alert("Enter a social media link first");
      return;
    }

    if (value.length >= max) {
      alert(`Maximum ${max} social links allowed`);
      return;
    }

    if (value.includes(trimmed)) {
      alert("This social link is already added");
      return;
    }

    onChange([...value, trimmed]);
    setInput("");
  };

  const removeSocial = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="social-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Social Media Link"
        />
        <button type="button" className="add-btn" onClick={addSocial}>
          Add
        </button>
      </div>

      <div className="info-text">You can add up to {max} social links.</div>

      <div className="social-list">
        {value.map((link, index) => (
          <div key={index} className="social-item">
            <span className="social-text">{link}</span>
            <button
              type="button"
              className="remove-btn"
              onClick={() => removeSocial(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}