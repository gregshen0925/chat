import Entity from "./Entity";
import { OrderBody } from "./Order";

export default class Asset extends Entity<string> {
    name!: string;
    address!: string;
    icon!: string;
    lastPrice!: number;
    tokenId !: string;
    platformName!: string;
    holder!: string;
    orderHash?: string;
    orders?: [] | OrderBody[];
    metaDataJson: any;
    chainType?: string;
    ercType?: string;
}
