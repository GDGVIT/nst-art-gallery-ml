// testStyleTransfer.js
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Function to test the stylize endpoint
async function testStylize() {
  const form = new FormData();
  form.append('content', fs.createReadStream('path/to/your/content_image.jpg'));
  form.append('style', fs.createReadStream('path/to/your/style_image.jpg'));
  form.append('styleRatio', '1.0');

  try {
    const response = await axios.post('http://localhost:3000/stylize', form, {
      headers: form.getHeaders(),
      responseType: 'stream',
    });

    const outputPath = 'stylized_output.jpg';
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log(`Stylized image saved to ${outputPath}`);
    });

    writer.on('error', (err) => {
      console.error('Error writing stylized image:', err);
    });
  } catch (error) {
    console.error('Error in stylize request:', error);
  }
}

// Function to test the combine-styles endpoint
async function testCombineStyles() {
  const form = new FormData();
  form.append('content', fs.createReadStream('path/to/your/content_image.jpg'));
  form.append('style1', fs.createReadStream('path/to/your/style1_image.jpg'));
  form.append('style2', fs.createReadStream('path/to/your/style2_image.jpg'));
  form.append('styleRatio', '0.5');

  try {
    const response = await axios.post('http://localhost:3000/combine-styles', form, {
      headers: form.getHeaders(),
      responseType: 'stream',
    });

    const outputPath = 'combined_stylized_output.jpg';
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log(`Combined stylized image saved to ${outputPath}`);
    });

    writer.on('error', (err) => {
      console.error('Error writing combined stylized image:', err);
    });
  } catch (error) {
    console.error('Error in combine-styles request:', error);
  }
}

// Function to test the cleanup endpoint
async function testCleanup() {
  try {
    const response = await axios.post('http://localhost:3000/cleanup');
    console.log(response.data);
  } catch (error) {
    console.error('Error in cleanup request:', error);
  }
}

// Execute the tests
testStylize();
testCombineStyles();
testCleanup();

