require("dotenv").config();
const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./config/database");
const morgan = require("morgan");

app.use(morgan("tiny"));

//Database connection
connectDB();

//Set up body parser
app.use(bodyParser.urlencoded({ extended: true }));

//Setup json parsing
app.use(express.json());

//Set cookie parser
app.use(cookieParser());

//Set up CORS - accessible by other domains
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

//--------------Routes------------------
const auth = require("./routes/auth");

app.use("/api/v1", auth);

//Handle unhandled routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});
//--------------------------------------

//Handle unhandled routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT} in ${process.env.NODE_ENV}`);
});
