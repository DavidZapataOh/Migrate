import Web3 from 'web3';
import { Navbar, Nav, Button, Form, FormControl } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import './styles/App.css';
import migrateContractAbi from './contracts/migrateABI'
import crtPolygonContractAbi from './contracts/erc20ABI';
import crtAvalancheContractAbi from './contracts/erc20ABI';

function App() {

  // Estados para almacenar el proveedor, cuenta, red y balance de CRT
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const [crtPolygonBalance, setCrtPolygonBalance] = useState('0');
  const [isMigrateDisabled, setIsMigrateDisabled] = useState(true);
  const [migrationMessage, setMigrationMessage] = useState('');

  // Escuchar cambios en la cadena y cuentas de MetaMask
  useEffect(() => {
    if (provider) {
      provider.on('chainChanged', handleNetworkChange);
    }
    return () => {
      if (provider) {
        provider.off('chainChanged', handleNetworkChange);
      }
    }
  }, [provider]);

  useEffect(() => {
    if (provider) {
      provider.on('accountsChanged', handleAccountsChanged);
    }
  
    return () => {
      if (provider) {
        provider.off('accountsChanged', handleAccountsChanged);
      }
    };
  }, [provider]);
  
  // Cargar balance de CRT cuando la cuenta o la red cambien
  useEffect(() => {
    if (account && network === '80001') {
      loadCrtBalance();
    }
  }, [account, network]);

  // Habilitar o deshabilitar el botón de migración basado en el balance de CRT
  useEffect(() => {
    setIsMigrateDisabled(crtPolygonBalance <= '1');
  }, [crtPolygonBalance]);
  
  // Función para cargar el balance de CRT del usuario
  const loadCrtBalance = async () => {
    const web3 = new Web3(provider); // Inicializa web3 con el proveedor de Metamask
    const crtContractAddress = '0xc8C06a58E4ad7c01b9bb5Af6C76a7a1CfEBd0319'; // Reemplaza con la dirección de tu contrato
    const crtContract = new web3.eth.Contract(crtPolygonContractAbi, crtContractAddress);

    try {
      const balance = await crtContract.methods.balanceOf(account).call();
      setCrtPolygonBalance(web3.utils.fromWei(balance, 'ether')); // Convierte de Wei a Ether si es necesario
    } catch (error) {
      console.error('Error al cargar el balance de CRT:', error);
    }
  };

  // Manejar cambios en la red de blockchain
  const handleNetworkChange = async (_chainId) => {
    const network = await provider.request({ method: 'net_version' });
    setNetwork(network);
    const networkName = getNetworkName(network);
    setNetworkName(networkName);
  }

  // Manejar cambios en las cuentas de MetaMask
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      console.log("Por favor, conecta a MetaMask.");
    } else {
      setAccount(accounts[0]);
      loadCrtBalance();
    }
  };

  // Función para migrar tokens CRT
  const migrateTokens = async () => {
    if (!account || network !== '80001') {
      return;
    }


  
    const web3 = new Web3(provider);
    const crtContractAddress = '0xc8C06a58E4ad7c01b9bb5Af6C76a7a1CfEBd0319'; // Polygon CRT address 
    const crtContract = new web3.eth.Contract(crtAvalancheContractAbi, crtContractAddress);

    const migrateContractAddress = '0x25846e920BCb9DfaA9bd297a5Ec2500cdF763F32';
    const migrateContract = new web3.eth.Contract(migrateContractAbi, migrateContractAddress);
  
    try {
      // transfer
      const balanceWei = await crtContract.methods.balanceOf(account).call();

      const currentAllowance = await crtContract.methods.allowance(account, migrateContractAddress).call();

      if (currentAllowance < balanceWei) {
        const approveTx = await crtContract.methods.approve(migrateContractAddress, balanceWei).send({ from: account });
        console.log("Approve Tx:", approveTx);
      }

      const migrateTx = await migrateContract.methods.migrate().send({ from: account });
      console.log("Migrate Tx:", migrateTx);

      setMigrationMessage("Migración exitosa! Agrega el token: 0xb583D7191C41D9dbE86a08dae80D64926BF4C9bE");
      await loadCrtBalance();
  
    } catch (error) {
      console.error('Error al migrar tokens:', error);
      setMigrationMessage("Hubo un fallo en la migración, intenta nuevamente.");
    }
  };
  
  // Obtener el nombre de la red basado en el identificador de la red
  const getNetworkName = (network) => {
    switch(network) {
      case '80001':
        return 'Mumbai';
      case '43114':
        return 'Avalanche';
      case '43113':
        return 'Fuji';
      default:
        return 'Otra';
    }
  }

  // Conectar con la wallet de MetaMask
  async function connectMetamask() {
    const provider = await detectEthereumProvider();
    if (provider) {
      setProvider(provider);
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      const network = await provider.request({ method: 'net_version' });
      setNetwork(network);
      const networkName = getNetworkName(network);
      setNetworkName(networkName);
      if (!['80001', '43114', '43113'].includes(network)) {
      }
    }
  }

  return (
    <div className='bgd'>
      <Navbar className="navbar-custom justify-content-between">
        <Navbar.Brand href="#home" className="text-light ml-3">CRT V2</Navbar.Brand>
        <Nav className="mr-auto"></Nav>
        <Form inline className="ml-auto">
          {account && (
              <span className="text-light button-container">Red: {networkName}</span>
          )}
          {account ? (
            <div className="button-container">
              <FormControl type="text" value={account} readOnly className="mr-sm-2 account" />
            </div>
          ) : (
            <div className="button-container">
              <Button variant="outline-info" className="metamask-button" onClick={connectMetamask}>Conectar a Metamask</Button>
            </div>
          )}
        </Form>
      </Navbar>
      {account && (
        <div className="parent-container">
          {['80001'].includes(network) ? (
            <div className="container">
              <h1 className="title">¡AVALANCHE TE ESPERA!</h1>
              <div className="migrate-box">
                  <p className="total-migrate">Total a migrar</p>
                  <p>{crtPolygonBalance} CRT</p>
              </div>
              <button className="migrate-button" onClick={migrateTokens} disabled={isMigrateDisabled}>
                {isMigrateDisabled ? 'No tienes CRT para migrar' : 'MIGRAR'}
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
