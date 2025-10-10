export default class RippleEffect {
    static DIRS = [
        { r: -1, c: 0, is_diagonal: false }, { r: 1, c: 0, is_diagonal: false },
        { r: 0, c: -1, is_diagonal: false }, { r: 0, c: 1, is_diagonal: false },
        { r: -1, c: -1, is_diagonal: true }, { r: -1, c: 1, is_diagonal: true },
        { r: 1, c: -1, is_diagonal: true }, { r: 1, c: 1, is_diagonal: true }
    ];

    constructor(width, height, element) {
        this.width = width;
        this.height = height;
        this.element = element;
        this.chars = [' ', '░', '▒', '▓', '█'];

        this.config = {
            dampening: 0.94,
            rest_spring_constant: 0.05,
            neighbor_spring_constant: 0.03,
            mouse_force: 0.25,
            mouse_influence_radius: 1.25,
            click_force: 1.0,
            click_radius: 2.0,
        };

        this.particles = [];
        this.particleStates = new Map();
        this._initialize();
    }

    _initialize() {
        for (let i = 0; i < this.height; i++) {
            this.particles[i] = [];
            for (let j = 0; j < this.width; j++) {
                this.particles[i][j] = { x: j, y: i, rest_x: j, rest_y: i, vx: 0, vy: 0, displacement: 0 };
            }
        }
    }

    update(delta_time, mouse_pos) {
        if (mouse_pos && mouse_pos.x >= 0) {
            this._apply_mouse_force(mouse_pos);
        }
        this._update_particles();
    }

    render() {
        const charGrid = Array(this.height).fill(null).map(() => Array(this.width).fill(' '));
        const now = Date.now();

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const particle = this.particles[i][j];
                const key = `${j},${i}`;
                const displacement = particle.displacement;

                let charIndex = 0;

                if (displacement > 0.05) {
                    if (!this.particleStates.has(key)) {
                        this.particleStates.set(key, now);
                    }
                    if (displacement > 0.8) charIndex = 4;
                    else if (displacement > 0.6) charIndex = 3;
                    else if (displacement > 0.3) charIndex = 2;
                    else charIndex = 1;

                } else if (this.particleStates.has(key)) {
                    const age = now - this.particleStates.get(key);
                    if (age < 300) charIndex = 2;
                    else if (age < 600) charIndex = 1;
                    else this.particleStates.delete(key);
                }
                charGrid[i][j] = this.chars[charIndex];
            }
        }
        this.element.textContent = charGrid.map(row => row.join('')).join('\n');
    }

    _update_particles() {
        const next_particles = structuredClone(this.particles);

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const particle = this.particles[i][j];
                const target = next_particles[i][j];

                const rest_force_x = (particle.rest_x - particle.x) * this.config.rest_spring_constant;
                const rest_force_y = (particle.rest_y - particle.y) * this.config.rest_spring_constant;
                let neighbor_force_x = 0;
                let neighbor_force_y = 0;

                for (const dir of RippleEffect.DIRS) {
                    const ni = i + dir.r;
                    const nj = j + dir.c;

                    if (ni >= 0 && ni < this.height && nj >= 0 && nj < this.width) {
                        const neighbor = this.particles[ni][nj];
                        const rest_dist = dir.is_diagonal ? Math.SQRT2 : 1.0;
                        const dx = neighbor.x - particle.x;
                        const dy = neighbor.y - particle.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            const force = (dist - rest_dist) * this.config.neighbor_spring_constant;
                            neighbor_force_x += (dx / dist) * force;
                            neighbor_force_y += (dy / dist) * force;
                        }
                    }
                }
                
                target.vx += rest_force_x + neighbor_force_x;
                target.vy += rest_force_y + neighbor_force_y;
                target.vx *= this.config.dampening;
                target.vy *= this.config.dampening;
                target.x += target.vx;
                target.y += target.vy;
                target.displacement = Math.sqrt(Math.pow(target.x - target.rest_x, 2) + Math.pow(target.y - target.rest_y, 2));
            }
        }
        this.particles = next_particles;
    }

    _apply_force_to_area(center_x, center_y, radius, force_strength) {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const dx = j - center_x;
                const dy = i - center_y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius && dist > 0) {
                    const force_magnitude = (radius - dist) / radius * force_strength;
                    const particle = this.particles[i][j];
                    particle.vx -= (dx / dist) * force_magnitude;
                    particle.vy -= (dy / dist) * force_magnitude;
                }
            }
        }
    }

    _apply_mouse_force(mouse_pos) {
        this._apply_force_to_area(mouse_pos.x, mouse_pos.y, this.config.mouse_influence_radius, this.config.mouse_force);
    }
    
    handle_click(click_x, click_y) {
        this._apply_force_to_area(click_x, click_y, this.config.click_radius, this.config.click_force);
    }
    
    getInfo() {
        return [
            `GRID: ${this.width}x${this.height}`,
            `RENDER: BLOCK`,
            `ACTIVE PARTICLES: ${this.particleStates.size}`
        ];
    }
}

