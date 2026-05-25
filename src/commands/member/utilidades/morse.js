import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

const MORSE = {
  a:".-",b:"-...",c:"-.-.",d:"-..",e:".",f:"..-.",g:"--.",h:"....",
  i:"..",j:".---",k:"-.-",l:".-..",m:"--",n:"-.",o:"---",p:".--.",
  q:"--.-",r:".-.",s:"...",t:"-",u:"..-",v:"...-",w:".--",x:"-..-",
  y:"-.--",z:"--..",0:"-----",1:".----",2:"..---",3:"...--",4:"....-",
  5:".....",6:"-....",7:"--...",8:"---..",9:"----."
};

export default {
  name: "morse",
  description: "Converte texto para código morse.",
  commands: ["morse"],
  usage: `${PREFIX}morse ola mundo`,
  handle: async ({ fullArgs, sendReply }) => {
    if (!fullArgs?.trim()) throw new InvalidParameterError(`Ex: *${PREFIX}morse ola mundo*`);
    const norm = fullArgs.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const res  = norm.split("").map(c => c === " " ? "/" : (MORSE[c] || "?")).join(" ");
    await sendReply(`📡 *Morse:*\n\n${res}`);
  },
};
