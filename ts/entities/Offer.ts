import BigNumber from "bignumber.js";
import Asset from "./Asset";
import ListingAsset from "./ListingAsset";

export default class Offer {
    asset!: Asset | ListingAsset;
    price!: BigNumber;
}
