let {
    getUserNFTs,
    getUserByIdNFTs,
    getNFTOwner,
    mintToken
} = require('../controllers/UserNFT')

module.exports = (router) => {
    router.get('/:id(\\d+)', async (req, res) => {
        try {
            var song = await getUserByIdNFTs(req.params.id, req.query)
        } catch (error) {
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(song)
        let status = response.status || 200
        delete response.status


        return res.status(status || 200).json({
            ...response
        })

    })

    router.get('/', async (req, res) => {
        try {
            var song = await getUserNFTs(req.user.id, req.query)
        } catch (error) {
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(song)
        let status = response.status || 200
        delete response.status


        return res.status(status || 200).json({
            ...response
        })

    })
    router.post('/owner/:token', async (req, res) => {
        try {
            var song = await getNFTOwner(req.params.token, req.user)
        } catch (error) {
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(song)
        let status = response.status || 200
        delete response.status


        return res.status(status || 200).json({
            ...response
        })

    })
    router.post('/mint', async (req, res) => {
        try {
            var song = await mintToken(req.body, req.user)
        } catch (error) {
            if (error.statusCode === 500) {
                console.error(error)
            }
            let errResponse = formatResponse({ error }, true)
            let status = errResponse.status || 500
            delete errResponse.status
            return res.status(status).json({
                ...errResponse
            })
        }

        let response = formatResponse(song)
        let status = response.status || 200
        delete response.status


        return res.status(status || 200).json({
            ...response
        })

    })
    return router
}

function formatResponse(result, isError = false) {

    if (isError === true) {
        return {
            message: result.error.message.message || result.error.message,
            success: false,
            status: result.error.statusCode
        }
    }
    return {
        ...result,
        success: true,
        status: 200
    }
}
