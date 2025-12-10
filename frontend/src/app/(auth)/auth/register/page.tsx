'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, AlertCircle, Home } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(formData.entries());
    
    try {
      setStatus("submitting");
      await api.auth.register(payload);
      setStatus("success");
      setMessage("Account created! Redirecting to KYC...");
      
      // Redirect to KYC page after registration
      setTimeout(() => {
        router.push('/auth/kyc');
      }, 1500);
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setMessage(errorMessage);
      
      // Show popup if user already registered
      if (errorMessage.includes("already registered") || errorMessage.includes("User already registered")) {
        setShowPopup(true);
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#010514] px-4 py-16 text-white">
      <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-white/50">StockMart</p>
            <h1 className="text-3xl font-semibold">Create your investing workspace</h1>
            <p className="text-sm text-white/60">Join thousands of investors on StockMart</p>
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
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full Name" name="name" placeholder="Aditi Sharma" />
            <Field label="Email" name="email" type="email" placeholder="aditi@stockmart.com" />
            <Field label="Mobile" name="mobile" placeholder="+91 98200 11111" />
            <Field label="Password" name="password" type="password" placeholder="••••••••" />
            <div className="md:col-span-2">
              <Field label="Referral Code (Optional)" name="referral" placeholder="Enter referral code if you have one" />
            </div>
          </div>
          
          <button
            type="submit"
            className={cn(
              "w-full rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200",
              status === "submitting" && "opacity-70 cursor-not-allowed"
            )}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Opening account..." : "Create account"}
          </button>
          
          <p className="text-center text-xs text-white/60">
            Already have an account? <Link href="/auth/login" className="font-medium text-white/80 underline hover:text-white">Log in</Link>
          </p>
        </form>
        
        {message && !showPopup && (
          <p className={cn("text-center text-sm", status === "error" ? "text-rose-400" : "text-emerald-400")}>
            {message}
          </p>
        )}
      </div>

      {/* Popup Modal for User Already Registered */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-500/20 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                <AlertCircle className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">User Already Registered</h3>
                <p className="mt-2 text-sm text-white/70">
                  This email is already registered. Please log in instead.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Close
                  </button>
                  <Link
                    href="/auth/login"
                    onClick={() => setShowPopup(false)}
                    className="flex-1 rounded-2xl bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                  >
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
};

function Field({ label, name, type = "text", placeholder }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-widest text-white/60">{label}</label>
      <input
        name={name}
        type={type}
        required={name !== "referral"}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10"
      />
    </div>
  );
}

