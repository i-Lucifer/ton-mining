import {Address} from "ton"

import {TonClient} from "ton"
import {getHttpEndpoint} from "@orbs-network/ton-access";

import {BN} from 'bn.js'

async function main () {

  const wallet = Address.parse('UQCTU9tGq16RGCsbMWzQ6_FVJaVOAiWUG3CyLk0Ywo1BD4Sx');

  // const collection = Address.parse('https://testnet.getgems.io/collection');
  const collection = Address.parse('EQDk8N7xM5D669LC2YACrseBJtDyFqwtSPCNhRWXU7kjEptX');

  const endpoint = await getHttpEndpoint({
    // host:"https://testnet.toncenter.com/api/v2/jsonRPC",
    network: "testnet",
  });

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

}

main()