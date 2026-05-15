import crypto from "crypto";

const SECRET = process.env.FILE_SIGN_SECRET || "super-secret-key";

// Create token
export const createSignedToken = (filename, expiresInSeconds = 300) => {
  const expires = Date.now() + expiresInSeconds * 1000;

  const data = `${expires}.${filename}`;

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex");

  return `${signature}.${data}`;
};

// Verify token
export const verifySignedToken = (token, filename) => {
  const parts = token.split(".");
  // console.log("parts", parts)

  if (parts.length < 3) return false;

  const [signature, expires, ...rest ] = parts;
const generatedFileName=rest.join(".")
  if (generatedFileName !== filename) return false;

  if (Date.now() > Number(expires)) return false;

  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(`${expires}.${generatedFileName}`)
    .digest("hex");

    console.log("exprected-vs-reality", expectedSignature === signature)


  return expectedSignature === signature;
};