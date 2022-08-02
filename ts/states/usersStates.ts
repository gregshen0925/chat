import AssetsStates from "./AssetsStates";
import User from "../entities/User";
import createValueStore from "./CreateValueStore";
import getOrNewValue from "./GetOrNewValue";

const usersStates = {

    user: (address: string) => getOrNewValue('user', address, () => ({

        state: createValueStore<User>(),

        assets: AssetsStates.assets(address)

    }))

}

export default usersStates;
