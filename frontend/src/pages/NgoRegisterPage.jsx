import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import SocialLinksInput from "../components/SocialLinksInput";

export default function NgoRegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [socialLinks, setSocialLinks] = useState([]);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedTypes.includes(selected.type)) {
      alert("Only PDF, JPG, JPEG, PNG files are allowed");
      e.target.value = "";
      setFile(null);
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const registerNGO = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", form.name);
    data.append("email", form.email);
    data.append("password", form.password);
    data.append("role", "ngo");
    data.append("social", JSON.stringify(socialLinks));

    if (file) data.append("certificate", file);

    try {
      const res = await api.post("/register", data);
      alert(res.data.message || "NGO Registered. Wait for Admin Approval.");
      navigate("/login");
    } catch (error) {
      alert(error?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <Layout title="NGO Register">
      <div className="container">
        <h2>NGO Registration</h2>

        <form onSubmit={registerNGO}>
          <input
            placeholder="NGO Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <SocialLinksInput value={socialLinks} onChange={setSocialLinks} />

          <label>Upload Certificate (Optional)</label>
          <input type="file" onChange={handleFile} />
          <div className="info-text">Allowed: PDF, JPG, PNG | Max size: 2MB</div>

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button type="submit">Register NGO</button>
        </form>

        <p>After registration, wait for Admin Approval.</p>
        <Link to="/login">Back to Login</Link>
      </div>
    </Layout>
  );
}