import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { MapPin, Mail, Phone, Briefcase, UserCircle2 } from "lucide-react";

const REP = {
  firstName: "Gordon",
  lastName:  "Marshall",
  initials:  "GM",
  title:     "Sales Representative",
  location:  "Denver, CO",
  email:     "gmarshall@ncs180.com",
  phone:     "(720) 555-0182",
  bio:       "Gordon has been with NCS 180 for over 8 years, specializing in multifamily property management solutions across the Mountain West region. He's dedicated to making sure every client has the tools and support they need to succeed.",
};

const INFO_ROWS = [
  { icon: Briefcase, label: "Title",    value: REP.title    },
  { icon: MapPin,    label: "Location", value: REP.location  },
  { icon: Mail,      label: "Email",    value: REP.email     },
  { icon: Phone,     label: "Phone",    value: REP.phone     },
];

export default function ClientMyRep() {
  return (
    <ClientPortalLayout>
      <div className="max-w-md mx-auto">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Top accent band */}
          <div className="h-24 bg-gradient-to-br from-primary/80 to-primary relative" />

          {/* Avatar — overlaps the band */}
          <div className="flex flex-col items-center -mt-12 px-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-card shadow-lg flex items-center justify-center ring-4 ring-primary/20">
              <span className="text-3xl font-bold text-primary">{REP.initials}</span>
            </div>

            {/* Name */}
            <h1 className="mt-4 text-3xl font-display font-bold text-foreground tracking-tight text-center">
              {REP.firstName} {REP.lastName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 mb-5">{REP.title}</p>

            {/* Bio */}
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6 px-2">
              {REP.bio}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 mx-6" />

          {/* Info rows */}
          <div className="px-6 py-5 space-y-4">
            {INFO_ROWS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact button */}
          <div className="px-6 pb-6">
            <a
              href={`mailto:${REP.email}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email {REP.firstName}
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your dedicated NCS 180 representative
        </p>
      </div>
    </ClientPortalLayout>
  );
}
