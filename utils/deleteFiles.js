const fs = require("fs");

const deleteFiles = (fileName) => {
  //Get filepath
  let filepath = `${__dirname}/public/images/${fileName}`.replace("/utils", "");
  //Delete the file there
  fs.unlink(filepath, (err) => {
    if (err) return console.log(err);
  });
};

module.exports = deleteFiles;
