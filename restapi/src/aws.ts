import AWS = require('aws-sdk');
import { config } from './config/config';
import fs from 'fs';

//Configure AWS
if (config.awsProfile !== 'DEPLOYED') {
  var credentials = new AWS.SharedIniFileCredentials({
    profile: config.awsProfile
  });
  AWS.config.credentials = credentials;
}

export const s3 = new AWS.S3({
  signatureVersion: 'v4',
  region: config.awsRegion,
  params: { Bucket: config.awsMediaBucket }
});

/* getGetSignedUrl generates an aws signed url to retreive an item
 * @Params
 *    key: string - the filename to be put into the s3 bucket
 * @Returns:
 *    a url as a string
 */
export function getGetSignedUrl(key: string): string {
  const signedUrlExpireSeconds = 60 * 5;
  const url = s3.getSignedUrl('getObject', {
    Bucket: config.awsMediaBucket,
    Key: key,
    Expires: signedUrlExpireSeconds
  });
  return url;
}

/* getPutSignedUrl generates an aws signed url to put an item
 * @Params
 *    key: string - the filename to be retreived from s3 bucket
 * @Returns:
 *    a url as a string
 */
export function getPutSignedUrl(key: string): string {
  const signedUrlExpireSeconds = 60 * 5;
  const url = s3.getSignedUrl('putObject', {
    Bucket: config.awsMediaBucket,
    Key: key,
    Expires: signedUrlExpireSeconds
  });
  return url;
}

export function upload(key: string, stream: fs.ReadStream): Promise<AWS.S3.ManagedUpload.SendData> {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: config.awsMediaBucket,
    Key: key,
    Body: stream
  };
  return new Promise((resolve, reject) => {
    console.log(`AWS upload() key[${key}] start`);
    s3.upload(params, (error, data) => {
      if (error) {
        console.log(`AWS upload() key[${key}] error[${error}]`);
        reject(error);
      }
      console.log(`AWS upload() key[${key}] stop data[${JSON.stringify(data)}]`);
      resolve(data);
    });
  });
}
