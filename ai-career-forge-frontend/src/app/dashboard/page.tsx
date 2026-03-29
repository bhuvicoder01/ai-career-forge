"use client";

import { BrainCircuit, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

interface UserProfile {
  id?: string;
  skills: string[];
  parsedGoals?: string;
  resumeS3Url?: string;
}

export default function DashboardProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/profile");
      setProfile(response.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setUploadStatus("idle");
      const response = await api.post("/profile/resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile(response.data);
      setUploadStatus("success");
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">AI automates your data to customize your opportunities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 bg-muted/20 relative">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            accept=".pdf"
          />
          
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          ) : uploadStatus === "success" ? (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          ) : (
            <UploadCloud className="w-12 h-12 text-blue-500" />
          )}

          <div>
            <h3 className="text-lg font-medium">
              {isUploading ? "Processing..." : uploadStatus === "success" ? "Upload Complete!" : "Upload Resume"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
              {uploadStatus === "error" ? "Upload failed. Please try again." : "Drag & drop your PDF here. The AI will extract all skills and experience instantly."}
            </p>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 mt-2 font-medium rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Select File"}
          </button>

          {profile?.resumeS3Url && (
            <div className="mt-4 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded truncate max-w-full">
              Current: {profile.resumeS3Url.split('/').pop()}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <BrainCircuit className="text-purple-400 w-5 h-5" /> 
            Extracted Intelligence
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">Top Skills</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map(s => (
                    <span key={s} className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">No skills extracted yet. Upload a resume to begin.</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Goals</span>
              <p className="text-sm mt-1">
                {profile?.parsedGoals || "Upload a resume or update your profile to see AI-generated goals."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
