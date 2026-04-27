FROM python:3.11-slim
RUN pip install uv
WORKDIR /app
COPY . .
RUN uv sync
# Important: Collect static files if you use admin
RUN uv run python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["uv", "run", "gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
