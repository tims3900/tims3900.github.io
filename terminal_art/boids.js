class Boid {
    static MAX_SPEED = 0.5;
    static MAX_FORCE = 0.05;
    static PERCEPTION_RADIUS = 20;
    static AVOIDANCE_RADIUS = 20;
    
    static SEPARATION_WEIGHT = 0.5; 
    static ALIGNMENT_WEIGHT = 0.5;
    static COHESION_WEIGHT = 0.5;
    static MOUSE_AVOIDANCE_WEIGHT = 1.5;
    static MOUSE_INFLUENCE_RADIUS = 30;

    constructor(x, y, width, height) {
        this.width = width;
        this.height = height;
        this.position = { x, y };
        const angle = Math.random() * 2 * Math.PI;
        this.velocity = { x: Math.cos(angle) * Boid.MAX_SPEED, y: Math.sin(angle) * Boid.MAX_SPEED };
        this.acceleration = { x: 0, y: 0 };
    }

    _limit(vector, max) {
        const mag_sq = vector.x * vector.x + vector.y * vector.y;
        if (mag_sq > max * max && mag_sq > 0) {
            const mag = Math.sqrt(mag_sq);
            vector.x = (vector.x / mag) * max;
            vector.y = (vector.y / mag) * max;
        }
    }

    _distance_sq(other) {
        const dx = other.position.x - this.position.x;
        const dy = other.position.y - this.position.y;
        return dx * dx + dy * dy;
    }

    _wrap_edges() {
        if (this.position.x > this.width) this.position.x = 0;
        else if (this.position.x < 0) this.position.x = this.width;
        if (this.position.y > this.height) this.position.y = 0;
        else if (this.position.y < 0) this.position.y = this.height;
    }

    _separation(flock) {
        let steering = { x: 0, y: 0 };
        let total_in_avoidance_range = 0;
        for (const other of flock) {
            if (other === this) continue;
            const d_sq = this._distance_sq(other);
            if (d_sq > 0 && d_sq < Boid.AVOIDANCE_RADIUS * Boid.AVOIDANCE_RADIUS) {
                let diff = { x: this.position.x - other.position.x, y: this.position.y - other.position.y };
                diff.x /= d_sq;
                diff.y /= d_sq;
                steering.x += diff.x;
                steering.y += diff.y;
                total_in_avoidance_range++;
            }
        }

        if (total_in_avoidance_range > 0) {
            steering.x /= total_in_avoidance_range;
            steering.y /= total_in_avoidance_range;
            
            const mag_sq = steering.x * steering.x + steering.y * steering.y;
            if (mag_sq > 0) {
                const mag = Math.sqrt(mag_sq);
                steering.x = (steering.x / mag) * Boid.MAX_SPEED;
                steering.y = (steering.y / mag) * Boid.MAX_SPEED;
                steering.x -= this.velocity.x;
                steering.y -= this.velocity.y;
                this._limit(steering, Boid.MAX_FORCE);
            }
        }
        return steering;
    }

    _alignment(flock) {
        let steering = { x: 0, y: 0 };
        let total_in_perception = 0;
        for (const other of flock) {
            if (other === this) continue;
            const d_sq = this._distance_sq(other);
            if (d_sq > 0 && d_sq < Boid.PERCEPTION_RADIUS * Boid.PERCEPTION_RADIUS) {
                steering.x += other.velocity.x;
                steering.y += other.velocity.y;
                total_in_perception++;
            }
        }

        if (total_in_perception > 0) {
            steering.x /= total_in_perception;
            steering.y /= total_in_perception;

            const mag_sq = steering.x * steering.x + steering.y * steering.y;
            if (mag_sq > 0) {
                const mag = Math.sqrt(mag_sq);
                steering.x = (steering.x / mag) * Boid.MAX_SPEED;
                steering.y = (steering.y / mag) * Boid.MAX_SPEED;
                steering.x -= this.velocity.x;
                steering.y -= this.velocity.y;
                this._limit(steering, Boid.MAX_FORCE);
            }
        }
        return steering;
    }

    _cohesion(flock) {
        let steering = { x: 0, y: 0 };
        let total_in_perception = 0;
        for (const other of flock) {
            if (other === this) continue;
            const d_sq = this._distance_sq(other);
            if (d_sq > 0 && d_sq < Boid.PERCEPTION_RADIUS * Boid.PERCEPTION_RADIUS) {
                steering.x += other.position.x;
                steering.y += other.position.y;
                total_in_perception++;
            }
        }

        if (total_in_perception > 0) {
            steering.x /= total_in_perception;
            steering.y /= total_in_perception;
            steering.x -= this.position.x;
            steering.y -= this.position.y;

            const mag_sq = steering.x * steering.x + steering.y * steering.y;
            if (mag_sq > 0) {
                const mag = Math.sqrt(mag_sq);
                steering.x = (steering.x / mag) * Boid.MAX_SPEED;
                steering.y = (steering.y / mag) * Boid.MAX_SPEED;
                steering.x -= this.velocity.x;
                steering.y -= this.velocity.y;
                this._limit(steering, Boid.MAX_FORCE);
            }
        }
        return steering;
    }

    _avoid_mouse(mouse_pos) {
        let steering = { x: 0, y: 0 };

        if (mouse_pos && mouse_pos.x > -1) {
            const dx = this.position.x - mouse_pos.x;
            const dy = this.position.y - mouse_pos.y;
            const d_sq = dx * dx + dy * dy;

            if (d_sq > 0 && d_sq < Boid.MOUSE_INFLUENCE_RADIUS * Boid.MOUSE_INFLUENCE_RADIUS) {
                const mag = Math.sqrt(d_sq);
                steering.x = (dx / mag) * Boid.MAX_SPEED;
                steering.y = (dy / mag) * Boid.MAX_SPEED;

                steering.x -= this.velocity.x;
                steering.y -= this.velocity.y;
                this._limit(steering, Boid.MAX_FORCE * 2);
            }
        }
        return steering;
    }


    _apply_rules(flock, rule_mode, mouse_pos) {
        this.acceleration = { x: 0, y: 0 };
        
        if (rule_mode >= 1) {
            const separation = this._separation(flock);
            this.acceleration.x += separation.x * Boid.SEPARATION_WEIGHT;
            this.acceleration.y += separation.y * Boid.SEPARATION_WEIGHT;
        }

        if (rule_mode >= 2) {
            const alignment = this._alignment(flock);
            this.acceleration.x += alignment.x * Boid.ALIGNMENT_WEIGHT;
            this.acceleration.y += alignment.y * Boid.ALIGNMENT_WEIGHT;
        }

        if (rule_mode >= 3) {
            const cohesion = this._cohesion(flock);
            this.acceleration.x += cohesion.x * Boid.COHESION_WEIGHT;
            this.acceleration.y += cohesion.y * Boid.COHESION_WEIGHT;
        }
        
        const avoidance = this._avoid_mouse(mouse_pos);
        this.acceleration.x += avoidance.x * Boid.MOUSE_AVOIDANCE_WEIGHT;
        this.acceleration.y += avoidance.y * Boid.MOUSE_AVOIDANCE_WEIGHT;
    }

    update(flock, rule_mode, mouse_pos) {
        this._apply_rules(flock, rule_mode, mouse_pos);

        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this._limit(this.velocity, Boid.MAX_SPEED);

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        this._wrap_edges();
    }
}

export default class Boids {
    static NUM_BOIDS = 500;

    constructor(width, height, element) {
        this.width = width;
        this.height = height;
        this.element = element;
        this.flock = [];

        // NEW: Rule mode for toggling
        // 1 = Separation only
        // 2 = Separation + Alignment
        // 3 = All three rules
        this.rule_mode = 3; 

        for (let i = 0; i < Boids.NUM_BOIDS; i++) {
            this._spawn_boid();
        }
    }

    _spawn_boid() {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        this.flock.push(new Boid(x, y, this.width, this.height));
    }

    update(delta_time, mouse_pos) {
        for (const boid of this.flock) {
            boid.update(this.flock, this.rule_mode, mouse_pos);
        }
    }

    render() {
        const grid = Array(this.height).fill(null).map(() => Array(this.width).fill(' '));
        
        for (const boid of this.flock) {
            const x = Math.floor(boid.position.x);
            const y = Math.floor(boid.position.y);
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                 grid[y][x] = 'O'; 
            }
        }
        this.element.textContent = grid.map(row => row.join('')).join('\n');
    }
    
    getInfo() {
        const active_rules = [];
        if (this.rule_mode >= 1) active_rules.push('SEPARATION');
        if (this.rule_mode >= 2) active_rules.push('ALIGNMENT');
        if (this.rule_mode >= 3) active_rules.push('COHESION');

        return [
            `GRID: ${this.width}x${this.height}`,
            `BOIDS: ${this.flock.length}/${Boids.NUM_BOIDS}`,
            `RULES: ${active_rules.join(', ') || 'NONE'}`
        ];
    }
}


