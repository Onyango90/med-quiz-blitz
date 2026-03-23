import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import "./Auth.css";

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const username = e.target.username?.value?.trim() || e.target.email.value.split("@")[0];
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    console.log("Attempting to sign up with:", email);

    const auth = getAuth();
    const db = getFirestore();
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Success! User created:", user.uid);
      
      // Update profile with username
      await updateProfile(user, { displayName: username });
      
      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        profile: {
          name: username,
          username: username,
          email: email,
          year: year,
          joinDate: new Date().toISOString()
        },
        stats: {
          totalAttempted: 0,
          totalCorrect: 0,
          streak: 0,
          lastActiveDate: null,
          totalTimeSpent: 0,
          sessionsCompleted: 0
        },
        subjectStats: {},
        dailyActivity: {}
      });
      
      // Store basic info
      localStorage.setItem("userName", username);
      localStorage.setItem("userYear", year);
      
      // Navigate to home
      navigate("/home");
      
    } catch (err) {
      console.error("Signup error:", err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Try signing in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError(`Error: ${err.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          Join <span>MedBlitz</span>
        </h1>
        <p className="auth-subtitle">
          Create an account and start your medical learning streak!
        </p>

        {error && (
          <div style={{ 
            backgroundColor: "#fee", 
            color: "#c33", 
            padding: "10px", 
            borderRadius: "8px", 
            marginBottom: "15px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="auth-input"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            className="auth-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
            className="auth-input"
            required
            minLength="6"
          />
          
          <select
  name="year"
  className="auth-select"
  required
  value={year}
  onChange={(e) => setYear(e.target.value)}
>
  <option value="">Select Year of Study</option>
  <option value="1">1st Year</option>
  <option value="2">2nd Year</option>
  <option value="3">3rd Year</option>
  <option value="4">4th Year</option>
  <option value="5">5th Year</option>
  <option value="6">6th Year</option>
</select>
          
          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/signin")}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}