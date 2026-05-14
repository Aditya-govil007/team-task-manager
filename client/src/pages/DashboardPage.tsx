import { FormEvent, useEffect, useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import toast from "react-hot-toast";
import api, { getMyTasks, getProjectMembers, getProjectTasks, ProjectMember, socket } from "../services/api";
import Card from "../components/Card";
import { Project, Task } from "../types";
import { useAuth } from "../context/AuthContext";

type Summary = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const panelClass =
  "rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6";

const kanbanColumns: Array<{ status: Task["status"]; title: string }> = [
  { status: "PENDING", title: "Pending" },
  { status: "IN_PROGRESS", title: "In progress" },
  { status: "COMPLETED", title: "Completed" },
];

function KanbanColumn({
  status,
  title,
  tasks,
  now,
  updatingTaskId,
  onStatusChange,
}: {
  status: Task["status"];
  title: string;
  tasks: Task[];
  now: Date;
  updatingTaskId: string;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-40 rounded-xl border border-slate-200 bg-slate-50/50 p-3 ${
        isOver ? "border-slate-400 bg-slate-100" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
          {tasks.length}
        </span>
      </div>

      <ul className="space-y-2">
        {tasks.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
            No tasks
          </li>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              now={now}
              updatingTaskId={updatingTaskId}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function DraggableTaskCard({
  task,
  now,
  updatingTaskId,
  onStatusChange,
}: {
  task: Task;
  now: Date;
  updatingTaskId: string;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < now &&
    task.status !== "COMPLETED";

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={`rounded-lg border bg-white p-3 transition hover:shadow-sm sm:p-4 ${
        isOverdue
          ? "border-red-300 bg-red-50"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="min-w-0 flex-1 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <p className="text-sm font-medium text-slate-800">
            {task.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>
              {task.dueDate
                ? `Due: ${new Date(task.dueDate).toLocaleDateString()}`
                : "No due date"}
            </span>

            {isOverdue && (
              <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 font-medium text-red-700">
                Overdue
              </span>
            )}
          </div>
        </div>

        <select
          value={task.status}
          className={selectClass}
          disabled={updatingTaskId === task.id}
          onChange={(e) =>
            onStatusChange(task.id, e.target.value as Task["status"])
          }
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "ALL">("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [projectNameError, setProjectNameError] = useState("");
  const [projectError, setProjectError] = useState("");

  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  async function load(showLoading = false) {
    if (showLoading) setLoading(true);

    try {
      const [summaryRes, projectsRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/projects"),
      ]);
      const projectsData = projectsRes.data as Project[];
      const tasksData =
        user?.role === "ADMIN"
          ? (await Promise.all(projectsData.map((project) => getProjectTasks(project.id)))).flat()
          : await getMyTasks();

      setSummary(summaryRes.data);
      setProjects(projectsData);
      setTasks(tasksData);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void load(true);
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!user) return;

    socket.connect();

    function refreshDashboard() {
      void load();
    }

    socket.on("task:status-updated", refreshDashboard);
    socket.on("task:assigned", refreshDashboard);

    return () => {
      socket.off("task:status-updated", refreshDashboard);
      socket.off("task:assigned", refreshDashboard);
      socket.disconnect();
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    let active = true;
    setAssignedToId("");
    setProjectMembers([]);

    if (!selectedProjectId) {
      return;
    }

    getProjectMembers(selectedProjectId)
      .then((members) => {
        if (active) setProjectMembers(members);
      })
      .catch(() => {
        if (active) setProjectMembers([]);
      });

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

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
      }>("/projects", { name });

      const next: Project = {
        id: created.id,
        name: created.name,
        description: created.description ?? undefined,
      };

      setProjects((prev) => {
        const without = prev.filter((p) => p.id !== next.id);
        return [next, ...without];
      });

      setProjectName("");

      const { data } = await api.get<Project[]>("/projects");

      setProjects(data);

      const summaryRes = await api.get("/dashboard");

      setSummary(summaryRes.data);
      toast.success("Project created");
    } catch {
      setProjectError("Could not create project. Admins only.");
      toast.error("Could not create project");
    } finally {
      setCreatingProject(false);
    }
  }

  function onCreateProjectSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void createProject();
  }

  async function createTask() {
    if (!taskTitle.trim() || !selectedProjectId || creatingTask) return;

    setCreatingTask(true);
    try {
      await api.post("/tasks", {
        title: taskTitle.trim(),
        projectId: selectedProjectId,
        assignedToId: assignedToId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      setTaskTitle("");
      setAssignedToId("");
      setDueDate("");
      toast.success("Task created");

      void load();
    } catch {
      toast.error("Could not create task");
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateStatus(
    taskId: string,
    status: Task["status"]
  ) {
    if (updatingTaskId) return;

    setUpdatingTaskId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      toast.success("Task updated");

      void load();
    } catch {
      toast.error("Could not update task");
    } finally {
      setUpdatingTaskId("");
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const nextStatus = event.over?.id as Task["status"] | undefined;
    const task = tasks.find((item) => item.id === taskId);

    if (!task || !nextStatus || task.status === nextStatus) return;
    void updateStatus(taskId, nextStatus);
  }

  const visibleTasks =
    user?.role === "MEMBER"
      ? tasks.filter((task) => task.assignedToId === user.id)
      : tasks;
  const now = new Date();
  const visibleSummary = {
    totalTasks: visibleTasks.length,
    completedTasks: visibleTasks.filter((task) => task.status === "COMPLETED").length,
    inProgressTasks: visibleTasks.filter((task) => task.status === "IN_PROGRESS").length,
    pendingTasks: visibleTasks.filter((task) => task.status === "PENDING").length,
    overdueTasks: visibleTasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "COMPLETED"
    ).length,
  };
  const completionPercentage = visibleSummary.totalTasks
    ? Math.round((visibleSummary.completedTasks / visibleSummary.totalTasks) * 100)
    : 0;
  const filteredTasks = visibleTasks.filter((task) => {
    const isOverdue =
      task.dueDate &&
      new Date(task.dueDate) < now &&
      task.status !== "COMPLETED";

    return (
      task.title.toLowerCase().includes(taskSearch.trim().toLowerCase()) &&
      (statusFilter === "ALL" || task.status === statusFilter) &&
      (!overdueOnly || isOverdue)
    );
  });
  const activityItems = [
    ...projects.slice(0, 3).map((project) => ({
      id: `project-${project.id}`,
      label: "Project created",
      detail: project.name,
      tone: "text-slate-700",
    })),
    ...visibleTasks
      .filter((task) => task.assignedToId)
      .slice(0, 3)
      .map((task) => ({
        id: `assigned-${task.id}`,
        label: "Task assigned",
        detail: task.title,
        tone: "text-amber-700",
      })),
    ...visibleTasks
      .filter((task) => task.status === "COMPLETED")
      .slice(0, 3)
      .map((task) => ({
        id: `completed-${task.id}`,
        label: "Task completed",
        detail: task.title,
        tone: "text-emerald-700",
      })),
  ].slice(0, 6);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Team Task Manager
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Overview of your work and projects
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm">
              <span className="max-w-[12rem] truncate sm:max-w-none">
                {user?.name}
              </span>

              <span className="ml-2 text-slate-400">·</span>

              <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {user?.role}
              </span>
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

        {loading ? (
          <div className="space-y-6" aria-label="Loading dashboard">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-xl border border-slate-200/80 bg-slate-100"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
              <div className={`${panelClass} h-80 animate-pulse bg-slate-100`} />
              <div className={`${panelClass} h-80 animate-pulse bg-slate-100`} />
            </div>
          </div>
        ) : (
          <>
        {summary && (
          <section
            className="mb-8 sm:mb-10"
            aria-label="Task summary"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
              <Card
                title="Total tasks"
                value={visibleSummary.totalTasks}
                tone="default"
              />

              <Card
                title="Completion %"
                value={completionPercentage}
                tone="positive"
              />

              <Card
                title="Completed"
                value={visibleSummary.completedTasks}
                tone="positive"
              />

              <Card
                title="In progress"
                value={visibleSummary.inProgressTasks}
                tone="caution"
              />

              <Card
                title="Pending"
                value={visibleSummary.pendingTasks}
                tone="caution"
              />

              <Card
                title="Overdue"
                value={visibleSummary.overdueTasks}
                tone="critical"
              />
            </div>
          </section>
        )}

        <section className={`${panelClass} mb-4 lg:mb-8`} aria-label="Activity feed">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Recent activity
            </h2>
          </div>

          <ul className="mt-4 space-y-2">
            {activityItems.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-4 text-sm text-slate-500">
                No activity yet.
              </li>
            ) : (
              activityItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className={`text-sm font-medium ${item.tone}`}>
                    {item.label}
                  </span>
                  <span className="min-w-0 text-sm text-slate-600 sm:max-w-md sm:truncate">
                    {item.detail}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
          <section className={panelClass}>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Projects
            </h2>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-800">
                Create a new project
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {isAdmin
                  ? "Projects you create appear in the list below."
                  : "Project creation is managed by admin users."}
              </p>

              {isAdmin ? (
                <form
                  className="mt-4 space-y-3"
                  onSubmit={onCreateProjectSubmit}
                >
                  <div>
                    <label
                      htmlFor="project-name"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
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
                    <button
                      type="submit"
                      disabled={creatingProject}
                      className={btnPrimary}
                    >
                      {creatingProject
                        ? "Creating…"
                        : "Create Project"}
                    </button>
                  </div>

                  {projectNameError && (
                    <p className="text-sm font-medium text-amber-800">
                      {projectNameError}
                    </p>
                  )}

                  {projectError && (
                    <p className="text-sm font-medium text-red-600">
                      {projectError}
                    </p>
                  )}
                </form>
              ) : (
                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                  Admins can manage projects and add new teams here.
                </div>
              )}
            </div>

            <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your projects
            </h3>

            <ul className="space-y-2">
              {projects.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">No projects yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Create a project to start organizing tasks with your team.
                  </p>
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
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Tasks
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Add a task to a project and update its status.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xs">
                <label
                  htmlFor="task-project"
                  className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm"
                >
                  Project
                </label>

                <select
                  id="task-project"
                  className={selectClass}
                  value={selectedProjectId}
                  onChange={(e) =>
                    setSelectedProjectId(e.target.value)
                  }
                >
                  <option value="">Select project</option>

                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <label
                  htmlFor="task-title"
                  className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm"
                >
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

              {isAdmin && (
                <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xs">
                  <label
                    htmlFor="task-assignee"
                    className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm"
                  >
                    Assignee
                  </label>

                  <select
                    id="task-assignee"
                    className={selectClass}
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    disabled={!selectedProjectId}
                  >
                    <option value="">Unassigned</option>

                    {projectMembers.map((member) => (
                      <option key={member.id} value={member.userId}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="min-w-0 basis-full sm:basis-auto sm:max-w-[12rem]">
                <label
                  htmlFor="task-due-date"
                  className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm"
                >
                  Due date
                </label>

                <input
                  id="task-due-date"
                  type="date"
                  className={inputClass}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => void createTask()}
                disabled={creatingTask}
                className={`${btnPrimary} w-full sm:w-auto sm:shrink-0`}
              >
                {creatingTask ? "Adding..." : "Add task"}
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <label
                  htmlFor="task-search"
                  className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm"
                >
                  Search tasks
                </label>

                <input
                  id="task-search"
                  className={inputClass}
                  placeholder="Search by title"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                />
              </div>

              <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xs">
                <label
                  htmlFor="task-status-filter"
                  className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm"
                >
                  Status
                </label>

                <select
                  id="task-status-filter"
                  className={selectClass}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as Task["status"] | "ALL")
                  }
                >
                  <option value="ALL">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <label className="inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm sm:w-auto">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                />
                Overdue only
              </label>
            </div>

            <div className="mt-6">
              {filteredTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    {visibleTasks.length === 0 ? "No tasks yet" : "No matching tasks"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {visibleTasks.length === 0
                      ? "Create a task above to begin tracking work."
                      : "Try adjusting your search, status, or overdue filters."}
                  </p>
                </div>
              ) : (
                <DndContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                    {kanbanColumns.map((column) => (
                      <KanbanColumn
                        key={column.status}
                        status={column.status}
                        title={column.title}
                        tasks={filteredTasks.filter((task) => task.status === column.status)}
                        now={now}
                        updatingTaskId={updatingTaskId}
                        onStatusChange={(taskId, status) => void updateStatus(taskId, status)}
                      />
                    ))}
                  </div>
                </DndContext>
              )}
            </div>
          </section>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
