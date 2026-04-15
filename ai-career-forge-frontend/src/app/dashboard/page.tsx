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
  const [isDragging, setIsDragging] = useState(false);
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

  const uploadFile = async (file: File) => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      uploadFile(file);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">Mission Profile</h1>
        <p className="text-muted-foreground font-semibold">AI automates your data to customize your opportunities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`bg-card border-2 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 border-dashed relative overflow-hidden group transition-all ${
            isDragging ? 'border-foreground bg-foreground/5 scale-[1.02]' : 'border-border bg-muted/10'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            accept=".pdf"
          />
          
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
          ) : uploadStatus === "success" ? (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          ) : (
            <UploadCloud className={`w-12 h-12 transition-transform ${isDragging ? 'scale-125 text-foreground' : 'text-muted-foreground group-hover:scale-110'}`} />
          )}

          <div>
            <h3 className="text-lg font-black tracking-tighter">
              {isDragging ? "DROP TO INGEST" : isUploading ? "RECONNAISSANCE..." : uploadStatus === "success" ? "UPLOAD SECURED" : "UPLOAD RESUME"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-[250px] mt-1 font-bold">
              {isDragging ? "Release to begin AI extraction" : uploadStatus === "error" ? "Transmission failed. Retry." : "Drag & drop your PDF. AI extraction engaged."}
            </p>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-2.5 mt-2 font-black rounded-xl bg-foreground text-background text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {isUploading ? "UPLOADING..." : "SELECT FILE"}
          </button>

          {profile?.resumeS3Url && (
            <div className="mt-4 text-[10px] text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg truncate max-w-full border border-border font-mono">
              FILE: {profile.resumeS3Url.split('/').pop()}
            </div>
          )}

          {/* Drag Overlay Effect */}
          {isDragging && (
            <div className="absolute inset-0 bg-foreground/5 pointer-events-none animate-pulse" />
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-foreground/70">
            <BrainCircuit className="text-foreground/40 w-5 h-5" /> 
            Extracted Intel
          </h3>
          <div className="space-y-6 flex-1">
            <div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Top Competencies</span>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map(s => (
                    <span key={s} className="px-3 py-1.5 text-[11px] rounded-lg bg-secondary text-foreground border border-border font-black uppercase shadow-sm">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">No skills extracted. Awaiting resume transmission.</span>
                )}
              </div>
            </div>
            <div className="pt-6 border-t border-border/50">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mission Objectives</span>
              <p className="text-sm mt-3 text-foreground/80 leading-relaxed font-medium">
                {profile?.parsedGoals || "Upload a resume to initialize AI-generated objectives."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
