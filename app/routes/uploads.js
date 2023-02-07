let { uploadAlbum, uploadSongs, uploadFile } = require('../controllers/Upload')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

module.exports = (router) => {
    router.post('/', upload.single('file'), async (req, res) => {
        try {
            var song = await uploadFile(req.file, req.body)
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

    }),
        router.post('/album', async (req, res) => {
            try {
                var song = await uploadAlbum(req.body, req.user.id)
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
    router.post('/song', async (req, res) => {
        try {
            var song = await uploadSongs(req.body, req.user.id)
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
