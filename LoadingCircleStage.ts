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

class LoadingCircleStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : LoadingCircleStage = new LoadingCircleStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += ScaleUtil.updateValue(this.scale, this.dir, parts, parts)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class LCNode {

    state : State = new State()
    next : LCNode
    prev : LCNode

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new LCNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawLCNode(context, this.i, this.state.scale)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : LCNode {
        var curr : LCNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class LoadingCircle {

    root : LCNode = new LCNode(0)
    curr : LCNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    animator : Animator = new Animator()
    lc : LoadingCircle = new LoadingCircle()

    render(context : CanvasRenderingContext2D) {
        this.lc.draw(context)
    }

    handleTap(cb : Function) {
        this.lc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.lc.update(() => {
                    cb()
                    this.animator.stop()
                })
            })
        })
    }
}
