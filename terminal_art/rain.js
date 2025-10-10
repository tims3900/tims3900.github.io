export default class DigitalRain {
    constructor(width, height, element) {
        this.width = width;
        this.height = height;
        this.element = element;
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        
        this.config = {
            fall_speed: 15,
            spawn_chance: 0.5,
            leader_color: '#d0f0d0',
            trail_color_start: '#86dc86',
            trail_color_mid: '#42a842',
            trail_color_end: '#006400'
        };

        this.columns = [];
        this._initialize_columns();
        this.streams_completed = 0;
    }

    _initialize_columns() {
        for (let i = 0; i < this.width; i++) {
            this.columns[i] = {
                y: -1, 
                trail_length: Math.floor(Math.random() * (this.height * 0.8) + (this.height * 0.2)),
            };
        }
    }

    update(delta_time) {
        for (let i = 0; i < this.width; i++) {
            const col = this.columns[i];
            if (col.y >= 0) {
                col.y += this.config.fall_speed * delta_time;
                if (col.y - col.trail_length > this.height) {
                    col.y = -1;
                    this.streams_completed++;
                }
            } else {
                if (Math.random() < this.config.spawn_chance * delta_time) {
                    col.y = 0;
                    col.trail_length = Math.floor(Math.random() * (this.height * 0.8) + (this.height * 0.2));
                }
            }
        }
    }

    render() {
        const grid = Array(this.height).fill(0).map(() => Array(this.width).fill(' '));
        for (let i = 0; i < this.width; i++) {
            const col = this.columns[i];
            const lead_y = Math.floor(col.y);
            for (let j = 1; j < col.trail_length; j++) {
                const trail_y = lead_y - j;
                if (trail_y >= 0 && trail_y < this.height) {
                    const trail_progress = j / col.trail_length;
                    let color = this.config.trail_color_end;
                    if (trail_progress < 0.25) color = this.config.trail_color_start;
                    else if (trail_progress < 0.6) color = this.config.trail_color_mid;
                    const char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    grid[trail_y][i] = `<span style="color:${color}">${char}</span>`;
                }
            }
            if (lead_y >= 0 && lead_y < this.height) {
                const char = this.chars[Math.floor(Math.random() * this.chars.length)];
                grid[lead_y][i] = `<span style="color:${this.config.leader_color}">${char}</span>`;
            }
        }
        this.element.innerHTML = grid.map(row => row.join('')).join('\n');
    }

    getInfo() {
        return [
            `GRID: ${this.width}x${this.height}`,
            `RENDER: COLOR`,
            `STREAMS COMPLETED: ${this.streams_completed}`
        ];
    }
}

