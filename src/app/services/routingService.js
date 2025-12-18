// routingService.js


import { getCollection } from "../../utils/getCollection.js";
import getDatesOfISOWeek from "../../utils/weekHelper.js";

async function getThisCollection() {
  return await getCollection("routings");
}



/* --------------------------------------------------
   CREATE (Insert site inside week doc or create new week doc)
-----------------------------------------------------*/
export async function createWeekService(payload) {
  const col = await getThisCollection();

  const { year, week, site, dates, isPayRunSubmitted } = payload;

  // Check if the week exists
  const yearNum = Number(year);
  const weekNum = Number(week);

  const doc = await col.findOne({ year: yearNum, week: weekNum });

  if (!doc) {
    const newDoc = {
      year: yearNum,
      week: weekNum,
      sites: [{ site, dates, isPayRunSubmitted }]
    };
    const result = await col.insertOne(newDoc);
    return { createdNewWeek: true, _id: result.insertedId, ...newDoc };
  }

  // Week exists → check site
  const siteExists = doc.sites.some(s => s.site === site);

  if (siteExists) {
    const updated = await col.findOneAndUpdate(
      { year: yearNum, week: weekNum, "sites.site": site },
      { $set: { "sites.$.dates": dates, "sites.$.isPayRunSubmitted":isPayRunSubmitted } },
      { returnDocument: "after" }
    );

    return {
      updatedExistingSite: true,
      site,
      week: weekNum,
      year: yearNum,
      updatedDoc: updated.value
    };
  }

  // Week exists but site does NOT exist → push new site
  await col.updateOne(
    { year: yearNum, week: weekNum },
    { $push: { sites: { site, dates,isPayRunSubmitted} } }
  );

  return {
    addedNewSiteToExistingWeek: true,
    site,
    week: weekNum,
    year: yearNum
  };

}

//grok


// export async function createWeekService(payload) {
//   const col = await getThisCollection();
//   const { year, week, site, dates } = payload;

//   // Try to find existing week
//   const existingDoc = await col.findOne({ year, week });

//   if (!existingDoc) {
//     // 1. Create brand new week document
//     const newDoc = {
//       year,
//       week,
//       sites: [{ site, dates }]
//     };
//     const result = await col.insertOne(newDoc);

//     return {
//       action: 'createdNewWeek',
//       _id: result.insertedId,
//       year,
//       week,
//       site,
//       dates,
//       doc: { ...newDoc, _id: result.insertedId }
//     };
//   }

//   // Week exists → check if site already exists
//   const siteIndex = existingDoc.sites.findIndex(s => s.site === site);

//   if (siteIndex !== -1) {
//     // 2. Update existing site
//     const updated = await col.findOneAndUpdate(
//       { year, week, "sites.site": site },
//       { $set: { "sites.$.dates": dates } },
//       { returnDocument: "after" }
//     );

//     return {
//       action: 'updatedExistingSite',
//       _id: updated.value._id,
//       year,
//       week,
//       site,
//       dates,
//       doc: updated.value
//     };
//   }

//   // 3. Add new site to existing week
//   const updated = await col.findOneAndUpdate(
//     { year, week },
//     { $push: { sites: { site, dates } } },
//     { returnDocument: "after" }
//   );

//   return {
//     action: 'addedNewSiteToExistingWeek',
//     _id: updated.value._id,
//     year,
//     week,
//     site,
//     dates,
//     doc: updated.value
//   };
// }

/* --------------------------------------------------
   GET WEEK (returns all sites for the week)
-----------------------------------------------------*/
// export async function getWeekService(year, week, site) {
//   const col = await getThisCollection();

//   if (site) {
//     const data = await col.findOne({
//       year: Number(year),
//       week: Number(week)
//     });
//     const res = (data.sites.find(d => d.site === site)).dates
//     console.log("res", res)
//     return { site, year, week, dates: res }

//   }


//   return await col.findOne({
//     year: Number(year),
//     week: Number(week)
//   });
// }


export async function getWeekService(year, week, site) {
  const col = await getThisCollection();

  const query = {
    year: Number(year),
    week: Number(week)
  };

  const doc = await col.findOne(query);

  // Week doesn't exist at all → return null (not error)
  if (!doc) {
    return null;
  }

  // If site is requested → return only that site's data
  if (site) {
    const siteData = doc.sites?.find(s => s.site === site);
    if (!siteData) {
      return null; // site not in this week → also return null (clean)
    }
    return {
      site,
      year: doc.year,
      week: doc.week,
      dates: siteData.dates
    };
  }

  // No site → return full week document
  return doc;
}

/* --------------------------------------------------
   UPDATE WEEK (modify specific site data)
-----------------------------------------------------*/
export async function updateSiteInWeekService(year, week, site, updates) {
  const col = await getThisCollection();

  const result = await col.findOneAndUpdate(
    { year, week, "sites.site": site },
    { $set: { "sites.$": updates } }, // replace whole site object
    { returnDocument: "after" }
  );

  return result.value;
}


/* --------------------------------------------------
   COPY WEEK
-----------------------------------------------------*/
export async function copyWeekService(params) {
  const col = await getThisCollection();

  const source = await col.findOne({
    year: Number(params.fromYear),
    week: Number(params.fromWeek),
  });

  if (!source) return { sourceNotFound: true };

  const targetDates = getDatesOfISOWeek(
    Number(params.toWeek),
    Number(params.toYear)
  );

  const newSites = source.sites.map(site => ({
    site: site.site,
    dates: targetDates.map((date, idx) => ({
      date: date.toISOString().slice(0, 10),
      weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
      routes: structuredClone(site.dates?.[idx]?.routes || []),
    }))
  }));

  const payload = {
    year: Number(params.toYear),
    week: Number(params.toWeek),
    sites: newSites
  };

  if (params.save) {
    const exists = await col.findOne({
      year: payload.year,
      week: payload.week,
    });

    if (exists) return { conflict: true };

    const result = await col.insertOne(payload);
    return { saved: true, doc: { _id: result.insertedId, ...payload } };
  }

  return { saved: false, doc: payload };
}


// copySiteOnlyService.js


export async function copySiteOnlyService(params) {
  const col = await getThisCollection();
  const { fromYear, fromWeek, toYear, toWeek, site, save } = params;
  console.log("params", fromYear, fromWeek, toYear, toWeek, site, save)
  // 1️⃣ Fetch source week
  const sourceWeek = await col.findOne({
    year: Number(fromYear),
    week: Number(fromWeek)
  });
  console.log("sourceWeek service", sourceWeek)
  if (!sourceWeek) return { sourceNotFound: true };

  // 2️⃣ Find source site inside the week
  const sourceSite = sourceWeek.sites.find(s => s.site === site);

  if (!sourceSite) return { sourceSiteNotFound: true };

  // 3️⃣ Get target week dates
  const targetDates = getDatesOfISOWeek(
    Number(toWeek),
    Number(toYear)
  );

  // 4️⃣ Copy *allocations only* (routes), keep NEW week’s dates
  const copiedSite = {
    site,
    dates: targetDates.map((dateObj, index) => ({
      date: dateObj.toISOString().slice(0, 10),
      weekday: dateObj.toLocaleDateString("en-GB", { weekday: "long" }),
      routes: structuredClone(sourceSite.dates[index]?.routes || [])
    }))
  };

  console.log("copiedSite",copiedSite)

  // If save is false → just return preview
  // if (!save) {
  //   return {
  //     saved: false,
  //     site: copiedSite
  //   };
  // }
  let responseDates = [];
  // 5️⃣ Save: insert into existing target week OR create new target week
  const targetWeek = await col.findOne({
    year: Number(toYear),
    week: Number(toWeek)
  });
  console.log("target qweek", targetWeek)

  if (!targetWeek) {
    // Create new week doc
    const newDoc = {
      year: Number(toYear),
      week: Number(toWeek),
      sites: [copiedSite]
    };

    // console.log("New Doc", newDoc, "from RouterService..copy")

    const result = await col.insertOne(newDoc);
    responseDates = newDoc.sites.find(d => d.site === site).dates;
    console.log("resilt", result)
    const res = (newDoc.sites.find(d => d.site === site)).dates    // 
    return {
      site, year: (newDoc.year), week: (newDoc.week), dates: res
    };
  }

  // If week exists → replace OR add site
  const siteExists = targetWeek.sites.some(s => s.site === site);
  // const res = (newDoc.sites.find(d => d.site === site)).dates
  if (!siteExists) {
    await col.updateOne(
      { year: Number(toYear), week: Number(toWeek) },
      { $push: { sites: copiedSite } }
    );
     responseDates = copiedSite.dates;

    return {
    saved: true,
    addedToExistingWeek: true,
    site,
    year: Number(toYear),
    week: Number(toWeek),
    dates: responseDates
    };
  }

  // If site exists → overwrite the allocations
  await col.updateOne(
    {
      year: Number(toYear),
      week: Number(toWeek),
      "sites.site": site
    },
    { $set: { "sites.$": copiedSite } }
  );

  responseDates = copiedSite.dates;

  return {
    saved: true,
    updatedExistingSite: true,
    site,
    year: Number(toYear),
    week: Number(toWeek),
    dates: responseDates
  };
}


/* --------------------------------------------------
   UPDATE WEEK (submit specific site data)
-----------------------------------------------------*/
export async function siteSubmitService(year,week,site,update){
const col= await getThisCollection();

const result= await col.updateOne(
   { year, week, "sites.site": site },
  {
    $set: {
      "sites.$.isSubmitted": update ,
    },
  }
);
return result
}
