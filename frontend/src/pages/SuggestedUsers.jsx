import { useState } from "react";
import "./SuggestedUsers.css";

const users = [
  {
    id: 1,
    name: "Leo Brasil",
    username: "leoafrica",
    followers: 730,
    image: "https://i.pravatar.cc/500?img=12"
  },
  {
    id: 2,
    name: "Macho2Macho",
    username: "macho2macho",
    followers: 1137,
    image: "https://i.pravatar.cc/500?img=13"
  },
  {
    id: 3,
    name: "play Mo><i>><i",
    username: "playmoxi",
    followers: 26,
    image: "https://i.pravatar.cc/500?img=14"
  },
  {
    id: 4,
    name: "Gregorgus Geez",
    username: "gregorgus",
    followers: 5425,
    image: "https://i.pravatar.cc/500?img=15"
  },
  {
    id: 5,
    name: "Blue Waves",
    username: "bluewaves",
    followers: 861,
    image: "https://i.pravatar.cc/500?img=16"
  },
  {
    id: 6,
    name: "Night Radio",
    username: "nightradio",
    followers: 1204,
    image: "https://i.pravatar.cc/500?img=17"
  }
];

function SuggestedUsers() {
  const [following, setFollowing] = useState([]);

  function toggleFollow(id) {
    setFollowing((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <section className="suggested-users">
      <div className="suggested-users-header">
        <div>
          <h2>New crew, suggested for you</h2>
          <p>Discover people and creators on Sonik</p>
        </div>

        <button className="suggested-see-all">
          See all
        </button>
      </div>

      <div className="suggested-users-row">
        {users.map((user) => {
          const isFollowing = following.includes(user.id);

          return (
            <article className="suggested-user-card" key={user.id}>
              <img
                className="suggested-user-image"
                src={user.image}
                alt={user.name}
              />

              <h3>{user.name}</h3>
              <div className="suggested-username">
                @{user.username}
              </div>

              <div className="suggested-followers">
                {user.followers.toLocaleString()} followers
              </div>

              <button
                className={`suggested-follow-button ${
                  isFollowing ? "following" : ""
                }`}
                onClick={() => toggleFollow(user.id)}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default SuggestedUsers;
