const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK('1f90852a0c130b04ab9b', '947b290a669955f38545055a79e5a56b5f9e3fafdb717bdb9fa1cf5ffdfeae80');
const fs = require('fs')

const ipfsGateway = 'https://amplify-dev.mypinata.cloud'

async function uploadFileToPinata(path, metaname, keyvalues = {}) {
    const options = {
        pinataMetadata: {
            name: metaname,
            keyvalues
        },
        pinataOptions: {
            cidVersion: 0
        }
    };
    return await pinata.pinFileToIPFS(path, options)
}

async function init() {
    let results = await Promise.all([
        fs.createReadStream(`./uploads/bro1.mp3`), fs.createReadStream(`./uploads/bro2.mp3`), fs.createReadStream(`./uploads/bro3.mp3`)
    ].map((file, i) => uploadFileToPinata(file, `Bro${i}`, {})))
}