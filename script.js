const rawBonsai = `
                             .s.s.
                         , \`'Y8bso.
                       ,d88bso y'd8l
                       ",8K j8P*?b.
                      ,bonsai_\`o.o
                 ,r.osbJ--','  e8b?Y.. 
                j*Y888P*{ \`._.-'" 888b
                  \`"',.\`'-. \`"*?*P"
                   db8sld-'., ,):5ls.
              <sd88P,-d888P'd888d8888Rdbc
              \`"*J*CJ8*d8888l:'  \`\`88?bl.o
              .o.sl.rsdP^*8bdbs.. *"?**l888s.
            ,\`JYsd88P88ls?\\**"\`*\`-. \`  \` \`"\`   
           dPJ88*J?P;Pd888D;=-.  -.l.s.
         .'\`"*Y,.sbsdkC l.    ?(     ^.
              .Y8*?8P*"\`       \`)\' .' :
                \`"\`         _.-'. ,   k.
                           (    : '  ('
                  _______ ,'\`-  ).\`. \`.l  ___
              r========-==-==-=-=-=------------=7
              \`Y - --  ---- -- -   .          ,'
                :                        '   :
                 \`-..  .. .. . . . . .     ,/\`
              .-<=:\`._____________________,'.:&gt;-.
              L______                        ___J
`;

const leafColors = ["#3ba55d", "#34a853", "#2ea043", "#36b45b", "#2f9e4d"];
const danceColors = ["#ff69b4", "#fadb2f", "#83a598", "#d3869b", "#fabd2f", "#b8bb26"];

function colorizeDance(frame) {
    return frame.replace(/♪/g, () => {
        const color = danceColors[Math.floor(Math.random() * danceColors.length)];
        return `<span class="dance" style="color:${color}">♪</span>`;
    });
}

class RippleEffect {
    constructor(element) {
        this.element = element;
        this.gridWidth = 50;
        this.gridHeight = 25;
        this.particles = [];
        this.chars = [' ', '░', '▒', '▓', '█'];
        this.mouse = { x: -1, y: -1 };
        this.isMouseOver = false;
        this.particleStates = new Map(); 
        
        this.restSpringConstant = 0.05;
        this.neighborSpringConstant = 0.03;
        this.dampening = 0.94;
        this.maxVelocity = 0.4;
        this.mouseInfluenceRadius = 1.25;
        this.mouseForce = 0.25;
        this.clickForce = 1;
        this.clickRadius = 2;
    }

    init() {
        for (let i = 0; i < this.gridHeight; i++) {
            this.particles[i] = [];
            for (let j = 0; j < this.gridWidth; j++) {
                this.particles[i][j] = {
                    x: j, 
                    y: i,
                    restX: j, 
                    restY: i, 
                    vx: 0, 
                    vy: 0, 
                    displacement: 0
                };
            }
        }
        
        this.element.addEventListener('mouseenter', () => {
            this.isMouseOver = true;
        });

        this.element.addEventListener('mouseleave', () => {
            this.isMouseOver = false;
            this.mouse.x = -1;
            this.mouse.y = -1;
        });

        this.element.addEventListener('click', (e) => {
            const rect = this.element.getBoundingClientRect();
            const charWidth = this.element.offsetWidth / this.gridWidth;
            const charHeight = this.element.offsetHeight / this.gridHeight;

            const gridX = Math.floor((e.clientX - rect.left) / charWidth);
            const gridY = Math.floor((e.clientY - rect.top) / charHeight);
            
            const clickX = Math.max(1, Math.min(this.gridWidth - 2, gridX));
            const clickY = Math.max(1, Math.min(this.gridHeight - 2, gridY));

            for (let i = 0; i < this.gridHeight; i++) {
                for (let j = 0; j < this.gridWidth; j++) {
                    const particle = this.particles[i][j];
                    const dx = clickX - j;
                    const dy = clickY - i;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.clickRadius && distance > 0) {
                        const forceMagnitude = (this.clickRadius - distance) / this.clickRadius;
                        const force = this.clickForce * forceMagnitude;
                        
                        const normalizedDx = dx / distance;
                        const normalizedDy = dy / distance;
                        
                        particle.vx -= normalizedDx * force;
                        particle.vy -= normalizedDy * force;
                    }
                }
            }
        });

        this.element.addEventListener('mousemove', (e) => {
            if (!this.isMouseOver) return;
            
            const rect = this.element.getBoundingClientRect();
            const charWidth = this.element.offsetWidth / this.gridWidth;
            const charHeight = this.element.offsetHeight / this.gridHeight;

            const gridX = Math.floor((e.clientX - rect.left) / charWidth);
            const gridY = Math.floor((e.clientY - rect.top) / charHeight);
            
            this.mouse.x = Math.max(1, Math.min(this.gridWidth - 2, gridX));
            this.mouse.y = Math.max(1, Math.min(this.gridHeight - 2, gridY));
        });
        
        this.animate();
    }

    animate() {
        if (this.isMouseOver && this.mouse.x >= 0 && this.mouse.y >= 0) {
            for (let i = 0; i < this.gridHeight; i++) {
                for (let j = 0; j < this.gridWidth; j++) {
                    const particle = this.particles[i][j];
                    const dx = this.mouse.x - j;
                    const dy = this.mouse.y - i;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.mouseInfluenceRadius && distance > 0) {
                        const forceMagnitude = (this.mouseInfluenceRadius - distance) / this.mouseInfluenceRadius;
                        const force = this.mouseForce * forceMagnitude;
                        
                        const normalizedDx = dx / distance;
                        const normalizedDy = dy / distance;
                        
                        particle.vx -= normalizedDx * force;
                        particle.vy -= normalizedDy * force;
                    }
                }
            }
        }

        for (let i = 1; i < this.gridHeight - 1; i++) {
            for (let j = 1; j < this.gridWidth - 1; j++) {
                const particle = this.particles[i][j];
                
                const restForceX = (particle.restX - particle.x) * this.restSpringConstant;
                const restForceY = (particle.restY - particle.y) * this.restSpringConstant;
                
                let neighborForceX = 0;
                let neighborForceY = 0;
                
                const neighbors = [
                    { i: i-1, j: j, isDiagonal: false },
                    { i: i+1, j: j, isDiagonal: false },
                    { i: i, j: j-1, isDiagonal: false },
                    { i: i, j: j+1, isDiagonal: false },
                    { i: i-1, j: j-1, isDiagonal: true },
                    { i: i-1, j: j+1, isDiagonal: true },
                    { i: i+1, j: j-1, isDiagonal: true },
                    { i: i+1, j: j+1, isDiagonal: true }
                ];
                
                for (const neighbor of neighbors) {
                    const neighborParticle = this.particles[neighbor.i][neighbor.j];
                    const restDistance = neighbor.isDiagonal ? Math.sqrt(2) : 1.0;
                    
                    const dx = neighborParticle.x - particle.x;
                    const dy = neighborParticle.y - particle.y;
                    const currentDistance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (currentDistance > 0) {
                        const force = (currentDistance - restDistance) * this.neighborSpringConstant;
                        const normalizedDx = dx / currentDistance;
                        const normalizedDy = dy / currentDistance;
                        
                        neighborForceX += normalizedDx * force;
                        neighborForceY += normalizedDy * force;
                    }
                }
                
                particle.vx += restForceX + neighborForceX;
                particle.vy += restForceY + neighborForceY;

                particle.vx *= this.dampening;
                particle.vy *= this.dampening;
                
                const velocityMagnitude = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                if (velocityMagnitude > this.maxVelocity) {
                    particle.vx = (particle.vx / velocityMagnitude) * this.maxVelocity;
                    particle.vy = (particle.vy / velocityMagnitude) * this.maxVelocity;
                }
                
                particle.x += particle.vx;
                particle.y += particle.vy;

                particle.displacement = Math.sqrt(
                    Math.pow(particle.x - particle.restX, 2) +
                    Math.pow(particle.y - particle.restY, 2)
                );
            }
        }

        this.render(); 
        requestAnimationFrame(this.animate.bind(this));
    }

    render() {
        const charGrid = Array(this.gridHeight).fill(0).map(() => Array(this.gridWidth).fill(' '));
        const now = Date.now();

        for (let i = 0; i < this.gridHeight; i++) {
            for (let j = 0; j < this.gridWidth; j++) {
                const particle = this.particles[i][j];
                const key = `${j},${i}`;
                const displacement = particle.displacement;

                let charIndex = 0;

                if (displacement > 0.05) {
                    if (!this.particleStates.has(key)) {
                        this.particleStates.set(key, now);
                    }
                    
                    if (displacement > 0.8) {
                        charIndex = 4;
                    } else if (displacement > 0.6) {
                        charIndex = 3;
                    } else if (displacement > 0.3) {
                        charIndex = 2;
                    } else {
                        charIndex = 1;
                    }
                } else if (this.particleStates.has(key)) {
                    const age = now - this.particleStates.get(key);
                    if (age < 300) {
                        charIndex = 2;
                    } else if (age < 600) {
                        charIndex = 1;
                    } else {
                        this.particleStates.delete(key);
                        charIndex = 0;
                    }
                }

                charGrid[i][j] = this.chars[charIndex];
            }
        }

        let output = '';
        for (let i = 0; i < this.gridHeight; i++) {
            output += charGrid[i].join('') + '\n';
        }
        this.element.textContent = output;
    }
    
    start() {
        this.element.classList.add('ripple-active');
        this.init();
    }
}


const asciiArt = [
    {
        type: "animation",
        frames: [`
♪　　　　 ∧＿∧　　　♪
　　　 （´・ω・｀∩
　　 　　o　　　,ﾉ
　　　　Ｏ＿　.ﾉ
♪　　　 　 (ノ\`,`,
`
♪　　　　∧＿∧　 
　　　 ∩・ω・｀）
　　　 |　　 ⊂ﾉ
　　　｜　　 _⊃　　
　　　 し ⌒`
        ],
        title: "/home/tim/ascii-animation"
    },
    {
        type: "static",
        content: rawBonsai,
        title: "/home/tim/ascii-bonsai"
    },
    {
        type: "ripple",
        title: "/home/tim/ascii-ripple"
    }
];

let animationInterval;
let rippleInstance;

document.addEventListener('DOMContentLoaded', () => {
    const artElement = document.getElementById('ascii');
    const titleElement = document.getElementById('ascii-title');

    function displayRandomArt() {
        if (animationInterval) clearInterval(animationInterval);
        if (rippleInstance) {
            artElement.classList.remove('ripple-active');
            rippleInstance = null;
        }
        
        const randomArt = asciiArt[Math.floor(Math.random() * asciiArt.length)];

        titleElement.textContent = randomArt.title;

        if (randomArt.type === "animation") {
            let currentFrame = 0;
            function animateFrames() {
                let frame = randomArt.frames[currentFrame];
                frame = colorizeDance(frame);
                artElement.innerHTML = frame;
                currentFrame = (currentFrame + 1) % randomArt.frames.length;
            }
            animateFrames();
            animationInterval = setInterval(animateFrames, 1000);
        } else if (randomArt.type === "static") {
            artElement.textContent = rawBonsai;
        } else if (randomArt.type === "ripple") {
            rippleInstance = new RippleEffect(artElement);
            rippleInstance.start();
        }
    } 
    setTimeout(displayRandomArt, 500); 
});