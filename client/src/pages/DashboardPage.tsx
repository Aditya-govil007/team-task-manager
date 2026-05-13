import { FormEvent, useEffect, useState } from "react";
import api from "../services/api";
import Card from "../components/Card";
import { Project, Task } from "../types";
import { useAuth } from "../context/AuthContext";

type Summary = { totalTasks: number; completedTasks: number; pendingTasks: number; overdueTasks: number };

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 sm:w-auto sm:min-w-[10rem]";

const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const panelClass = "rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6";

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectNameError, setProjectNameError] = useState("");
  const [projectError, setProjectError] = useState("");
  const { user, logout } = useAuth();

  function projectsEndpoint(): string {
    const root = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
    return root ? `${root}/projects` : "/projects";
  }

  async function load() {
    const [summaryRes, projectsRes, tasksRes] = await Promise.all([
      api.get("/dashboard"),
      api.get(projectsEndpoint()),
      api.get("/tasks/me")
    ]);
    setSummary(summaryRes.data);
    setProjects(projectsRes.data);
    setTasks(tasksRes.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createProject() {
    const name = projectName.trim();
    if (!name) {
      setProjectNameError("Please enter a project name.");
      setProjectError("");
      return;
    }
    setProjectNameError("");
    setProjectError("");
    setCreatingProject(true);
    try {
      const { data: created } = await api.post<{
        id: string;
        name: string;
        description?: string | null;
      }>(projectsEndpoint(), { name });
      const next: Project = {
        id: created.id,
        name: created.name,
        description: created.description ?? undefined
      };
      setProjects((prev) => {
        const without = prev.filter((p) => p.id !== next.id);
        return [next, ...without];
      });
      setProjectName("");
      const { data } = await api.get<Project[]>(projectsEndpoint());
      setProjects(data);
      const summaryRes = await api.get("/dashboard");
      setSummary(summaryRes.data);
    } catch {
      setProjectError("Could not create project. Admins only.");
    } finally {
      setCreatingProject(false);
    }
  }

  function onCreateProjectSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void createProject();
  }

  async function createTask() {
    if (!taskTitle.trim() || !selectedProjectId) return;
    await api.post("/tasks", { title: taskTitle, projectId: selectedProjectId });
    setTaskTitle("");
    void load();
  }

  async function updateStatus(taskId: string, status: Task["status"]) {
    await api.patch(`/tasks/${taskId}/status`, { status });
    void load();
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Team Task Manager</h1>
            <p className="mt-1 text-sm text-slate-500">Overview of your work and projects</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm">
              <span className="max-w-[12rem] truncate sm:max-w-none">{user?.name}</span>
              <span className="ml-2 text-slate-400">·</span>
              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{user?.role}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-2 font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              Log out
            </button>
          </div>
        </header>

        {summary && (
          <section className="mb-8 sm:mb-10" aria-label="Task summary">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              <Card title="Total tasks" value={summary.totalTasks} tone="default" />
              <Card title="Completed" value={summary.completedTasks} tone="positive" />
              <Card title="Pending" value={summary.pendingTasks} tone="caution" />
              <Card title="Overdue" value={summary.overdueTasks} tone="critical" />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <section className={panelClass}>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Projects</h2>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-800">Create a new project</p>
              <p className="mt-0.5 text-xs text-slate-500">Projects you create appear in the list below.</p>
              <form className="mt-4 space-y-3" onSubmit={onCreateProjectSubmit}>
                <div>
                  <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Project name
                  </label>
                  <input
                    id="project-name"
                    name="projectName"
                    type="text"
                    className={inputClass}
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      setProjectNameError("");
                      setProjectError("");
                    }}
                    disabled={creatingProject}
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button type="submit" disabled={creatingProject} className={btnPrimary}>
                    {creatingProject ? "Creating…" : "Create Project"}
                  </button>
                </div>
                {projectNameError && <p className="text-sm font-medium text-amber-800">{projectNameError}</p>}
                {projectError && <p className="text-sm font-medium text-red-600">{projectError}</p>}
              </form>
            </div>

            <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Your projects</h3>
            <ul className="space-y-2">
              {projects.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                  No projects yet.
                </li>
              ) : (
                projects.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm"
                  >
                    {p.name}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className={panelClass}>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Tasks</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Add a task to a project and update its status.</p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 sm:max-w-xs">
                <label htmlFor="task-project" className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm">
                  Project
                </label>
                <select
                  id="task-project"
                  className={selectClass}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="task-title" className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm">
                  Task title
                </label>
                <input
                  id="task-title"
                  className={inputClass}
                  placeholder="New task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <button type="button" onClick={() => void createTask()} className={`${btnPrimary} w-full sm:w-auto sm:shrink-0`}>
                Add task
              </button>
            </div>

            <ul className="mt-6 space-y-2">
              {tasks.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                  No tasks yet.
                </li>
              ) : (
                tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm sm:p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{task.title}</span>
                      <select
                        value={task.status}
                        className={`${selectClass} sm:max-w-[11rem]`}
                        onChange={(e) => void updateStatus(task.id, e.target.value as Task["status"])}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
