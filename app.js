// Entry point for the app

// Express is the underlying that atlassian-connect-express uses:
// https://expressjs.com
import express from 'express';

// https://expressjs.com/en/guide/using-middleware.html
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import morgan from 'morgan';

// atlassian-connect-express also provides a middleware
import ace from 'atlassian-connect-express';

// Use Handlebars as view engine:
// https://npmjs.org/package/express-hbs
// http://handlebarsjs.com
import hbs from 'express-hbs';

// We also need a few stock Node modules
import http from 'http';
import path from 'path';
import os from 'os';
import helmet from 'helmet';
import nocache from 'nocache';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Routes live here; this is the C in MVC
import routes from './routes/index.js';
import PgClient from 'pg/lib/client.js';

PgClient.prototype._handleErrorWhileConnecting = function(err) {
  console.log("Sequelize connection error %s, exiting...", err.code);
  process.exit(1);
};


// Bootstrap Express and atlassian-connect-express
const app = express();
const addon = ace(app);

// See config.json
const port = addon.config.port();
app.set('port', port);

// Log requests, using an appropriate formatter by env
const devEnv = app.get('env') === 'development';
app.use(morgan(devEnv ? 'dev' : 'combined'));

// We don't want to log JWT tokens, for security reasons
morgan.token('url', redactJwtTokens);

// Configure Handlebars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const viewsDir = path.join(__dirname, 'views');
const handlebarsEngine = hbs.express4({partialsDir: viewsDir});
app.engine('hbs', handlebarsEngine);
app.set('view engine', 'hbs');
app.set('views', viewsDir);

// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
// HSTS must be enabled with a minimum age of at least one year
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: false
}));
app.use(helmet.referrerPolicy({
  policy: ['origin']
}));

// Include request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// Gzip responses when appropriate
app.use(compression());

// Include atlassian-connect-express middleware
app.use(addon.middleware());

// Mount the static files directory
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
app.use(nocache());

// Show nicer errors in dev mode
if (devEnv) app.use(errorHandler());

// Wire up routes
routes(app, addon);

// Boot the HTTP server
http.createServer(app).listen(port, () => {
  console.log('App server running at http://' + os.hostname() + ':' + port);

  // Enables auto registration/de-registration of app into a host in dev mode
  if (devEnv) addon.register();
});

function redactJwtTokens(req) {
  const url = req.originalUrl || req.url || '';
  const params = new URLSearchParams(url);
  let redacted = url;
  params.forEach((value, key) => {
    if (key.toLowerCase() === 'jwt') {
      redacted = redacted.replace(value, 'redacted');
    }
  });
  return redacted;
}