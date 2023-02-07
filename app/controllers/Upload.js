let { Song, Album, User } = require('../models'),
    { transaction } = require('objection'),
    { processMinting, minyBatchTransactionsForSong } = require('../lib/near')
const fs = require("fs"),
    path = require("path"),
    moment = require("moment")
const { utils: { format: { parseNearAmount } } } = require('near-api-js');
const del = require('del');
const { getNearPriceInUSD } = require('../lib/near')
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const ipfsGateway = 'https://amplify-dev.mypinata.cloud'
module.exports = {
    ipfsGateway,
    async uploadFileToPinata(path, metaname, keyvalues = {}) {
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
    },
    async uploadFile(file, body) {
        let uploadedJSON = await module.exports.uploadFileToPinata(fs.createReadStream(path.resolve() + '/' + file.path), body.name, {})
        if (uploadedJSON.isDuplicate) {
            let album = await Album.query().findOne({ is_deleted: false, cover_cid: uploadedJSON.IpfsHash })
            if (album) {
                throw {
                    message: `This is already associated with album with title : ${album.title}`,
                    type: 'EXISTS'
                }
            } else {
                let song = await Song.query().findOne({ is_deleted: false, song_cid: uploadedJSON.IpfsHash })
                console.log(song, 'song')
                if (song) {
                    throw {
                        message: `This is already associated with song with title : ${song.title}`,
                        type: 'EXISTS'
                    }
                }
            }
            await del.sync([`${path.resolve()}/${file.path}`])
        }
        return uploadedJSON;
    },
    async uploadJSONToPinata(body, metaname, keyvalues = {}) {
        const options = {
            pinataMetadata: {
                name: metaname,
                keyvalues
            },
            pinataOptions: {
                cidVersion: 0
            }
        };
        return await pinata.pinJSONToIPFS(body, options)
    },
    async uploadAlbum(albumBody, user_id) {
        if (!albumBody.cover) {
            throw {
                message: 'Album cover should be provided'
            }
        }
        if (!albumBody.name) {
            throw {
                message: 'Album name should be provided'
            }
        }
        const uploadedAlbum = await transaction(
            User,
            Album,
            async (User, Album) => {
                const user = await User.query().findById(user_id)
                let albumUrl = `${ipfsGateway}/ipfs/${albumBody.cover}`
                // upload metadata for the song
                const albumSchema = {}
                albumSchema['name'] = `${albumBody.name}`
                albumSchema['cover'] = albumUrl
                albumSchema['description'] = `${albumBody.description}`
                let metaObj = await module.exports.uploadJSONToPinata(albumSchema, albumBody.name + '- Info', {})
                let metdataUrl = `${ipfsGateway}/ipfs/${metaObj.IpfsHash}`
                let { USD } = await getNearPriceInUSD()
                let nearPrice = parseInt(albumBody.price / 100) / USD
                let price = parseNearAmount(`${nearPrice}`)
                // mint token with song url
                try {
                    // await del.sync([`${path.resolve()}/${file.path}`])
                    const album = await Album.query().insert({
                        cid: metaObj.IpfsHash,
                        title: albumBody.name,
                        description: albumBody.description,
                        cover_cid: albumBody.cover,
                        user_id: user.id,
                        qty: parseInt(albumBody.qty) || 1,
                        available_qty: parseInt(albumBody.qty),
                        current_owner: user_id,
                        price: albumBody.price,
                        yocto_near_price: price,
                        minting_cost: (0.1 * USD).toFixed(2) * 100
                    })
                    return {
                        album_id: album.id,
                        owner: user.near_account_id,
                        medadata: metdataUrl,
                        ...album,
                        cover_url: albumUrl,
                        // txn_hash: txnHash,
                    }
                } catch (e) {
                    console.log(e, 'MES')
                    throw {
                        message: JSON.parse(e.message).kind.ExecutionError
                    }
                }
            })
        return uploadedAlbum
    },
    async uploadSongs(songBody, user_id) {
        let songsMetadata = songBody.metadata
        songsMetadata.map(f => {
            if (!f.title) {
                throw {
                    message: 'Song title is missing for one of your files'
                }
            }
        })
        let qty = songBody.qty
        delete songBody.qty
        const uploadedSongs = await transaction(
            User,
            Song,
            async (User, Song) => {
                const user = await User.query().findById(user_id)

                let album = await Album.query().findOne({ id: songBody.album_id })
                if (!album) {
                    throw {
                        message: 'Album does not exist'
                    }
                }
                let albumUrl = `${ipfsGateway}/ipfs/${album.cid}`

                // upload file to pinata
                const results = await Promise.all(songsMetadata.map(async (file, index) => {
                    let songUrl = `${ipfsGateway}/ipfs/${file.hash}`
                    // upload metadata for the song
                    const songSchema = {}
                    const now = new Date().getTime()
                    songSchema['date'] = now
                    songSchema['name'] = `${songsMetadata[index].title}`
                    songSchema['album'] = albumUrl
                    songSchema['description'] = `${songsMetadata[index].description}`
                    songSchema['song_url'] = songUrl

                    let metaObj = await module.exports.uploadJSONToPinata(songSchema, songsMetadata[index].title + '- Info', {})

                    let metdataUrl = `${ipfsGateway}/ipfs/${metaObj.IpfsHash}`
                    // mint token with song url
                    try {
                        await del.sync([`${path.resolve()}/${file.path}`])

                        const song = await Song.query().insert({
                            cid: metaObj.IpfsHash,
                            title: songsMetadata[index].title,
                            user_id: user.id,
                            released_year: new Date(),
                            lyricist: songBody.lyricist,
                            genre: songBody.genre,
                            singer: songBody.singer,
                            song_cid: file.hash,
                            album_id: album.id,
                            current_owner: user_id,
                            qty,
                            available_qty: qty
                        })

                        // await Song.query().patchAndFetchById(song.id, {
                        //     txn_hash: txnHash
                        // })
                        return {
                            owner: user.near_account_id,
                            medadata: metdataUrl,
                            ...song,
                            // txn_hash: txnHash
                        }
                    } catch (e) {
                        console.log(e)
                        // since minting fails, delete album record
                        console.log(album, 'adsfdf')
                        await Album.query().patchAndFetchById(album.id, { is_deleted: true })
                        throw {
                            message: JSON.parse(e.message).kind.ExecutionError
                        }
                    }

                }))

                let songsHashes = results.map(r => r.song_cid)
                // add album cover as NFT
                songsHashes.push(album.cover_cid)
                const albumSchema = {}
                albumSchema['title'] = `${album.title}`
                albumSchema['media'] = albumUrl
                albumSchema['copies'] = album.qty
                // albumSchema['issued_at'] = now
                albumSchema['description'] = `${album.description}`
                albumSchema['songs'] = results.map(r => ({ title: r.title, url: `${ipfsGateway}/ipfs/${r.song_cid}` }))
                try {
                    const txnHash = await processMinting(album.cover_cid, songsHashes, parseInt(qty), album.yocto_near_price, user.near_account_id,)
                    await Album.query().patchAndFetchById(album.id, {
                        txn_hash: txnHash,
                    })
                    return {
                        results
                    }
                } catch (e) {
                    console.log(JSON.parse(e.message))
                    // since minting fails, delete album record
                    await Album.query().patchAndFetchById(album.id, { is_deleted: true })
                    throw {
                        message: JSON.parse(e.message).kind.ExecutionError
                    }
                }

            })
        return uploadedSongs
    },
}
