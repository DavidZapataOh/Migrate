import Web3 from 'web3';
import * as XLSX from 'xlsx';
import erc20ABI from '../contracts/erc20ABI';
import airdropABI from '../contracts/airdropABI';

export const networkConfigs = {
  '80001': { // Mumbai testnet
    tokenAddress: '0xc8C06a58E4ad7c01b9bb5Af6C76a7a1CfEBd0319',
    airdropContractAddress: '0xAD5aCd1325700849c55e38FB329334316Cbe954b'
  },
  '43114': { // Avalanche mainnet
    tokenAddress: '0x3deC4aA8bC74fC3289A7BDaffAfDB43385836A7A',
    airdropContractAddress: '0xC3Fe0D8E8DCfAF4E86Df5A27e71777b18A121306'
  },
  '43113': { // Fuji testnet
    tokenAddress: '0x3deC4aA8bC74fC3289A7BDaffAfDB43385836A7A',
    airdropContractAddress: '0xC3Fe0D8E8DCfAF4E86Df5A27e71777b18A121306'
  }
}

export async function runAirdrop(provider, account, file, networkConfig) {
  const web3 = new Web3(provider);

  // Aquí están tus direcciones de contrato
  const tokenAddress = networkConfig.tokenAddress;
  const airdropContractAddress = networkConfig.airdropContractAddress;

  const tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress);
  const airdropContract = new web3.eth.Contract(airdropABI, airdropContractAddress);

  // Leer los datos de Excel
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});

      let sheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(sheet, {header:1});

      let tokenName = jsonData[0][0];
      let addresses = [];
      let amounts = [];

      for(let i = 2; i < jsonData.length; i++) {
        if(!jsonData[i][0] || !jsonData[i][1] || typeof jsonData[i][0] === 'undefined' || typeof jsonData[i][1] === 'undefined') continue;
        addresses.push(jsonData[i][0]);
        amounts.push(jsonData[i][1]);
      }

      // Crea y envía las transacciones
      const approveTx = {
        from: account,
        to: tokenAddress,
        data: tokenContract.methods.approve(airdropContractAddress, web3.utils.toWei('134591', 'ether')).encodeABI(),
        gas: 60000
      };

      web3.eth.sendTransaction(approveTx).on('receipt', (receipt) => {
        const airdropTx = {
          from: account,
          to: airdropContractAddress,
          data: airdropContract.methods.airdropToken(tokenName, addresses, amounts.map(amount => web3.utils.toWei(amount.toString(), 'ether'))).encodeABI(),
          gas: 2000000
        };

        web3.eth.sendTransaction(airdropTx).on('receipt', resolve).on('error', reject);
      }).on('error', reject);
    };
    reader.readAsArrayBuffer(file);
  });
}
