const app = require("express")();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./src/middlewares/errorHandler")
require("dotenv").config();;

const swaggerUi = require("swagger-ui-express");
const swaggerJsDocs = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PNB API',
      version: '0.0.1',
      description: 'PNB - Pentester\'s notes blog REST API documentation.'
    },
  },
  apis: ["./src/swagger/swagger.yaml"]
};
const swaggerDocs = swaggerJsDocs(swaggerOptions);

const server = require("http").createServer(app);

app.use(cookieParser());
app.use(bodyParser.json({limit: '10MB'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/", require('./src/routes'));
app.use(errorMiddleware)

const port = process.env.PORT || 3001;
server.listen(port, () => console.log("API listening on port " + port + "!"));
