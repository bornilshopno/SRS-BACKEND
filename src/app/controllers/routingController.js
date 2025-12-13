// routingController.js
import {
  createWeekService,
  getWeekService,
  updateSiteInWeekService,
  copyWeekService
} from "../services/routingService.js";
import {
  copySiteOnlyService
} from "../services/routingService.js";

// --------------------------------------------------
// CREATE (Add site inside week OR create new week)
// --------------------------------------------------
export const createWeek = async (req, res) => {
  try {
    const result = await createWeekService(req.body);

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



// --------------------------------------------------
// GET WEEK (returns full week document with all sites)
// GET /api/routing?year=2025&week=4
// --------------------------------------------------

// export const getWeek = async (req, res) => {
//   try {
//     const { year, week, site } = req.query;

//     if (!year || !week) {
//       return res.status(400).json({
//         message: "year and week are required",
//       });
//     }

//     const doc = await getWeekService(year, week, site);

//     if (!doc) {
//       return res.status(404).json({ message: "Week not found" });
//     }

//     return res.json(doc);

//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };

export const getWeek = async (req, res) => {
  try {
    const { year, week, site } = req.query;

    if (!year || !week) {
      return res.status(400).json({
        message: "year and week are required",
      });
    }

    const doc = await getWeekService(year, week, site);

    // Just return whatever getWeekService returns
    // → null if week doesn't exist
    // → full doc if no site param
    // → site-specific object if site is provided
    return res.status(200).json(doc);  // Always 200

  } catch (err) {
    console.error('getWeek error:', err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------------------
// UPDATE SITE INSIDE WEEK
// PUT /api/routing/:year/:week/:site
// --------------------------------------------------
export const updateSite = async (req, res) => {
  try {
    const { year, week, site } = req.params;

    const updated = await updateSiteInWeekService(
      Number(year),
      Number(week),
      site,
      req.body
    );

    if (!updated) {
      return res.status(404).json({
        message: "Site not found for this week"
      });
    }

    return res.json(updated);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// --------------------------------------------------
// COPY WEEK (Full week copy)
// POST /api/routing/copy
// --------------------------------------------------
export const copyWeek = async (req, res) => {
  try {
    const result = await copyWeekService(req.body);

    if (result.sourceNotFound) {
      return res.status(404).json({
        message: "Source week not found"
      });
    }

    if (result.conflict) {
      return res.status(409).json({
        message: "Target week already exists"
      });
    }

    return res
      .status(result.saved ? 201 : 200)
      .json(result.doc);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// routingController.js



export async function copySiteOnlyController(req, res) {
  try {
    const params = req.body;

    const result = await copySiteOnlyService(params);

    if (result.sourceNotFound)
      return res.status(404).json({ message: "Source week not found" });

    if (result.sourceSiteNotFound)
      return res.status(404).json({ message: "Source site not found in source week" });

    return res.json(result);

  } catch (error) {
    console.error("Copy Site Only Error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
}
