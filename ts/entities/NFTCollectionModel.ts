import Entity from "./Entity";

export default class NFTCollectionModel extends Entity {
    contract_address?: string;
    name!: string;
    symbol!: string;
    description!: number;
    website!: string;
    email!: number;
    twitter!: number;
    discord!: number;
    telegram!: number;
    github!: string;
    instagram!: number;
    medium!: number;
    logo_url!: string;
    banner_url!: string;
    featured_url!: string;
    large_image_url!: number;
    attributes!: number;
    erc_type!: string;
    deploy_block_number!: string;
    owner!: string;
    verified!: boolean;
    royalty!: number;
    items_total!: number;
    owners_total!: number;
    opensea_floor_price!: number;
    collections_with_same_name!: string;
}