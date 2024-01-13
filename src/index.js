import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './styles/index.css';

import '@rainbow-me/rainbowkit/styles.css';
import {
    connectorsForWallets,
    getDefaultWallets,
    RainbowKitProvider,
  } from '@rainbow-me/rainbowkit';
import {
    argentWallet,
    trustWallet,
    ledgerWallet,
    coreWallet,
  } from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
    polygon,
    polygonMumbai,
  } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const projectId = process.env.REACT_APP_PROJECT_ID;

  const {chains, publicClient, webSocketPublicClient} = configureChains(
    [polygon, polygonMumbai],
    [publicProvider()]
  );

  const {wallets} = getDefaultWallets({
    appName: "Migrate",
    projectId,
    chains,
  });

  const demoAppInfo = {
    appName: "Migrate",
  };

  const connectors = connectorsForWallets([
    ...wallets,
  ]);

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
  });

  const root = ReactDOM.createRoot(
    document.getElementById('root')
  );

root.render(
    <React.StrictMode>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </React.StrictMode>
  );
  
  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  serviceWorker.unregister();
