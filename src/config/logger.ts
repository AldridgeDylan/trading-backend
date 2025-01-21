import { createLogger, transports, format, Logger } from 'winston';

const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
  ),
  transports: [new transports.Console()],
});

export default logger;
