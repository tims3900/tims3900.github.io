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
                 \`-..  .. .. . . . . .     ,/
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

const asciiArt = [
    {
        type: "animation",
        frames: [`
♪　　　　 ∧＿∧　　　♪
　　　 （´・ω・｀∩
　　 　　o　　　,ﾉ
　　　　Ｏ＿　.ﾉ
♪　　　 　 (ノ\,`,
`
♪　　　　∧＿∧　
　　　 ∩・ω・｀）
　　　 |　　 ⊂ﾉ
　　　｜　　 _⊃　　
　　　 し ⌒`
        ]
    },
    {
        type: "static",
        content: rawBonsai
    }
];

let animationInterval;
const artElement = document.getElementById('ascii');

function displayRandomArt() {
    setTimeout(() => {
        if (animationInterval) clearInterval(animationInterval);

        const randomArt = asciiArt[Math.floor(Math.random() * asciiArt.length)];

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
        } else {
            artElement.textContent  = rawBonsai;
        }
    }, 1);
}

window.addEventListener('load', displayRandomArt);
