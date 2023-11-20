import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './routes';
import { logger } from './clients/logger';

const server = express();

server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use('/', router);

server.listen(8080, () => {
  logger.info('Server started.');
});
