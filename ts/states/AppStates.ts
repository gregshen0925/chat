import { Action, Store } from "redux";

import SpacesStates from "./SpacesStates";
import UserStates from "./UserStates";
import createValueStore from "./CreateValueStore";
import NftRanking from "../entities/TrendingRankings";

export default {
    user: UserStates,
    spaces: SpacesStates,

    switchingToChannel: createValueStore<string>(),
    switchingToTransaction: createValueStore<number>(),
    startBlockchainTxn: createValueStore<1 | null>(), // 1 is wrap eth
    nftRankings: createValueStore(Array<NftRanking>()),
    severTime: createValueStore(new Date()),
    rateEthToUSD: createValueStore<number | null>(),
} as const;
