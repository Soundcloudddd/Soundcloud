import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    displayName: "",
    username: "",
    email: "",
    bio: "",
    picture: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("sonikProfile");

    if (saved) {
      setProfile(JSON.parse(saved));
      return;
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

  function change(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value
    }));
  }

  function uploadPicture(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      change("picture", reader.result);
    };

    reader.readAsDataURL(file);
  }

  function saveProfile() {
    localStorage.setItem("sonikProfile", JSON.stringify(profile));
    sessionStorage.setItem("profileName", profile.displayName || profile.name || "User");
    sessionStorage.setItem("signupEmail", profile.email || "");
    navigate("/profile");
  }

  return (
    <div className="edit-profile-page">
      <button className="edit-back" onClick={() => navigate("/profile")}>
        ← Back
      </button>

      <div className="edit-profile-box">
        <h1>Edit profile</h1>

        <div className="edit-avatar">
          {profile.picture ? (
            <img src={profile.picture} alt="Profile" />
          ) : (
            <div className="edit-avatar-letter">
              {(profile.displayName || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <label className="upload-button">
          Upload profile picture
          <input
            type="file"
            accept="image/*"
            onChange={uploadPicture}
          />
        </label>

        <label>
          Name
          <input
            value={profile.name}
            onChange={(e) => change("name", e.target.value)}
          />
        </label>

        <label>
          Surname
          <input
            value={profile.surname}
            onChange={(e) => change("surname", e.target.value)}
          />
        </label>

        <label>
          Display name
          <input
            value={profile.displayName}
            onChange={(e) => change("displayName", e.target.value)}
          />
        </label>

        <label>
          Username
          <input
            value={profile.username}
            onChange={(e) => change("username", e.target.value)}
          />
        </label>

        <label>
          Email
          <input
            value={profile.email}
            onChange={(e) => change("email", e.target.value)}
          />
        </label>

        <label>
          Bio
          <textarea
            value={profile.bio}
            onChange={(e) => change("bio", e.target.value)}
            placeholder="Tell listeners about yourself"
          />
        </label>

        <div className="edit-buttons">
          <button
            className="cancel-button"
            onClick={() => navigate("/profile")}
          >
            Cancel
          </button>

          <button
            className="save-button"
            onClick={saveProfile}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
