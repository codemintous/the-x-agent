import {addressToBytes32} from '@layerzerolabs/lz-v2-utilities';

async function getAddress(){
    console.log(addressToBytes32('0x9c7Eddf2d733f5b818127741C52BBecd487cE6D9'))
}

getAddress();