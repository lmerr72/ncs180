import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function Arrow180Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12C4 7.58172 7.58172 4 12 4H18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M4 12C4 16.4183 7.58172 20 12 20H18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M15 1L18 4L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 17L18 20L15 23" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (!ok) {
        setError("Invalid email or password. Please try again.");
      } else {
        navigate("/");
      }
    }, 600);
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0d1b2e] via-[#112240] to-[#0a1628]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-primary/8 blur-2xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            <Arrow180Logo className="w-7 h-7 text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">NCS 180</span>
        </div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Your sales pipeline,<br />
            <span className="text-primary">all in one place.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Manage clients, track placements, and grow your book of business with NCS 180.
          </p>
        </div>

        <p className="text-white/20 text-sm relative z-10">© 2026 NCS 180. All rights reserved.</p>
      </div>

      {/* Right sign-in panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10 justify-center">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
              <Arrow180Logo className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">NCS 180</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-white/50 mt-1 text-sm">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setUsername(e.target.value); setError(""); }}
                  placeholder="Enter your email"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl bg-white/8 border text-white placeholder-white/25 text-sm",
                    "focus:outline-none focus:ring-2 transition-all",
                    error
                      ? "border-red-500/50 focus:ring-red-500/20 focus:border-red-500/70"
                      : "border-white/15 focus:ring-primary/30 focus:border-primary/50"
                  )}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password"
                    className={cn(
                      "w-full px-4 py-3 pr-11 rounded-xl bg-white/8 border text-white placeholder-white/25 text-sm",
                      "focus:outline-none focus:ring-2 transition-all",
                      error
                        ? "border-red-500/50 focus:ring-red-500/20 focus:border-red-500/70"
                        : "border-white/15 focus:ring-primary/30 focus:border-primary/50"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/8 space-y-2">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white/70">Sales Rep</p>
                  <p className="text-xs text-white/40 font-mono">gmarshall@ncs180.com / lindsay</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white/70">Client</p>
                  <p className="text-xs text-white/40 font-mono">kmcgee@property.com / client</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
