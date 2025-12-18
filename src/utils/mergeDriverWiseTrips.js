export function mergeDriverWiseTrips(existingDriverWiseTrips, incomingDriverWiseTrips) {
    // 1️⃣ Clone root object
    const mergedTrips = { ...existingDriverWiseTrips };

    for (const driverId in incomingDriverWiseTrips) {
        const incomingDriver = incomingDriverWiseTrips[driverId];
        const existingDriver = existingDriverWiseTrips[driverId];

        // 2️⃣ Driver does not exist → clone entire driver
        if (!existingDriver) {
            mergedTrips[driverId] = {
                ...incomingDriver,
                weekData: incomingDriver.weekData.map(day => ({
                    ...day,
                    assignments: [...day.assignments],
                })),
            };
            continue;
        }

        // 3️⃣ Merge weekData
        const existingWeekDataMap = new Map(
            existingDriver.weekData.map(day => [day.date, day])
        );

        const mergedWeekData = [...existingDriver.weekData.map(day => ({
            ...day,
            assignments: [...day.assignments],
        }))];

        for (const incomingDay of incomingDriver.weekData) {
            const existingDay = existingWeekDataMap.get(incomingDay.date);

            // 4️⃣ Date does not exist → add new date
            if (!existingDay) {
                mergedWeekData.push({
                    ...incomingDay,
                    assignments: [...incomingDay.assignments],
                });
                continue;
            }

            // 5️⃣ Merge assignments by detailRoute
            const mergedAssignments = [...existingDay.assignments];

            for (const incomingAssignment of incomingDay.assignments) {
                const index = mergedAssignments.findIndex(
                    a => a.detailRoute === incomingAssignment.detailRoute
                );

                if (index !== -1) {
                    mergedAssignments[index] = incomingAssignment;
                } else {
                    mergedAssignments.push(incomingAssignment);
                }
            }

            // Replace day entry immutably
            const dayIndex = mergedWeekData.findIndex(
                d => d.date === incomingDay.date
            );

            mergedWeekData[dayIndex] = {
                ...existingDay,
                assignments: mergedAssignments,
            };
        }

        mergedTrips[driverId] = {
            ...existingDriver,
            weekData: mergedWeekData,
        };
    }

    return mergedTrips;
}
