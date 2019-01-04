#!/bin/bash

HOST=localhost
PORT=7545
AMOUNT=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF

# npm run ganache --
./node_modules/ganache-cli/cli.js --gasLimit 0xFFFFFFFF --port $PORT --mnemonic "hold cluster kiss toss mind glad curious twelve biologyehicle start letter" \
  --account 0x0000000000000000000000000000000000000000000000000000000000000001,$AMOUNT \
  --account 0xb82c5dce5f18fe371f124463acc3f4007b6d04d48b2cbc95358b6b03f25fb154,$AMOUNT \
  --account 0xc228437dd9515a8f8048d938de58f473c501aea2a6edfbecdb7456f66c46979d,$AMOUNT \
  --account 0xb38584486a296611fee78169777f87fb3639a3204c6a8986f998bab78abb03da,$AMOUNT \
  --account 0x83ba8e8262432d500c468013a320e34d36ad42fa238dd99f49aadffa59ba7cee,$AMOUNT \
  --account 0xe2935611d482df196429d996485d560ca058baa18bb2eb88cfebabf1b76345f7,$AMOUNT \
  --account 0xf83227ef0cb588da676cd11d6492efc3f11f1cdde487ff54d6246d7ac23277fe,$AMOUNT \
  --account 0x7bc153a314881d452f7f87b84845890458fafebbdb763c489139176d61bef1c5,$AMOUNT \
  --account 0x3dccc079ad878e4cffff93bfd2d1d8989753ce0b35e3d5befb8347e12e32635b,$AMOUNT \
  --account 0x52bfc3d2b451a1d542ac54f612d01db8bd073a5b49fbba28d6fa680fceafe5c4,$AMOUNT \
  --account 0xad0472d844a2c40806aa73873b7ca1be26f7e9064949bbb8c5601156567fccfe,$AMOUNT \
  --account 0xa67955e8d6e2a16be7d040cea03afaf0d8d9e1c3348509814845a7cbac143056,$AMOUNT \
  --account 0xba3a18dacd448c0a76893a4ed306c28bba917d70777ddb857473e091ebfb8ece,$AMOUNT \
  --account 0xe91c54a9b61d785f54a8f4e09a1779c386576ba247cbd8ad67a0155886c24d38,$AMOUNT \
  --account 0xf1fff27c5108718112fffae55ce7ac3c0a4bf48f836bf8edacc2d19afae36833,$AMOUNT \
  --account 0xc0361d27bf0ec6542867e04e5304b95a332b4bbbe5f199b8cb5c8585b879233b,$AMOUNT \
  --account 0xa8cbcca0f09526d3ea5b80954561a56a21f84dd7856d785f03eb7af758d2b548,$AMOUNT \
  & \
  sleep 3; ./node_modules/truffle/build/cli.bundled.js deploy;./node_modules/truffle/build/cli.bundled.js exec fundAccount.js & \
  wait
