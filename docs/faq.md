## Frequently asked questions

1. Should we separate where drinks go to others? A way to filter KDS by category: we want to only see drinks.
1. What happens if we need to join tables ad-hoc? We join the tables and we remove a table.
1. What happens if people change the order of the QRs? We are going to add numbers to each of the QR codes we generate. A visual number we send to restaurants.
1. What happens when there's an error? We want to explicitely monitor and report all errors: 1. when the order fails, explicit error on customer side 2. if it "arrives" on the customer side but not the kitchen, when the customer hits "Estado del pedido" or there's a TK timeout get them to the page.
1. What happens when the customer gets it wrong? Calls the waiter and the waiter is going to have a page to remove some pages, from their phone.
1. How should we do our taxes/transactions? We should integrate with verifactu or others.
1. What happens when the QR is broker or I lose it? We support downloading the paper version on the restaurants page. In case the good QR is broken or lost, they don't lose business.
1. Can we share the QR sessions using Whatsapp or Messenger? Yes, it's a unique URL generated for the session, i.e. https://mzenas.com/<restaurante>/<mesa>/87d6a8c8-74be-44c8-a8b0-fea2e169d484
1. What happens when the customer has lots of drinks?
1. What happens if the waiter forgets to free the table? We remind the waiter and have a timer to pop the notification back up. We want to use the color orange as a way to display to the waiter.
