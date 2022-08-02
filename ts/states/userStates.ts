import User from "../entities/User";
import createValueStore from "./CreateValueStore";

export default {
    currentUser: createValueStore<User>(),
    isConnectingMetaMask: createValueStore(false),
    isLoggingIn: createValueStore(false),
    signatureMessage: createValueStore<string>()
} as const;
