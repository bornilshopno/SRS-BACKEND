import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  // console.log("generate Token", user,process.env.JWT_SECRET)
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (user) => {
  //  console.log("refresh Token", user,process.env.JWT_REFRESH_SECRET)
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

