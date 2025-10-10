import { ascii_art } from './terminal_art/art-data.js';
import RippleEffect from './terminal_art/ripple.js';
import Boids from './terminal_art/boids.js';
import DigitalRain from './terminal_art/rain.js';
import PerlinFlow from './terminal_art/perlin.js';

const App = {
    elements: {
        art: null,
        title: null,
        info_card: null,
        info_title: null,
        info_text: null,
    },
    state: {
        animation_interval: null,
        active_simulation: null,
        simulation_loop_id: null,
        last_time: 0,
        mouse_pos: { x: -1, y: -1 },
    },

    initialize() {
        
        this.elements.art = document.getElementById('ascii');
        this.elements.title = document.getElementById('ascii-title');
        this.elements.info_card = document.getElementById('info-card');
        this.elements.info_title = document.getElementById('info-title');
        this.elements.info_text = document.getElementById('info-text');
        this._attach_event_listeners();
        this.display_random_art();
    },

    _attach_event_listeners() {
        this.elements.art.addEventListener('mousemove', (e) => {
            if (!this.state.active_simulation) return;
            const sim = this.state.active_simulation;
            const rect = this.elements.art.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.state.mouse_pos.x = Math.floor(x / (rect.width / sim.width));
            this.state.mouse_pos.y = Math.floor(y / (rect.height / sim.height));
        });
        this.elements.art.addEventListener('click', (e) => {
            if (this.state.active_simulation && typeof this.state.active_simulation.handle_click === 'function') {
                this.state.active_simulation.handle_click(this.state.mouse_pos.x, this.state.mouse_pos.y);
            }
        });
        this.elements.art.addEventListener('mouseleave', () => {
            this.state.mouse_pos.x = -1;
            this.state.mouse_pos.y = -1;
        });
    },

    _get_weighted_random_art() {
        const total_weight = ascii_art.reduce((sum, art) => sum + (art.weight ?? 1), 0);
        if (total_weight === 0) {
            return ascii_art[Math.floor(Math.random() * ascii_art.length)];
        }
        let random_num = Math.random() * total_weight;
        for (const art_piece of ascii_art) {
            random_num -= (art_piece.weight ?? 1);
            if (random_num <= 0) return art_piece;
        }
        return ascii_art[ascii_art.length - 1];
    },

    display_random_art() {
        this.clean_up();
        const art_piece = this._get_weighted_random_art();
        this.elements.title.textContent = art_piece.title;

        switch (art_piece.type) {
            case 'static':
                this.elements.art.textContent = art_piece.content;
                break;
            case 'animation':
                this._run_simple_animation(art_piece);
                break;
            case 'interactive':
                this.elements.info_card.style.display = 'block';
                this.elements.info_title.textContent = art_piece.title + '.info';

                let SimClass;
                switch (art_piece.simulation) {
                    case 'boids': SimClass = Boids; break;
                    case 'rain': SimClass = DigitalRain; break;
                    case 'ripple': SimClass = RippleEffect; break;
                    case 'perlin': SimClass = PerlinFlow; break;
                    default: return;
                }
                
                const config = art_piece.config || {};
                const renderer = config.renderer || 'default';
                let width, height;
                
                const card_element = this.elements.art.closest('.card');
                width = 50;
                height = 25;

                if (renderer === 'boid') {
                    width = 200;
                    height = 100;
                    this.elements.art.classList.add('boid-renderer-active');
                    if (card_element) card_element.classList.add('wide-card');
                } else if (renderer === 'fine') {
                    width = 100;
                    height = 50;
                    this.elements.art.classList.add('fine-renderer-active');
                    if (card_element) card_element.classList.add('wide-card');
                } else {
                    // width = 55;
                    // height = 25;
                }

                this.state.active_simulation = new SimClass(width, height, this.elements.art);
                this.state.last_time = performance.now();
                this._run_simulation_loop();
                break;
        }
    },

    _run_simple_animation(art_piece) {
        let current_frame = 0;
        const animate = () => {
            this.elements.art.innerHTML = art_piece.processor ? art_piece.processor(art_piece.frames[current_frame]) : art_piece.frames[current_frame];
            current_frame = (current_frame + 1) % art_piece.frames.length;
        };
        animate();
        this.state.animation_interval = setInterval(animate, art_piece.interval || 500);
    },

    _run_simulation_loop(current_time = 0) {
        const delta_time = (current_time - this.state.last_time) / 1000;
        this.state.last_time = current_time;

        if (this.state.active_simulation) {
            this.state.active_simulation.update(delta_time, this.state.mouse_pos);
            this.state.active_simulation.render();

            if (typeof this.state.active_simulation.getInfo === 'function') {
                const info_data = this.state.active_simulation.getInfo();
                this.elements.info_text.innerHTML = info_data.join(' | ');
            }
        }
        this.state.simulation_loop_id = requestAnimationFrame((time) => this._run_simulation_loop(time));
    },

    clean_up() {
        if (this.state.animation_interval) clearInterval(this.state.animation_interval);
        if (this.state.simulation_loop_id) cancelAnimationFrame(this.state.simulation_loop_id);
        
        this.elements.art.classList.remove('fine-renderer-active');
        this.elements.art.classList.remove('boid-renderer-active');
        this.elements.art.innerHTML = '';

        const card_element = this.elements.art.closest('.card');
        if (card_element) card_element.classList.remove('wide-card');

        if (this.elements.info_card) {
            this.elements.info_card.style.display = 'none';
            this.elements.info_text.innerHTML = '';
        }

        if (this.state.active_simulation?.clear) {
            this.state.active_simulation.clear();
        }
        
        this.state.active_simulation = null;
    },
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    App.initialize();
  }, 1000);
});

