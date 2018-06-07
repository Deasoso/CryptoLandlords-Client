import Web3 from 'web3';
import ABI from '@/contract/DDZ_abi.json';
//import Code from '@/contract/DDZ_data.bin';
import Promise from 'bluebird';
// // import * as config from '@/config';

// const getWeb3 = new Promise(function(resolve) {
//     window.addEventListener('load', function() {
//         var results;
//         var web3 = window.web3;
//         if (typeof web3 !== 'undefined') {
//             // Use Mist/MetaMask's provider.
//             web3 = new Web3(web3.currentProvider);
//             results = {
//                 web3: web3
//             };
//             console.log('Injected web3 detected.');
//             resolve(results);
//         } else {
//             alert('请安装MetaMask插件并解锁您的以太坊账户');
//         }
//     })
// });
// var web3;
//getWeb3.then(function(results) {
    //     web3 = results.web3;
    //     //await deploy();
    // });
    // deploy = async() =>
// {
//     var _name = "ddz_game" ;
//     console.log("hello2");
//     //console.log(web3.eth);
//     var contractat = '0xf421dc58733c8dde61e5ba17e7dfaed5a81e6eb2';
//     ddzcontract = web3.eth.contract(ABI).at(contractat);
//     // ddzcontract.new(
//     //     _name,
//     //     {
//     //         from: web3.eth.accounts[0],
//     //         data: '@/contract/DDZ_data.bin',
//     //         gas: '288628',
//     //         gasPrice: 4
//     //     }, function (e, contract){
//     //         console.log(e, contract);
//     //         if (e !== 'undefined') {
//     //             if (typeof contract.address !== 'undefined') {
//     //                 console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
//     //             } else {
//     //                 console.log('Contract mined! transactionHash: ' + contract.transactionHash);
//     //             }
//     //         }
//     //     });
// };
const web3Provider = window.web3 ? window.web3.currentProvider : null;
const web3 = web3Provider
  ? new Web3(web3Provider)
  : new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/DQtbJQhdBnp43bneIiqp"));//config.defaultNetwork.rpc));

web3.eth.defaultAccount = web3.eth.accounts[0];
DDZ_DEBUG && console.log("hello");
DDZ_DEBUG && console.log(web3);
var contractat = '0x9aafd76a87e09b15754de910e61f6a17d28f3e27';
var ddzcontract = web3.eth.contract(ABI).at(contractat);

export const newroundevent = ddzcontract.Newround();

export const joingame = () => new Promise((resolve, reject) => {
    DDZ_DEBUG && console.log("joining game");
    ddzcontract.join({
        value: 0,
        gasPrice: 1000000000 * 5
    },
    (err, result) => (err ? reject(err) : resolve(result)));
});

export const sellcoin = coin => new Promise((resolve, reject) => {
    getrate().then((rate) => {
        DDZ_DEBUG && console.log("selling coin " + coin + " " + rate);
        ddzcontract.sell(coin, {
            value: 0, 
            gasPrice: 1000000000 * 5
        },
        (err, result) => (err ? reject(err) : resolve(result)));
    });
});
export const buycoin = coin => new Promise((resolve, reject) => {
    getrate().then((rate) => {
        DDZ_DEBUG && console.log("buying coin " + coin + " " + rate);
        ddzcontract.buy(coin, {
            value: coin * rate, 
            gasPrice: 1000000000 * 5
        },
        (err, result) => (err ? reject(err) : resolve(result)));
    });
});
export const requestround = (player1, player2, player3, coin) => 
new Promise((resolve, reject) => {
    DDZ_DEBUG && console.log("requesting round" + ":" + player1 + ":" + player2 + ":" + player3);
    ddzcontract.addround(player1, player2, player3, coin, {
      value: 0,
      gasPrice: 1000000000 * 5
    },
    (err, result) => (err ? reject(err) : resolve(result)));
});
export const startround = (roundid) => new Promise((resolve, reject) => {
    DDZ_DEBUG && console.log("starting round");
    ddzcontract.startround(roundid, {
      value: 0,
      gasPrice: 1000000000 * 5
    },
    (err, result) => (err ? reject(err) : resolve(result)));
});
export const endround = (roundid, landlordaddr, farmerwin) => 
new Promise((resolve, reject) => {
    DDZ_DEBUG && console.log("ending round");
    ddzcontract.endround(roundid, landlordaddr, farmerwin, {
      value: 0,
      gasPrice: 1000000000 * 5
    },
    (err, result) => (err ? reject(err) : resolve(result)));
});
//=====================================
export const getMe = async () => {
    if (!window.web3) {
        throw Error('NO_METAMASK');
    }
    const me = {};
    me.address = (await Promise.promisify(web3.eth.getAccounts)())[0];
  
    if (me.address) {
        me.joined = await Promise.promisify(ddzcontract.isjoined)(me.address);
        if(!me.joined) throw Error('NONE_JOINED');
        me.coin = await Promise.promisify(ddzcontract.getBalance)(me.address);
        return me;
    }
    throw Error('METAMASK_LOCKED');
};
export const getCoin = async (address) => {
    return await Promise.promisify(ddzcontract.getBalance)(address);
}
export const getrate = async () => {
    return await Promise.promisify(ddzcontract.getrate)();
}
export const playerisjoined = async (address) => {
    return await Promise.promisify(ddzcontract.isjoined)(address);
}