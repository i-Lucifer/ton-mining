import {Address} from "ton"

import {TonClient} from "ton"
import {getHttpEndpoint} from "@orbs-network/ton-access";

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
  
  console.log(miningData)
  // {
  //   gas_used: 2374,
  //   stack: [
  //     [
  //       'num',
  //       '0x1000000000000000000000000000000000000000000000000000000000000000'
  //     ],
  //     [ 'num', '0x66ccb931' ],
  //     [ 'num', '0x465e0ea6bb6bec988cbe44adaa0c3f9a' ],
  //     [ 'num', '0x1e' ],
  //     [ 'num', '0xab' ],
  //     [ 'num', '0xfc' ]
  //   ]
  // }

}

main()