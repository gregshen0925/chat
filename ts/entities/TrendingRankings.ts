import Entity from "./Entity";

export default class NftRanking extends Entity {
    slug!: string;
    one_day_volume!: number;
    one_day_change!: number;
    one_day_sales!: number;
    one_day_average_price!: number;
    seven_day_volume!: number;
    seven_day_change!: number;
    seven_day_sales!: number;
    seven_day_average_price!: number;
    thirty_day_volume!: number;
    thirty_day_change!: number;
    thirty_day_sales!: number;
    thirty_day_average_price!: number;
    total_volume!: number;
    total_sales!: number;
    total_supply!: number;
    num_count!: number;
    average_price!: number;
    num_reports!: number;
    market_cap!: number;
    floor_price!: number;
    last_update_timestamp!: number;
    is_verified!: boolean;
    nft_contract_address!: string;
    img_uri!: string;
    symbol!: string;
    collection_name!: string;
}
