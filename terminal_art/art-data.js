const raw_bonsai = `
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
 .'\`"*Y,.sbsdkC l.     ?(      ^.
         .Y8*?8P*"\`       \`)\' .' :
           \`"\`       _.-'. ,   k.
                     (   : '  ('
           _______ ,'\`-  ).\`. \`.l  ___
         r========-==-==-=-=-=------------=7
         \`Y - --  ---- -- -  .        ,'
           :                     '   :
            \`-..  .. .. . . . . .   ,/\`
         .-<=:\`.\_____________________,'.:&gt;-.
         L______                       ___J
`;

const cat_animation_frames = [
`
♪　　　　 ∧＿∧　　　♪
　　　 （´・ω・｀∩
　　 　　o　　　,ﾉ
　　　　Ｏ＿　.ﾉ
♪　　　 　 (ノ\`,\`
`,
`
♪　　　　∧＿∧　 
　　　 ∩・ω・｀）
　　　 |　　 ⊂ﾉ
　　　｜　　 _⊃　　
　　　 し ⌒\`
`
];

function colorize_notes(frame) {
    const get_random_hex_span = () => {
        const hex_chars = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += hex_chars[Math.floor(Math.random() * 16)];
        }
        return `<span class="dance" style="color:${color}">♪</span>`;
    }
    return frame.replace(/♪/g, get_random_hex_span);
}

export const ascii_art = [
    {type:"animation",frames:cat_animation_frames,title:"/home/tim/ascii-animation",processor:colorize_notes,interval:500,weight:1},
    {type:"static",content:raw_bonsai,title:"/home/tim/ascii-bonsai",weight:1},
    {type:"interactive",simulation:"ripple",title:"/home/tim/ascii-ripple",weight:2,config:{renderer:'default'}},
    {type:"interactive",simulation:"boids",title:"/home/tim/ascii-boids",weight:2,config:{renderer:'boid'}},
    {type:"interactive",simulation:"rain",title:"/home/tim/ascii-rain",weight:2,config:{renderer:'default'}},
    {type:"interactive",simulation:"perlin",title:"/home/tim/ascii-perlin-flow",weight:2,config:{renderer:'fine'}}
];

