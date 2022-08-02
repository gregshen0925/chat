let baseConfig = {
    baseUrl: "https://www.atemnetapp.com",

    googleAnalytics: {
        apiKey: "AIzaSyDoe2zSvDmjb9w6Siw-oQZmq3AG1Z6XVzM",
        authDomain: "savvy-nimbus-351916.firebaseapp.com",
        projectId: "savvy-nimbus-351916",
        storageBucket: "savvy-nimbus-351916.appspot.com",
        messagingSenderId: "487629741617",
        appId: "1:487629741617:web:245eaf7a37e8a41a203f10",
        measurementId: "G-WP6RBW72MV"
    }
}

try {
    const localConfig = require('./config.local.ts').default;

    console.info({ localConfig });

    baseConfig = Object.assign({}, baseConfig, localConfig);
} catch { }

const config = Object.assign({}, baseConfig);

export default config;
