import Asset from "../entities/Asset";
import ListingAsset from "../entities/ListingAsset";
import createValueStore from "./CreateValueStore";
import getOrNewValue from "./GetOrNewValue";

export default {

    nft: (address: string) => getOrNewValue('nft', address, () => ({

        asset: (id: string) => getOrNewValue('asset', `${address}/${id}`, () => ({

            state: createValueStore<Asset | ListingAsset>()

        })),

    })),

    assets: (address: string) => getOrNewValue('assets', address, () => {

        const assetsStates = {

            address,

            isLoading: createValueStore(false),

            list: createValueStore<Asset[]>([]),

            lastPage: createValueStore(0),

            hasNextPage: createValueStore(true),

            orderBy: createValueStore('price-high-to-low'),

            orderByOptions: {
                'price-high-to-low': 'Price High to Low',
                'price-low-to-high': 'Price Low to High',
            } as { [key: string]: string },

            searchBy: createValueStore<string>(),

            filtered: createValueStore<Asset[]>([]),

            refreshFiltered: () => {
                const searchBy = assetsStates.searchBy.getState();

                let assets = assetsStates.list.getState();

                if (searchBy) {
                    const searchByLowerCase = searchBy.toLowerCase();
                    assets = assets.filter(asset => asset.name.toLowerCase().indexOf(searchByLowerCase) >= 0)
                }

                const orderBy = assetsStates.orderBy.getState();
                const orderNFT = assets.filter((it) => it.orders!.length > 0);
                const noPriceNFT = assets.filter((it) => it.orders!.length === 0).filter((item) => item.lastPrice.toString() === '0');
                const hasPriceNFT = assets.filter((it) => it.orders!.length === 0).filter((item) => item.lastPrice > 0);
                const sortNFTOfHasPriceNFT = hasPriceNFT.sort((assetA, assetB) => (assetA.lastPrice - assetB.lastPrice) * (orderBy === 'price-low-to-high' ? 1 : -1));
                assetsStates.filtered.dispatch({ type: [...orderNFT, ...sortNFTOfHasPriceNFT, ...noPriceNFT] });
            }

        };

        assetsStates.list.subscribe(() => assetsStates.refreshFiltered());
        assetsStates.orderBy.subscribe(() => assetsStates.refreshFiltered());
        assetsStates.searchBy.subscribe(() => assetsStates.refreshFiltered());

        return assetsStates;
    }),
    owner: (nftAddress: string, tokenId: string) =>
        getOrNewValue(nftAddress, tokenId, () => ({
            ensOrAddress: createValueStore<string>(),
        })),

    orderAssets: (address: string) => getOrNewValue('orderAssets', address, () => {

        const assetsStates = {

            list: createValueStore<ListingAsset[]>([]),

            isLoading: createValueStore(false),

            hasNextPage: createValueStore(true),

            filtered: createValueStore<ListingAsset[]>([]),

            orderBy: createValueStore('price-high-to-low'),

            orderByOptions: {
                'price-high-to-low': 'Price High to Low',
                'price-low-to-high': 'Price Low to High',
            } as { [key: string]: string },

            searchBy: createValueStore<string>(),

            refreshFiltered: () => {
                const searchBy = assetsStates.searchBy.getState();

                let assets = assetsStates.list.getState();

                if (searchBy) {
                    const searchByLowerCase = searchBy.toLowerCase();
                    assets = assets.filter(asset => asset.name.toLowerCase().indexOf(searchByLowerCase) >= 0)
                }

                const orderBy = assetsStates.orderBy.getState();
                const orderNFT = assets.filter((it) => it.orders!.length > 0);
                const noPriceNFT = assets.filter((it) => it.orders!.length === 0).filter((item) => item.lastPrice.toString() === '0');
                const hasPriceNFT = assets.filter((it) => it.orders!.length === 0).filter((item) => item.lastPrice > 0);
                const sortNFTOfHasPriceNFT = hasPriceNFT.sort((assetA, assetB) => (assetA.lastPrice - assetB.lastPrice) * (orderBy === 'price-low-to-high' ? 1 : -1));
                assetsStates.filtered.dispatch({ type: [...orderNFT, ...sortNFTOfHasPriceNFT, ...noPriceNFT] });
            }

        }

        assetsStates.list.subscribe(() => assetsStates.refreshFiltered());
        assetsStates.orderBy.subscribe(() => assetsStates.refreshFiltered());
        assetsStates.searchBy.subscribe(() => assetsStates.refreshFiltered());
        return assetsStates;
    })
} as const;
