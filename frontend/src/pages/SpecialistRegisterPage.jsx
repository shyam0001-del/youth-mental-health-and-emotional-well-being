import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";

export default function SpecialistRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    specialization: "",
    password: "",
  });
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const handleFiles = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF, JPG, JPEG, PNG files are allowed");
        e.target.value = "";
        setFiles([]);
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert("Each file must be less than 2MB");
        e.target.value = "";
        setFiles([]);
        return;
      }
    }

    setFiles(selectedFiles);
  };

  const registerSpecialist = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", form.name);
    data.append("email", form.email);
    data.append("specialization", form.specialization);
    data.append("password", form.password);
    data.append("role", "specialist");

    files.forEach((file) => data.append("certificate", file));

    try {
      const res = await api.post("/register", data);
      alert(res.data.message || "Registered. Wait for Admin Approval.");
      navigate("/login");
    } catch (error) {
      alert(error?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <Layout title="Specialist Register">
      <div className="container">
        <h2>Specialist Registration</h2>

        <form onSubmit={registerSpecialist}>
          <input
            placeholder="Full Name"
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
            placeholder="Specialization"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            required
          />

          <label>Upload Certificates</label>
          <input type="file" multiple onChange={handleFiles} />
          <div className="info-text">Allowed: PDF, JPG, PNG | Max size: 2MB each</div>

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button type="submit">Register Specialist</button>
        </form>

        <Link to="/login">Back to Login</Link>
      </div>
    </Layout>
  );
}