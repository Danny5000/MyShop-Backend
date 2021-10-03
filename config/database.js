const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(process.env.DB_LOCAL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then((con) => {
      console.log(`Mongo DB connected with host: ${con.connection.host}`);
    })
    .catch((error) => console.error(error.message));
};

module.exports = connectDB;
