'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, AlertCircle, Home } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"warning" | "error">("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      setStatus("submitting");
      setMessage(null);
      const response = await api.auth.login({ email, password });
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('user_token', response.token);
        localStorage.setItem('user_refreshToken', response.refreshToken);
        localStorage.setItem('user_role', 'user');
      }
      
      setStatus("success");
      setMessage("Login success! Redirecting...");
      
      // Redirect to user dashboard
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 1000);
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Unable to login";
      setMessage(errorMessage);
      
      // Show popup for specific error types
      if (errorMessage.includes("pending approval") || errorMessage.includes("wait for approval")) {
        setPopupTitle("Account Pending Approval");
        setPopupMessage("Your account is pending approval. Please wait for approval.");
        setPopupType("warning");
        setShowPopup(true);
      } else if (errorMessage.includes("User not found") || errorMessage.includes("user not found")) {
        setPopupTitle("User Not Found");
        setPopupMessage("No account found with this email address. Please check your email or create a new account.");
        setPopupType("error");
        setShowPopup(true);
      } else if (errorMessage.includes("Invalid password")) {
        setPopupTitle("Invalid Password");
        setPopupMessage("The password you entered is incorrect. Please try again.");
        setPopupType("error");
        setShowPopup(true);
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#010514] px-4 py-16 text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.35em] text-white/50">StockMart</p>
            <h1 className="mt-3 text-3xl font-semibold">Log in to your account</h1>
            <p className="text-sm text-white/60">Use email + password or OTP.</p>
          </div>
          <Link
            href="/"
            className="ml-4 flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
            title="Back to Home"
          >
            <Home className="size-5" />
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white"
              placeholder="you@stockmart.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className={cn(
              "w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition",
              status === "submitting" && "opacity-70"
            )}
          >
            {status === "submitting" ? "Authenticating..." : "Continue"}
          </button>
          <Link href="/auth/register" className="block text-center text-xs text-white/60 underline">
            New to StockMart? Create account
          </Link>
        </form>
        {message && !showPopup && (
          <p className={cn("text-center text-sm", status === "error" ? "text-rose-400" : "text-emerald-400")}>
            {message}
          </p>
        )}
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={cn(
            "relative w-full max-w-md rounded-3xl border bg-slate-900 p-6 shadow-2xl",
            popupType === "warning" ? "border-yellow-500/20" : "border-rose-500/20"
          )}>
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                popupType === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-rose-500/20 text-rose-400"
              )}>
                <AlertCircle className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{popupTitle}</h3>
                <p className="mt-2 text-sm text-white/70">
                  {popupMessage}
                </p>
                <div className="mt-4 flex gap-3">
                  {popupType === "error" && message?.includes("User not found") && (
                    <Link
                      href="/auth/register"
                      onClick={() => setShowPopup(false)}
                      className="flex-1 rounded-2xl bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                    >
                      Create Account
                    </Link>
                  )}
                  <button
                    onClick={() => setShowPopup(false)}
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                      popupType === "warning" || (popupType === "error" && !message?.includes("User not found"))
                        ? "w-full bg-white text-slate-900 hover:bg-slate-200"
                        : "flex-1 border border-white/20 bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    {popupType === "error" && message?.includes("User not found") ? "Close" : "OK"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

