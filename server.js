const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const StyleTransfer = require('./style_transfer')

const app = express();
const upload = multer({ dest: 'uploads/' });
const styleTransfer = new StyleTransfer();

app.post('/stylize', upload.fields([
  { name: 'content', maxCount: 1 },
  { name: 'style', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files['content'] || !req.files['style']) {
      return res.status(400).send('Please upload both content and style images.');
    }

    const contentPath = req.files['content'][0].path;
    const stylePath = req.files['style'][0].path;
    const outputPath = path.join('outputs', `stylized_${Date.now()}.jpg`);
    const styleRatio = parseFloat(req.body.styleRatio) || 1.0;

    await styleTransfer.stylizeImage(contentPath, stylePath, outputPath, styleRatio);

    res.download(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      }
      // Clean up files after sending
      Promise.all([
        fs.unlink(contentPath),
        fs.unlink(stylePath),
        fs.unlink(outputPath)
      ]).catch(console.error);
    });
  } catch (error) {
    console.error('Error in style transfer:', error);
    res.status(500).send('Error processing style transfer');
  }
});

app.post('/combine-styles', upload.fields([
  { name: 'content', maxCount: 1 },
  { name: 'style1', maxCount: 1 },
  { name: 'style2', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files['content'] || !req.files['style1'] || !req.files['style2']) {
      return res.status(400).send('Please upload content and both style images.');
    }

    const contentPath = req.files['content'][0].path;
    const style1Path = req.files['style1'][0].path;
    const style2Path = req.files['style2'][0].path;
    const outputPath = path.join('outputs', `combined_stylized_${Date.now()}.jpg`);
    const styleRatio = parseFloat(req.body.styleRatio) || 0.5;

    await styleTransfer.combineStyles(contentPath, style1Path, style2Path, outputPath, styleRatio);

    res.download(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      }
      // Clean up files after sending
      Promise.all([
        fs.unlink(contentPath),
        fs.unlink(style1Path),
        fs.unlink(style2Path),
        fs.unlink(outputPath)
      ]).catch(console.error);
    });
  } catch (error) {
    console.error('Error in combined style transfer:', error);
    res.status(500).send('Error processing combined style transfer');
  }
});

app.post('/cleanup', async (req, res) => {
  try {
    await cleanupFiles();
    res.send('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).send('Error during cleanup');
  }
});

async function cleanupFiles() {
  const directories = ['uploads', 'outputs'];
  
  for (const dir of directories) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        await fs.unlink(path.join(dir, file));
      }
      console.log(`Cleaned up ${files.length} files in ${dir}`);
    } catch (error) {
      console.error(`Error cleaning up ${dir}:`, error);
    }
  }
}

// Schedule cleanup job to run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled cleanup job');
  try {
    await cleanupFiles();
    console.log('Scheduled cleanup completed successfully');
  } catch (error) {
    console.error('Scheduled cleanup error:', error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cleanup job scheduled to run every 6 hours');
});
