import { useState } from "react";
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useParams
} from "react-router-dom";

const API = "http://127.0.0.1:8000";

function Page({ children, progress }) {
  return (
    <div className="page">
      <div className="auth">
        {children}
      </div>

      {progress && (
        <div className="progress-wrap">
          <div className="progress-line">
            <div className="progress-fill" />
          </div>
          <div className="progress-text">{progress}</div>
        </div>
      )}
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();

  return (
    <button className="back-button" onClick={() => navigate(-1)}>
      ←
    </button>
  );
}

function SocialButtons() {
  return (
    <div className="social-buttons">
      <button disabled>
        <span>G</span>
        Continue with Google
      </button>

      <button disabled>
        <span>f</span>
        Continue with Facebook
      </button>

      <button disabled>
        <span></span>
        Continue with Apple
      </button>
    </div>
  );
}

function Signup() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function continueNext() {
    if (!email.trim() || !email.includes("@")) {
      setError("The email you entered is incorrect");
      return;
    }

    sessionStorage.setItem("signupEmail", email.trim());
    navigate("/signup/password");
  }

  return (
    <Page>
      <h1>Sign up or create an account</h1>

      <input
        className={`field ${error ? "field-error" : ""}`}
        placeholder="Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
      />

      {error && <div className="error-text">ⓘ {error}</div>}

      <button className="yellow-button" onClick={continueNext}>
        Continue
      </button>

      <div className="or">Or</div>

      <SocialButtons />

      <div className="bottom-text">
        Already have an account?{" "}
        <Link to="/login">Log in</Link>
      </div>
    </Page>
  );
}

function SignupPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const valid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

  function continueNext() {
    if (!valid || password !== confirm) return;

    sessionStorage.setItem("signupPassword", password);
    navigate("/signup/profile");
  }

  return (
    <Page progress="Choose a password">
      <BackButton />

      <h1>Create an account</h1>

      <input
        className="field"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="requirements-title">
        Password requirements:
      </div>

      <div className="requirements">
        <div>• At least 8 characters</div>
        <div>• One uppercase letter</div>
        <div>• One lowercase letter</div>
        <div>• One number</div>
      </div>

      <input
        className="field"
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <button
        className="yellow-button"
        disabled={!valid || password !== confirm}
        onClick={continueNext}
      >
        Continue
      </button>
    </Page>
  );
}

function Profile() {
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const navigate = useNavigate();

  function continueNext() {
    if (!name || !month || !day || !year || !gender) return;

    sessionStorage.setItem("profileName", name);
    navigate("/signup/agreement");
  }

  return (
    <Page progress="Tell us a bit about yourself">
      <BackButton />

      <h1>Introduce yourself</h1>

      <input
        className="field"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="description">
        Choose a display name that other users will see.
      </div>

      <div className="label">Date of birth</div>

      <div className="date-row">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Month</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1}>{i + 1}</option>
          ))}
        </select>

        <select value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1}>{i + 1}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {Array.from({ length: 100 }, (_, i) => (
            <option key={i}>{new Date().getFullYear() - i}</option>
          ))}
        </select>
      </div>

      <div className="description">
        Your date of birth is kept private.
      </div>

      <select
        className="field"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
      >
        <option value="">Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Prefer not to say</option>
      </select>

      <button className="yellow-button" onClick={continueNext}>
        Continue
      </button>
    </Page>
  );
}

function Agreement() {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function createAccount() {
    const email = sessionStorage.getItem("signupEmail") || "";
    const password = sessionStorage.getItem("signupPassword") || "";

    try {
      const response = await fetch(`${API}/api/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          username: email,
          password,
          password_confirm: password
        })
      });

      if (response.ok) {
        navigate("/login");
        return;
      }

      const data = await response.json();
      setError(JSON.stringify(data));
    } catch {
      setError("Backend is not running.");
    }
  }

  return (
    <Page progress="User agreement">
      <BackButton />

      <h1>You must accept the User Agreement</h1>

      <div className="agreement">
        By using Sonik you agree to follow our Community Guidelines,
        respect copyright laws and use the service responsibly.
        By continuing, you confirm that you have read and accepted
        the Sonik User Agreement and Privacy Policy.
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>I agree to the Sonik User Agreement</span>
      </label>

      {error && <div className="error-text">{error}</div>}

      <button
        className="yellow-button"
        disabled={!accepted}
        onClick={createAccount}
      >
        Continue
      </button>
    </Page>
  );
}

function Login() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  function continueNext() {
    if (!value.trim()) return;

    sessionStorage.setItem("loginValue", value.trim());
    navigate("/login/password");
  }

  return (
    <Page>
      <h1>Log in</h1>

      <input
        className="field"
        placeholder="Email address or username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button className="yellow-button" onClick={continueNext}>
        Continue
      </button>

      <label className="check-row">
        <input type="checkbox" />
        <span>Save login info on your iCloud devices</span>
      </label>

      <div className="login-tabs">
        <span>Phone</span>
        <span className="active">Email/Username</span>
      </div>

      <Link className="forgot-link" to="/forgot-password">
        Forgot your password?
      </Link>

      <div className="or">Or</div>

      <SocialButtons />

      <div className="bottom-text">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
    </Page>
  );
}

function LoginPassword() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function login() {
    const username = sessionStorage.getItem("loginValue") || "";

    try {
      const response = await fetch(`${API}/api/auth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        navigate("/account");
      } else {
        setError("The password you entered is incorrect");
      }
    } catch {
      setError("Backend is not running.");
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Enter your password</h1>

      <input
        className={`field ${error ? "field-error" : ""}`}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
      />

      {error && <div className="error-text">ⓘ {error}</div>}

      <button className="yellow-button" onClick={login}>
        Continue
      </button>

      <Link className="forgot-link" to="/forgot-password">
        Forgot your password?
      </Link>

      <div
        className="verification-link"
        onClick={() => navigate("/verification")}
      >
        Use verification code
      </div>
    </Page>
  );
}

function Verification() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  function updateCode(index, value) {
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Enter the verification code</h1>

      <div className="code-row">
        {code.map((value, index) => (
          <input
            key={index}
            id={`code-${index}`}
            className="code-box"
            value={value}
            onChange={(e) => updateCode(index, e.target.value)}
            inputMode="numeric"
            maxLength={1}
          />
        ))}
      </div>

      <button className="resend-button">Resend code</button>

      <div className="verification-help">
        Didn't get a code?
      </div>

      <button className="yellow-button verification-continue">
        Continue
      </button>

      <div className="legal">
        This site is protected to ensure spam and abuse.
        By continuing, you agree to our Privacy Policy and Terms of Service.
      </div>
    </Page>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  async function reset() {
    try {
      const response = await fetch(`${API}/api/auth/password-reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setMessage(data.detail || "");

      if (data.reset_url) {
        setResetUrl(data.reset_url);
      }
    } catch {
      setMessage("Backend is not running.");
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Forgot your password?</h1>

      <input
        className="field"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button className="yellow-button" onClick={reset}>
        Send reset link
      </button>

      {message && <div className="hint">{message}</div>}

      {resetUrl && (
        <a className="reset-link" href={resetUrl}>
          Open reset link
        </a>
      )}

      <Link className="forgot-link" to="/login">
        Back to login
      </Link>
    </Page>
  );
}

function ResetPassword() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function save() {
    try {
      const response = await fetch(
        `${API}/api/auth/password-reset-confirm/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid,
            token,
            password,
            password_confirm: confirm
          })
        }
      );

      if (response.ok) {
        navigate("/login");
        return;
      }

      const data = await response.json();
      setError(data.detail || "Could not change password.");
    } catch {
      setError("Backend is not running.");
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Reset password</h1>

      <input
        className="field"
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        className="field"
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {error && <div className="error-text">{error}</div>}

      <button className="yellow-button" onClick={save}>
        Save password
      </button>
    </Page>
  );
}

function Account() {
  return (
    <Page>
      <h1>Welcome to Sonik</h1>
      <div className="agreement">Your account is ready.</div>

      <Link className="yellow-link" to="/login">
        Log out
      </Link>
    </Page>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/password" element={<SignupPassword />} />
      <Route path="/signup/profile" element={<Profile />} />
      <Route path="/signup/agreement" element={<Agreement />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/password" element={<LoginPassword />} />
      <Route path="/verification" element={<Verification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
      <Route path="/account" element={<Account />} />
    </Routes>
  );
}
