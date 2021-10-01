const User = require("../models/users");

//Register a new user => /api/v1/register
exports.registerUser = async (req, res, next) => {
  const { name, userName, email, password } = req.body;

  const user = await User.create({
    name,
    userName,
    email,
    password,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
};
