from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from .models import Task
from .forms import TaskForm


class TaskListView(LoginRequiredMixin, ListView):
    """Display all tasks for the logged-in user."""
    model = Task
    template_name = 'tasks/task_list.html'
    context_object_name = 'tasks'

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)


class TaskDetailView(LoginRequiredMixin, DetailView):
    """Display a single task."""
    model = Task
    template_name = 'tasks/task_detail.html'
    context_object_name = 'task'

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)


class TaskCreateView(LoginRequiredMixin, CreateView):
    """Create a new task."""
    model = Task
    form_class = TaskForm
    template_name = 'tasks/task_form.html'
    success_url = reverse_lazy('tasks:task_list')

    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)


class TaskUpdateView(LoginRequiredMixin, UpdateView):
    """Update an existing task."""
    model = Task
    form_class = TaskForm
    template_name = 'tasks/task_form.html'
    success_url = reverse_lazy('tasks:task_list')

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)


class TaskDeleteView(LoginRequiredMixin, DeleteView):
    """Delete a task."""
    model = Task
    template_name = 'tasks/task_confirm_delete.html'
    success_url = reverse_lazy('tasks:task_list')

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)


@login_required
def task_toggle_status(request, pk):
    """Quick toggle between todo/in_progress/done."""
    task = get_object_or_404(Task, pk=pk, owner=request.user)

    status_cycle = {
        Task.Status.TODO: Task.Status.IN_PROGRESS,
        Task.Status.IN_PROGRESS: Task.Status.DONE,
        Task.Status.DONE: Task.Status.TODO,
    }

    task.status = status_cycle[task.status]
    task.save()

    return redirect('tasks:task_list')
