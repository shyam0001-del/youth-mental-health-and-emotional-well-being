import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function DashboardPage() {
  return (
    <Layout title="Dashboard">
      <div className="simple-center">
        <h1>Welcome to MindMitra Dashboard</h1>
        <Link to="/login">Logout</Link>
      </div>
    </Layout>
  );
}