import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GraphqlStatusCard } from "@/components/graphql/GraphqlStatusCard";
import { MOCK_GOALS } from "@/lib/mock-data";
import { ArrowUpRight, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createBrowserLogger } from "@/lib/logger";
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell
} from "recharts";
import IndustryEvents from "./IndustryEvents";
import UpcomingMeetings from "./UpcomingMeetings";
import TaskList from "./TaskList";
import { getTasks, type ExtendedTask, updateTask } from "@/services/taskService";

const logger = createBrowserLogger("Dashboard");

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);

  useEffect(() => {
    if (!user?.repId) {
      setTasks([]);
      return;
    }

    let ignore = false;

    async function loadTasks() {
      try {
        const nextTasks = await getTasks(user.repId);
        if (!ignore) {
          setTasks(nextTasks.slice(0, 5));
        }
      } catch (error) {
        logger.error("Failed to load dashboard tasks", { error, repId: user.repId });
      }
    }

    void loadTasks();

    return () => {
      ignore = true;
    };
  }, [user?.repId]);

  async function toggleTask(id: string) {
    const existingTask = tasks.find((task) => task.id === id);
    if (!existingTask) return;

    const nextCompleted = !existingTask.completed;
    const previousTasks = tasks;

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: nextCompleted } : task))
    );

    try {
      const updated = await updateTask(id, { completed: nextCompleted });
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
    } catch (error) {
      logger.error("Failed to update dashboard task", { error, taskId: id });
      setTasks(previousTasks);
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Welcome back, {user?.firstName}. Here's what's happening today.</p>
      </div>

      <GraphqlStatusCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              {MOCK_GOALS.trend === "on_track" ? "On Track" : MOCK_GOALS.trend}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="flex flex-col items-center justify-center relative">
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={16}
                    data={[{ name: "Progress", value: MOCK_GOALS.percentComplete }]}
                    startAngle={90}
                    endAngle={-270}
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

            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Monthly Actual vs Target</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_GOALS.monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                    <RechartsTooltip
                      cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-md)" }}
                    />
                    <Bar dataKey="target" fill="var(--color-muted)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {MOCK_GOALS.monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.actual >= entry.target ? "var(--color-primary)" : "var(--color-primary)"} opacity={entry.actual >= entry.target ? 1 : 0.6} />
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

        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col hover-elevate overflow-hidden">
          <div className="border-b border-border/50 bg-muted/20 shrink-0 px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Tasks</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-primary/10 text-primary">
              {completedCount}/{tasks.length}
            </span>
          </div>

          <TaskList tasks={tasks} onToggleTask={toggleTask} />
        </div>

        <UpcomingMeetings />
        <IndustryEvents />
      </div>
    </AppLayout>
  );
}
