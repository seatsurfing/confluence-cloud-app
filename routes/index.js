import * as jwt from 'atlassian-jwt';
import moment from 'moment';

const addonKey = require("../atlassian-connect").key;

export default function routes(app, addon) {
  app.get('/', (req, res) => {
    res.redirect('/atlassian-connect.json');
  });

  app.get('/macro', addon.authenticate(), (req, res) => {
    let httpClient = addon.httpClient(req);
    httpClient.get({ uri: `/rest/atlassian-connect/1/addons/${addonKey}/properties/json` }, (err, ires, body) => {
      const config = JSON.parse(body);
      const backendUrl = ((config || {}).value || {}).backendUrl || "";
      const backendInstanceId = ((config || {}).value || {}).backendInstanceId || "";
      const backendSecret = ((config || {}).value || {}).backendSecret || "";
      if ((backendUrl === "") || (backendInstanceId === "") || (backendSecret === "")) {
        res.render('install', {});
        return;
      }
      let now = moment().utc();
      let jwtPayload = {
        "user": req.context.userAccountId,
        "key": req.context.userAccountId,
        "iat": now.unix(),
        "exp": now.add(5, 'minutes').unix()
      };
      let token = jwt.encodeSymmetric(jwtPayload, backendSecret);
      let targetUrl = backendUrl + "confluence/" + backendInstanceId + "/" + token;
      res.render('macro', {
        targetUrl: targetUrl
      });
    });
  });

  app.get('/settings', addon.authenticate(), addon.authorizeConfluence({ application: ["administer"] }), (req, res) => {
    let httpClient = addon.httpClient(req);
    httpClient.get({ uri: `/rest/atlassian-connect/1/addons/${addonKey}/properties/json` }, (err, ires, body) => {
      const config = JSON.parse(body);
      res.render('settings', {
        title: "Seatsurfing Setting",
        backendUrl: ((config || {}).value || {}).backendUrl || "",
        backendInstanceId: ((config || {}).value || {}).backendInstanceId || "",
        backendSecret: ((config || {}).value || {}).backendSecret || ""
      });
    });
  });

  app.get('/settings-save', addon.checkValidToken(), addon.authorizeConfluence({ application: ["administer"] }), (req, res) => {
    let httpClient = addon.httpClient(req);
    let backendUrl = req.query["backend-url"].trim();
    let backendInstanceId = req.query["backend-instance-id"].trim();
    let backendSecret = req.query["backend-secret"].trim();
    if (!backendUrl.endsWith("/")) {
      backendUrl += "/";
    }
    const payload = {
      backendUrl: backendUrl,
      backendInstanceId: backendInstanceId,
      backendSecret: backendSecret
    };
    httpClient.put({ uri: `/rest/atlassian-connect/1/addons/${addonKey}/properties/json`, body: JSON.stringify(payload) }, (err, ires, body) => {
      res.render('settings', {
        title: "Seatsurfing Setting (saved)",
        backendUrl: backendUrl,
        backendInstanceId: backendInstanceId,
        backendSecret: backendSecret
      });
    });
  });

  app.get('/settings-clear', addon.checkValidToken(), addon.authorizeConfluence({ application: ["administer"] }), (req, res) => {
    let httpClient = addon.httpClient(req);
    httpClient.del({ uri: `/rest/atlassian-connect/1/addons/${addonKey}/properties/json` }, (err, ires, body) => {
      res.render('settings', {
        title: "Seatsurfing Setting (cleared)",
        backendUrl: "",
        backendInstanceId: "",
        backendSecret: ""
      });
    });
  });
}
