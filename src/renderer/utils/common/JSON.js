module.exports = {
    foramtJsonLikeString(str) {
        try {
            if (typeof JSON.parse(str) == 'object') {
                return JSON.parse(str)
            } else {
                return str
            }
        } catch (e) {
            return str
        }
    }
}
