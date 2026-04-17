import { getCollection } from "../../utils/getCollection.js";

export async function verifyUser(email) {
    const query = { email };
    const userCollection = await getCollection("users");
    const user = await userCollection.findOne(query);
    return { _id: user._id, email: user.email, role: user.role };
}