/* eslint-disable @typescript-eslint/no-explicit-any */
import styles from './index.css?inline'

interface IConfig {
    highlight: string | RegExp | string[]
}

export class HighlightInTextarea {
    ID: string
    private el: HTMLTextAreaElement | null
    private container: HTMLDivElement | null
    public highlight: IConfig | null
    private highlights: HTMLDivElement | null
    private backdrop: HTMLDivElement | null
    private browser: string | null

    constructor(el: HTMLTextAreaElement, config: IConfig) {
        this.backdrop = null
        this.container = null
        this.highlights = null
        this.ID = 'yetone-hit'
        this.el = el
        el.style.position = 'relative'
        this.browser = 'chrome'

        this.highlight = config
        this.generate()
    }

    generate() {
        if (!this.el) {
            return
        }

        this.el.classList.add(this.ID + '-input', this.ID + '-content')

        this.el.addEventListener('input', this.handleInput.bind(this))
        this.el.addEventListener('scroll', this.handleScroll.bind(this))

        this.highlights = document.createElement('div')
        this.highlights.classList.add(this.ID + '-highlights', this.ID + '-content')
        this.highlights.style.fontSize = window.getComputedStyle(this.el, null).getPropertyValue('font-size')

        this.backdrop = document.createElement('div')
        this.backdrop.classList.add(this.ID + '-backdrop')
        this.backdrop.append(this.highlights)

        this.container = document.createElement('div')
        this.container.classList.add(this.ID + '-container')
        this.el.parentNode?.insertBefore(this.container, this.el.nextSibling)
        const style = document.createElement('style')
        style.textContent = styles
        this.el.parentNode?.insertBefore(style, this.el.nextSibling)

        this.container.append(this.backdrop)
        this.container.append(this.el) // moves el into container

        this.container.addEventListener('scroll', this.blockContainerScroll.bind(this))

        this.browser = this.detectBrowser()
        switch (this.browser) {
            case 'firefox':
                this.fixFirefox()
                break
            case 'ios':
                this.fixIOS()
                break
        }

        // trigger input event to highlight any existing input
        this.handleInput()
    }

    // browser sniffing sucks, but there are browser-specific quirks to handle
    // that are not a matter of feature detection
    detectBrowser() {
        const ua = window.navigator.userAgent.toLowerCase()
        if (ua.indexOf('firefox') !== -1) {
            return 'firefox'
            // eslint-disable-next-line no-extra-boolean-cast
        } else if (!!ua.match(/msie|trident\/7|edge/)) {
            return 'ie'
        } else if (!!ua.match(/ipad|iphone|ipod/) && ua.indexOf('windows phone') === -1) {
            // Windows Phone flags itself as "like iPhone", thus the extra check
            return 'ios'
        } else {
            return 'other'
        }
    }

    // Firefox doesn't show text that scrolls into the padding of a textarea, so
    // rearrange a couple box models to make highlights behave the same way
    fixFirefox() {
        const hl = window.getComputedStyle(this.highlights as Element, null)
        // take padding and border pixels from highlights div
        const padding = {
            'padding-top': parseInt(hl.getPropertyValue('padding-top')),
            'padding-right': parseInt(hl.getPropertyValue('padding-right')),
            'padding-bottom': parseInt(hl.getPropertyValue('padding-bottom')),
            'padding-left': parseInt(hl.getPropertyValue('padding-left')),
        }

        const border = {
            'border-top-width': parseInt(hl.getPropertyValue('border-top-width')),
            'border-right-width': parseInt(hl.getPropertyValue('border-right-width')),
            'border-bottom-width': parseInt(hl.getPropertyValue('border-bottom-width')),
            'border-left-width': parseInt(hl.getPropertyValue('border-left-width')),
        }

        if (!this.highlights || !this.backdrop) {
            return
        }

        this.highlights.style.padding = '0'
        this.highlights.style.borderWidth = '0'

        const bdStyle = window.getComputedStyle(this.backdrop, null)

        const bdMarginTopOldValue = parseInt(bdStyle.getPropertyValue('margin-top'))
        const bdMarginRightOldValue = parseInt(bdStyle.getPropertyValue('margin-right'))
        const bdMarginBottomOldValue = parseInt(bdStyle.getPropertyValue('margin-bottom'))
        const bdMarginLeftOldValue = parseInt(bdStyle.getPropertyValue('margin-left'))

        this.backdrop.style.marginTop = bdMarginTopOldValue + padding['padding-top'] + border['border-top-width'] + 'px'

        this.backdrop.style.marginRight =
            bdMarginRightOldValue + padding['padding-right'] + border['border-right-width'] + 'px'

        this.backdrop.style.marginBottom =
            bdMarginBottomOldValue + padding['padding-bottom'] + border['border-bottom-width'] + 'px'

        this.backdrop.style.marginLeft =
            bdMarginLeftOldValue + padding['padding-left'] + border['border-left-width'] + 'px'
    }

    // iOS adds 3px of (unremovable) padding to the left and right of a textarea,
    // so adjust highlights div to match
    fixIOS() {
        if (!this.highlights || !this.backdrop) {
            return
        }

        const paddingLeftOldValue = parseInt(this.highlights.style.paddingLeft)
        this.highlights.style.paddingLeft = paddingLeftOldValue + 3 + 'px'

        const paddingRightOldValue = parseInt(this.highlights.style.paddingRight)
        this.highlights.style.paddingRight = paddingRightOldValue + 3 + 'px'
    }

    public handleInput() {
        const input = this.el?.value
        const ranges = this.getRanges(input, this.highlight?.highlight ?? null)
        const unstaggeredRanges = this.removeStaggeredRanges(ranges)
        const boundaries = this.getBoundaries(unstaggeredRanges)
        this.renderMarks(boundaries)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getType(instance: any) {
        const type = typeof instance
        if (!instance) {
            return 'falsey'
        } else if (Array.isArray(instance)) {
            if (instance.length === 2 && typeof instance[0] === 'number' && typeof instance[1] === 'number') {
                return 'range'
            } else {
                return 'array'
            }
        } else if (type === 'object') {
            if (instance instanceof RegExp) {
                return 'regexp'
                // eslint-disable-next-line no-prototype-builtins
            } else if (instance.hasOwnProperty('highlight')) {
                return 'custom'
            }
        } else if (type === 'function' || type === 'string') {
            return type
        }

        return 'other'
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRanges(input: string | undefined, highlight: IConfig['highlight'] | null): any {
        const type = this.getType(highlight)
        switch (type) {
            case 'array':
                return this.getArrayRanges(input, highlight)
            case 'function':
                return this.getFunctionRanges(input, highlight)
            case 'regexp':
                return this.getRegExpRanges(input, highlight)
            case 'string':
                return this.getStringRanges(input, highlight)
            case 'range':
                return this.getRangeRanges(input, highlight)
            case 'custom':
                return this.getCustomRanges(input, highlight)
            default:
                if (!highlight) {
                    // do nothing for falsey values
                    return []
                } else {
                    console.error('unrecognized highlight type')
                }
        }
    }

    getArrayRanges(input: string | undefined, arr: any) {
        const ranges = arr?.map(this.getRanges.bind(this, input))
        return Array.prototype.concat.apply([], ranges)
    }

    getFunctionRanges(input: any, func: any) {
        return this.getRanges(input, func(input))
    }

    getRegExpRanges(input: any, regex: any) {
        const ranges = []
        let match
        while (((match = regex.exec(input)), match !== null)) {
            ranges.push([match.index, match.index + match[0].length])
            if (!regex.global) {
                // non-global regexes do not increase lastIndex, causing an infinite loop,
                // but we can just break manually after the first match
                break
            }
        }
        return ranges
    }

    getStringRanges(input: any, str: any) {
        const ranges = []
        const inputLower = input.toLowerCase()
        const strLower = str.toLowerCase()
        let index = 0
        while (((index = inputLower.indexOf(strLower, index)), index !== -1)) {
            if (
                (index === 0 || !/\w/.test(inputLower[index - 1])) &&
                (index + strLower.length === inputLower.length || !/\w/.test(inputLower[index + strLower.length]))
            ) {
                ranges.push([index, index + strLower.length])
            }
            index += strLower.length
        }
        return ranges
    }

    getRangeRanges(_input: any, range: any) {
        return [range]
    }

    getCustomRanges(input: any, custom: any) {
        const ranges = this.getRanges(input, custom.highlight)
        if (custom.className) {
            ranges.forEach((range: any) => {
                // persist class name as a property of the array
                if (range.className) {
                    range.className = custom.className + ' ' + range.className
                } else {
                    range.className = custom.className
                }
            })
        }
        return ranges
    }

    // prevent staggered overlaps (clean nesting is fine)
    removeStaggeredRanges(ranges: any) {
        const unstaggeredRanges: any[] = []
        ranges.forEach((range: any) => {
            const isStaggered = unstaggeredRanges.some((unstaggeredRange) => {
                const isStartInside = range[0] > unstaggeredRange[0] && range[0] < unstaggeredRange[1]
                const isStopInside = range[1] > unstaggeredRange[0] && range[1] < unstaggeredRange[1]
                return isStartInside !== isStopInside // xor
            })
            if (!isStaggered) {
                unstaggeredRanges.push(range)
            }
        })
        return unstaggeredRanges
    }

    getBoundaries(ranges: any) {
        const boundaries: any[] = []
        ranges.forEach((range: any) => {
            boundaries.push({
                type: 'start',
                index: range[0],
                className: range.className,
            })
            boundaries.push({
                type: 'stop',
                index: range[1],
            })
        })

        this.sortBoundaries(boundaries)
        return boundaries
    }

    sortBoundaries(boundaries: any) {
        // backwards sort (since marks are inserted right to left)
        boundaries.sort((a: any, b: any) => {
            if (a.index !== b.index) {
                return b.index - a.index
            } else if (a.type === 'stop' && b.type === 'start') {
                return 1
            } else if (a.type === 'start' && b.type === 'stop') {
                return -1
            } else {
                return 0
            }
        })
    }

    renderMarks(boundaries: any) {
        if (!this.el) {
            return
        }
        let input = this.el.value
        if (!this.highlights) {
            return
        }
        this.highlights.innerText = input
        boundaries.forEach((boundary: any, index: any) => {
            let markup
            if (boundary.type === 'start') {
                markup = '{{hit-mark-start|' + index + '}}'
            } else {
                markup = '{{hit-mark-stop}}'
            }
            input = input.slice(0, boundary.index) + markup + input.slice(boundary.index)
        })

        // this keeps scrolling aligned when input ends with a newline
        input = input.replace(/\n({{hit-mark-stop}})?$/, '\n\n$1')

        // encode HTML entities
        input = input.replace(/</g, '&lt;').replace(/>/g, '&gt;')

        if (this.browser === 'ie') {
            // IE/Edge wraps whitespace differently in a div vs textarea, this fixes it
            input = input.replace(/ /g, ' <wbr>')
        }

        // replace start tokens with opening <mark> tags with class name
        input = input.replace(/{{hit-mark-start\|(\d+)}}/g, (_match, subMatch) => {
            const { className } = boundaries[+subMatch]
            if (className) {
                return '<mark class="' + className + '">'
            } else {
                return '<mark>'
            }
        })

        // replace stop tokens with closing </mark> tags
        input = input.replace(/{{hit-mark-stop}}/g, '</mark>')

        this.highlights.innerHTML = input
    }

    handleScroll() {
        if (!this.backdrop || !this.el) {
            return
        }

        this.backdrop.scrollTop = this.el.scrollTop

        // Chrome and Safari won't break long strings of spaces, which can cause
        // horizontal scrolling, this compensates by shifting highlights by the
        // horizontally scrolled amount to keep things aligned
        const scrollLeft = this.el.scrollLeft

        if (scrollLeft > 0) {
            this.backdrop.style.transform = 'translateX(' + -scrollLeft + 'px)'
        } else {
            this.backdrop.style.transform = ''
        }
    }

    // in Chrome, page up/down in the textarea will shift stuff within the
    // container (despite the CSS), this immediately reverts the shift
    blockContainerScroll() {
        if (!this.container) {
            return
        }
        this.container.scrollLeft = 0
    }

    destroy() {
        if (!this.el || !this.container) {
            return
        }
        this.container.parentElement?.replaceChild(this.el, this.container)
        this.el?.classList.remove(this.ID + '-content', this.ID + '-input')
    }
}
