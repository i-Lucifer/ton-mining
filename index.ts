import {Address} from "ton"

import {TonClient} from "ton"
import {getHttpEndpoint} from "@orbs-network/ton-access";

import {BN} from 'bn.js'

import {unixNow} from "./src/lib/utils";
import {MineMessageParams, Queries} from "./src/giver/NftGiver.data";

import {toNano} from "ton"

async function main () {

  // 1. 链接合约，读取seed种子，以及要计算的hash难度

  // const wallet = Address.parse('UQCTU9tGq16RGCsbMWzQ6_FVJaVOAiWUG3CyLk0Ywo1BD4Sx');
  const wallet = Address.parse('UQDbkRGNOQA5xQzczBOM7cqnrH_tqwW1MzMIP9SnYex2wTnH');

  // const collection = Address.parse('https://getgems.io/collection/');
  // const collection = Address.parse('https://testnet.getgems.io/collection/');
  const collection = Address.parse('EQDk8N7xM5D669LC2YACrseBJtDyFqwtSPCNhRWXU7kjEptX');

  // const endpoint = await getHttpEndpoint({
    // host:"https://testnet.toncenter.com/api/v2/jsonRPC",
    // network: "testnet", // 注释掉就是主网
  // });

  const endpoint = await getHttpEndpoint();

  const client = new TonClient({ endpoint });

  const miningData = await client.callGetMethod(collection, 'get_mining_data') // 调用合约的getter方法
  
  // console.log(miningData)
  // {
  //   gas_used: 2374,
  //   stack: [
  //     [
  //       'num',
  //       '0x1000000000000000000000000000000000000000000000000000000000000000' // 工作量证明复杂性，越大越好
  //     ],
  //     [ 'num', '0x66ccb931' ], // 时间戳 最后一次挖矿交易
  //     [ 'num', '0x465e0ea6bb6bec988cbe44adaa0c3f9a' ], // 种子，计算hash需要种子

  // 工作量证明复杂性的三个参数
  //     [ 'num', '0x1e' ],
  //     [ 'num', '0xab' ],
  //     [ 'num', '0xfc' ]
  //   ]
  // }

  const parseStackNum = (sn: any) => new BN(sn[1].substring(2), 'hex');

  const complexity = parseStackNum(miningData.stack[0]);
  const last_success = parseStackNum(miningData.stack[1]);
  const seed = parseStackNum(miningData.stack[2]);
  const target_delta = parseStackNum(miningData.stack[3]);
  const min_cpl = parseStackNum(miningData.stack[4]);
  const max_cpl = parseStackNum(miningData.stack[5]);

  console.log('complexity', complexity);
  console.log('last_success',miningData.stack[1],"===>", last_success.toString());
  console.log('seed',miningData.stack[2],"===>", seed);
  console.log('target_delta',miningData.stack[3],"===>",target_delta.toString());
  console.log('min_cpl',miningData.stack[4],"===>", min_cpl.toString());
  console.log('max_cpl',miningData.stack[5],"===>", max_cpl.toString());
  console.log("")
  console.log("====================")
  console.log("")

  // 2. 循环计算工作量证明hash
  const mineParams : MineMessageParams = {
    expire: unixNow() + 300, // 5分钟完成一次转账交易
    mintTo: wallet,
    data1: new BN(0), // 要在矿机中递增的临时变量，计数器
    seed // 从 get_mining_data 接口获取的唯一种子
  };

  let msg = Queries.mine(mineParams);
  let progress = 0;

  while (new BN(msg.hash(), 'be').gt(complexity)) {
    progress += 1
    console.clear()
    console.log(`Mining started: please, wait for 30-60 seconds to mine your NFT!`)
    console.log(' ')
    console.log(`⛏ Mined ${progress} hashes! Last: `, new BN(msg.hash(), 'be').toString())

    mineParams.expire = unixNow() + 300
    mineParams.data1.iaddn(1)
    msg = Queries.mine(mineParams)
  }

  console.log(' ')
  console.log('💎 Mission completed: msg_hash less than pow_complexity found!');
  console.log(' ')
  console.log('msg_hash: ', new BN(msg.hash(), 'be').toString())
  console.log('pow_complexity: ', complexity.toString())
  console.log('msg_hash < pow_complexity: ', new BN(msg.hash(), 'be').lt(complexity))

  console.log(' ');
  console.log("💣 WARNING! As soon as you find the hash, you should quickly send the transaction.");
  console.log("If someone else sends a transaction before you, the seed changes, and you'll have to find the hash again!");
  console.log(' ');

  // 3. 构建支付链接，进行区块打包
  // 转化为友好地址形式
  const collectionAddr = collection.toFriendly({
    urlSafe: true,
    bounceable: true,
  })
  // 将Ton转化为nanoTon
  const amountToSend = toNano('0.05').toString()
 // BOC means Bag Of Cells here
  const preparedBodyCell = msg.toBoc().toString('base64url')

  // 构建支付链接的闭包函数
  const tonDeepLink = (address: string, amount: string, body: string) => {
    return `ton://transfer/${address}?amount=${amount}&bin=${body}`;
  };

  // 构建支付链接
  const link = tonDeepLink(collectionAddr, amountToSend, preparedBodyCell);

  console.log('🚀 Link to receive an NFT:') // 支付链接
  console.log(link);

  // 4. 为支付链接生成支付二维码
  const qrcode = require('qrcode-terminal');

  qrcode.generate(link, {small: true}, function (qrcode : any) {
    console.log('🚀 Link to mine your NFT (use Tonkeeper in testnet mode):')
    console.log(qrcode);
    console.log('* If QR is still too big, please run script from the terminal. (or make the font smaller)')
  });

  // 5. 付款后，就挖掘到一个NFT（非同质化货币）
}

main()