var app = angular
  .module('DataCenter', [
    'ngResource',
    'ngCookies',
    'datatables',
    'ui.bootstrap'
  ]);

(function () {
  app
    .config(['$resourceProvider', function($resourceProvider) {
      // Don't strip trailing slashes from calculated URLs
      $resourceProvider.defaults.stripTrailingSlashes = false;
    }]);
})();

$(function() {
  'use strict';

  var modal = $('modal');

  // Настройки DataTable
  $.extend(true, $.fn.DataTable.defaults, {
    //dom: "<'row'<'#data-table-filter.col-sm-6'><'col-sm-6'f>>" + "<'row'<'col-sm-12'tr>>" + "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    dom: '<"row"<"col-sm-12"f>>t<"row"<"col-sm-12"p>>',
    lengthChange: true,
    info:         true,
    stateSave:    true,
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
      loadingRecords:     'Загрузка данных с сервера...',
      info:               'Записи с _START_ по _END_ из _TOTAL_',
      infoFiltered:       '(выборка из _MAX_ записей)',
      infoEmpty:          '0 записей'
    },
    initComplete: function (settings, json) {
      // Изменить класс у формы поиска
      //$('.dataTables_filter input').removeClass('input-sm');
    }
  });

  // Настройки модальных окон
  $('.modal.fade').modal({
    keyboard: true,
    show:     false
  });

  //$.fn.dataTable.Api.register('table().ChangeSearchFilter()', function () {
  //  $('.dataTables_filter input').removeClass('input-sm');
  //});

  // Закрыть модальное окно и перезагрузить таблицу в случае успешного создания руководителя
  // table - селектор (желательно id) таблицы, которую необходимо обновить
  //$.fn.modal_success = function (table) {
  //  this.modal('hide');

    //$(table).DataTable().ajax.reload(null, false);
  //};
});


// Функция, удаляющая класс input-sm у формы поиска
function ChangeSearchFilter() {
  $('.dataTables_filter input').removeClass('input-sm');
}

// Функция, добавляющая кнопку "Добавить" в заголовок таблицы
// Куда добавлять - #name_block
// Что добавлять - #name_form
// name - общий у обоих параметров
function AddButton(name) {
  $('#' + name + '_form').appendTo('#' + name + '_block');
}