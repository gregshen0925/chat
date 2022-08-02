import Channel from "./Channel";
import Entity from "./Entity";

export default class Space extends Entity {
    nftContractAddress!: string;
    is_verified!: number;
    name!: string;
    icon!: string;
    channels!: Array<Channel>;
    switchToMain!: () => void
}