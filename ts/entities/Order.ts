
export interface Asset {
    id: string;
    address: string;
    quantity: string;
}

export interface Metadata {
    asset: Asset;
    schema: string;
}

export interface OrderBody {
    exchange: string;
    maker: string;
    taker: string;
    makerRelayerFee: string;
    takerRelayerFee: string;
    makerProtocolFee: string;
    takerProtocolFee: string;
    makerReferrerFee: string;
    feeMethod: number;
    feeRecipient: string;
    side: number;
    saleKind: number;
    target: string;
    howToCall: number;
    calldata: string;
    replacementPattern: string;
    staticTarget: string;
    staticExtradata: string;
    paymetToken: string;
    quantity: string;
    basePrice: string;
    extra: string;
    listingTime: string;
    expirationTime: number;
    salt: string;
    metadata: Metadata;
    v: number;
    r: string;
    s: string;
    nonce: number;
    orderHash?: string
}

export default class Order {
    orderId!: string;
    orderHash!: string;
    orderBody!: string | OrderBody;
    orderStatus!: number;
}

