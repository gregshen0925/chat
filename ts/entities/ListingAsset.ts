import Entity from "./Entity";

export interface OrderForListing {
    orderHash: string;
    orderBody: string;
    maker: string;
    side: number;
    target: string;
    listingTime: number;
    expirationTime: number;
    paymentToken: string;
    basePrice: string;
    assetId: string;
    tokenAddress: string;
    schema: string;

}

export default class ListingAsset extends Entity<string> {
    name!: string;
    address!: string;
    icon!: string;
    lastPrice!: number;
    tokenId !: string;
    platformName!: string;
    holder!: string;
    orderHash?: string;
    orders?: [] | OrderForListing[];
    metaDataJson: any;
    chainType?: string;
    ercType?: string;
}