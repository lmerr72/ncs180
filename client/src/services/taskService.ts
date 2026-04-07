import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import type { TaskType, Importance } from "@/types/api";
export type TaskCommType = "email" | "phone" | null;
export type TaskCompanyOrigin = "all-clients" | "my-clients" | "pipeline";

export type ExtendedTask = {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  importance: Importance;
  dueDate: string;
  dueDateValue: string;
  completed: boolean;
  commType: TaskCommType;
  associatedCompanyName?: string;
  associatedCompanyId?: string;
  associatedCompanyOrigin?: TaskCompanyOrigin;
};

type GraphqlTaskType = "PROSPECTING" | "FOLLOW_UP" | "TRAINING" | "OTHER";
type GraphqlTaskCommType = "EMAIL" | "PHONE" | null;

type GraphqlTask = {
  id: string;
  clientId: string | null;
  repId: string;
  title: string;
  description: string;
  taskType: GraphqlTaskType;
  importance: Importance;
  dueDate: string;
  completed: boolean;
  commType: GraphqlTaskCommType;
  client?: {
    id: string;
    companyName: string;
  } | null;
};

type TasksQueryData = {
  tasks: GraphqlTask[];
};

type TasksQueryVariables = {
  repId: string;
  clientId?: string;
};

type CreateTaskMutationData = {
  createTask: GraphqlTask;
};

type UpdateTaskMutationData = {
  updateTask: GraphqlTask;
};

type DeleteTaskMutationData = {
  deleteTask: GraphqlTask;
};

export type CreateTaskServiceInput = {
  repId: string;
  clientId?: string;
  title: string;
  description: string;
  taskType: TaskType;
  importance: Importance;
  dueDate: string;
  completed?: boolean;
  commType?: Exclude<TaskCommType, null>;
};

export type UpdateTaskServiceInput = {
  clientId?: string | null;
  title?: string;
  description?: string;
  taskType?: TaskType;
  importance?: Importance;
  dueDate?: string;
  completed?: boolean;
  commType?: TaskCommType;
};

type CreateTaskMutationVariables = {
  input: {
    repId: string;
    clientId?: string;
    title: string;
    description: string;
    taskType: GraphqlTaskType;
    importance: Importance;
    dueDate: string;
    completed?: boolean;
    commType?: Exclude<GraphqlTaskCommType, null>;
  };
};

type UpdateTaskMutationVariables = {
  id: string;
  input: {
    clientId?: string | null;
    title?: string;
    description?: string;
    taskType?: GraphqlTaskType;
    importance?: Importance;
    dueDate?: string;
    completed?: boolean;
    commType?: GraphqlTaskCommType;
  };
};

type DeleteTaskMutationVariables = {
  id: string;
};

export const TASK_FIELDS = gql`
  fragment TaskFields on Task {
    id
    clientId
    repId
    title
    description
    taskType
    importance
    dueDate
    completed
    commType
    client {
      id
      companyName
    }
  }
`;

export const TASKS_QUERY = gql`
  query Tasks($repId: ID!, $clientId: ID) {
    tasks(repId: $repId, clientId: $clientId) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;

export async function getTasks(repId: string, clientId?: string): Promise<ExtendedTask[]> {
  const response = await apolloClient.query<TasksQueryData, TasksQueryVariables>({
    query: TASKS_QUERY,
    variables: {
      repId,
      ...(clientId ? { clientId } : {})
    },
    fetchPolicy: "network-only"
  });

  return response.data.tasks.map(toExtendedTask);
}

export async function createTask(input: CreateTaskServiceInput): Promise<ExtendedTask> {
  const response = await apolloClient.mutate<CreateTaskMutationData, CreateTaskMutationVariables>({
    mutation: CREATE_TASK_MUTATION,
    variables: {
      input: {
        repId: input.repId,
        ...(input.clientId ? { clientId: input.clientId } : {}),
        title: input.title.trim(),
        description: input.description.trim(),
        taskType: toGraphqlTaskType(input.taskType),
        importance: input.importance,
        dueDate: input.dueDate,
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
        ...(input.commType ? { commType: toGraphqlCommType(input.commType) } : {})
      }
    }
  });

  if (!response.data?.createTask) {
    throw new Error("Task creation did not return a task.");
  }

  return toExtendedTask(response.data.createTask);
}

export async function updateTask(id: string, input: UpdateTaskServiceInput): Promise<ExtendedTask> {
  const response = await apolloClient.mutate<UpdateTaskMutationData, UpdateTaskMutationVariables>({
    mutation: UPDATE_TASK_MUTATION,
    variables: {
      id,
      input: {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.taskType !== undefined ? { taskType: toGraphqlTaskType(input.taskType) } : {}),
        ...(input.importance !== undefined ? { importance: input.importance } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
        ...(input.commType !== undefined ? { commType: toGraphqlCommType(input.commType) } : {})
      }
    }
  });

  if (!response.data?.updateTask) {
    throw new Error("Task update did not return a task.");
  }

  return toExtendedTask(response.data.updateTask);
}

export async function deleteTask(id: string): Promise<ExtendedTask> {
  const response = await apolloClient.mutate<DeleteTaskMutationData, DeleteTaskMutationVariables>({
    mutation: DELETE_TASK_MUTATION,
    variables: { id }
  });

  if (!response.data?.deleteTask) {
    throw new Error("Task deletion did not return a task.");
  }

  return toExtendedTask(response.data.deleteTask);
}

function toExtendedTask(task: GraphqlTask): ExtendedTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    taskType: fromGraphqlTaskType(task.taskType),
    importance: task.importance,
    dueDate: formatDueDate(task.dueDate),
    dueDateValue: task.dueDate.slice(0, 10),
    completed: task.completed,
    commType: fromGraphqlCommType(task.commType),
    associatedCompanyName: task.client?.companyName ?? undefined,
    associatedCompanyId: task.client?.id ?? task.clientId ?? undefined,
  };
}

function toGraphqlTaskType(taskType: TaskType): GraphqlTaskType {
  switch (taskType) {
    case "Prospecting":
      return "PROSPECTING";
    case "Follow-Up":
      return "FOLLOW_UP";
    case "Training":
      return "TRAINING";
    case "Other":
    default:
      return "OTHER";
  }
}

function fromGraphqlTaskType(taskType: GraphqlTaskType): TaskType {
  switch (taskType) {
    case "PROSPECTING":
      return "Prospecting";
    case "FOLLOW_UP":
      return "Follow-Up";
    case "TRAINING":
      return "Training";
    case "OTHER":
    default:
      return "Other";
  }
}

function toGraphqlCommType(commType: TaskCommType): GraphqlTaskCommType {
  if (commType === "email") return "EMAIL";
  if (commType === "phone") return "PHONE";
  return null;
}

function fromGraphqlCommType(commType: GraphqlTaskCommType): TaskCommType {
  if (commType === "EMAIL") return "email";
  if (commType === "PHONE") return "phone";
  return null;
}

function formatDueDate(dateStr: string): string {
  const due = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const dayDiff = Math.round(diffMs / 86400000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff === -1) return "Yesterday";

  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
