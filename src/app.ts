import bodyParser = require("body-parser");
import express = require("express");
import expressPino = require("express-pino-logger");
import { LOGGER } from "./config";
import adminRoutes from "./routes/admin";
import dataRoutes from "./routes/data";

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

app.use("/streams", adminRoutes);
app.use("/data", dataRoutes);

// errors
app.use((err: any, req, res, next) => {
    res.status(err.status || 500);
    LOGGER.error(err);
    res.json({ status: "failure", msg: err.message });
});

app.set("port", process.env.PORT || 3000);

const server = app.listen(app.get("port"), () => {
    LOGGER.debug("Express server listening on port " + server.address().port);
});
