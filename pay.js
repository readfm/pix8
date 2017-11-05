window.Pay = {
  init: function(){
    $('<span>', {id: 'pay-openTip'}).tip({
      id: 'pay-options'
    }).click(ev => {

    }).text('Pay').appendTo('#pic');

    var $options = $('<div>', {
      class: 'options tip',
      id: 'pay-options'
    }).text('By:').appendTo('body');

    $('<div>', {class: 'option'}).click(ev => {
      W({
        cmd: 'paypal.pay'
      });
    }).text('Paypal').appendTo($options);

    $('<div>', {class: 'option'}).click(ev => {
    }).text('Credit Card').appendTo($options);

    $('<div>', {class: 'option'}).click(ev => {
    }).text('Bitcoin').appendTo($options);

    $('<div>', {class: 'option'}).click(ev => {
    }).text('Etherium').appendTo($options);
  }
};
