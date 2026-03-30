import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const loginUser = async (e) => {
    e.preventDefault();
  
    try {
      const res = await api.post("/login", form);
  
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name || "");
  
      const role = res.data.role;
  
      if (role === "user") navigate("/student");
      else if (role === "ngo") navigate("/dashboard");
      else if (role === "specialist") navigate("/dashboard");
      else if (role === "admin") navigate("/admin");
      else alert("Unknown role");
    } catch (error) {
      alert(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <Layout title="MindMitra Login">
      <div className="container glass">
        <form onSubmit={loginUser}>
          <input
            placeholder="Email"
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
          <button type="submit">Login</button>
        </form>

        <Link to="/register">Create Account</Link>
      </div>
    </Layout>
  );
}