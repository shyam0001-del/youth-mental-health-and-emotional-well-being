import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";

export default function UserRegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const registerUser = async (e) => {
    e.preventDefault();

    try {
      await api.post("/register", {
        ...form,
        role: "user",
      });
      alert("User Registered");
      navigate("/login");
    } catch (error) {
      alert(error?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <Layout title="User Register">
      <div className="container">
        <h2>User Register</h2>

        <form onSubmit={registerUser}>
          <input
            placeholder="Name"
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
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit">Register</button>
        </form>
      </div>
    </Layout>
  );
}