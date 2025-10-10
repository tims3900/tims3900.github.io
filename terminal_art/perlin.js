class PerlinNoise {
    constructor() {
        const permutation = this._generateAndShufflePermutation();
        this.p = new Uint8Array(512);
        for (let i = 0; i < 256; i++) {
            this.p[i] = this.p[i + 256] = permutation[i];
        }
    }

    _generateAndShufflePermutation() {
        let p = Array.from({ length: 256 }, (_, i) => i);
        for (let i = p.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        return p;
    }

    _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    _lerp(t, a, b) { return a + t * (b - a); }
    _grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    get(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        const u = this._fade(x);
        const v = this._fade(y);
        const w = this._fade(z);
        const a = this.p[X] + Y;
        const aa = this.p[a] + Z;
        const ab = this.p[a + 1] + Z;
        const b = this.p[X + 1] + Y;
        const ba = this.p[b] + Z;
        const bb = this.p[b + 1] + Z;
        const n00 = this._lerp(u, this._grad(this.p[aa], x, y, z), this._grad(this.p[ba], x - 1, y, z));
        const n01 = this._lerp(u, this._grad(this.p[ab], x, y - 1, z), this._grad(this.p[bb], x - 1, y - 1, z));
        const n1 = this._lerp(v, n00, n01);
        const n10 = this._lerp(u, this._grad(this.p[aa + 1], x, y, z - 1), this._grad(this.p[ba + 1], x - 1, y, z - 1));
        const n11 = this._lerp(u, this._grad(this.p[ab + 1], x, y - 1, z - 1), this._grad(this.p[bb + 1], x - 1, y - 1, z - 1));
        const n2 = this._lerp(v, n10, n11);
        return this._lerp(w, n1, n2);
    }
}

export default class PerlinFlow {
    constructor(width, height, element) {
        this.width = width;
        this.height = height;
        this.element = element;
        this.noise = new PerlinNoise();
        
        this.render_modes = ['block', /*'color',*/ 'ascii'];
        this.render_mode = this.render_modes[Math.floor(Math.random() * this.render_modes.length)];

        this.palettes = {
            viridis:   [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]],
            inferno:   [[0, 0, 4], [59, 12, 106], [148, 35, 98], [228, 89, 41], [251, 231, 37]],
            magma:     [[0, 0, 4], [51, 10, 103], [120, 42, 129], [214, 91, 82], [252, 249, 164]],
            gnbu:      [[8, 48, 107], [43, 117, 181], [123, 185, 222], [208, 230, 241], [247, 252, 253]],
            binary:    [[255, 255, 255], [0, 0, 0]],
            twilight:  [[255, 255, 255], [128, 128, 128], [0, 0, 0], [128, 128, 128], [255, 255, 255]],
            pastel1:   [[251, 180, 174], [179, 226, 205], [204, 235, 197], [222, 203, 228], [254, 217, 166]],
            gnuplot:   [[214, 18, 242], [32, 22, 242], [20, 237, 242], [20, 242, 22], [242, 234, 20], [242, 22, 22]]
        };
        const palette_keys = Object.keys(this.palettes);
        this.active_palette_name = palette_keys[Math.floor(Math.random() * palette_keys.length)];
        this.active_palette = this.palettes[this.active_palette_name];

        this.ramps = {
            block: ' ░▒▓█',
            ascii: ' .,:;xX&@',
        };

        this.num_octaves = Math.floor(Math.random() * 4) + 1;
        this.lacunarity = 2.0;
        this.persistence = 0.5;

        this.grid = Array(height).fill(null).map(() => Array(width).fill(0));
        this.time = Math.random() * 1000;
        this.time_speed = 0.2;
        this.noise_scale = 0.07;

        this.dom_grid = [];
        this.last_color_grid = [];
        this.last_text_output = '';
        this._initialize_dom();
    }
    
    _initialize_dom() {
        this.element.innerHTML = '';
        //TODO fix rendering speed issues
        /*
        if (this.render_mode === 'color') {
            for (let y = 0; y < this.height; y++) {
                this.dom_grid[y] = [];
                this.last_color_grid[y] = [];
                for (let x = 0; x < this.width; x++) {
                    const span = document.createElement('span');
                    span.textContent = '█';
                    this.element.appendChild(span);
                    this.dom_grid[y][x] = span;
                    this.last_color_grid[y][x] = '';
                }
                this.element.appendChild(document.createTextNode('\n'));
            }
        }
        */
    }

    _lerp_color(t, palette) {
        const scaled_t = t * (palette.length - 1);
        const i = Math.floor(scaled_t);
        const j = Math.ceil(scaled_t);
        const frac = scaled_t - i;
        if (i >= palette.length - 1) return `rgb(${palette[palette.length - 1].join(',')})`;
        const c1 = palette[i];
        const c2 = palette[j];
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * frac);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * frac);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * frac);
        return `rgb(${r},${g},${b})`;
    }
    
    update(delta_time) {
        this.time += delta_time * this.time_speed;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let total_noise = 0;
                let frequency = this.noise_scale;
                let amplitude = 1.0;
                let max_amplitude = 0;
                for (let i = 0; i < this.num_octaves; i++) {
                    total_noise += this.noise.get(x * frequency, y * frequency, this.time) * amplitude;
                    max_amplitude += amplitude;
                    amplitude *= this.persistence;
                    frequency *= this.lacunarity;
                }
                const normalized_noise = total_noise / max_amplitude;
                this.grid[y][x] = (normalized_noise + 1) / 2;
            }
        }
    }
    
    render() {
        switch(this.render_mode) {
            case 'color':
                //TODO fix rendering speed issues
                /*
                // NEW: Optimized render loop
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        const color = this._lerp_color(this.grid[y][x], this.active_palette);
                        // Only update the DOM if the color has changed
                        if (color !== this.last_color_grid[y][x]) {
                            this.dom_grid[y][x].style.color = color;
                            this.last_color_grid[y][x] = color;
                        }
                    }
                }
                */
                break;
            
            case 'ascii':
            case 'block':
            default:
                let output = '';
                const ramp = this.ramps[this.render_mode] || this.ramps.block;
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        const index = Math.floor(this.grid[y][x] * (ramp.length));
                        output += ramp[Math.min(index, ramp.length - 1)];
                    }
                    output += '\n';
                }
                if (output !== this.last_text_output) {
                    this.element.textContent = output;
                    this.last_text_output = output;
                }
                break;
        }
    }
    
    clear() {
        this.element.innerHTML = '';
    }

    getInfo() {
        const info = [
            `GRID: ${this.width}x${this.height}`,
            `RENDER: ${this.render_mode.toUpperCase()}`,
            `OCTAVES: ${this.num_octaves}`,
        ];
        if (this.render_mode === 'color') {
            info.push(`PALETTE: ${this.active_palette_name.toUpperCase()}`);
        }
        return info;
    }
}

export { PerlinNoise };
