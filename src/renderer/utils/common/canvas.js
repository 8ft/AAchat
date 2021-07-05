module.exports = {
    /** 截断文字，并用...链接
    *@param content:要处理的内容
    *@param cxt:canvas的上下文环境
    *@param maxLen:几个字符以内不需要处理
    *@param rowWidth:行宽
    *@param fontWidth:文字宽度
    **/
    contentCut(content, ctx, maxLen, rowWidth, fontWidth) {
        if (content.length <= maxLen) {
            return content
        }
        if (ctx.measureText(content).width > rowWidth) {
            let words = content.slice(0, maxLen - 2)
            const maxWidth = rowWidth - fontWidth * 2
            for (let i = maxLen; i < content.length; i++) {
                words += content[i]
                if (ctx.measureText(words).width > maxWidth) {
                    return `${words.slice(0, -1)}...${content.slice(-1)}`
                }
            }
        } else {
            return content
        }
    },

    /** 文字切割成多行
    *@param content:要处理的内容
    *@param cxt:canvas的上下文环境
    *@param maxLen:几个字符以内不需要处理
    *@param rowWidth:行宽
    *@param fontWidth:文字宽度
    **/
    contentBreak(content, ctx, maxLen, rowWidth, fontWidth) {
        if (content.length <= maxLen) {
            return content
        }

        const rows = []
        let curRow = 0
        let curWords
        let newWords

        const words = content.split(' ')
        if (words.length > 1) {
            rows.push(words[0])
            for (let i = 1; i < words.length; i++) {
                curWords = rows[curRow]
                newWords = `${curWords} ${words[i]}`
                if (ctx.measureText(newWords).width > rowWidth) {
                    rows.push(words[i])
                    curRow++
                } else {
                    rows[curRow] = newWords
                }
            }
            return rows
        } else {
            rows.push(content.slice(0, maxLen))
            for (let i = maxLen; i < content.length; i++) {
                curWords = rows[curRow]
                newWords = `${curWords}${content[i]}`
                if (ctx.measureText(newWords).width > rowWidth) {
                    rows.push[content[i]]
                    curRow++
                } else {
                    rows[curRow] = newWords
                }
            }
            return rows
        }
    },

    /** 绘制一个有填充色的圆角矩形
    *@param cxt:canvas的上下文环境
    *@param x:左上角x轴坐标
    *@param y:左上角y轴坐标
    *@param width:矩形的宽度
    *@param height:矩形的高度
    *@param radius:圆的半径
    *@param fillColor:填充颜色
    **/
    fillRoundRect(cxt, x, y, width, height, radius, /* optional*/ fillColor) {
        // 圆的直径必然要小于矩形的宽高
        if (2 * radius > width || 2 * radius > height) { return false }

        cxt.save()
        cxt.translate(x, y)
        // 设置阴影
        cxt.shadowOffsetX = 0
        cxt.shadowOffsetY = 0
        cxt.shadowBlur = 7
        cxt.shadowColor = '#C2C2C2'
        // 绘制圆角矩形的各个边
        this.drawRoundRectPath(cxt, width, height, radius)
        cxt.fillStyle = fillColor || '#000' // 若是给定了值就用给定的值否则给予默认值
        cxt.fill()
        cxt.restore()
    },

    /** 绘制圆角矩形
     *@param cxt:canvas的上下文环境
        *@param x:左上角x轴坐标
        *@param y:左上角y轴坐标
        *@param width:矩形的宽度
        *@param height:矩形的高度
        *@param radius:圆的半径
        *@param lineWidth:线条粗细
        *@param strokeColor:线条颜色
        **/
    strokeRoundRect(cxt, x, y, width, height, radius, /* optional*/ lineWidth, /* optional*/ strokeColor) {
        // 圆的直径必然要小于矩形的宽高
        if (2 * radius > width || 2 * radius > height) { return false }

        cxt.save()
        cxt.translate(x, y)
        // 绘制圆角矩形的各个边
        this.drawRoundRectPath(cxt, width, height, radius)
        cxt.lineWidth = lineWidth || 2 // 若是给定了值就用给定的值否则给予默认值2
        cxt.strokeStyle = strokeColor || '#000'
        cxt.stroke()
        cxt.restore()
    },

    drawRoundRectPath(cxt, width, height, radius) {
        cxt.beginPath(0)
        // 从右下角顺时针绘制，弧度从0到1/2PI
        cxt.arc(width - radius, height - radius, radius, 0, Math.PI / 2)

        // 矩形下边线
        cxt.lineTo(radius, height)

        // 左下角圆弧，弧度从1/2PI到PI
        cxt.arc(radius, height - radius, radius, Math.PI / 2, Math.PI)

        // 矩形左边线
        cxt.lineTo(0, radius)

        // 左上角圆弧，弧度从PI到3/2PI
        cxt.arc(radius, radius, radius, Math.PI, Math.PI * 3 / 2)

        // 上边线
        cxt.lineTo(width - radius, 0)

        // 右上角圆弧
        cxt.arc(width - radius, radius, radius, Math.PI * 3 / 2, Math.PI * 2)

        // 右边线
        cxt.lineTo(width, height - radius)
        cxt.closePath()
    }
}
