var app = angular.module('servers', []);
app.directive('stopClick', function() {
  return function(scope, element, attrs) {
    element.click(function(event) {
      event.preventDefault();
    })
  }
});

app.controller("FlashMessageCtrl",['$attrs', '$timeout', function($attrs, $timeout) {
  controller        = this;
  controller.notice = $attrs.notice;
  controller.alert  = $attrs.alert;

  $timeout(function() {
    controller.notice = null;
  }, 2000);

}]);

/* ======================================================================================= */

$(function () {
  var modal = $('modal');

  // Настройки DataTable
  $.extend(true, $.fn.DataTable.defaults, {
    info: false,
    stateSave: true,
    language: { //Надписи на кнопках и в таблице
      emptyTable: 'Данные отсутствуют',
      paginate: { //Нумерация страниц
        first:    'Перв.',
        last:     'Посл.',
        previous: 'Пред.',
        next:     'След.'
      },
      search:             '',
      searchPlaceholder:  'Поиск',
      zeroRecords:        'Данные отсутсвуют',
      lengthMenu:         'Показано _MENU_ записей',
      processing:         'Выполнение...',
      loadingRecords:     'Загрузка данных с сервера...'
    }
  });

  // Настройки модальных окон
  $('.modal.fade').modal({
    keyboard: true,
    show:     false
  });

});
