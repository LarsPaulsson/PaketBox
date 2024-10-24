curl -v -X POST https://mpc.getswish.net/qrg-swish/api/v1/prefilled -H "Content-Type: application/json" --data '{"format": "png", "size": 300}'

curl --request POST --header "Content-Type: application/json" --data '{"format":"png","size":300,"message":{"value":"test message","editable":true},"amount":{"value":100,"editable":false}}' --output qrcode.png https://mpc.getswish.net/qrg-swish/api/v1/prefilled

curl --request POST --header "Content-Type: application/json" --data {"format":"png","size":300,"message":{"value":"test message","editable":true},"amount":{"value":100,"editable":false}} --output qrcode.png https://mpc.getswish.net/qrg-swish/api/v1/prefilled

curl --request POST --header "Content-Type: application/json" --data '{"format":"png","size":300,"message":{"value":"test message","editable":true},"amount":{"value":100,"editable":false},"payee":{"value":"123456789","editable":true}}' --output qrcode.png https://mpc.getswish.net/qrg-swish/api/v1/prefilled

curl --data '{"format":"svg","size":300,"message":{"value":"test","editable":true},"amount":{"value":100,"editable":false},"transparent":true}' --header "Content-Type: application/json" --output output.png --request POST https://mpc.getswish.net/qrg-swish/api/v1/prefilled