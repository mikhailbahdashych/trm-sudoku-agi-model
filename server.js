const app = require("express")();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

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

dotenv.config();

const server = require("http").createServer(app);

app.use(bodyParser.json({limit: '2MB'}))
app.use(bodyParser.urlencoded({extended: true}))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/", require('./src/routes'));
app.use(cors({
  origin: '*'
}))

const port = process.env.PORT || 3001;
server.listen(port, () => console.log("API listening on port " + port + "!"));
