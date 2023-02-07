let {
    getSongs,
    getSong,
    createSong,
    deleteSong,
    editSong,
    sellSong,
    buySong
} = require('../controllers/Songs')

module.exports = (router) => {

    router.get('/', async (req, res) => {

        try {
            var songs = await getSongs(
                req.query,
                req.query.page,
                req.query.perPage,
                req.user
            )
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

        let response = formatResponse(songs)
        let status = response.status || 200
        delete response.status

        return res.status(status || 200).json({
            ...response
        })

    })

    router.get('/:id', async (req, res) => {
        try {
            var song = await getSong(req.params.id, req.query)
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

    router.post('/', async (req, res) => {
        try {
            var song = await createSong(req.body)
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
    router.post('/sell', async (req, res) => {
        try {
            var song = await sellSong(req.body)
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
    router.post('/buy', async (req, res) => {
        try {
            var song = await buySong(req.body, req.user)
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
    router.patch('/:id', async (req, res) => {
        try {
            var song = await editSong(req.params.id, req.body)
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

    router.delete('/:id', async (req, res) => {
        try {
            var song = await deleteSong(req.params.id)
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

        return res.json(formatResponse(song))

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
