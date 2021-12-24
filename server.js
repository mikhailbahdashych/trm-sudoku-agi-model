const app = require("express")();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

dotenv.config();

const server = require("http").createServer(app);

app.use(bodyParser.json({limit: '2MB'}))
app.use(bodyParser.urlencoded({extended: true}))

app.use("/", require('./src/routes'));
app.use(cors({
  origin: '*'
}))

const port = process.env.PORT || 3001;
server.listen(port, () => console.log("API listening on port " + port + "!"));
