import * as DotEnvFlow from 'dotenv-flow';

DotEnvFlow.config();

export const config = {
  username: process.env.POSTGRESS_USERNAME,
  password: process.env.POSTGRESS_PASSWORD,
  database: process.env.POSTGRESS_DATABASE,
  host: process.env.POSTGRESS_HOST,
  dialect: 'postgres',
  awsRegion: process.env.AWS_REGION,
  awsProfile: process.env.AWS_PROFILE,
  awsMediaBucket: process.env.AWS_MEDIA_BUCKET,
  jwtSecret: process.env.JWT_SECRET,
  imageFilterApi: process.env.IMAGE_FILTER_API
};
