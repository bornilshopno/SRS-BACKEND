
import { getCollection } from "../../utils/getCollection.js";

export async function getDefaultsService() {
    const collection = await getCollection("systemDefaults");
    const result = await collection.find().toArray();

    const sortedResult = result.map(doc => {
        if (Array.isArray(doc.sites)) {
            doc.sites.sort((a, b) =>
                (a.label || "").localeCompare(b.label || "")
            );
        }
        return doc;
    });

    return sortedResult;
}

export async function checkSiteService(newLabel, newValue) {
    const collection = await getCollection("systemDefaults")

    const existing = await collection.findOne(
        {
            $or:
                [{ "sites.label": newLabel }, { "sites.value": newValue }]
        }
    )
    if (existing) {
        const labelExists = existing.sites.some(l => l.label === newLabel);
        const valueExists = existing.sites.some(l => l.value === newValue);

        return {
            isDuplicate: true,
            isLabelDuplicate: labelExists,
            ifValueDuplicate: valueExists
        }

    }
    return { isDuplicate: false }
}

export const checkSiteUsage = async (siteName) => {
    try {
        const usersCollection = await getCollection("users");
        const routingCollection = await getCollection("routings");

        // 🔢 Count users using this site
        const userCount = await usersCollection.countDocuments({
            site: siteName
        });

        // 🔢 Count routings using this site
        const routingCount = await routingCollection.countDocuments({
            "sites.site": siteName
        });

        // ✅ Decide deletable
        const isDeletable = userCount === 0 && routingCount === 0;
  
        return {
            isDeletable,
            userCount,
            routingCount
        };

    } catch (error) {
        throw error;
    }
};

export async function addSiteService(updatedSite) {
    const filter = { allDefaults: true };
    const newSite={...updatedSite, initialLabel:updatedSite.label}
    const collection = await getCollection("systemDefaults")
    const result = await collection.updateOne(filter, {
        $push: {
            sites: newSite
        }
    })
    return result
}

export async function editSiteService(updatedSite) {
    const collection = await getCollection("systemDefaults");

    const { label, value, status } = updatedSite;


    const result = await collection.updateOne(
        {
            allDefaults: true,
            "sites.value": value // find the specific site
        },
        {
            $set: {
                "sites.$.label": label,
                "sites.$.value": value,
                "sites.$.status": status,
            }
        }
    );

    return result;
}

export async function deleteSiteService(siteName) {
    const usage = await checkSiteUsage(siteName);

if (!usage.isDeletable) {
  const error = new Error(
    `Cannot delete. Used in ${usage.userCount} users and ${usage.routingCount} routings`
  );
  error.statusCode = 400;
  throw error;
}
    try {
        const collection = await getCollection("systemDefaults");

        const filter = { allDefaults: true };

        const result = await collection.updateOne(
            filter,
            {
                $pull: {
                    sites: { value: siteName } // 👈 match by value
                }
            }
        );

        return result;

    } catch (error) {
        throw error;
    }
}