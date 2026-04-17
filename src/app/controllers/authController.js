import { generateAccessToken, generateRefreshToken, } from "../../utils/generateToken.js";
import { verifyUser } from "../services/authServices.js";

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await verifyUser(email);
        if (!user._id || !user.email) return res.status(401).json({ message: "Invalid credentials" });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);


        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000, // 15 min
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
    res.clearCookie("jwt_token");
    res.send({ message: "Logged out" });
};

export const refreshAccessToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).send("No refresh token");
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const newAccessToken = generateAccessToken({
            id: decoded.id,
            email: decoded.email,
        });

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        res.send({ message: "Token refreshed" });
    } catch (err) {
        return res.status(403).send("Invalid refresh token");
    }
};

export const testingFn = (req, res) => {
    console.log("Cookies:", req.cookies);
    res.send("OK");
}