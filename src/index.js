import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './styles/index.css';

import { createRoot } from 'react-dom/client';

import '@rainbow-me/rainbowkit/styles.css';
import {
    connectorsForWallets,
    getDefaultWallets,
    RainbowKitProvider,
  } from '@rainbow-me/rainbowkit';

import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
    polygon,
    polygonMumbai,
  } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const projectId = "e3770fd59efd5da0b6467299f27598a9";

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

  const container = document.getElementById('root');
  const root = createRoot(container);

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
  reportWebVitals();
