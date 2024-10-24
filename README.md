# Macken
 
curl --request POST \
     --header "Content-Type: application/json" \
     --data '{
         "format": "png",
         "size": 300,
         "message": {
             "value": "test message",
             "editable": true
         },
         "amount": {
             "value": 100,
             "editable": false
         },
         "payee": {
             "value": "123456789",
             "editable": true
         }
     }' \
     --output qrcode.png \
     https://mpc.getswish.net/qrg-swish/api/v1/prefilled
