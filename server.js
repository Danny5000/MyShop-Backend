require("dotenv").config();
const express = require("express");
const app = express();

const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");

const connectDB = require("./config/database");
const errorMiddleware = require("./middleware/error");
const ErrorHandler = require("./utils/errorHandler");
const morgan = require("morgan");

app.use(morgan("tiny"));

// Handling Uncaught Exception
// process.on("uncaughtException", (err) => {
//   console.log(`ERROR ${err.message}`);
//   console.log("Shutting down server due to uncaught exception...");
//   process.exit(1);
// });

//Database connection
connectDB();

//Set up body parser
app.use(bodyParser.urlencoded({ extended: true }));

//Setup json parsing
app.use(express.json());

//Set cookie parser
app.use(cookieParser());

//Handle file uploads
app.use(fileUpload());

//serve static files
app.use(express.static("public"));

//Set up CORS - accessible by other domains
app.use(
  cors({
    origin: ["http://localhost:3000", "https://stripe.com"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

//--------------Routes------------------
fs.readdirSync("./routes").map((r) =>
  app.use("/api/v1", require(`./routes/${r}`))
);

//Handle unhandled routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});
//--------------------------------------

//Error handling Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT} in ${process.env.NODE_ENV}`);
});

//Handling unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log("Shutting down server due to Unhandled promise rejection...");
  server.close(() => {
    process.exit(1);
  });
});
