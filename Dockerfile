FROM python:3.11-slim
RUN pip install uv
WORKDIR /app
COPY . .
RUN uv sync
# Set a dummy secret key so collectstatic doesn't crash if it looks for settings
ENV DJANGO_SECRET_KEY=dummy-key-for-build
RUN uv run python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["uv", "run", "gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
