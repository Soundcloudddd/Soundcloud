import { useState } from 'react'
import './Login.css'

const API_URL = 'http://127.0.0.1:8000'

function getErrorMessage(data) {
  if (data?.detail) {
    return data.detail
  }

  if (data?.non_field_errors) {
    return data.non_field_errors.join(' ')
  }

  const messages = Object.values(data || {}).flat()

  return messages.join(' ') || 'Something went wrong.'
}

export default function Login() {
  const [registerMode, setRegisterMode] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    const endpoint = registerMode
      ? '/api/auth/register/'
      : '/api/auth/token/'

    const body = registerMode
      ? {
          email,
          username,
          password,
          password_confirm: passwordConfirm,
        }
      : {
          username,
          password,
        }

    try {
      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(getErrorMessage(data))
      }

      localStorage.setItem(
        'sonik_access_token',
        data.access,
      )

      localStorage.setItem(
        'sonik_refresh_token',
        data.refresh,
      )

      setSuccessMessage(
        registerMode
          ? 'Account created successfully!'
          : 'You are signed in!',
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setRegisterMode((currentMode) => !currentMode)
    setError('')
    setPassword('')
    setPasswordConfirm('')
    setSuccessMessage('')
  }

  return (
    <main className="sonik-login-page">
      <section className="sonik-login-card">
        <div className="sonik-logo">
          <span className="sonik-wave">
            ▂▄▆█▆▄▂
          </span>

          <span>Sonik</span>
        </div>

        {successMessage ? (
          <div className="sonik-success">
            <div className="sonik-check">✓</div>

            <h1>Welcome to Sonik</h1>

            <p>{successMessage}</p>

            <button
              className="sonik-submit"
              type="button"
              onClick={() => setSuccessMessage('')}
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <h1>
              {registerMode
                ? 'Create your Sonik account'
                : 'Sign in to Sonik'}
            </h1>

            <p className="sonik-subtitle">
              Listen, upload and share your sound.
            </p>

            <button
              className="sonik-social google"
              type="button"
              disabled
              title="Coming soon"
            >
              Continue with Google
            </button>

            <button
              className="sonik-social apple"
              type="button"
              disabled
              title="Coming soon"
            >
              Continue with Apple
            </button>

            <div className="sonik-divider">
              <span>or</span>
            </div>

            <form onSubmit={handleSubmit}>
              {registerMode && (
                <>
                  <label htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                  />
                </>
              )}

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
              />

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

              {registerMode && (
                <>
                  <label htmlFor="password-confirm">
                    Confirm password
                  </label>

                  <input
                    id="password-confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={passwordConfirm}
                    onChange={(event) =>
                      setPasswordConfirm(
                        event.target.value,
                      )
                    }
                    required
                  />
                </>
              )}

              {error && (
                <p className="sonik-error">
                  {error}
                </p>
              )}

              <button
                className="sonik-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Please wait...'
                  : registerMode
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>

            <p className="sonik-register">
              {registerMode
                ? 'Already have an account?'
                : 'New to Sonik?'}

              <button
                className="sonik-mode-button"
                type="button"
                onClick={switchMode}
              >
                {registerMode
                  ? 'Sign in'
                  : 'Create an account'}
              </button>
            </p>
          </>
        )}
      </section>
    </main>
  )
}