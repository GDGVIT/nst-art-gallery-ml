const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

class StyleTransfer {
  constructor() {
    this.styleNet = null;
    this.transformNet = null;
  }

  async loadModels() {
    this.styleNet = await tf.loadGraphModel('file://./saved_model_style_inception_js/model.json');
    this.transformNet = await tf.loadGraphModel('file://./saved_model_transformer_js/model.json');
  }

  async stylizeImage(contentPath, stylePath, outputPath, styleRatio = 1.0) {
    await this.loadModels();

    const content = await this.loadImage(contentPath);
    const style = await this.loadImage(stylePath);

    const stylized = await tf.tidy(() => {
      const contentTensor = content.toFloat().div(tf.scalar(255)).expandDims();
      const styleTensor = style.toFloat().div(tf.scalar(255)).expandDims();

      let bottleneck = this.styleNet.predict(styleTensor);

      if (styleRatio !== 1.0) {
        const identityBottleneck = this.styleNet.predict(contentTensor);
        const styleBottleneck = bottleneck;
        bottleneck = tf.tidy(() => {
          const styleBottleneckScaled = styleBottleneck.mul(tf.scalar(styleRatio));
          const identityBottleneckScaled = identityBottleneck.mul(tf.scalar(1.0 - styleRatio));
          return styleBottleneckScaled.add(identityBottleneckScaled);
        });
        identityBottleneck.dispose();
      }

      return this.transformNet.predict([contentTensor, bottleneck]).squeeze();
    });

    await this.saveImage(stylized, outputPath);
    stylized.dispose();
  }

  async combineStyles(contentPath, style1Path, style2Path, outputPath, styleRatio = 0.5) {
    await this.loadModels();

    const content = await this.loadImage(contentPath);
    const style1 = await this.loadImage(style1Path);
    const style2 = await this.loadImage(style2Path);

    const stylized = await tf.tidy(() => {
      const contentTensor = content.toFloat().div(tf.scalar(255)).expandDims();
      const style1Tensor = style1.toFloat().div(tf.scalar(255)).expandDims();
      const style2Tensor = style2.toFloat().div(tf.scalar(255)).expandDims();

      const bottleneck1 = this.styleNet.predict(style1Tensor);
      const bottleneck2 = this.styleNet.predict(style2Tensor);

      const combinedBottleneck = tf.tidy(() => {
        const scaledBottleneck1 = bottleneck1.mul(tf.scalar(1 - styleRatio));
        const scaledBottleneck2 = bottleneck2.mul(tf.scalar(styleRatio));
        return scaledBottleneck1.add(scaledBottleneck2);
      });

      return this.transformNet.predict([contentTensor, combinedBottleneck]).squeeze();
    });

    await this.saveImage(stylized, outputPath);
    stylized.dispose();
  }

  async loadImage(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    const tfImage = tf.node.decodeImage(imageBuffer);
    return tfImage;
  }

  async saveImage(tensor, outputPath) {
    const [height, width] = tensor.shape;
    const uint8Array = await tf.node.encodeJpeg(tensor.mul(255).cast('int32'));
    fs.writeFileSync(outputPath, uint8Array);
  }
}

async function main() {
  const styleTransfer = new StyleTransfer();
  
  // Single style transfer
  const contentPath = './skull.jpg';
  const stylePath = './paint.jpg';
  const outputPath = './stylized_image.jpg';
  const styleRatio = 0.95;

  await styleTransfer.stylizeImage(contentPath, stylePath, outputPath, styleRatio);
  console.log('Single style transfer: Stylized image saved to:', outputPath);

  // Combined style transfer
  const style1Path = './paint.jpg';
  const style2Path = './flowers.jpg';
  const combinedOutputPath = './combined_stylized_image.jpg';
  const combinedStyleRatio = 0.5;  // Equal mix of both styles

  await styleTransfer.combineStyles(contentPath, style1Path, style2Path, combinedOutputPath, combinedStyleRatio);
  console.log('Combined style transfer: Stylized image saved to:', combinedOutputPath);
}

main().catch(console.error);