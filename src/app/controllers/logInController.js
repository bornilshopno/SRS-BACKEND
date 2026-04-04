import { UAParser } from "ua-parser-js";
import { getLogBook, saveLogInInfo } from "../services/logInService.js";


export const saveLogInController = async (req, res) => {
    try {
        const { userId, email, userAgent, } = req.body;

        // const ip = req.headers["x-forwarded-for"]?.split(",")[0] ||
        //     req.socket.remoteAddress;
        const ip = req.ip;
        const parser = new UAParser(userAgent);
        const device = parser.getDevice();
        const browser = parser.getBrowser();

        // console.log("req.ip:", req.ip);

        const loginDetails = {
            userId,
            email,
            device,
            browser,
            ip,
            loginTime: Date.now()
        }

        await saveLogInInfo(loginDetails)
        res.status(200).json({ loginDetails })
    } catch (error) {
        console.error("Login Detail not Saved", error);
        res.status(500).send({ error: { message: "Internal save error" } });
    }
}

export const getLogInHistory = async (req, res) => {
    try {
        const userId = req.query.uid || ''
        const history = await getLogBook(userId)

        res.status(200).json(history)
    } catch (error) {
        console.error("Login detail not found", error);
        res.status(500).send({ error: { message: "Internal server error" } });
    }
}