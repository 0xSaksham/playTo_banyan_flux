FROM python:3.11-slim
RUN pip install uv
WORKDIR /app
COPY . .
# Sync dependencies and explicitly ensure gunicorn is installed
RUN uv sync
# Verify gunicorn is in the venv
RUN /app/.venv/bin/gunicorn --version

ENV DJANGO_SECRET_KEY=dummy-key-for-build
RUN uv run python manage.py collectstatic --noinput

EXPOSE 8000
# Use the explicit path to the gunicorn executable
CMD ["/app/.venv/bin/gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
