const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

const USERNAME = process.env.FTP_USERNAME || 'set.in.env.var';
const PASSWORD = process.env.FTP_PASSWORD;

ftpDeploy
  .deploy({
    user: USERNAME,
    password: PASSWORD,
    host: 'ftp.zeddic.com',
    port: 21,
    localRoot: __dirname + '/build',
    remoteRoot: '/public_html/gcbc/',
    include: ['*', '**/*', '.*'],
    exclude: [],
    deleteRemote: true,
  })
  .then(res => console.log('finished:', res))
  .catch(err => console.log(err));
