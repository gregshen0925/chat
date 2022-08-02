import createValueStore from "./CreateValueStore";
import getOrNewValue from "./GetOrNewValue";

class NotificationCollection {
    count = createValueStore(0);
    private sumWithKeys = Array<string>();

    sumWith = (key: string) => {
        this.sumWithKeys.push(key);

        collection(key).count.subscribe(() => this.count.dispatch({
            type: this.sumWithKeys.map(key => collection(key).count.getState()).reduce((sum, each) => sum + each, 0)
        }));
    }
}


const collection = (key: string) => getOrNewValue('notification', key, () => new NotificationCollection());


export default {

    collection

} as const;