import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const loadPending = async () => {
    try {
      const res = await api.get("/pending", {
        headers: getAuthHeaders(),
      });
      setUsers(res.data);
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to load pending users";
      alert(msg);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        logout();
      }
    }
  };

  const approveUser = async (id) => {
    try {
      await api.post(
        "/approve",
        { id },
        {
          headers: getAuthHeaders(),
        }
      );
      loadPending();
    } catch (error) {
      alert(error?.response?.data?.message || "Approval failed");
    }
  };

  const rejectUser = async (id) => {
    try {
      await api.post(
        "/reject",
        { id },
        {
          headers: getAuthHeaders(),
        }
      );
      loadPending();
    } catch (error) {
      alert(error?.response?.data?.message || "Rejection failed");
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  return (
    <Layout title="Admin Approval Panel">
      <div className="simple-center" style={{ marginTop: 20 }}>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="admin-list">
        {users.length === 0 ? (
          <p style={{ textAlign: "center" }}>No pending users</p>
        ) : (
          users.map((u) => (
            <div key={u._id} className="admin-card">
              <p><b>Name:</b> {u.name}</p>
              <p><b>Email:</b> {u.email}</p>
              <p><b>Role:</b> {u.role}</p>
              {u.specialization ? <p><b>Specialization:</b> {u.specialization}</p> : null}

              <p><b>Social Links:</b></p>
              <div>
                {(u.social || []).map((link, i) => {
                  const finalLink = link.startsWith("http") ? link : `https://${link}`;
                  return (
                    <div key={i}>
                      <a href={finalLink} target="_blank" rel="noreferrer">
                        {finalLink}
                      </a>
                    </div>
                  );
                })}
              </div>

              <p><b>Certificates:</b></p>
              <div>
                {(u.certificate || []).length === 0 ? (
                  <div>No certificate uploaded</div>
                ) : (
                  (u.certificate || []).map((_, i) => (
                    <div key={i}>
                      <a
                        href={`http://localhost:3000/certificate/${u._id}/${i}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          const token = localStorage.getItem("token");
                          fetch(`http://localhost:3000/certificate/${u._id}/${i}`, {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          })
                            .then(async (res) => {
                              if (!res.ok) {
                                const data = await res.json().catch(() => ({}));
                                throw new Error(data.message || "Failed to fetch certificate");
                              }
                              return res.blob();
                            })
                            .then((blob) => {
                              const url = window.URL.createObjectURL(blob);
                              window.open(url, "_blank");
                            })
                            .catch((err) => alert(err.message));
                        }}
                      >
                        View Certificate {i + 1}
                      </a>
                    </div>
                  ))
                )}
              </div>

              <div className="button-row">
                <button className="approve" onClick={() => approveUser(u._id)}>
                  Approve
                </button>
                <button className="reject" onClick={() => rejectUser(u._id)}>
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}