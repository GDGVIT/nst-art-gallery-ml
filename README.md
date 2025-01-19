<p align="center">
<a href="https://dscvit.com">
	<img width="400" src="https://user-images.githubusercontent.com/56252312/159312411-58410727-3933-4224-b43e-4e9b627838a3.png#gh-light-mode-only" alt="GDSC VIT"/>
	<hr>
<!-- 	<p align="center">
		<img  src="https://github.com/dk-a-dev/collabify/blob/dev/src/lib/assets/logo.svg">
	</p> -->
</a>
	<h2 align="center"> Nst Art Gallery- Style Transfer Model </h2>
	<h4 align="center">Our project utilizes Neural Style Transfer (NST), powered by a pre-trained VGG19 network. NST combines the content of one image with the artistic style of another, using convolutional neural networks, Gram matrices, and loss functions to create unique, visually captivating images that blend structure and texture. This guide provides detailed instructions on setting up and running the Style Transfer Flask API with and without Docker. It also includes information on the API endpoints, expected i/o's and example usage <h4>
</p>

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Running the Project Without Docker](#running-the-project-without-docker)
- [Running the Project With Docker](#running-the-project-with-docker)
- [Using the API](#using-the-api)
- [Testing the API](#testing-the-api)
- [Troubleshooting](#troubleshooting)
- [Additional Notes](#additional-notes)

## Introduction

The Style Transfer Flask API allows you to apply artistic styles to images using a pre-trained TensorFlow model. The API accepts a content image and a style image and returns a stylized image where the style of the style image is applied to the content image.

This guide will walk you through setting up the API, both with and without Docker, and show you how to interact with it.

## Prerequisites

- Python 3.8 or higher (for running without Docker)
- Docker (for running with Docker)
- Git (for cloning the repository)
- Internet Connection (for downloading dependencies and the TensorFlow Hub model)

## Project Structure

Here's how the project directory is organized:

```
/nst-art-gallery-ml
│
├── app.py             # Flask application code
├── Dockerfile         # Dockerfile for containerizing the app
├── requirements.txt   # Python dependencies
├── pictures/          # Directory containing images
│   ├── skull.jpg     # Content image
│   └── flowers.jpg   # Style image
```

## Running the Project Without Docker

### 1. Clone the Repository

Open your terminal and clone the repository:

```bash
git clone https://github.com/GDGVIT/nst-art-gallery-ml.git
```

Replace `GDGVIT` and `nst-art-gallery-ml` with the appropriate GitHub repository information.

Navigate to the project directory:

```bash
cd nst-art-gallery-ml
```

### 2. Set Up a Virtual Environment

It's recommended to use a virtual environment to manage dependencies:

```bash
python3 -m venv venv
```

Activate the virtual environment:

- On Unix or MacOS:
  ```bash
  source venv/bin/activate
  ```

- On Windows:
  ```bash
  venv\Scripts\activate
  ```

### 3. Install Dependencies

Upgrade pip and install the required packages:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Note**: Ensure that you have a compatible version of TensorFlow installed. The requirements.txt should specify the versions.

### 4. Run the Flask App

Run the Flask application:

```bash
python app.py
```

By default, the app will run on `http://0.0.0.0:5002`.

## Running the Project With Docker

### 1. Build the Docker Image

Build the Docker image using the provided Dockerfile:

```bash
docker build -t style-transfer-app .
```

**Note**: Ensure Docker is running and you have internet connectivity to download the base image and dependencies.

### 2. Run the Docker Container

Run the container from the image:

```bash
docker run -p 5002:5002 --name style-transfer-container style-transfer-app
```

- `-p 5002:5002`: Maps port 5002 in the container to port 5002 on your host machine
- `--name style-transfer-container`: Names the container for easier management

## Using the API

### Endpoint

- URL: `http://localhost:5002/stylize`
- Method: `POST`

### Request Parameters

The API expects a `multipart/form-data` request with the following files:

- `content_image`: The content image file (required)
- `style_image`: The style image file (required)

### Response

- Success (200 OK): Returns the stylized image in JPEG format
- Error (400 Bad Request): Missing required files
- Error (500 Internal Server Error): An error occurred during processing

### Example Usage

**Request:**
```http
POST /stylize HTTP/1.1
Host: localhost:5002
Content-Type: multipart/form-data; boundary=---------------------------boundary

-----------------------------boundary
Content-Disposition: form-data; name="content_image"; filename="skull.jpg"
Content-Type: image/jpeg

<Binary data of skull.jpg>
-----------------------------boundary
Content-Disposition: form-data; name="style_image"; filename="flowers.jpg"
Content-Type: image/jpeg

<Binary data of flowers.jpg>
-----------------------------boundary--
```

**Response:**
- Content-Type: `image/jpeg`
- Body: Binary data of the stylized image

## Testing the API

### Using curl

#### 1. Basic Test with Local Images

```bash
curl -X POST http://localhost:5002/stylize \
  -F content_image=@pictures/skull.jpg \
  -F style_image=@pictures/flowers.jpg \
  --output stylized_image.jpg
```

#### 2. Test with Verbose Output

```bash
curl -v -X POST http://localhost:5002/stylize \
  -F content_image=@pictures/skull.jpg \
  -F style_image=@pictures/flowers.jpg \
  --output stylized_image.jpg
```

#### 3. Test Missing Content Image

```bash
curl -X POST http://localhost:5002/stylize \
  -F style_image=@pictures/flowers.jpg
```

Expected Response:
```json
{
  "error": "Please provide both content_image and style_image files."
}
```

#### 4. Test Missing Style Image

```bash
curl -X POST http://localhost:5002/stylize \
  -F content_image=@pictures/skull.jpg
```

Expected Response:
```json
{
  "error": "Please provide both content_image and style_image files."
}
```

#### 5. Test with Large Images

```bash
curl -X POST http://localhost:5002/stylize \
  -F content_image=@pictures/large_skull.jpg \
  -F style_image=@pictures/large_flowers.jpg \
  --output stylized_large_image.jpg
```

#### 6. Test Concurrent Requests

```bash
for i in {1..5}
do
   curl -X POST http://localhost:5002/stylize \
     -F content_image=@pictures/skull.jpg \
     -F style_image=@pictures/flowers.jpg \
     --output stylized_image_$i.jpg &
done
wait
```

### Using Python Requests

```python
import requests

url = 'http://localhost:5002/stylize'
files = {
    'content_image': open('pictures/skull.jpg', 'rb'),
    'style_image': open('pictures/flowers.jpg', 'rb')
}

response = requests.post(url, files=files)

if response.status_code == 200:
    with open('stylized_image.jpg', 'wb') as f:
        f.write(response.content)
    print('Stylized image saved as stylized_image.jpg')
else:
    print('Error:', response.json())
```

## Troubleshooting

### Common Issues and Solutions

1. **Error: ModuleNotFoundError: No module named 'tensorflow'**
   - Ensure TensorFlow is installed and the version is compatible with your code
   - Install TensorFlow using `pip install tensorflow`

2. **Docker Build Fails Due to Platform Mismatch**
   - If building on an ARM64 platform (e.g., Apple M1), use a base image compatible with ARM64 or adjust your Dockerfile

3. **Empty or Corrupted Output Image**
   - Ensure that the `tensor_to_image` function correctly converts tensors to images
   - Check the server logs for any errors during processing

4. **Slow Performance**
   - Style transfer is computationally intensive. For better performance, consider using a machine with a dedicated GPU
   - When running in Docker, ensure sufficient resources are allocated

## Additional Notes

### Model Caching
- The TensorFlow Hub model is downloaded and cached during the first run
- Ensure you have a stable internet connection

### Content Image Size Preservation
- The output image will have the same dimensions as the content image

### Style Image Resizing
- The style image is resized to (256, 256) internally to meet the model's requirements

### Thread Safety
- The API uses a threading lock to ensure thread-safe operations when handling concurrent requests

### Security Considerations
- For production environments, implement input validation and security measures
- Consider adding authentication and using HTTPS

### Scaling for Production
- Use a production WSGI server like Gunicorn (already included in the Dockerfile)
- Adjust the number of worker processes based on your server's capabilities

## Conclusion

This guide provides a comprehensive overview of setting up and running the Style Transfer Flask API, both with and without Docker. By following the instructions, you should be able to run the API locally, interact with it, and perform style transfer on images.

Feel free to explore and modify the code to suit your needs. If you encounter any issues or have questions, refer to the troubleshooting section or consult additional resources.


## Contributors

<table>
	<tr>
		<td>
		Sidhant Srivastav
		<p align="center">
			<img src = "https://avatars.githubusercontent.com/u/66166455?v=4" width="150" height="150">
		</p>
			<p align="center">
				<a href = "https://github.com/sidhant-sriv">
					<img src = "http://www.iconninja.com/files/241/825/211/round-collaboration-social-github-code-circle-network-icon.svg" width="36" height = "36" alt="GitHub"/>
				</a>
				<a href = "https://www.linkedin.com/in/sidhant-srivastava-41803620b/">
					<img src = "http://www.iconninja.com/files/863/607/751/network-linkedin-social-connection-circular-circle-media-icon.svg" width="36" height="36" alt="LinkedIn"/>
				</a>
			</p>
		</td>
</table>

<p align="center">
	Made with 💗 by <a href="https://dscvit.com">GDSC-VIT</a>
</p>

