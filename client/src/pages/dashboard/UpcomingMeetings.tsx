import { MOCK_MEETINGS } from "@/lib/mock-data";
import { CalendarIcon, Clock } from "lucide-react";

export default function UpcomingMeetings() {
    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col hover-elevate">
          <div className="p-5 border-b border-border/50 bg-primary text-primary-foreground rounded-t-xl">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Upcoming Meetings
            </h2>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            {MOCK_MEETINGS.map((meeting, i) => {
              const date = new Date(meeting.date);
              const month = date.toLocaleString('default', { month: 'short' });
              const day = date.getDate();
              const time = date.toLocaleString('default', { hour: 'numeric', minute: '2-digit' });
              
              return (
                <div key={meeting.id} className="flex gap-4 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <span className="text-xs font-bold uppercase">{month}</span>
                    <span className="text-lg font-display font-bold leading-none">{day}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{meeting.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    )
}