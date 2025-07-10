import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

export const Route = createFileRoute("/")({
  component: PageDashboard,
});

function PageDashboard() {
  const { data, isPending, error } = useQuery({
    ...convexQuery(api.tasks.get, {}),
    initialData: [], // use an empty list if no data is available yet
    gcTime: 10000, // stay subscribed for 10 seconds after this component unmounts
  });

  const { mutate, isPending: _ } = useMutation({
    mutationFn: useConvexMutation(api.tasks.add),
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const taskText = formData.get("task") as string;
    console.log("Task text:", taskText);

    if (taskText?.trim()) {
      mutate({ text: taskText });
      // Reset form
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="max-w-8xl w-full mx-auto flex flex-1 flex-col gap-4 p-6">
      Hello "/"!
      <form onSubmit={handleAddTask}>
        <label htmlFor="task">
          Task Name
          <input id="task" name="task" type="text" />
        </label>

        <button type="submit">Add Task</button>
      </form>
      {isPending && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data.map((task) => (
        <div key={task._id}>{task.text}</div>
      ))}
    </div>
  );
}
