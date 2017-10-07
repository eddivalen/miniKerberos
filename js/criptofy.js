var crp = require('crypto'),
    algorithm = 'aes192';

function encrypt(text, password){
  var cipher = crp.createCipher(algorithm,password);
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text, password){
  var decipher = crp.createDecipher(algorithm,password);
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function Cipher(text, password){
  var decipher = text >>>= password.length;
  var dec = generateRandom(dec);
  var dec = decipher.update(text,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
}