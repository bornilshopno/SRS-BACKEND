import { getCollection } from "../../utils/getCollection.js";


export const saveLogInInfo = async (loginDetails) => {
    try {
        const {
            userId,
            email,
            device,
            browser,
            ip,
            loginTime,
        } = loginDetails;

        const loginCollection = await getCollection("logins");
        const trialCollection = await getCollection("trials")


        // ✅ Clean device info
        const cleanDevice =
            device?.type && device?.model
                ? `${device.type} (${device.model})`
                : device?.model || device?.type || "Desktop"; // fallback if undefined

        // ✅ Clean browser info
        const cleanBrowser = `${browser?.name || "Unknown"}`.trim();

        // ✅ Fix IP (important for localhost)
        const cleanIP =
            ip === "::1" || ip === "::ffff:127.0.0.1"
                ? "8.8.8.8" // 👈 fallback for local testing
                : ip;

        // ✅ Get location
        let location = { city: "Unknown", country: "Unknown" };

        try {
            const res = await fetch(`http://ip-api.com/json/${cleanIP}`);
            const data = await res.json();
            console.log("CLEAN DEVICE", cleanDevice, "clean Browser", cleanBrowser, "cleanIp", cleanIP, "datafrom ip-api", data)
            if (data.status === "success") {
                location = {
                    regionName: data.regionName,
                    city: data.city,
                    country: data.country,
                };

                await trialCollection.insertOne({ ...loginDetails, cleanDevice: cleanDevice, cleanBrowser: cleanBrowser, cleanIP: cleanIP, location })
            } else {
                // fallback
                const res2 = await fetch(`https://ipwho.is/${cleanIP}`);
                const data2 = await res2.json();

                if (data2.success) {
                    location = {
                        city: data2.city,
                        country: data2.country,
                    };
                    await trialCollection.insertOne({ ...loginDetails, cleanDevice: cleanDevice, cleanBrowser: cleanBrowser, cleanIP: cleanIP, location })
                }
            }
        } catch (err) {
            console.log("Location fetch failed:", err.message);
        }


        // ✅ Prepare login object
        const newLog = {
            device: cleanDevice,
            browser: cleanBrowser,
            ip: cleanIP,
            location,
            loginTime,
        };


        await loginCollection.updateOne(
            { userId }, // find user
            {
                $set: {
                    email, // keep email updated
                },
                $push: {
                    logInData: {
                        $each: [newLog],
                        $position: 0, // newest first
                        $slice: 10,   // keep last 10 logins only
                    },
                },
            },
            {
                upsert: true, // create if first login
            }
        );
        return { success: true };
        
    } catch (error) {
        console.error("Error saving login info:", error);
        return { success: false, error: error.message };
    }
};


export const getLogBook = async (id) => {
    const loginCollection = await getCollection("logins");

    const pipeline = [
        // ✅ Optional filter by userId
        ...(id ? [{ $match: { userId: id } }] : []),

        // ✅ Join with users collection
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "uid", // adjust if needed
                as: "user",
            },
        },

        // ✅ Convert array to object
        {
            $unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true,
            },
        },

        // ✅ Add last login (NEW STAGE)
        {
            $addFields: {
                lastLogin: { $arrayElemAt: ["$logInData", 0] },
            },
        },

        // ✅ Select only needed fields
        {
            $project: {
                userId: 1,
                email: 1,
                name: "$user.name",
                site: "$user.site",
                srsDriverNumber: "$user.srsDriverNumber",
                profileImage: "$user.profileImage",
                userDbId: "$user._id",
                lastLogin: 1,     // 👈 include this
                logInData: 1,     // optional
            },
        },
    ];

    const result = await loginCollection.aggregate(pipeline).toArray();

    return result;
};