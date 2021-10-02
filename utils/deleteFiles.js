const fs = require("fs");

const deleteFiles = (fileName) => {
  let filepath = `${__dirname}/public/images/${fileName}`.replace("/utils", "");

  fs.unlink(filepath, (err) => {
    if (err) return console.log(err);
  });
};

module.exports = deleteFiles;
