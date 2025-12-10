'use client';

import { FormEvent, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Upload, FileImage } from "lucide-react";

export default function KycPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    if (!selectedFile) {
      setMessage("Please upload a document or image");
      setStatus("error");
      return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentName', selectedFile.name);
      formData.append('documentSize', selectedFile.size.toString());
      formData.append('documentData', base64Data);
      formData.append('documentType', selectedFile.type);
      
      // Get user info from localStorage if available
      const userToken = localStorage.getItem('user_token');
      if (userToken) {
        // Extract user ID from token (format: token-USERID)
        const userId = userToken.replace('token-', '');
        formData.append('userId', userId);
      }
      
      try {
        setStatus("submitting");
        await api.auth.kyc(formData);
        setStatus("success");
        setMessage("KYC document submitted for review. Redirecting to login...");
        
        // Clear user session and redirect to login
        setTimeout(() => {
          localStorage.removeItem('user_token');
          localStorage.removeItem('user_refreshToken');
          localStorage.removeItem('user_role');
          router.push('/auth/login');
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to submit KYC");
      }
    };
    
    reader.onerror = () => {
      setStatus("error");
      setMessage("Failed to read file");
    };
    
    reader.readAsDataURL(selectedFile);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#010514] px-4 py-16 text-white">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.35em] text-white/50">StockMart</p>
          <h1 className="text-3xl font-semibold">Complete KYC Verification</h1>
          <p className="text-sm text-white/60">Upload your identity document to verify your account.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-widest text-white/50">Upload Document</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition",
                selectedFile
                  ? "border-emerald-400/50 bg-emerald-400/5"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              {selectedFile ? (
                <>
                  <FileImage className="mb-3 size-12 text-emerald-400" />
                  <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-3 text-xs text-white/60 underline hover:text-white"
                  >
                    Change file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="mb-3 size-12 text-white/40" />
                  <p className="text-sm font-medium text-white">Click to upload or drag and drop</p>
                  <p className="mt-1 text-xs text-white/60">PNG, JPG, PDF up to 10MB</p>
                </>
              )}
            </div>
            <p className="text-xs text-white/50">
              Accepted: Aadhaar, PAN card, Passport, Driving License, or any government-issued ID
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Declaration</label>
            <textarea
              name="declaration"
              rows={3}
              readOnly
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 outline-none"
              defaultValue="I consent to StockMart storing and sharing my information for regulatory purposes."
            />
          </div>

          <button
            type="submit"
            className={cn(
              "w-full rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition",
              status === "submitting" && "opacity-70",
              !selectedFile && "opacity-50 cursor-not-allowed"
            )}
            disabled={status === "submitting" || !selectedFile}
          >
            {status === "submitting" ? "Submitting KYC..." : "Submit for approval"}
          </button>
        </form>
        
        {message && (
          <p className={cn("mt-4 text-center text-sm", status === "error" ? "text-rose-400" : "text-emerald-400")}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

