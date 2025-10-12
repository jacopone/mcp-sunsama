import type { CreateTaskOptions } from "sunsama-api/types";
import {
  type AddSubtaskInput,
  addSubtaskSchema,
  type CompleteSubtaskInput,
  completeSubtaskSchema,
  type CreateSubtasksInput,
  createSubtasksSchema,
  type CreateTaskInput,
  createTaskSchema,
  type DeleteTaskInput,
  deleteTaskSchema,
  type GetArchivedTasksInput,
  getArchivedTasksSchema,
  type GetTaskByIdInput,
  getTaskByIdSchema,
  type GetTasksBacklogInput,
  getTasksBacklogSchema,
  type GetTasksByDayInput,
  getTasksByDaySchema,
  type UncompleteSubtaskInput,
  uncompleteSubtaskSchema,
  type UpdateSubtaskTitleInput,
  updateSubtaskTitleSchema,
  type UpdateTaskBacklogInput,
  updateTaskBacklogSchema,
  type UpdateTaskCompleteInput,
  updateTaskCompleteSchema,
  type UpdateTaskDueDateInput,
  updateTaskDueDateSchema,
  type UpdateTaskNotesInput,
  updateTaskNotesSchema,
  type UpdateTaskPlannedTimeInput,
  updateTaskPlannedTimeSchema,
  type UpdateTaskSnoozeDateInput,
  updateTaskSnoozeDateSchema,
  type UpdateTaskStreamInput,
  updateTaskStreamSchema,
  type UpdateTaskTextInput,
  updateTaskTextSchema,
} from "../schemas.js";
import { filterTasksByCompletion } from "../utils/task-filters.js";
import { trimTasksForResponse } from "../utils/task-trimmer.js";
import {
  formatJsonResponse,
  formatPaginatedTsvResponse,
  formatTsvResponse,
  withTransportClient,
  type ToolContext,
} from "./shared.js";
import {
  getCachedTasksByDay,
  getCachedTaskById,
  getCachedTasksBacklog,
  getUserTimezone,
  checkPastDateWarning,
  invalidateTaskCaches,
  invalidateDayCaches,
  validateTaskText,
  formatTaskResponse,
} from "./task-helpers.js";
import { getTaskScheduledDate } from "../models/task.js";

// Task Query Tools
export const getTasksBacklogTool = withTransportClient({
  name: "get-tasks-backlog",
  description: "Get tasks from the backlog",
  parameters: getTasksBacklogSchema,
  execute: async (_args: GetTasksBacklogInput, context: ToolContext) => {
    // T029: Cache integration (30s TTL) + validation
    const tasks = await getCachedTasksBacklog(context);
    const trimmedTasks = trimTasksForResponse(tasks);

    return formatTsvResponse(trimmedTasks);
  },
});

export const getTasksByDayTool = withTransportClient({
  name: "get-tasks-by-day",
  description:
    "Get tasks for a specific day with optional filtering by completion status",
  parameters: getTasksByDaySchema,
  execute: async (
    { day, timezone, completionFilter = "all" }: GetTasksByDayInput,
    context: ToolContext,
  ) => {
    // T020: Cache integration + timezone awareness
    // If no timezone provided, get the user's default timezone
    let resolvedTimezone = timezone;
    if (!resolvedTimezone) {
      resolvedTimezone = await getUserTimezone(context);
    }

    // Get tasks with caching (30s TTL)
    const tasks = await getCachedTasksByDay(day, resolvedTimezone, context);
    const filteredTasks = filterTasksByCompletion(tasks, completionFilter);
    const trimmedTasks = trimTasksForResponse(filteredTasks);

    return formatTsvResponse(trimmedTasks);
  },
});

export const getArchivedTasksTool = withTransportClient({
  name: "get-archived-tasks",
  description: "Get archived tasks with optional pagination",
  parameters: getArchivedTasksSchema,
  execute: async (
    { offset = 0, limit = 100 }: GetArchivedTasksInput,
    context: ToolContext,
  ) => {
    const requestedLimit = limit;
    const fetchLimit = requestedLimit + 1;

    const allTasks = await context.client.getArchivedTasks(offset, fetchLimit);

    const hasMore = allTasks.length > requestedLimit;
    const tasks = hasMore ? allTasks.slice(0, requestedLimit) : allTasks;
    const trimmedTasks = trimTasksForResponse(tasks);

    const paginationInfo = {
      offset,
      limit: requestedLimit,
      count: tasks.length,
      hasMore,
      nextOffset: hasMore ? offset + requestedLimit : null,
    };

    return formatPaginatedTsvResponse(trimmedTasks, paginationInfo);
  },
});

export const getTaskByIdTool = withTransportClient({
  name: "get-task-by-id",
  description: "Get a specific task by its ID",
  parameters: getTaskByIdSchema,
  execute: async ({ taskId }: GetTaskByIdInput, context: ToolContext) => {
    // T021: Cache integration + Zod validation
    const task = await getCachedTaskById(taskId, context);

    return formatJsonResponse(task);
  },
});

// Task Lifecycle Tools
export const createTaskTool = withTransportClient({
  name: "create-task",
  description: "Create a new task with optional properties",
  parameters: createTaskSchema,
  execute: async (
    {
      text,
      notes,
      streamIds,
      timeEstimate,
      dueDate,
      snoozeUntil,
      private: isPrivate,
      taskId,
      integration,
    }: CreateTaskInput,
    context: ToolContext,
  ) => {
    // T022: Past date warning + cache invalidation
    const options: CreateTaskOptions = {};
    if (notes) options.notes = notes;
    if (streamIds) options.streamIds = streamIds;
    if (timeEstimate) options.timeEstimate = timeEstimate;
    if (dueDate) options.dueDate = dueDate;
    if (snoozeUntil) options.snoozeUntil = snoozeUntil;
    if (isPrivate !== undefined) options.private = isPrivate;
    if (taskId) options.taskId = taskId;
    if (integration) options.integration = integration;

    // Check for past date warning (FR-010)
    let warning: string | null = null;
    if (snoozeUntil) {
      const userTimezone = await getUserTimezone(context);
      warning = checkPastDateWarning(snoozeUntil, userTimezone);
    }

    const result = await context.client.createTask(text, options);

    // Invalidate caches (bypass cache on write)
    const createdTaskId = result.updatedFields?._id;
    if (createdTaskId) {
      invalidateTaskCaches(createdTaskId, snoozeUntil || null);
    }

    return formatJsonResponse(formatTaskResponse({
      success: result.success,
      taskId: createdTaskId,
      title: text,
      created: true,
      updatedFields: result.updatedFields,
    }, warning));
  },
});

export const deleteTaskTool = withTransportClient({
  name: "delete-task",
  description: "Delete a task permanently",
  parameters: deleteTaskSchema,
  execute: async (
    { taskId, limitResponsePayload, wasTaskMerged }: DeleteTaskInput,
    context: ToolContext,
  ) => {
    // T026: Get task metadata before deletion for confirmation (FR-021)
    const task = await getCachedTaskById(taskId, context);

    const result = await context.client.deleteTask(
      taskId,
      limitResponsePayload,
      wasTaskMerged,
    );

    // Invalidate all related caches
    if (task) {
      invalidateTaskCaches(taskId, getTaskScheduledDate(task));
    }

    // Return task metadata for client confirmation dialog
    return formatJsonResponse({
      success: result.success,
      taskId,
      deleted: true,
      taskMetadata: task ? {
        text: task.text,
        scheduledDate: getTaskScheduledDate(task),
        notesPreview: task.notes?.substring(0, 100),
      } : null,
      updatedFields: result.updatedFields,
    });
  },
});

// Task Update Tools
export const updateTaskCompleteTool = withTransportClient({
  name: "update-task-complete",
  description: "Mark a task as complete with optional completion timestamp",
  parameters: updateTaskCompleteSchema,
  execute: async (
    { taskId, completeOn, limitResponsePayload }: UpdateTaskCompleteInput,
    context: ToolContext,
  ) => {
    // T023: Set completedAt timestamp + invalidate caches
    // Get task to know which day cache to invalidate
    const task = await getCachedTaskById(taskId, context);

    const result = await context.client.updateTaskComplete(
      taskId,
      completeOn,
      limitResponsePayload,
    );

    // Invalidate task and day caches (bypass cache on write)
    if (task) {
      invalidateTaskCaches(taskId, getTaskScheduledDate(task));
    }

    return formatJsonResponse({
      success: result.success,
      taskId,
      completed: true,
      completedAt: completeOn || new Date().toISOString(),
      updatedFields: result.updatedFields,
    });
  },
});

export const updateTaskSnoozeDateTool = withTransportClient({
  name: "update-task-snooze-date",
  description:
    "Update task snooze date to reschedule tasks or move them to backlog",
  parameters: updateTaskSnoozeDateSchema,
  execute: async (
    { taskId, newDay, timezone, limitResponsePayload }:
      UpdateTaskSnoozeDateInput,
    context: ToolContext,
  ) => {
    // T024: Handle null (move to backlog FR-014) + past date warning + invalidate old and new day caches
    // Get task to know old date
    const task = await getCachedTaskById(taskId, context);
    const oldDay = task ? getTaskScheduledDate(task) : null;

    const options: { timezone?: string; limitResponsePayload?: boolean } = {};
    const userTimezone = timezone || await getUserTimezone(context);
    options.timezone = userTimezone;
    if (limitResponsePayload !== undefined) {
      options.limitResponsePayload = limitResponsePayload;
    }

    // Check for past date warning if rescheduling (not moving to backlog)
    let warning: string | null = null;
    if (newDay) {
      warning = checkPastDateWarning(newDay, userTimezone);
    }

    const result = await context.client.updateTaskSnoozeDate(
      taskId,
      newDay,
      options,
    );

    // Invalidate old and new day caches
    invalidateDayCaches(oldDay, newDay);

    return formatJsonResponse(formatTaskResponse({
      success: result.success,
      taskId,
      newDay,
      movedToBacklog: newDay === null,
      updatedFields: result.updatedFields,
    }, warning));
  },
});

export const updateTaskBacklogTool = withTransportClient({
  name: "update-task-backlog",
  description: "Move a task to the backlog",
  parameters: updateTaskBacklogSchema,
  execute: async (
    { taskId, timezone, limitResponsePayload }: UpdateTaskBacklogInput,
    context: ToolContext,
  ) => {
    const options: { timezone?: string; limitResponsePayload?: boolean } = {};
    if (timezone) options.timezone = timezone;
    if (limitResponsePayload !== undefined) {
      options.limitResponsePayload = limitResponsePayload;
    }

    const result = await context.client.updateTaskSnoozeDate(
      taskId,
      null,
      options,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      movedToBacklog: true,
      updatedFields: result.updatedFields,
    });
  },
});

export const updateTaskPlannedTimeTool = withTransportClient({
  name: "update-task-planned-time",
  description: "Update the planned time (time estimate) for a task",
  parameters: updateTaskPlannedTimeSchema,
  execute: async (
    { taskId, timeEstimateMinutes, limitResponsePayload }:
      UpdateTaskPlannedTimeInput,
    context: ToolContext,
  ) => {
    const result = await context.client.updateTaskPlannedTime(
      taskId,
      timeEstimateMinutes,
      limitResponsePayload,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      timeEstimateMinutes,
      updatedFields: result.updatedFields,
    });
  },
});

export const updateTaskNotesTool = withTransportClient({
  name: "update-task-notes",
  description: "Update the notes content for a task",
  parameters: updateTaskNotesSchema,
  execute: async (
    { taskId, html, markdown, limitResponsePayload }: UpdateTaskNotesInput,
    context: ToolContext,
  ) => {
    // XOR validation: exactly one of html or markdown must be provided
    const hasHtml = html !== undefined;
    const hasMarkdown = markdown !== undefined;
    if (hasHtml === hasMarkdown) {
      throw new Error("Exactly one of 'html' or 'markdown' must be provided");
    }

    const content = html
      ? { type: "html" as const, value: html }
      : { type: "markdown" as const, value: markdown! };

    const options: { limitResponsePayload?: boolean } = {};
    if (limitResponsePayload !== undefined) {
      options.limitResponsePayload = limitResponsePayload;
    }

    const apiContent = content.type === "html"
      ? { html: content.value }
      : { markdown: content.value };
    const result = await context.client.updateTaskNotes(
      taskId,
      apiContent,
      options,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      notesUpdated: true,
      updatedFields: result.updatedFields,
    });
  },
});

export const updateTaskDueDateTool = withTransportClient({
  name: "update-task-due-date",
  description: "Update the due date for a task",
  parameters: updateTaskDueDateSchema,
  execute: async (
    { taskId, dueDate, limitResponsePayload }: UpdateTaskDueDateInput,
    context: ToolContext,
  ) => {
    const result = await context.client.updateTaskDueDate(
      taskId,
      dueDate,
      limitResponsePayload,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      dueDate,
      dueDateUpdated: true,
      updatedFields: result.updatedFields,
    });
  },
});

export const updateTaskTextTool = withTransportClient({
  name: "update-task-text",
  description: "Update the text/title of a task",
  parameters: updateTaskTextSchema,
  execute: async (
    { taskId, text, recommendedStreamId, limitResponsePayload }:
      UpdateTaskTextInput,
    context: ToolContext,
  ) => {
    // T025: Validate text length (FR-015) + invalidate task cache
    const validation = validateTaskText(text);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const options: {
      recommendedStreamId?: string | null;
      limitResponsePayload?: boolean;
    } = {};
    if (recommendedStreamId !== undefined) {
      options.recommendedStreamId = recommendedStreamId;
    }
    if (limitResponsePayload !== undefined) {
      options.limitResponsePayload = limitResponsePayload;
    }

    const result = await context.client.updateTaskText(taskId, text, options);

    // Invalidate task cache (bypass cache on write)
    invalidateTaskCaches(taskId);

    return formatJsonResponse({
      success: result.success,
      taskId,
      text,
      textUpdated: true,
      updatedFields: result.updatedFields,
    });
  },
});

export const updateTaskStreamTool = withTransportClient({
  name: "update-task-stream",
  description: "Update the stream/channel assignment for a task",
  parameters: updateTaskStreamSchema,
  execute: async (
    { taskId, streamId, limitResponsePayload }: UpdateTaskStreamInput,
    context: ToolContext,
  ) => {
    const result = await context.client.updateTaskStream(
      taskId,
      streamId,
      limitResponsePayload !== undefined ? limitResponsePayload : true,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      streamId,
      streamUpdated: true,
      updatedFields: result.updatedFields,
    });
  },
});

// Subtask Management Tools
export const createSubtasksTool = withTransportClient({
  name: "create-subtasks",
  description: "Create multiple subtasks for a task (low-level API for bulk operations)",
  parameters: createSubtasksSchema,
  execute: async (
    { taskId, subtaskIds, limitResponsePayload }: CreateSubtasksInput,
    context: ToolContext,
  ) => {
    const result = await context.client.createSubtasks(
      taskId,
      subtaskIds,
      limitResponsePayload,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      subtaskIds,
      subtasksCreated: true,
      count: subtaskIds.length,
      updatedFields: result.updatedFields,
    });
  },
});

export const updateSubtaskTitleTool = withTransportClient({
  name: "update-subtask-title",
  description: "Update the title of a subtask",
  parameters: updateSubtaskTitleSchema,
  execute: async (
    { taskId, subtaskId, title }: UpdateSubtaskTitleInput,
    context: ToolContext,
  ) => {
    const result = await context.client.updateSubtaskTitle(
      taskId,
      subtaskId,
      title,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      subtaskId,
      title,
      subtaskTitleUpdated: true,
      updatedFields: result.updatedFields,
    });
  },
});

export const completeSubtaskTool = withTransportClient({
  name: "complete-subtask",
  description: "Mark a subtask as complete with optional completion timestamp",
  parameters: completeSubtaskSchema,
  execute: async (
    { taskId, subtaskId, completedDate, limitResponsePayload }: CompleteSubtaskInput,
    context: ToolContext,
  ) => {
    const result = await context.client.completeSubtask(
      taskId,
      subtaskId,
      completedDate,
      limitResponsePayload,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      subtaskId,
      subtaskCompleted: true,
      completedDate: completedDate || new Date().toISOString(),
      updatedFields: result.updatedFields,
    });
  },
});

export const uncompleteSubtaskTool = withTransportClient({
  name: "uncomplete-subtask",
  description: "Mark a subtask as incomplete (uncomplete it)",
  parameters: uncompleteSubtaskSchema,
  execute: async (
    { taskId, subtaskId, limitResponsePayload }: UncompleteSubtaskInput,
    context: ToolContext,
  ) => {
    const result = await context.client.uncompleteSubtask(
      taskId,
      subtaskId,
      limitResponsePayload,
    );

    return formatJsonResponse({
      success: result.success,
      taskId,
      subtaskId,
      subtaskUncompleted: true,
      updatedFields: result.updatedFields,
    });
  },
});

export const addSubtaskTool = withTransportClient({
  name: "add-subtask",
  description: "Convenience method to create a subtask with a title in one call (recommended for single subtask creation)",
  parameters: addSubtaskSchema,
  execute: async (
    { taskId, title }: AddSubtaskInput,
    context: ToolContext,
  ) => {
    const result = await context.client.addSubtask(taskId, title);

    return formatJsonResponse({
      success: result.result.success,
      taskId,
      subtaskId: result.subtaskId,
      title,
      subtaskAdded: true,
      updatedFields: result.result.updatedFields,
    });
  },
});

// Export all task tools
export const taskTools = [
  // Query tools
  getTasksBacklogTool,
  getTasksByDayTool,
  getArchivedTasksTool,
  getTaskByIdTool,

  // Lifecycle tools
  createTaskTool,
  deleteTaskTool,

  // Update tools
  updateTaskCompleteTool,
  updateTaskSnoozeDateTool,
  updateTaskBacklogTool,
  updateTaskPlannedTimeTool,
  updateTaskNotesTool,
  updateTaskDueDateTool,
  updateTaskTextTool,
  updateTaskStreamTool,

  // Subtask management tools
  createSubtasksTool,
  updateSubtaskTitleTool,
  completeSubtaskTool,
  uncompleteSubtaskTool,
  addSubtaskTool,
];
