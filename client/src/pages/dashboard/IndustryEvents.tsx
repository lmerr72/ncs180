import { MOCK_EVENTS } from "@/lib/mock-data";
import { MapPin } from "lucide-react";
import DashboardWidgetContainer from "./DashboardWidgetContainer";


export default function IndustryEvents(){
  return (
    <DashboardWidgetContainer
      title="Industry Events"
      icon={<MapPin className="w-4 h-4 text-primary" />}
      bodyClassName="p-4 flex flex-col gap-3"
    >
      {MOCK_EVENTS.map((event) => {
        const start = new Date(event.startDate).toLocaleDateString("default", { month: "short", day: "numeric" });
        const end = event.endDate ? new Date(event.endDate).toLocaleDateString("default", { month: "short", day: "numeric" }) : "";

        return (
          <div key={event.id} className="p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30">
            <div className="flex justify-between items-start mb-2 gap-3">
              <h4 className="font-bold text-foreground">{event.name}</h4>
              <span className="text-xs font-semibold bg-accent text-accent-foreground px-2 py-1 rounded-md whitespace-nowrap">
                {start} {end ? `- ${end}` : ""}
              </span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {event.location}
            </p>
          </div>
        );
      })}
    </DashboardWidgetContainer>
  );
}
