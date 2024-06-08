const ULID = require("ulid");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");
const { hashPassword, compareHash } = require("./../utilities/hash");
const { generateKeys } = require("../utilities/keygenerator");
const User = require("../models/userModel");
const ResourceExists = require("../errors/ResourceExisits");
const AuthenticationError = require("../errors/AuthenticationError");

async function registerUser(userData) {
  const { username, email, password } = userData;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ResourceExists(
      "A user with the provided username or email address exists"
    );
  }

  const today = new Date();

  let hashedPassword = await hashPassword(password);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  const result = {
    id: newUser._id,
    email: newUser.email,
  };

  //   // CREATE AND SEND TOKEN
  // const token = await JWT.sign(
  //     { email: newUser.email },
  //     process.env.JWT_SECRET ,
  //     {
  //       expiresIn: 360000,
  //     }
  //   );

  //   // SEND THE TOKEN
  //   res.json({
  //     errors: [],
  //     data: {
  //       token,
  //       user: {
  //         id: newUser._id,
  //         email: newUser.email,
  //       },
  //     },
  // msg: "Registration successful",
  //   });
  //   --------------------------------

  // const result = await collection.insertOne({
  //     id: ULID.ulid(),
  //     first_name: userData.first_name,
  //     last_name: userData.last_name,
  //     username: userData.username,
  //     email: userData.email,
  //     password: password,
  //     created_at: format(today, 'yyyy-MM-dd'),
  // });

  return result;
}

async function login(email, password) {
  const user = await User.findOne({ email });

  if (user === null) {
    throw new AuthenticationError("User credentials do not match our records");
  }

  const passwordCompare = await compareHash(password, user.password);

  if (passwordCompare === false) {
    throw new AuthenticationError("User credentials do not match our records");
  }

  const token = jwt.sign(
    {
      email: user?.email,
      username: user.username,
      id: user.id,
    },
    process.env.APP_KEY,
    { expiresIn: 60 * 30, issuer: process.env.JWT_ISSUER }
  );

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    created_at: user.created_at,
    token: token,
  };
}

module.exports = {
  registerUser,
  login,
};
