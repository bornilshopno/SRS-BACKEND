import verifyAuth from "./verifyAuth.js";

/**
 * router.get("/profile", verifyJWT, getProfile);
 * router.get("/admin", verifyAdmin, adminController);
 * router.get("/driver", verifyDriver, driverController);
 **/

export const verifyJWT = verifyAuth(); // any logged-in user

export const verifyAdmin = verifyAuth(["superAdmin"]);

export const verifyManager = verifyAuth([
    "superAdmin",
    "fleetManager",
    "payrollManager",
    "siteManager",
]);

export const verifyDriver = verifyAuth([
    "driver",
    "superAdmin",
    "fleetManager",
    "payrollManager",
    "siteManager",
]);