const path = require("path");
const v4 = require("uuid/v4");
const ErrorHandler = require("../utils/errorHandler");

const uploadFiles = (file, req) => {
  // Check file type
  const supportedFiles = /.jpeg|.jpg|.png|.svg/;
  if (!supportedFiles.test(path.extname(file.name))) {
    return next(new ErrorHandler("Please upload an image file.", 400));
  }

  // Check doucument size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorHandler("Please upload file less than 2MB.", 400));
  }

  const pictureId = v4();

  // Renaming product file
  file.name = `${req.user.id}_${pictureId}_${file.name}`;

  file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler("Resume upload failed.", 500));
    }
  });

  return file.name;
};

module.exports = uploadFiles;
