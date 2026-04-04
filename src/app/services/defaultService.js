
import { getCollection } from "../../utils/getCollection.js";

export async function getDefaultsService() {
    const collection = await getCollection("systemDefaults");
    const result = await collection.find().toArray();
    return result;
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

export async function addSiteService(updatedSite) {
    const filter = { allDefaults: true }
    const collection = await getCollection("systemDefaults")
    const result = await collection.updateOne(filter, {
        $push: {
            sites: updatedSite
        }
    })
    return result
}

export async function editSiteService(updatedSite) {
  const collection = await getCollection("systemDefaults");

  const {label, value, status}=updatedSite;


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
