/**
 * This file is copypasta from another library.
 * No corresponding npm package exits - no relation to https://www.npmjs.com/package/color-js
 * The origin seems to be https://github.com/PitPik/colorPicker/blob/master/colors.js
 * which has an MIT licence: https://github.com/PitPik/colorPicker/blob/master/LICENSE.md
 */
const _Math = window.Math
const _round = _Math.round
const _valueRanges: any = {
    rgb: {r: [0, 255], g: [0, 255], b: [0, 255]},
    hsv: {h: [0, 360], s: [0, 100], v: [0, 100]},
    hsl: {h: [0, 360], s: [0, 100], l: [0, 100]},
    alpha: {alpha: [0, 1]},
    HEX: {HEX: [0, 16777215]} // maybe we don't need this
}
const grey = {r: 0.298954, g: 0.586434, b: 0.114612} // CIE-XYZ 1931
const luminance = {r: 0.2126, g: 0.7152, b: 0.0722} // W3C 2.0

interface RGB {
    r: number
    g: number
    b: number
}
interface HSL {
    h: number
    s: number
    l: number
}
interface HSV {
    h: number
    s: number
    v: number
}
interface Colors {
    rgb: RGB
    hsl: HSL
    hsv: HSV
}

let _instance: any = {} as any
let _colors: Colors | any = {} as Colors

const Colors: any = function (this: badany, options: any) {
    this.colors = {RND: {} as X}
    this.options = {
        color: 'rgba(204, 82, 37, 0.8)', // init value(s)...
        grey,
        luminance,
        valueRanges: _valueRanges
        // customBG: '#808080'
        // convertCallback: undefined,
        // allMixDetails: false
    }
    initInstance(this, options || {})
}

Colors.prototype.setColor = function (newCol: string, type: keyof Colors, alpha: number) {
    focusInstance(this)
    if (newCol) {
        return setColor(this.colors, newCol, type, undefined, alpha)
    } else {
        if (alpha !== undefined) {
            this.colors.alpha = limitValue(alpha, 0, 1)
        }
        return convertColors(type)
    }
}

Colors.prototype.setCustomBackground = function (col: string | any) { // wild gues,... check again...
    focusInstance(this) // needed???
    this.options.customBG = (typeof col === 'string') ? ColorConverter.txt2color(col).rgb : col
    // return setColor(this.colors, this.options.customBG, 'rgb', true); // !!!!RGB
    return setColor(this.colors, undefined, 'rgb') // just recalculate existing
}

Colors.prototype.saveAsBackground = function () { // alpha
    focusInstance(this) // needed???
    // return setColor(this.colors, this.colors.RND.rgb, 'rgb', true);
    return setColor(this.colors, undefined, 'rgb', true)
}

Colors.prototype.toString = function (colorMode: string, forceAlpha: boolean) {
    return ColorConverter.color2text((colorMode || 'rgb').toLowerCase(), this.colors, forceAlpha)
}

const initInstance = function (THIS: any, options: any) {
    const _options = THIS.options

    focusInstance(THIS)
    for (const option in options) {
        if (options.hasOwnProperty(option)) {
            if (options[option] !== undefined) _options[option] = options[option]
        }
    }
    const customBG = _options.customBG
    _options.customBG = (typeof customBG === 'string') ? ColorConverter.txt2color(customBG).rgb : customBG
    _colors = setColor(THIS.colors, _options.color, undefined, true) // THIS.colors = _colors =
}
const focusInstance = function (THIS: any) {
    if (_instance !== THIS) {
        _instance = THIS
        _colors = THIS.colors
    }
}

// ------------------------------------------------------ //
// ---------- Color calculation related stuff  ---------- //
// -------------------------------------------------------//

function setColor(colors: any, color: any, type?: keyof Colors, save?: boolean, alpha?: number) { // color only full range
    type = type || 'rgb'
    if (typeof color === 'string') {
        color = ColorConverter.txt2color(color) // new object
        type = <keyof Colors>color.type
        _colors[type] = color[type]
        alpha = alpha !== undefined ? alpha : color.alpha
    }
    else if (color) {
        for (const n in color) {
            if (color.hasOwnProperty(n)) {
                colors[type][n] = limitValue(color[n] / _valueRanges[type][n][1], 0, 1)
            }
        }
    }
    if (alpha !== undefined) {
        colors.alpha = limitValue(+alpha, 0, 1)
    }
    return convertColors(type, save ? colors : undefined)
}

function saveAsBackground(RGB: RGB, rgb: RGB, alpha: number) {
    const grey = _instance.options.grey
    const color: any = {}

    color.RGB = {r: RGB.r, g: RGB.g, b: RGB.b}
    color.rgb = {r: rgb.r, g: rgb.g, b: rgb.b}
    color.alpha = alpha
    // color.RGBLuminance = getLuminance(RGB);
    color.equivalentGrey = _round(grey.r * RGB.r + grey.g * RGB.g + grey.b * RGB.b)

    color.rgbaMixBlack = mixColors(rgb, {r: 0, g: 0, b: 0}, alpha, 1)
    color.rgbaMixWhite = mixColors(rgb, {r: 1, g: 1, b: 1}, alpha, 1)
    color.rgbaMixBlack.luminance = getLuminance(color.rgbaMixBlack, true)
    color.rgbaMixWhite.luminance = getLuminance(color.rgbaMixWhite, true)

    if (_instance.options.customBG) {
        color.rgbaMixCustom = mixColors(rgb, _instance.options.customBG, alpha, 1)
        color.rgbaMixCustom.luminance = getLuminance(color.rgbaMixCustom, true)
        _instance.options.customBG.luminance = getLuminance(_instance.options.customBG, true)
    }

    return color
}

function convertColors(type: string, colorObj?: any) {
    const colors = colorObj || _colors
    const convert: any = ColorConverter
    const options = _instance.options
    const ranges: any = _valueRanges
    const RND = colors.RND// type = colorType, // || _mode.type,
    let modes: any 
    let mode = ''
    let from = '' // value = '',
    const exceptions: any = {hsl: 'hsv', rgb: type}
    let RGB = RND.rgb
    let SAVE: any
    let SMART: any
    if (type !== 'alpha') {
        for (const typ in ranges) {
            if (ranges.hasOwnProperty(typ)) {
                if (!ranges[typ][typ]) { // no alpha|HEX
                    if (type !== typ) {
                        from = exceptions[typ] || 'rgb'
                        colors[typ] = convert[from + '2' + typ](colors[from])
                    }

                    if (!RND[typ]) RND[typ] = {}
                    modes = colors[typ]
                    for (mode in modes) {
                        if (modes.hasOwnProperty(mode)) {
                            RND[typ][mode] = _round(modes[mode] * ranges[typ][mode][1])
                        }
                    }
                }
            }
        }

        RGB = RND.rgb
        colors.HEX = convert.RGB2HEX(RGB)
        colors.equivalentGrey =
            options.grey.r * colors.rgb.r +
            options.grey.g * colors.rgb.g +
            options.grey.b * colors.rgb.b
        colors.webSave = SAVE = getClosestWebColor(RGB, 51)
        // colors.webSave.HEX = convert.RGB2HEX(colors.webSave);
        colors.webSmart = SMART = getClosestWebColor(RGB, 17)
        // colors.webSmart.HEX = convert.RGB2HEX(colors.webSmart);
        colors.saveColor = RGB.r === SAVE.r && RGB.g === SAVE.g && RGB.b === SAVE.b
            ? 'web save'
            : RGB.r === SMART.r && RGB.g === SMART.g && RGB.b === SMART.b
                ? 'web smart'
                : ''
        colors.hueRGB = ColorConverter.HUE2RGB(colors.hsv.h)

        if (colorObj) {
            colors.background = saveAsBackground(RGB, colors.rgb, colors.alpha)
        }
    } // else RGB = RND.rgb;

    const rgb = colors.rgb // for better minification...
    const alpha = colors.alpha
    const luminance = 'luminance'
    const background = colors.background

    const rgbaMixBlack = mixColors(rgb, {r: 0, g: 0, b: 0}, alpha, 1)
    rgbaMixBlack[luminance] = getLuminance(rgbaMixBlack, true)
    colors.rgbaMixBlack = rgbaMixBlack

    const rgbaMixWhite = mixColors(rgb, {r: 1, g: 1, b: 1}, alpha, 1)
    rgbaMixWhite[luminance] = getLuminance(rgbaMixWhite, true)
    colors.rgbaMixWhite = rgbaMixWhite

    if (options.customBG) {
        const rgbaMixBGMixCustom = mixColors(rgb, background.rgbaMixCustom, alpha, 1)
        rgbaMixBGMixCustom[luminance] = getLuminance(rgbaMixBGMixCustom, true)
        rgbaMixBGMixCustom.WCAG2Ratio = getWCAG2Ratio(rgbaMixBGMixCustom[luminance], background.rgbaMixCustom[luminance])
        rgbaMixBGMixCustom.luminanceDelta = _Math.abs(rgbaMixBGMixCustom[luminance] - background.rgbaMixCustom[luminance])
        rgbaMixBGMixCustom.hueDelta = getHueDelta(background.rgbaMixCustom, rgbaMixBGMixCustom, true)
        colors.rgbaMixBGMixCustom = rgbaMixBGMixCustom
    }

    colors.RGBLuminance = getLuminance(RGB)
    colors.HUELuminance = getLuminance(colors.hueRGB)

    // renderVars.readyToRender = true;
    if (options.convertCallback) {
        options.convertCallback(colors, type)
    }

    // if (colorObj)
    return colors
}

// ------------------------------------------------------ //
// ------------------ color conversion ------------------ //
// -------------------------------------------------------//

const ColorConverter = {
    txt2color(txt: string): { type: string, rgb: RGB, alpha: number } {
        const color: { type: string, rgb: RGB, alpha: number } | any = {} as any
        const parts = txt.replace(/(?:#|\)|%)/g, '').split('(')
        const values = (parts[1] || '').split(/,\s*/)
        const type = parts[1] ? parts[0].substr(0, 3) : 'rgb'
        let m = ''

        color.type = type
        color[type] = {}
        if (parts[1]) {
            for (let n = 3; n--;) {
                m = type[n] || type.charAt(n) // IE7
                color[type][m] = +values[n] / _valueRanges[type][m][1]
            }
        }
        else {
            color.rgb = ColorConverter.HEX2RGB(parts[0])
        }
        // color.color = color[type];
        color.alpha = values[3] ? +values[3] : 1

        return color
    },
    color2text(colorMode: string, colors: any, forceAlpha?: boolean) {
        const alpha = forceAlpha !== false && _round(colors.alpha * 100) / 100
        const hasAlpha = typeof alpha === 'number' && forceAlpha !== false && (forceAlpha || alpha !== 1)
        const RGB = colors.RND.rgb
        const HSL = colors.RND.hsl
        const shouldBeHex = colorMode === 'hex' && hasAlpha
        const isHex = colorMode === 'hex' && !shouldBeHex
        const isRgb = colorMode === 'rgb' || shouldBeHex
        const innerText = isRgb
            ? RGB.r + ', ' + RGB.g + ', ' + RGB.b
            : !isHex
                ? HSL.h + ', ' + HSL.s + '%, ' + HSL.l + '%'
                : '#' + colors.HEX

        return isHex ? innerText : (shouldBeHex ? 'rgb' : colorMode) +
            (hasAlpha ? 'a' : '') + '(' + innerText +
            (hasAlpha ? ', ' + alpha : '') + ')'
    },

    RGB2HEX(RGB: RGB) {
        return (
            (RGB.r < 16 ? '0' : '') + RGB.r.toString(16) +
            (RGB.g < 16 ? '0' : '') + RGB.g.toString(16) +
            (RGB.b < 16 ? '0' : '') + RGB.b.toString(16)
        ).toUpperCase()
    },
    HEX2RGB(_HEX: string): RGB {
        const HEX = _HEX.split('') // IE7
        if (HEX[0] === '#') HEX.shift()
        return {
            r: +('0x' + HEX[0] + HEX[HEX[3] ? 1 : 0]) / 255,
            g: +('0x' + HEX[HEX[3] ? 2 : 1] + (HEX[3] || HEX[1])) / 255,
            b: +('0x' + (HEX[4] || HEX[2]) + (HEX[5] || HEX[2])) / 255
        }
    },

    HUE2RGB(hue: number): RGB {
        const h = hue * 6
        const mod = ~~h % 6 // _Math.floor(h) -> faster in most browsers
        const i = h === 6 ? 0 : (h - mod)

        return {
            r: _round([1, 1 - i, 0, 0, i, 1][mod] * 255),
            g: _round([i, 1, 1, 1 - i, 0, 0][mod] * 255),
            b: _round([0, 0, i, 1, 1, 1 - i][mod] * 255)
        }
    },

    // ------------------------ HSV ------------------------ //

    rgb2hsv(rgb: RGB): HSV { // faster
        let r = rgb.r,
            g = rgb.g,
            b = rgb.b,
            k = 0,
            chroma,
            min,
            s

        if (g < b) {
            // tslint:disable-next-line:ban-comma-operator
            g = b + (b = g, 0)
            k = -1
        }
        min = b
        if (r < g) {
            // tslint:disable-next-line:ban-comma-operator
            r = g + (g = r, 0)
            k = -2 / 6 - k
            min = _Math.min(g, b) // g < b ? g : b; ???
        }
        chroma = r - min
        s = r ? (chroma / r) : 0
        return {
            h: s < 1e-15
                ? ((_colors && _colors.hsl && _colors.hsl.h) || 0)
                : chroma
                    ? _Math.abs(k + (g - b) / (6 * chroma))
                    : 0,
            s: r ? (chroma / r) : ((_colors && _colors.hsv && _colors.hsv.s) || 0), // ??_colors.hsv.s || 0
            v: r
        }
    },

    hsv2rgb(hsv: HSV): RGB {
        const h = hsv.h * 6
        const s = hsv.s
        const v = hsv.v
        const i = ~~h // _Math.floor(h) -> faster in most browsers
        const f = h - i
        const p = v * (1 - s)
        const q = v * (1 - f * s)
        const t = v * (1 - (1 - f) * s)
        const mod = i % 6

        return {
            r: [v, q, p, p, t, v][mod],
            g: [t, v, v, q, p, p][mod],
            b: [p, p, t, v, v, q][mod]
        }
    },

    // ------------------------ HSL ------------------------ //

    hsv2hsl(hsv: HSV): HSL {
        const l = (2 - hsv.s) * hsv.v
        let s = hsv.s * hsv.v

        s = !hsv.s ? 0 : l < 1 ? (l ? s / l : 0) : s / (2 - l)

        return {
            h: hsv.h,
            s: !hsv.v && !s ? ((_colors && _colors.hsl && _colors.hsl.s) || 0) : s, // ???
            l: l / 2
        }
    },

    rgb2hsl(rgb: RGB, dependent: boolean): HSL { // not used in Color
        const hsv = ColorConverter.rgb2hsv(rgb)
        return ColorConverter.hsv2hsl(dependent ? hsv : (_colors.hsv = hsv))
    },

    hsl2rgb(hsl: HSL): RGB {
        const h = hsl.h * 6
        const s = hsl.s
        const l = hsl.l
        const v = l < 0.5 ? l * (1 + s) : (l + s) - (s * l)
        const m = l + l - v
        const sv = v ? ((v - m) / v) : 0
        const sextant = ~~h // _Math.floor(h) -> faster in most browsers
        const fract = h - sextant
        const vsf = v * sv * fract
        const t = m + vsf
        const q = v - vsf
        const mod = sextant % 6

        return {
            r: [v, q, m, m, t, v][mod],
            g: [t, v, v, q, m, m][mod],
            b: [m, m, t, v, v, q][mod]
        }
    }
}

// ------------------------------------------------------ //
// ------------------ helper functions ------------------ //
// -------------------------------------------------------//

function getClosestWebColor(RGB: any, val: number) {
    const out: any = {}
    const half = val / 2
    let tmp = 0
    for (const n in RGB) {
        // TODO really !RGB.hasOwnProperty?
        // if (!RGB.hasOwnProperty(n)) {
        if (RGB.hasOwnProperty(n)) {
            tmp = RGB[n] % val // 51 = 'web save', 17 = 'web smart'
            out[n] = RGB[n] + (tmp > half ? val - tmp : -tmp)
        }
    }
    return out
}

function getHueDelta(rgb1: RGB, rgb2: RGB, nominal = false) {
    return (_Math.max(rgb1.r - rgb2.r, rgb2.r - rgb1.r) +
        _Math.max(rgb1.g - rgb2.g, rgb2.g - rgb1.g) +
        _Math.max(rgb1.b - rgb2.b, rgb2.b - rgb1.b)) * (nominal ? 255 : 1) / 765
}

function getLuminance(rgb: RGB, normalized?: boolean) {
    const div = normalized ? 1 : 255
    const RGB = [rgb.r / div, rgb.g / div, rgb.b / div]
    const luminance = _instance.options.luminance

    for (let i = RGB.length; i--;) {
        RGB[i] = RGB[i] <= 0.03928 ? RGB[i] / 12.92 : _Math.pow(((RGB[i] + 0.055) / 1.055), 2.4)
    }
    return ((luminance.r * RGB[0]) + (luminance.g * RGB[1]) + (luminance.b * RGB[2]))
}

function mixColors(topColor: any, bottomColor: any, topAlpha: number, bottomAlpha: number) {
    const newColor: any = {}
    const alphaTop = (topAlpha !== undefined ? topAlpha : 1)
    const alphaBottom = (bottomAlpha !== undefined ? bottomAlpha : 1)
    const alpha = alphaTop + alphaBottom * (1 - alphaTop) // 1 - (1 - alphaTop) * (1 - alphaBottom);

    for (const n in topColor) {
        if (topColor.hasOwnProperty(n)) {
            newColor[n] = (topColor[n] * alphaTop + bottomColor[n] * alphaBottom * (1 - alphaTop)) / alpha
        }
    }
    newColor.a = alpha
    return newColor
}

// Web Content Accessibility Guidelines
function getWCAG2Ratio(lum1: number, lum2: number) {
    const ratio = lum1 >= lum2 ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05)
    return _round(ratio * 100) / 100
}

function limitValue(value: number, min: number, max: number) {
    // return _Math.max(min, _Math.min(max, value)); // faster??
    return (value > max ? max : value < min ? min : value)
}

export default Colors


// ## Exposed methods
const darkColor = 'rgb(0, 0, 0)'
const lightColor = 'rgb(255, 255, 255)'

export const calcTextColor = (backgroundColor: string, luminanceLightValue = 0.2): string => {
    if (!backgroundColor) return darkColor
    const color = new Colors({color: backgroundColor})
    return color.colors.RGBLuminance < luminanceLightValue ? lightColor : darkColor
}
export const calcHueDelta = (color1: string | RGB, color2: string | RGB) => {
    const rgb1 = typeof color1 === 'string' ? ColorConverter.HEX2RGB(color1) : color1
    const rgb2 = typeof color2 === 'string' ? ColorConverter.HEX2RGB(color2) : color2
    return getHueDelta(rgb1, rgb2, true)
}
