import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import type { Timezone } from "@/types/api";
import { Camera, Save, KeyRound, User as UserIcon, ShieldCheck, MapPin, Clock } from "lucide-react";
import CustomSelect from "@/components/shared/CustomSelect";
import OutlookSettingsWidget from "@/components/shared/OutlookSettingsWidget";

export default function Profile() {
  const { user } = useAuth();
  const location = useLocation();
  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}` : "NA";
  const outlookReturnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.delete("outlook");
    params.delete("outlook_error");
    const search = params.toString();
    return `${location.pathname}${search ? `?${search}` : ""}`;
  }, [location.pathname, location.search]);
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    title: string;
    location: string;
    timezone: Timezone;
  }>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    title: user?.title ?? "",
    location: "Denver, CO",
    timezone: (user?.timezone ?? "Mountain Time (MT)") as Timezone,
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be a mutation
    alert("Profile saved successfully!");
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      alert("New passwords do not match.");
      return;
    }
    alert("Password updated successfully!");
    setPassword({ current: "", new: "", confirm: "" });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-12">
        {/* Header Banner */}
        <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-24 shadow-lg border border-border/50">
          <img 
            src={`${import.meta.env.BASE_URL}images/profile-banner.png`} 
            alt="Profile background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Avatar overlapped over bottom edge */}
          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-4xl font-display font-bold text-primary-foreground border-4 border-background shadow-xl">
                {user?.initials ?? initials}
              </div>
              <button className="absolute bottom-2 right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md cursor-pointer border-2 border-background z-10" aria-label="Change photo">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-4 text-white drop-shadow-md">
              <h1 className="text-3xl font-display font-bold">{user?.firstName} {user?.lastName}</h1>
              <p className="text-white/80 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {user?.title}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
          <OutlookSettingsWidget returnTo={outlookReturnTo} />
          
          {/* Profile Form */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover-elevate">
            <div className="p-6 border-b border-border/50 bg-muted/10 flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Personal Information</h2>
            </div>
            <form onSubmit={handleProfileSave} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">First Name</label>
                  <input 
                    type="text" 
                    value={profile.firstName || ''} 
                    onChange={e => setProfile({...profile, firstName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">Last Name</label>
                  <input 
                    type="text" 
                    value={profile.lastName || ''} 
                    onChange={e => setProfile({...profile, lastName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Job Title</label>
                <input 
                  type="text" 
                  value={profile.title || ''} 
                  onChange={e => setProfile({...profile, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-muted/50 text-muted-foreground cursor-not-allowed font-medium"
                />
                <span className="text-xs text-muted-foreground">Email address cannot be changed.</span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Location
                </label>
                <input 
                  type="text"
                  value={profile.location}
                  onChange={e => setProfile({...profile, location: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Timezone
                </label>
                <CustomSelect
                  value={profile.timezone}
                  onChange={value => setProfile({...profile, timezone: value as Timezone})}
                  options={[
                    { value: "Mountain Time (MT)", label: "Mountain Time (MT) — UTC−7/−6" },
                    { value: "Eastern Time (ET)", label: "Eastern Time (ET) — UTC−5/−4" },
                    { value: "Central Time (CT)", label: "Central Time (CT) — UTC−6/−5" },
                    { value: "Pacific Time (PT)", label: "Pacific Time (PT) — UTC−8/−7" },
                    { value: "Alaska Time (AKT)", label: "Alaska Time (AKT) — UTC−9/−8" },
                    { value: "Hawaii Time (HT)", label: "Hawaii Time (HT) — UTC−10" },
                  ]}
                  className="px-4 py-3 font-medium"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button type="submit" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all active:translate-y-0">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Password Form */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover-elevate h-fit">
            <div className="p-6 border-b border-border/50 bg-muted/10 flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Security</h2>
            </div>
            <form onSubmit={handlePasswordSave} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Current Password</label>
                <input 
                  type="password" 
                  value={password.current}
                  onChange={e => setPassword({...password, current: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
              
              <div className="w-full h-px bg-border/50 my-2"></div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">New Password</label>
                <input 
                  type="password" 
                  value={password.new}
                  onChange={e => setPassword({...password, new: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Confirm New Password</label>
                <input 
                  type="password" 
                  value={password.confirm}
                  onChange={e => setPassword({...password, confirm: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  required
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button type="submit" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground border border-secondary-border font-semibold hover:bg-secondary/80 transition-all hover:shadow-md active:translate-y-px">
                  <KeyRound className="w-4 h-4" />
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
