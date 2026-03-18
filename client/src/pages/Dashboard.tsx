import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MOCK_TASKS, MOCK_MEETINGS, MOCK_EVENTS, MOCK_GOALS, MOCK_USER } from "@/lib/mock-data";
import { CheckCircle2, Circle, Calendar as CalendarIcon, MapPin, Clock, ArrowUpRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell 
} from "recharts";

export default function Dashboard() {
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Welcome back, {MOCK_USER.firstName}. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Goals Widget - Spans 2 cols on lg screens */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
          
          <div className="p-6 border-b border-border/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Quarterly Goal Progress
              </h2>
              <p className="text-sm text-muted-foreground">Q1 Sales Targets</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold border border-emerald-200">
              <ArrowUpRight className="w-4 h-4" />
              {MOCK_GOALS.trend === 'on_track' ? 'On Track' : MOCK_GOALS.trend}
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            {/* Donut Chart */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" 
                    barSize={16} data={[{ name: 'Progress', value: MOCK_GOALS.percentComplete }]} 
                    startAngle={90} endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} fill="var(--color-primary)" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-display font-bold text-foreground">{MOCK_GOALS.percentComplete}%</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">of Q1 Goal</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Monthly Actual vs Target</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_GOALS.monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <RechartsTooltip 
                      cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} 
                    />
                    <Bar dataKey="target" fill="var(--color-muted)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {MOCK_GOALS.monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.actual >= entry.target ? 'var(--color-primary)' : 'var(--color-primary)'} opacity={entry.actual >= entry.target ? 1 : 0.6} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-primary"></div>Actual</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-muted"></div>Target</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks widget */}
        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col hover-elevate overflow-hidden">
          {/* Header */}
          <div className="border-b border-border/50 bg-muted/20 shrink-0 px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Tasks</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-primary/10 text-primary">
              {completedCount}/{tasks.length}
            </span>
          </div>

          {/* Tasks list */}
          <div className="flex-1 overflow-y-auto p-2">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium transition-colors line-clamp-2",
                    task.completed ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {task.dueDate}
                    </span>
                    {!task.completed && (
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                        task.priority === "high"   ? "bg-destructive/10 text-destructive" :
                        task.priority === "medium" ? "bg-amber-100 text-amber-700" :
                                                     "bg-slate-100 text-slate-600"
                      )}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Widget */}
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

        {/* Events Widget */}
        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col lg:col-span-2 hover-elevate">
          <div className="p-5 border-b border-border/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Industry Events
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_EVENTS.map(event => {
              const start = new Date(event.startDate).toLocaleDateString('default', { month: 'short', day: 'numeric' });
              const end = event.endDate ? new Date(event.endDate).toLocaleDateString('default', { month: 'short', day: 'numeric' }) : '';
              
              return (
                <div key={event.id} className="p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-foreground">{event.name}</h4>
                    <span className="text-xs font-semibold bg-accent text-accent-foreground px-2 py-1 rounded-md whitespace-nowrap">
                      {start} {end ? `- ${end}` : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {event.location}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
