import Web3 from 'web3';
import { Navbar, Nav, Button, Form, FormControl } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import './styles/App.css';
import migrateContractAbi from './contracts/migrateABI'
import crtPolygonContractAbi from './contracts/erc20ABI';
import crtAvalancheContractAbi from './contracts/erc20ABI';
import { useAccount, useContractRead, usePrepareContractWrite, useContractWrite } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

import { ConnectButton } from '@rainbow-me/rainbowkit';

const App = () => {

  const { openConnectModal } = useConnectModal();

  const { address, isConnecting, isConnected, isDisconnected } = useAccount();

  // Estados para almacenar el proveedor, cuenta, red y balance de CRT
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletField, setShowWalletField] = useState(false);

  const [selectedToken, setSelectedToken] = useState('CRT'); // 'CRT' o 'BXT'
  const [bxtPolygonBalance, setBxtPolygonBalance] = useState('0');
  const [account, setAccount] = useState(null);
  const [crtPolygonBalance, setCrtPolygonBalance] = useState('0');
  const [isMigrateDisabled, setIsMigrateDisabled] = useState(true);
  const [migrationMessage, setMigrationMessage] = useState('');
  const [currentChainId, setCurrentChainId] = useState(null);

  useEffect(() => {
    const fetchChainId = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          const networkId = await web3.eth.net.getId();
          setCurrentChainId(networkId);
        } catch (e) {
          console.error('Error fetching chainId:', e);
        }
      }
    };
    fetchChainId();

    if (isConnected) {
      switchToPolygonNetwork();
    }

    console.log("Conectado:", isConnected);
    console.log("Chain ID:", currentChainId);
    console.log("Address:", address);
  }, [isConnected, currentChainId]);

  useEffect(() => {
    const web3 = new Web3(window.ethereum);
  
    // Función para actualizar el Chain ID
    const updateChainId = async () => {
      const networkId = await web3.eth.net.getId();
      setCurrentChainId(networkId);
    };
  
    // Listener para cambios en la red
    window.ethereum.on('chainChanged', updateChainId);
  
    // Eliminar el listener cuando el componente se desmonte
    return () => {
      window.ethereum.removeListener('chainChanged', updateChainId);
    };
  }, []);

  const switchToPolygonNetwork = async () => {
    try {
      await window?.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: "0x13881"}], // 0x13881  es el chainId para Polygon
      });
    } catch (switchError) {
      console.error(switchError);
    }
  };

  
  
  // Cargar balance de CRT cuando la cuenta o la red cambien
  useEffect(() => {
    if (isConnected && currentChainId === 80001n) {
      loadTokenBalance();
    }
  }, [address, isConnected, currentChainId, selectedToken]);

  // Habilitar o deshabilitar el botón de migración basado en el balance de CRT
  useEffect(() => {
    if (selectedToken === 'CRT') {
      setIsMigrateDisabled(crtPolygonBalance <= '1');
    } else if (selectedToken === 'BXT') {
      setIsMigrateDisabled(bxtPolygonBalance <= '1');
    }
  }, [crtPolygonBalance, bxtPolygonBalance, selectedToken]);

  const handleWalletAddressChange = (event) => {
    setWalletAddress(event.target.value);
    console.log("Estado:", showWalletField);
  };

  const loadTokenBalance = async () => {
    const web3 = new Web3(window.ethereum);
  
    let contractAddress;
    let contractAbi;
  
    if (selectedToken === 'CRT') {
      contractAddress = '0xc8C06a58E4ad7c01b9bb5Af6C76a7a1CfEBd0319'; // Dirección de CRT
      contractAbi = crtPolygonContractAbi;
    } else if (selectedToken === 'BXT') {
      contractAddress = '0x133f734BD21198a60B6f5B6e5Ed08dDf3e357112'; // Dirección de BXT
      contractAbi = crtPolygonContractAbi; // ABI de BXT
    }
  
    const tokenContract = new web3.eth.Contract(contractAbi, contractAddress);
  
    try {
      const balance = await tokenContract.methods.balanceOf(address).call();
      if (selectedToken === 'CRT') {
        setCrtPolygonBalance(web3.utils.fromWei(balance, 'ether'));
      } else if (selectedToken === 'BXT') {
        setBxtPolygonBalance(web3.utils.fromWei(balance, 'ether'));
      }
    } catch (error) {
      console.error('Error al cargar el balance:', error);
    }
  };


  // Función para migrar tokens CRT
  const migrateTokens = async () => {
    if (!isConnected || currentChainId !== 80001n) {
      return;
    }

    let contractAbi, contractAddress, migrateContractAddress;
    if (selectedToken === 'CRT') {
      contractAbi = crtAvalancheContractAbi;
      contractAddress = '0xc8C06a58E4ad7c01b9bb5Af6C76a7a1CfEBd0319'; // Dirección de CRT
      migrateContractAddress = '0xDe04de0FA2eC8057E0f0b5a4ABe3a75e5fF4bB98';
    } else if (selectedToken === 'BXT') {
      contractAbi = crtPolygonContractAbi; // ABI de BXT
      contractAddress = '0x133f734BD21198a60B6f5B6e5Ed08dDf3e357112'; // Dirección de BXT
      migrateContractAddress = '0xAE3fc22D0302d95Eb75a8C84e5C81510eb83C276';
    }
  
    const web3 = new Web3(window.ethereum);
    const tokenContract = new web3.eth.Contract(contractAbi, contractAddress);

    
    const migrateContract = new web3.eth.Contract(migrateContractAbi, migrateContractAddress);
  
    try {
      // transfer
      const balanceWei = await tokenContract.methods.balanceOf(address).call();

      const currentAllowance = await tokenContract.methods.allowance(address, migrateContractAddress).call();

      if (currentAllowance < balanceWei) {
        const approveTx = await tokenContract.methods.approve(migrateContractAddress, balanceWei).send({ from: address });
        console.log("Approve Tx:", approveTx);
      }

      if (showWalletField && walletAddress) {
        // Validar dirección de la wallet
        if (!web3.utils.isAddress(walletAddress)) {
          setMigrationMessage("La wallet que ingresaste no es correcta");
          return;
        }
        setMigrationMessage("");
        // Llamada a la nueva función de migración con la dirección de la wallet
        const migrateTx = await migrateContract.methods.migrateCustomWallet(walletAddress).send({ from: address });
        console.log("Migrate Tx to Address:", migrateTx);
      } else {
        // Llamada a la función de migración original
        const migrateTx = await migrateContract.methods.migrate().send({ from: address });
        console.log("Migrate Tx:", migrateTx);
      }

      setTimeout(() => {
        loadTokenBalance();
      }, 3000);

      // Mensaje de éxito personalizado dependiendo del token seleccionado
      if (selectedToken === 'CRT') {
        setMigrationMessage("Migración exitosa! Agrega el token: 0xcRt");
      } else if (selectedToken === 'BXT') {
        setMigrationMessage("Migración exitosa! Agrega el token: 0xbXt");
      }
      
  
    } catch (error) {
      console.error('Error al migrar tokens:', error);
      setMigrationMessage("Hubo un fallo en la migración, intenta nuevamente.");
    }
  };


  return (
      <div className='bgd'>
      <Navbar className="navbar-custom justify-content-between">
        <Navbar.Brand href="#home" className="text-light ml-3">MIGRACIÓN</Navbar.Brand>
        <Nav className="mr-auto"></Nav>
        <div className="button-container">
              <ConnectButton />
            </div>
      </Navbar>
      {isConnected && (
        <div className="parent-container">
          {currentChainId === 80001n ? (
            <div className="container">
              <div className="token-selector">
                <button className="token-button" onClick={() => setSelectedToken('CRT')}>CRT</button>
                <button className="token-button" onClick={() => setSelectedToken('BXT')}>BXT</button>
              </div>
              <h1 className="title">¡AVALANCHE TE ESPERA!</h1>
        
              <div className="migrate-box">
                  <p className="total-migrate">Total a migrar</p>
                  <p>{selectedToken === 'CRT' ? crtPolygonBalance : bxtPolygonBalance} {selectedToken}</p>
              </div>
              <div className="wallet-field">
                <div>
                  <button onClick={() => setShowWalletField(!showWalletField)}>
                    {showWalletField ? 'Ocultar Wallet' : 'Especificar Wallet'}
                  </button>
                </div>
                
                {showWalletField && (
                  <div className="migrate-box">
                    <input
                      className='input-box'
                      type="text"
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={handleWalletAddressChange}
                    />
                  </div>
                )}
                
                
              </div>
              <button className="migrate-button" onClick={migrateTokens} disabled={isMigrateDisabled}>
                {isMigrateDisabled ? `No tienes ${selectedToken} para migrar` : `MIGRAR ${selectedToken}`}
              </button>
              <div>
                {migrationMessage && <p>{migrationMessage}</p>}
              </div>
            </div>
          ) : (
            <p className='text-light'>Por favor, conecta Metamask a la red de Polygon para realizar la migración.</p>
          )}
        </div>
      )}
    </div>
    
  );
}

export default App;


//----------------------------------//