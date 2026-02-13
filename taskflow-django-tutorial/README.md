# TaskFlow - Django 6 Tutorial Project

A complete task management application built with Django 6.0, demonstrating modern Python web development practices.

**Tutorial:** [Django 6 Getting Started: Build Your First Web App in 2026](https://crashbytes.com/articles/django-6-getting-started-tutorial-2026-beginners-guide)

## Features

- ✅ User authentication (login/logout)
- ✅ Full CRUD operations for tasks
- ✅ Priority levels (Low, Medium, High)
- ✅ Status tracking (To Do, In Progress, Done)
- ✅ Quick status toggle
- ✅ Due date management
- ✅ Responsive Bootstrap 5 UI
- ✅ Django Admin integration

## Requirements

- Python 3.12+
- Django 6.0+

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/crashbytes/taskflow-django-tutorial.git
cd taskflow-django-tutorial
```

### 2. Create and activate virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Create a superuser

```bash
python manage.py createsuperuser
```

### 6. Run the development server

```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` and log in with your superuser credentials.

## Project Structure

```
taskflow-django-tutorial/
├── config/                 # Django project settings
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── tasks/                  # Tasks application
│   ├── migrations/
│   ├── templates/
│   │   └── tasks/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── forms.py
│   ├── models.py
│   ├── urls.py
│   └── views.py
├── templates/              # Global templates
│   ├── base.html
│   └── registration/
│       └── login.html
├── manage.py
├── requirements.txt
└── README.md
```

## Django 6.0 Features Demonstrated

This tutorial covers Django fundamentals that work across versions. For Django 6.0 specific features like the built-in tasks framework, CSP middleware, and template partials, see the [full tutorial](https://crashbytes.com/articles/django-6-getting-started-tutorial-2026-beginners-guide).

## License

MIT License - feel free to use this code for learning and your own projects.

## Learn More

- [Full Tutorial on CrashBytes](https://crashbytes.com/articles/django-6-getting-started-tutorial-2026-beginners-guide)
- [Django Documentation](https://docs.djangoproject.com/en/6.0/)
- [Django 6.0 Release Notes](https://docs.djangoproject.com/en/6.0/releases/6.0/)

---

Built with ❤️ by [CrashBytes](https://crashbytes.com)
