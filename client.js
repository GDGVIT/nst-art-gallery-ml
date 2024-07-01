const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

class StyleTransfer {
  constructor() {
    this.styleNet = null;
    this.transformNet = null;
  }

  async loadModels() {
    //Change models accordingly
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
  //images to be stylized
  const contentPath = './skull.jpg';
  const stylePath = './flowers.jpg';
  const outputPath = './stylized_image.jpg';
  const styleRatio = 0.8;

  await styleTransfer.stylizeImage(contentPath, stylePath, outputPath, styleRatio);
  console.log('Stylized image saved to:', outputPath);
}

main().catch(console.error);