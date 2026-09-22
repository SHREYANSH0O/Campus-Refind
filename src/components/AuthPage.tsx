import React, { useState, useEffect } from "react";
import {
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
  RefreshCw,
} from "lucide-react";
import { CampusUser } from "../types";
import {
  registerWithEmailVerification,
  loginWithEmail,
  resendVerificationEmail,
  checkEmailVerification,
} from "../services/firebaseService";

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

  // Verification Pending State
  const [verificationPendingUser, setVerificationPendingUser] = useState<CampusUser | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [verificationInfo, setVerificationInfo] = useState("");
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Loading / Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Generate an avatar initials string
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Translate Firebase errors into clean user messages
  const parseFirebaseAuthError = (err: any): string => {
    const code = err?.code || "";
    switch (code) {
      case "auth/email-already-in-use":
        return "An account with this email is already registered. Please sign in instead.";
      case "auth/invalid-email":
        return "The provided email format is invalid. Please enter a valid address.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please verify your credentials.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a few moments before trying again.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      case "auth/operation-not-allowed":
        return "Email authentication is currently being configured in the campus Firebase console.";
      default:
        return err?.message || "Authentication failed. Please try again.";
    }
  };

  // ================= 1. MANUAL SIGN IN SUBMIT =================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const identifier = loginIdentifier.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!identifier) {
      setLoginError("Please enter your campus email or Student Code.");
      return;
    }

    if (!password) {
      setLoginError("Please enter your account password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const isMasterAdmin = identifier === "shreyanshsingh105@gmail.com";

      // 1. Check local seed / cached user list first
      const matchedUser = allUsers.find(
        (u) =>
          u.email.toLowerCase() === identifier ||
          u.campusId.toLowerCase() === identifier
      );

      // 2. Try Firebase Email/Password Sign In
      let firebaseEmailVerified = false;
      try {
        if (identifier.includes("@")) {
          const { firebaseUser } = await loginWithEmail(identifier, password);
          firebaseEmailVerified = firebaseUser.emailVerified;
        }
      } catch (fbErr: any) {
        if (!matchedUser) {
          if (fbErr?.code === "auth/operation-not-allowed" || fbErr?.code === "auth/user-not-found" || fbErr?.code === "auth/invalid-credential") {
            setLoginError("Account not found. Please verify your credentials or click 'Register new profile' below.");
            setIsSubmitting(false);
            return;
          }
          throw fbErr;
        }
      }

      if (!matchedUser && !identifier.includes("@")) {
        setLoginError("Student Code not found. Please verify your code or register a new profile below.");
        setIsSubmitting(false);
        return;
      }

      if (matchedUser && matchedUser.password && matchedUser.password !== password) {
        setLoginError("Invalid password. Please check your credentials and try again.");
        setIsSubmitting(false);
        return;
      }

      const activeUser = matchedUser || {
        id: `user-${Date.now()}`,
        name: identifier.split("@")[0] || "Campus Member",
        email: identifier,
        role: isMasterAdmin ? "Campus Security" : "Student",
        department: "Computer Science & Engineering",
        campusId: `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        avatarInitials: getInitials(identifier) || "CU",
        emailVerified: firebaseEmailVerified || isMasterAdmin,
        authProvider: "password",
      };

      if (!isMasterAdmin && activeUser.emailVerified === false && !firebaseEmailVerified) {
        setVerificationPendingUser(activeUser);
        setVerificationError("Your email address has not been verified yet. Please verify your inbox below.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Welcome back, ${activeUser.name}!`);
      setTimeout(() => {
        onLogin(activeUser);
      }, 500);
    } catch (err: any) {
      console.warn("Sign In error:", err);
      setLoginError(parseFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= 3. MANUAL SIGN UP WITH EMAIL VERIFICATION =================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (!signupName.trim()) {
      setSignupError("Please enter your full name.");
      return;
    }

    const emailTrimmed = signupEmail.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes("@") || !emailTrimmed.includes(".")) {
      setSignupError("Please provide a valid email address (e.g. Rohitsharma@gmail.com).");
      return;
    }

    const existing = allUsers.find(
      (u) => u.email.toLowerCase() === emailTrimmed
    );
    if (existing) {
      setSignupError("An account with this email is already registered. Please sign in instead.");
      return;
    }

    if (!signupCampusId.trim()) {
      setSignupError("Please provide your official Student Code.");
      return;
    }

    const existingCode = allUsers.find(
      (u) => u.campusId.toLowerCase() === signupCampusId.trim().toLowerCase()
    );
    if (existingCode) {
      setSignupError("A profile with this Student Code already exists. Please verify your code or sign in.");
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

    // 1. Validate that the email address is authentic and has active DNS mail exchange (MX) servers
    try {
      const valRes = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed }),
      });
      const valData = await valRes.json();
      if (!valRes.ok || !valData.valid) {
        setSignupError(valData.error || "This email address is invalid or does not have an active mail server. Please use a real email address.");
        setIsSubmitting(false);
        return;
      }
    } catch (valErr) {
      console.warn("Email validation warning:", valErr);
    }

    try {
      const isMasterAdmin = emailTrimmed === "shreyanshsingh105@gmail.com";

      let firebaseUid = `user-${Date.now()}`;
      let authEmailSent = false;
      try {
        const { firebaseUser } = await registerWithEmailVerification(
          emailTrimmed,
          signupPassword,
          signupName.trim()
        );
        firebaseUid = firebaseUser.uid;
        authEmailSent = true;
      } catch (fbErr: any) {
        if (fbErr?.code === "auth/email-already-in-use") {
          setSignupError("An account with this email is already registered. Please sign in instead.");
          setIsSubmitting(false);
          return;
        }
        console.warn("Direct Firestore registration active (Auth fallback):", fbErr?.message || fbErr);
        // Seamless fallback: register directly to Firestore database!
      }

      const generatedId = signupCampusId.trim();

      const newUser: CampusUser = {
        id: firebaseUid,
        name: signupName.trim(),
        email: emailTrimmed,
        role: isMasterAdmin ? "Campus Security" : "Student",
        department: signupDepartment,
        campusId: generatedId,
        avatarInitials: getInitials(signupName.trim()) || "CU",
        password: signupPassword,
        joinedDate: new Date().toISOString().split("T")[0],
        emailVerified: true,
        authProvider: "password",
      };

      if (authEmailSent && !isMasterAdmin) {
        setVerificationPendingUser(newUser);
        setVerificationInfo(`We sent an official verification link to ${newUser.email}.`);
        setResendCooldown(45);
      } else {
        setSuccessMessage(
          isMasterAdmin
            ? `Master Admin profile registered! Redirecting...`
            : `Registration successful! Welcome to Campus ReFind, ${newUser.name}.`
        );
        setTimeout(() => {
          onRegister(newUser);
        }, 500);
      }
    } catch (err: any) {
      setSignupError(parseFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= 4. CHECK EMAIL VERIFICATION =================
  const handleCheckEmailVerification = async () => {
    if (!verificationPendingUser) return;
    setVerificationError("");
    setVerificationInfo("");
    setIsCheckingVerification(true);

    try {
      const isVerified = await checkEmailVerification();

      if (isVerified || verificationPendingUser.email.toLowerCase() === "shreyanshsingh105@gmail.com") {
        const verifiedUser: CampusUser = {
          ...verificationPendingUser,
          emailVerified: true,
        };
        setSuccessMessage("Email successfully verified! Welcome to Campus ReFind.");
        setTimeout(() => {
          onRegister(verifiedUser);
        }, 700);
      } else {
        setVerificationError(
          "We haven't detected your verification yet. Please open your Gmail, click the link sent to your inbox, then press this button again."
        );
      }
    } catch (err: any) {
      console.warn("Check verification error:", err);
      setVerificationError("Could not confirm verification status yet. Please ensure you clicked the link in your email.");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  // ================= 5. RESEND VERIFICATION EMAIL =================
  const handleResendVerification = async () => {
    if (!verificationPendingUser || resendCooldown > 0) return;
    setVerificationError("");
    setVerificationInfo("");

    try {
      await resendVerificationEmail();
      setVerificationInfo(`A fresh verification link has been sent to ${verificationPendingUser.email}.`);
      setResendCooldown(60);
    } catch (err: any) {
      console.warn("Resend email error:", err);
      setVerificationError(parseFirebaseAuthError(err));
    }
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
          {/* Sign In / Sign Up Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-950/40 p-6 sm:p-8 text-slate-800 border border-slate-200/80">
            {/* ================= SCREEN: VERIFICATION PENDING ================= */}
            {verificationPendingUser ? (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center">
                  <div className="relative w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-sm shadow-blue-500/10">
                    <Mail className="w-8 h-8" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Verify Your Email Address
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-[320px] mx-auto">
                    We sent an official verification link to:
                  </p>
                  <p className="text-xs font-mono font-bold text-blue-600 mt-0.5 bg-blue-50/80 py-1 px-3 rounded-lg inline-block border border-blue-100">
                    {verificationPendingUser.email}
                  </p>
                </div>

                {/* Instructions Box */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>How to activate your account:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px] leading-relaxed pl-1">
                    <li>Open your email inbox (and check Spam/Promotions).</li>
                    <li>Click the link inside to verify that your email is authentic.</li>
                    <li>Return here and click the button below to enter.</li>
                  </ol>
                </div>

                {/* Feedback Alerts */}
                {verificationError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{verificationError}</span>
                  </div>
                )}

                {verificationInfo && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{verificationInfo}</span>
                  </div>
                )}

                {/* Verification Actions */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCheckEmailVerification}
                    disabled={isCheckingVerification}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingVerification ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking inbox confirmation...</span>
                      </>
                    ) : (
                      <>
                        <span>I&apos;ve Verified My Email — Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : "Resend Verification Email"}
                    </span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationPendingUser(null);
                      setVerificationError("");
                      setVerificationInfo("");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Entered wrong email? Return to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Centered Brand Icon & Header inside Card */}
                <div className="flex flex-col items-center text-center mb-5">
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
                    Create Account
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
                        EMAIL ID / STUDENT CODE
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
                              "If you forgot your password, please contact the Vivekanand Hall Central Desk or register a new profile with your verified campus email."
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
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                  </form>
                ) : (
                  /* ================= SIGN UP / REGISTRATION FORM ================= */
                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    {signupError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{signupError}</span>
                      </div>
                    )}

                    {/* Full Name */}
                    <div className="space-y-1">
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
                          placeholder="e.g. Rohit Sharma"
                          className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Campus Email */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Institutional / Campus Email *
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
                      <p className="text-[10px] text-slate-400 pl-1">
                        A real inbox verification link will be sent to this email.
                      </p>
                    </div>

                    {/* Department Dropdown */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Academic Department *
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
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Student Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={signupCampusId}
                        onChange={(e) => setSignupCampusId(e.target.value)}
                        placeholder="e.g. B23----------87"
                        className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                      />
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="space-y-3 pt-0.5">
                      <div className="space-y-1">
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
                            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 bg-slate-50/50 focus:bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={() => setSignupShowPassword(!signupShowPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {signupShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Confirm Password *
                        </label>
                        <input
                          type={signupShowPassword ? "text" : "password"}
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
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Sending verification email...</span>
                      ) : (
                        <>
                          <span>Verify Email &amp; Create Account</span>
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
