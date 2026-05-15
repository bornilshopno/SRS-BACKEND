import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, } from "../../utils/generateToken.js";
import { verifyUser } from "../services/authServices.js";
import { firebaseAuth } from "../../config/firebaseAdmin.js";
import { updateLogInDetails } from "./logInController.js";

export const loginUser = async (req, res) => {
    const { language, platform, userAgent, token } = req.body;
    const ip = req.ip;


    try {

        // ✅ Verify Firebase token
        const decoded = await firebaseAuth().verifyIdToken(token);

        // output=>decoded= {
        //   iss: 'https://securetoken.google.com/srsdriverapp-9e783',
        //   aud: 'srsdriverapp-9e783',
        //   auth_time: 1777693388,
        //   user_id: 'TqZvtqp9FRcdobg4xnTT83goOrM2',
        //   sub: 'TqZvtqp9FRcdobg4xnTT83goOrM2',
        //   iat: 1777693388,
        //   exp: 1777696988,
        //   email: 'mohashin.bhyian@gmail.com',
        //   email_verified: true,
        //   firebase: { identities: { email: [Array] }, sign_in_provider: 'password' },
        //   uid: 'TqZvtqp9FRcdobg4xnTT83goOrM2'
        // }


        // 🔐 This is now TRUSTED
        const email = decoded.email;
        const uid = decoded.uid;

        // console.log("decoded", decoded)



        // (optional) find user in your DB
        const user = await verifyUser(email);

        if (!user.id || !user.email) {
            return res.status(401).json({ message: "User not found" });
        }

        const now = Date.now() / 1000;
        const authTime = decoded.auth_time;

        if (now - authTime > 60) { // 1 minute
            return res.status(401).json({ message: "Token too old" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        const saved = await updateLogInDetails(uid, email, userAgent, ip)

        // console.log("from AUTH", accessToken, refreshToken)
        console.log("from AUTH", "refreshToken and accesstoken found")

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 3 * 60 * 1000, // 15 min
            secure: process.env.NODE_ENV === "production",
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: process.env.NODE_ENV === "production",
        });

        res.json({ message: "Login successful" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


export const logoutUser = (req, res) => {
    // console.log("logOut Reached")
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.send({ message: "Logged out" });
};

export const refreshAccessToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log("refresh token",)
    if (!refreshToken) {
        return res.status(401).send("No refresh token");
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        console.log("decoded", )

        const newAccessToken = generateAccessToken({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });
        console.log("newTOken",)
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            // sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            sameSite:  "lax",
        });

        res.send({ message: "Token refreshed" });
    } catch (err) {
        console.log("Refresh error:", err.name, err.message);
        return res.status(403).send("Invalid refresh token");
    }
};

export const testingFn = (req, res) => {
    console.log("Cookies:",);
    res.send("OK");
}