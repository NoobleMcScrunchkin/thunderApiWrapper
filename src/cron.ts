import cron from "node-cron";
import { storeGamePackagesInDB } from "@/services/thunderstore";

cron.schedule("0 * * * *", () => {
	storeGamePackagesInDB();
});
