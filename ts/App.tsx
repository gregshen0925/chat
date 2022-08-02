import "./App.css";
import './App.scss';
import 'bootstrap';

import AppStates from "./states/AppStates";
import { Component } from "react";
import Navigation from "./navigation/Navigation";
import Notification from "./notification/Notification";
import SwapEthModal from "./trade-modals/SwapEth";
import { Unsubscribe } from "redux";
import userClient from "./web-clients/UserClient";
import googleAnalyticsClient from "./web-clients/google-analytics-client";

googleAnalyticsClient.init();

export default class App extends Component<any, { switchingToChannel: string | null; startBlockchainTxn: number | null }> {
    constructor(props: any) {
        super(props);
        this.state = {
            switchingToChannel: AppStates.switchingToChannel.getState(),
            startBlockchainTxn: AppStates.startBlockchainTxn.getState(),
        };
    }

    unsubscribes = new Array<Unsubscribe>();

    componentDidMount() {
        this.unsubscribes.push(
            AppStates.switchingToChannel.subscribe(() =>
                this.setState({
                    switchingToChannel: AppStates.switchingToChannel.getState(),
                })
            ),
            AppStates.startBlockchainTxn.subscribe(() =>
                this.setState({ startBlockchainTxn: AppStates.startBlockchainTxn.getState() })
            )
        );

        userClient.autoLoggin();
    }

    componentWillUnmount = () => this.unsubscribes.forEach((unsubscribe) => unsubscribe());

    render() {
        return <div className="App">
            <Navigation />
            {this.state.switchingToChannel && <Notification message={`Swithing to ${this.state.switchingToChannel}`} />}
            {this.state.startBlockchainTxn === 1 && <Notification children={Array(<SwapEthModal />)} />}
        </div>
    }
}