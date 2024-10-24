import { getDefaultConfig } from "expo/metro-config";
import { withNativeWind } from "nativewind/metro";

const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

export default withNativeWind(config, { input: "./global.css" });
