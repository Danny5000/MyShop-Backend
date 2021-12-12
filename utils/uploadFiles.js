const ErrorHandler = require("../utils/errorHandler");

const uploadFiles = (file, filename, next) => {
  //Move the file to the appropriate directory
  file.mv(`${process.env.UPLOAD_PATH}/${filename}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler("File upload failed.", 500));
    }
  });

  return file.name;
};

module.exports = uploadFiles;
