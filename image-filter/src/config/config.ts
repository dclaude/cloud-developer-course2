import * as DotEnvFlow from 'dotenv-flow';

DotEnvFlow.config();

export const config = {
  restApi: process.env.REST_API
};
