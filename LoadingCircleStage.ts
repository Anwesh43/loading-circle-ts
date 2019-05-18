const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 0.05
const sizeFactor : number = 0.51
const foreColor : string = "#303F9F"
const backColor : string = "#BDBDBD"
const nodes : number = 5
const parts : number = 2

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n,  ScaleUtil.maxScale(scale, i, n)) * n
    }

    static scaleFactor(scale : number) : number {
        return Math.floor(scale / scDiv)
    }

    static mirrorValue(scale : number, a : number, b : number) : number {
        const k : number = ScaleUtil.scaleFactor(scale)
        return (1 - k) / a + k / b
    }

    static updateValue(scale : number, dir : number, a : number, b : number) : number {
        return ScaleUtil.mirrorValue(scale, a, b) * dir * scGap
    }
}

class DrawingUtil {

    static drawArc(context : CanvasRenderingContext2D, r : number, start : number, end : number) {
        context.beginPath()
        for (var i = start; i <= end; i++) {
            const deg = i * Math.PI / 180
            const x : number = r * Math.cos(deg)
            const y : number = r * Math.sin(deg)
            if (i == start) {
                context.moveTo(x, y)
            } else {
                context.lineTo(x, y)
            }
        }
        context.stroke()
    }

    static drawLoadingSemiCircle(context : CanvasRenderingContext2D, size : number, sc : number) {
        const sc1 : number = ScaleUtil.divideScale(sc, 0, parts)
        const sc2 : number = ScaleUtil.divideScale(sc, 1, parts)
        DrawingUtil.drawArc(context, size, -90 + 180 * sc2, 180 * sc1)
    }

    static drawLCNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const gap : number = h / (nodes + 1)
        const size : number = gap / sizeFactor
        context.strokeStyle = foreColor
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.save()
        context.translate(w / 2, gap * (i + 1))
        for (var j = 0; j < parts; j++) {
            DrawingUtil.drawLoadingSemiCircle(context, size, ScaleUtil.divideScale(scale, j, parts))
        }
        context.restore()
    }
}
