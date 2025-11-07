import path, { join, dirname } from 'path';
import gradient from 'gradient-string';
const { pastel } = gradient;
import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

  let duck = pastel.multiline(
    [
      "───▄▀▀▀▄▄▄▄▄▄▄▀▀▀▄───",
      "───█▒▒░░░░░░░░░▒▒█───",
      "────█░░█░░░░░█░░█────",
      "─▄▄──█░░░▀█▀░░░█──▄▄─",
      "█░░█─▀▄░░░░░░░▄▀─█░░█",
      "█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█",
      "█░░╦─╦╔╗╦─╔╗╔╗╔╦╗╔╗░░█",
      "█░░║║║╠─║─║─║║║║║╠─░░█",
      "█░░╚╩╝╚╝╚╝╚╝╚╝╩─╩╚╝░░█",
      "█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█",
    ].join("\n")
  );
  console.log(duck);
  console.log("\n======================================\nRecode by : RexxHayanasi\nInstagram : @rexxzynxd\nGithub: RexxHayanasi\nTelegram: @RexxHayanasi\n======================================\n")
  function start(fileName) {
  const childProcess = spawn('node', [fileName], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  childProcess.on('error', (err) => {
    console.error(`Error starting ${fileName}:`, err.message);
  });

start('main.js');
