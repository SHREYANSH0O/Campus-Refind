import React, { useState } from "react";
import {
  Shield,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { CampusUser } from "../types";

interface AuthPageProps {
  allUsers: CampusUser[];
  onLogin: (user: CampusUser) => void;
  onRegister: (newUser: CampusUser) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  allUsers,
  onLogin,
  onRegister,
}) => {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State (All new registrations are standard Student accounts; Admin is strictly designated by Shreyansh Singh)
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCampusId, setSignupCampusId] = useState("");
  const [signupDepartment, setSignupDepartment] = useState("Computer Science & Engineering");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [agreeHonorCode, setAgreeHonorCode] = useState(true);
  const [signupError, setSignupError] = useState("");

  // Loading / Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Generate an avatar initials string
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle Sign In Submit
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const identifier = loginIdentifier.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!identifier) {
      setLoginError("Please enter your campus email or Campus ID.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Find matching user by email or campusId
      const matchedUser = allUsers.find(
        (u) =>
          u.email.toLowerCase() === identifier ||
          u.campusId.toLowerCase() === identifier
      );

      if (matchedUser) {
        // If user has a stored password, check it (or accept default for mock profiles)
        if (matchedUser.password && matchedUser.password !== password) {
          setLoginError("Invalid password. Please check your credentials and try again.");
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage(`Welcome back, ${matchedUser.name}!`);
        setTimeout(() => {
          onLogin(matchedUser);
        }, 600);
      } else {
        setLoginError(
          "No campus account found with that email or Campus ID. Please register for a new account below."
        );
        setIsSubmitting(false);
      }
    }, 450);
  };

  // Handle Sign Up Submit
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (!signupName.trim()) {
      setSignupError("Please enter your full name.");
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setSignupError("Please provide a valid institutional email address.");
      return;
    }

    // Check if email already registered
    const existing = allUsers.find(
      (u) => u.email.toLowerCase() === signupEmail.trim().toLowerCase()
    );
    if (existing) {
      setSignupError("An account with this email is already registered. Please sign in instead.");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!agreeHonorCode) {
      setSignupError("You must agree to the Campus Honor Code to participate.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Regular members always register with the standard Student role.
      // Master Admin status is strictly designated by Shreyansh Singh.
      const assignedRole =
        signupEmail.trim().toLowerCase() === "shreyanshsingh105@gmail.com"
          ? "Campus Security"
          : "Student";

      const generatedId =
        signupCampusId.trim() ||
        `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newUser: CampusUser = {
        id: `user-${Date.now()}`,
        name: signupName.trim(),
        email: signupEmail.trim(),
        role: assignedRole,
        department: signupDepartment,
        campusId: generatedId,
        avatarInitials: getInitials(signupName.trim()) || "CU",
        password: signupPassword,
        joinedDate: new Date().toISOString().split("T")[0],
      };

      setSuccessMessage(`Account registered successfully! Redirecting to dashboard...`);
      setTimeout(() => {
        onRegister(newUser);
      }, 700);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 flex flex-col justify-between text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top University Portal Bar - Minimal Option 3 */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
            Campus ReFind
          </span>
          <span className="text-slate-600 font-normal text-xs sm:text-sm">|</span>
          <span className="text-xs text-slate-400 font-medium">
            Lost &amp; Found
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-[410px] mx-auto">
          {/* Sign In / Sign Up Card - Classic Vertical Rectangle Shape */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-950/40 p-6 sm:p-8 text-slate-800 border border-slate-200/80">
            {/* Centered Brand Icon & Header inside Card */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-500/25 mb-3">
                R
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {authMode === "signin" ? "Campus Sign In" : "Create Account"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                {authMode === "signin"
                  ? "Enter your campus credentials to access the portal"
                  : "Join the verified campus registry to report and claim items"}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setLoginError("");
                  setSignupError("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  authMode === "signin"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setLoginError("");
                  setSignupError("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  authMode === "signup"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Create Account / Register
              </button>
            </div>

            {/* Success Toast */}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ================= SIGN IN FORM ================= */}
            {authMode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    EMAIL ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. Rohitsharma@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          "If you forgot your password, please contact the Vivekanand Hall Central Desk or register a new profile."
                        )
                      }
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember this browser session</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Sign Up */}
                <p className="text-center text-xs text-slate-500 pt-2">
                  Don&apos;t have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setLoginError("");
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Register new profile
                  </button>
                </p>

                {/* Central Desk Officer Login Helper */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Desk Officer:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier("shreyanshsingh105@gmail.com");
                      setLoginPassword("admin");
                    }}
                    className="text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Fill Admin Credentials
                  </button>
                </div>
              </form>
            ) : (
              /* ================= SIGN UP / REGISTRATION FORM ================= */
              <form onSubmit={handleSignUp} className="space-y-4">
                {signupError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{signupError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Arjun Sharma"
                      className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Campus Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Campus Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. Rohitsharma@gmail.com"
                      className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Department / Major *
                  </label>
                  <select
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Eng.</option>
                    <option value="Electrical & Electronics Eng.">Electrical & Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil & Environmental Eng.">Civil Engineering</option>
                    <option value="Physics & Astronomy">Physics & Astronomy</option>
                    <option value="Chemistry & Biochemistry">Chemistry & Biochemistry</option>
                    <option value="Business Administration">Business Administration</option>
                  </select>
                </div>

                {/* Student Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Student Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={signupCampusId}
                    onChange={(e) => setSignupCampusId(e.target.value)}
                    placeholder="e.g. B23----------87"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                  />
                </div>

                {/* Password & Confirm Password */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password (min. 6 chars) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={signupShowPassword ? "text" : "password"}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setSignupShowPassword(!signupShowPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {signupShowPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Campus Honor Code Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={agreeHonorCode}
                    onChange={(e) => setAgreeHonorCode(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    I pledge to report authentic belongings and provide truthful verification details when claiming items under university guidelines.
                  </span>
                </label>

                {/* Register Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering Profile...</span>
                  ) : (
                    <>
                      <span>Complete Registration & Go to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Sign In */}
                <p className="text-center text-xs text-slate-500 pt-1">
                  Already have a campus account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setSignupError("");
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
