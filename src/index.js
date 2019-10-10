import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import { backOff } from 'exponential-backoff'

import config from './config';
import apiRoutes from './routes/api';
import queryRoute from './routes/query';
import mongoose from 'mongoose';

const app = new Koa();

app.use(bodyparser());

app.use(apiRoutes.routes()).use(apiRoutes.allowedMethods());
app.use(queryRoute.routes()).use(queryRoute.allowedMethods());

app.listen(config.port, async () => {
  await backOff(() => {
    console.log('Connecting to mongo');

    return mongoose.connect(`mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  }, {
    startingDelay: 1000,
  });

  console.log(`Listening on port: ${config.port}`);
});
