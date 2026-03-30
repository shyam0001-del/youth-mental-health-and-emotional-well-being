import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function RegisterChoicePage() {
  const navigate = useNavigate();

  return (
    <Layout title="MindMitra Registration">
      <div className="container wide">
        <div className="subtitle">Choose how you want to register</div>
        <div className="desc">
          Select your role below to continue with the correct registration form.
        </div>

        <div className="role-section">
          <div className="role-card" onClick={() => navigate("/register/user")}>
            <img src="/images/stress.png" alt="User" />
            <p>User</p>
            <span>Register as a student or general user and access support resources.</span>
          </div>

          <div className="role-card" onClick={() => navigate("/register/ngo")}>
            <img src="/images/ngo.webp" alt="NGO" />
            <p>NGO</p>
            <span>Register your organization and request access after approval.</span>
          </div>

          <div className="role-card" onClick={() => navigate("/register/specialist")}>
            <img src="/images/doc2.avif" alt="Specialist" />
            <p>Specialist</p>
            <span>Register as a counselor or specialist and submit details for approval.</span>
          </div>
        </div>

        <div className="bottom-actions">
          <Link className="main-link-button" to="/login">
            Already registered? Login
          </Link>
        </div>
      </div>
    </Layout>
  );
}