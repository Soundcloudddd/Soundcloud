import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    displayName: "User",
    username: "user",
    email: "",
    bio: "",
    picture: ""
  });

  const [tab, setTab] = useState("All");

  useEffect(() => {
    const saved = localStorage.getItem("sonikProfile");

    if (saved) {
      try {
        const data = JSON.parse(saved);

        setProfile({
          name: data.name || "",
          surname: data.surname || "",
          displayName: data.displayName || "User",
          username: data.username || "user",
          email: data.email || "",
          bio: data.bio || "",
          picture: data.picture || ""
        });

        return;
      } catch {
        localStorage.removeItem("sonikProfile");
      }
    }

    const name = sessionStorage.getItem("profileName") || "User";
    const email = sessionStorage.getItem("signupEmail") || "";

    setProfile({
      name,
      surname: "",
      displayName: name,
      username: name.toLowerCase().replace(/\s+/g, ""),
      email,
      bio: "",
      picture: ""
    });
  }, []);

  const fullName = [profile.name, profile.surname].filter(Boolean).join(" ");

  function renderContent() {
    if (tab === "All" || tab === "Tracks") {
      return (
        <div className="profile-empty">
          <div className="empty-icon">♪</div>
          <h3>No tracks yet</h3>
          <p>
            Your uploaded and reposted tracks will appear here.
          </p>
        </div>
      );
    }

    if (tab === "Albums") {
      return (
        <div className="profile-empty">
          <div className="empty-icon">◫</div>
          <h3>No albums yet</h3>
          <p>Your albums will appear here.</p>
        </div>
      );
    }

    if (tab === "Playlists") {
      return (
        <div className="profile-empty">
          <div className="empty-icon">☰</div>
          <h3>No playlists yet</h3>
          <p>Your playlists will appear here.</p>
        </div>
      );
    }

    return (
      <div className="profile-empty">
        <div className="empty-icon">♡</div>
        <h3>No likes yet</h3>
        <p>Tracks you like will appear here.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link className="profile-back" to="/home">
          ←
        </Link>

        <div className="profile-brand">SONIK</div>

        <button
          className="profile-edit-top"
          onClick={() => navigate("/profile/edit")}
        >
          Edit profile
        </button>
      </header>

      <section className="profile-hero">
        <div className="profile-hero-bg"></div>

        <div className="profile-avatar-wrap">
          {profile.picture ? (
            <img
              className="profile-avatar-image"
              src={profile.picture}
              alt="Profile"
            />
          ) : (
            <div className="profile-avatar-letter">
              {(profile.displayName || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1>{profile.displayName || "User"}</h1>

          <div className="profile-username">
            @{profile.username || "user"}
          </div>

          {fullName && fullName !== profile.displayName && (
            <div className="profile-real-name">{fullName}</div>
          )}

          {profile.bio && (
            <p className="profile-bio">
              {profile.bio}
            </p>
          )}

          <div className="profile-stats">
            <div className="profile-stat">
              <strong>0</strong>
              <span>Followers</span>
            </div>

            <div className="profile-stat">
              <strong>0</strong>
              <span>Following</span>
            </div>

            <div className="profile-stat">
              <strong>0</strong>
              <span>Tracks</span>
            </div>
          </div>
        </div>
      </section>

      <nav className="profile-tabs">
        {["All", "Tracks", "Albums", "Playlists", "Likes"].map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <main className="profile-content">
        <section className="profile-main-column">
          <h2>{tab === "All" ? "Recent" : tab}</h2>
          {renderContent()}

          <section className="profile-about">
            <h2>About</h2>

            {profile.bio ? (
              <p>{profile.bio}</p>
            ) : (
              <p className="profile-muted">
                Tell listeners a little about yourself.
              </p>
            )}
          </section>
        </section>

        <aside className="profile-sidebar">
          <div className="profile-card">
            <h3>Profile</h3>

            <div className="profile-card-row">
              <span>Followers</span>
              <strong>0</strong>
            </div>

            <div className="profile-card-row">
              <span>Following</span>
              <strong>0</strong>
            </div>

            <div className="profile-card-row">
              <span>Tracks</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="profile-card">
            <h3>Member</h3>

            <p>
              {profile.email || "Sonik listener"}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Profile;
