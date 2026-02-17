"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  image_url: string | null;
  auth_provider: string;
}

export function AccountSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/users/me", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data: UserProfile = await res.json();
        setProfile(data);
        setDisplayName(data.display_name || "");
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ display_name: displayName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update profile");
      }
      const updated: UserProfile = await res.json();
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={profile?.email || ""}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed.
          </p>
        </div>

        {/* Auth provider badge */}
        <div className="space-y-2">
          <Label>Authentication Method</Label>
          <div>
            <span className="inline-flex items-center rounded-md bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              {profile?.auth_provider === "google"
                ? "Google"
                : "Email / Password"}
            </span>
          </div>
        </div>

        {/* Display name (editable) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              minLength={2}
              maxLength={100}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Update Profile
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-500">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
