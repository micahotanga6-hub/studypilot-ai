"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Field, PageHeader, fieldClass } from "@/components/ui";
import { useAccount } from "@/components/use-account";
import { authFetch } from "@/lib/api-client";
import { createOwned, listOwned, listWhere, saveFields } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import type { StudyPlanRecord, StudyTaskRecord } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function PlannerScreen() {
  const { user, limits } = useAccount();
  const [plans, setPlans] = useState<StudyPlanRecord[]>([]);
  const [planId, setPlanId] = useState("");
  const [taskState, setTaskState] = useState<{ planId: string; tasks: StudyTaskRecord[] }>({ planId: "", tasks: [] });
  const tasks = taskState.planId === planId ? taskState.tasks : [];
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [subjects, setSubjects] = useState([{ name: "", examDate: "", hoursPerWeek: 4, difficult: false }]);
  const [days, setDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [hoursPerDay, setHoursPerDay] = useState(2);

  async function loadPlans(uid: string) {
    const next = await listOwned<StudyPlanRecord>(COLLECTIONS.plans, uid);
    setPlans(next);
    setPlanId((current) => current || next[0]?.id || "");
  }

  useEffect(() => {
    if (!user) return;
    listOwned<StudyPlanRecord>(COLLECTIONS.plans, user.uid)
      .then((next) => {
        setPlans(next);
        setPlanId((current) => current || next[0]?.id || "");
      })
      .catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);

  useEffect(() => {
    if (!user || !planId) return;
    listWhere<StudyTaskRecord>(COLLECTIONS.tasks, user.uid, "planId", planId, "date")
      .then((next) => setTaskState({ planId, tasks: next }))
      .catch((err) => setError(friendlyFirebaseError(err)));
  }, [user, planId]);

  async function addPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const created = await createOwned(COLLECTIONS.plans, {
      uid: user.uid,
      title,
      subjects: String(form.get("subjects") || "").split(",").map((item) => item.trim()).filter(Boolean),
      source: "manual",
    });
    await loadPlans(user.uid);
    setPlanId(created.id);
    event.currentTarget.reset();
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !planId) return setError("Create a plan first.");
    const form = new FormData(event.currentTarget);
    await createOwned(COLLECTIONS.tasks, {
      uid: user.uid,
      planId,
      title: String(form.get("title") || "").trim(),
      subject: String(form.get("subject") || "").trim(),
      date: String(form.get("date") || ""),
      kind: "study",
      done: false,
    });
    setTaskState({ planId, tasks: await listWhere<StudyTaskRecord>(COLLECTIONS.tasks, user.uid, "planId", planId, "date") });
    event.currentTarget.reset();
  }

  async function toggle(task: StudyTaskRecord) {
    await saveFields(COLLECTIONS.tasks, task.id, { done: !task.done });
    setTaskState((current) => ({
      planId,
      tasks: current.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item),
    }));
  }

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.emailVerified) return setError("Verify your email before generating a plan.");
    setWorking(true);
    setError(null);
    try {
      const result = await authFetch<{ id: string }>("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: subjects.filter((item) => item.name && item.examDate),
          days,
          hoursPerDay,
        }),
      });
      await loadPlans(user.uid);
      setPlanId(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The plan could not be generated.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader title="Study Planner" lede="Add your own tasks on any plan. An AI timetable is part of Student and stays locked until a verified subscription exists." />
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Manual plan</h2>
          <form onSubmit={addPlan} className="mt-4 space-y-3">
            <Field label="Plan name"><input name="title" required maxLength={120} className={fieldClass} /></Field>
            <Field label="Subjects" hint="Optional, separated by commas."><input name="subjects" className={fieldClass} /></Field>
            <Button type="submit">Create plan</Button>
          </form>
        </Card>
        {limits.aiPlanner ? (
          <Card>
            <h2 className="font-display text-2xl">AI timetable</h2>
            <form onSubmit={generate} className="mt-4 space-y-3">
              {subjects.map((subject, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-2">
                  <input placeholder="Subject" value={subject.name} onChange={(event) => setSubjects((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className={fieldClass} />
                  <input type="date" value={subject.examDate} onChange={(event) => setSubjects((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, examDate: event.target.value } : item))} className={fieldClass} />
                  <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={subject.difficult} onChange={(event) => setSubjects((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, difficult: event.target.checked } : item))} /> This subject is difficult</label>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setSubjects((current) => [...current, { name: "", examDate: "", hoursPerWeek: 4, difficult: false }])}>Add subject</Button>
              <div className="flex flex-wrap gap-2 text-sm">
                {DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1"><input type="checkbox" checked={days.includes(day)} onChange={() => setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} />{day}</label>
                ))}
              </div>
              <Field label="Hours you can study on an available day"><input type="number" min={0.5} max={10} step={0.5} value={hoursPerDay} onChange={(event) => setHoursPerDay(Number(event.target.value))} className={fieldClass} /></Field>
              <Button type="submit" disabled={working}>{working ? "Building the timetable…" : "Generate timetable"}</Button>
            </form>
          </Card>
        ) : (
          <Card>
            <h2 className="font-display text-2xl">AI timetable</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Generating a timetable from exam dates is part of the Student plan. Payments are not open yet, so this stays locked. The manual planner on the left works now.</p>
          </Card>
        )}
      </div>
      <div className="mt-6">
        {plans.length === 0 ? <Empty title="No plans yet" body="Create a plan, then add tasks with dates." /> : (
          <>
            <Field label="Plan">
              <select className={fieldClass} value={planId} onChange={(event) => setPlanId(event.target.value)}>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}{plan.source === "ai" ? " · AI" : ""}</option>)}
              </select>
            </Field>
            <form onSubmit={addTask} className="mt-4 grid gap-3 md:grid-cols-4">
              <input name="title" required placeholder="Task" className={fieldClass} />
              <input name="subject" placeholder="Subject" className={fieldClass} />
              <input name="date" type="date" required className={fieldClass} />
              <Button type="submit">Add task</Button>
            </form>
            <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-card">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <input type="checkbox" checked={task.done} onChange={() => toggle(task)} aria-label={`Mark ${task.title} complete`} />
                  <div>
                    <p className={task.done ? "text-muted line-through" : ""}>{task.title}</p>
                    <p className="text-xs text-muted">{task.date}{task.subject ? ` · ${task.subject}` : ""} · {task.kind}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
