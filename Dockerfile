FROM python:3.11
# Set environment variables to prevent Python from writing .pyc files and to ensure stdout/stderr are unbuffered
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set the TensorFlow Hub cache directory to store the preloaded model
ENV TFHUB_CACHE_DIR=/app/tfhub_modules

# Set the working directory in the container
WORKDIR /app

# Install OS-level dependencies required by Pillow and other packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy the requirements.txt file into the container
COPY requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application code into the container
COPY . /app

# Create the TensorFlow Hub modules directory and preload the model
RUN mkdir -p /app/tfhub_modules 

# Expose the port that the Flask app runs on
EXPOSE 5002

# Start the application using Gunicorn with 4 worker processes
CMD ["gunicorn", "-b", "0.0.0.0:5002", "app:app"]