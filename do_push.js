const { spawnSync } = require('child_process');
const fs = require('fs');
const cwd = 'C:/Users/sever/IdeaProjects/MASEOfficial';
let log = '';

function run(args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  const out = `CMD: git ${args.join(' ')}\nSTDOUT: ${r.stdout}\nSTDERR: ${r.stderr}\nEXIT: ${r.status}\n---\n`;
  log += out;
  return r;
}

run(['remote', 'set-url', 'github', 'https://github.com/MaseSites/mase.git']);
run(['remote', '-v']);
run(['log', '--oneline', '-3']);
run(['push', 'github', 'main', '--force']);

fs.writeFileSync('push_result.txt', log, 'utf8');
console.log('DONE - see push_result.txt');
console.log(log);

