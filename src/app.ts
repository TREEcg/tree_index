import bodyParser = require("body-parser");
import express = require("express");
import negotiate = require("express-negotiate");
import expressPino = require("express-pino-logger");
import { LOGGER } from "./config";
import adminRoutes from "./routes/admin";
import dataRoutes from "./routes/data";
import resumeIngesters from "./util/resumeIngesters";

console.log(negotiate.version);

const expressLogger = expressPino({ LOGGER });
const app = express();

app.use(expressLogger);

// body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

if (process.env.ROUTE === "data") {
    app.use("/", dataRoutes);
    app.set("port", process.env.PORT || 3001);
} else {
    app.use("/", adminRoutes);
    app.set("port", process.env.PORT || 3000);
    resumeIngesters();
}

// errors
app.use((err: any, req, res, next) => {
    res.status(err.status || 500);
    LOGGER.error(err);
    res.json({ status: "failure", msg: err.message });
});

const server = app.listen(app.get("port"), () => {
    LOGGER.debug("Express server listening on port " + server.address().port);
});
