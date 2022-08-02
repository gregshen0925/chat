import axios from "axios";
import AppStates from "../states/AppStates";
import server from "./Server";

class BaseClient {
    timeDifference = 0;

    async reloadSystemTime() {
        const response = await axios.get(server.apis.time);
        const time = new Date(response.data);
        this.timeDifference = time.getTime() - new Date().getTime();
        AppStates.severTime.dispatch({ type: time });
    }

    async getPriceConversion({ amount, symbol, convert }: { amount: number, symbol: string, convert: string }) {
        try {
            const response = (await axios.get(server.apis.tools.priceConversion, {
                params: {
                    amount, symbol, convert
                }
            })).data;
            const rateEthToUSD = (response.data[0].quote.USD.price / response.data[0].amount);
            AppStates.rateEthToUSD.dispatch({ type: rateEthToUSD })
        } catch (error) {
            AppStates.rateEthToUSD.dispatch({ type: null })
        }
    }
}

const baseClient = new BaseClient();

baseClient.reloadSystemTime();

export default baseClient;
