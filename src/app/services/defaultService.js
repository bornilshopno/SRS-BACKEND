
import { getCollection } from "../../utils/getCollection.js";

export async function getDefaultsService() {
    const collection = await getCollection("systemDefaults");
    const result = await collection.find().toArray();
    return result;
}