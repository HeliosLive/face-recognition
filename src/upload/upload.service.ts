import { Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import environment from 'tools/environment/environment';
const fs = require('fs');
import * as path from 'path';
import * as cv from 'opencv4nodejs';
import { Mat, imread } from 'opencv4nodejs';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.v2.config({
      cloud_name: environment.cloudinary.cloud_name,
      api_key: environment.cloudinary.api_key,
      api_secret: environment.cloudinary.api_secret,
    });
  }

  async upload(file: any): Promise<any> {
    await this.doSomething(file);
    return await true;
    // let result = [];
    // try {
    //   for (const file of files) {
    //     await cloudinary.v2.uploader.upload(file.path, function(
    //       error,
    //       response,
    //     ) {
    //       result.push(response);
    //     });
    //   }
    //   return await result;
    // } catch (err) {
    //   return await err;
    // }
  }

  async doSomething(files: any[]): Promise<any> {
    files = [
      'https://res.cloudinary.com/dlth9ls92/image/upload/v1584295155/IMG_0163.jpg',
    ];
    const basePath = 'src/upload/image-data/face-recognition';
    const imgsPath = path.resolve(basePath, 'imgs');
    const nameMappings = ['ahmet', 'daryl', 'rick', 'negan'];

    console.log('files : ', files);

    let imgFiles = await fs.readdirSync(imgsPath);
    let imagesData = [];
    let fileImagesData = [];
    // imgFiles = await imgFiles.slice(0, imgFiles.length);
    const classifier = await new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
    const getFaceImage = (grayImg: cv.Mat) => {
      const faceRects = classifier.detectMultiScale(grayImg).objects;
      // console.log('grayImg :', grayImg);
      // console.log('faceRects :', faceRects);
      if (!faceRects.length) {
        throw new Error('failed to detect faces');
      }
      return grayImg.getRegion(faceRects[0]);
    };

    await imgFiles.map(el => {
      if (el !== '.DS_Store') {
        imagesData.push(el);
      }
    });

    // await console.log('imagesData : ', imagesData);
    const images = await imagesData
      // get absolute file path
      .map(file => path.resolve(imgsPath, file))
      // read image
      .map(filePath => cv.imread(filePath))
      // face recognizer works with gray scale images
      .map(img => img.bgrToGray())
      // detect and extract face
      .map(getFaceImage)
      // face images must be equally sized
      .map(faceImg => faceImg.resize(80, 80));

    const isImageFour = (_: any, i: number) => imagesData[i].includes('4');
    const isNotImageFour = (_: any, i: number) => !isImageFour(_, i);
    // use images 1 - 3 for training
    const trainImages = images.filter(isNotImageFour);
    // use images 4 for testing
    const testImages = images.filter(isImageFour);
    // make labels
    const labels = imagesData
      .filter(isNotImageFour)
      .map(file => nameMappings.findIndex(name => file.includes(name)));

    const runPrediction = (recognizer: cv.FaceRecognizer) => {
      testImages.forEach(img => {
        const result = recognizer.predict(img);
        console.log('result : ', result);
        console.log(
          'predicted: %s, confidence: %s',
          nameMappings[result.label],
          result.confidence,
        );
        // cv.imshowWait('face', img);
        cv.destroyAllWindows();
      });
    };

    const eigen = new cv.EigenFaceRecognizer();
    const fisher = new cv.FisherFaceRecognizer();
    const lbph = new cv.LBPHFaceRecognizer();
    await eigen.train(trainImages, labels);
    await fisher.train(trainImages, labels);
    await lbph.train(trainImages, labels);

    console.log('eigen:');
    runPrediction(eigen);

    // console.log('fisher:');
    // runPrediction(fisher);

    // console.log('lbph:');
    // runPrediction(lbph);
  }
}
