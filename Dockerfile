FROM python:3.11.9

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-dev \
    zlib1g-dev \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/* \

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TFHUB_CACHE_DIR=/app/.tfhub_modules

# Create a working directory
WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY requirements.txt /app/

# Install Python dependencies and cache the TensorFlow Hub model
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app/

# Expose port 5002 for the Flask app
EXPOSE 5002

# Set the environment variable for Flask
ENV FLASK_APP=app.py

# Run the Flask app using Gunicorn for better performance
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "app:app"]