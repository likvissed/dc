(function () {
  'use strict';

  app
    .controller('ServerPartIndexCtrl', ServerPartIndexCtrl)
    .controller('ServerPartPreviewCtrl', ServerPartPreviewCtrl);

  ServerPartIndexCtrl.$inject   = ['$controller', '$scope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash'];
  ServerPartPreviewCtrl.$inject = ['$scope'];

  function ServerPartIndexCtrl($controller, $scope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.previewModal   = false; // Флаг, скрывающий модальное окно
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      //.withOption('ajax', {
      //  url:  '/server_parts.json',
      //  data: { filter: self.selectedOption.value }
      //})
      .withOption('ajax', '/server_parts.json')
      .withOption('createdRow', createdRow)
      .withOption('rowCallback', rowCallback)
      .withDOM(
      '<"row"' +
        '<"col-sm-2"' +
          '<"#server_parts.new-record">>' +
        '<"col-sm-8">' +
        '<"col-sm-2"f>>' +
      't<"row"' +
        '<"col-sm-12"p>>'
    );
    self.server_parts   = {}; // Объекты комплектующих серверов (id => data)
    self.dtColumns      = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-sm-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Имя'),
      DTColumnBuilder.newColumn('detail_type.name').withTitle('Тип').withOption('className', 'col-sm-2'),
      DTColumnBuilder.newColumn('part_num').withTitle('Номер').withOption('className', 'col-sm-2'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-sm-1').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      self.server_parts[data.id] = data;
      return meta.row + 1;
    }

    // Компиляция строк
    function createdRow(row, data, dataIndex) {
      $compile(angular.element(row))($scope);
    }

    function rowCallback(row, data, index) {
      // Создание события просмотра данных о формуляре
      $(row).off().on('click', function (event) {
        if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
          return true;

        $scope.$apply(showServerPartData(data));
      });
    }

    // Показать данные сервера
    function showServerPartData(row_data) {
      Server.ServerPart.get({id: row_data.id},
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('serverPartData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response) {
          Flash.alert();
        });
    }

    // Отрендерить ссылку на удаление сервера
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverPartPage.destroyServerPart(' + data.id + ')" tooltip-placement="right" uib-tooltip="Удалить комплектующую"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    // Удалить сервис
    self.destroyServerPart = function (num) {
      var confirm_str = "Вы действительно хотите удалить комплектующую \"" + self.server_parts[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.ServerPart.delete({id: num},
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);
        },
        // Error
        function (response) {
          Flash.alert(response.data.full_message);
        });
    }
  }

// ================================================ Режим предпросмотра сервера ========================================

  function ServerPartPreviewCtrl($scope) {
    var self = this;

    $scope.$on('serverPartData', function (event, data) {
      self.name   = data.name;
      self.type   = data.detail_type.name;
      self.number = data.part_num;
      if (data.comment)
        self.comment = data.comment;
      else
        self.comment = 'Отсутствует';
    });
  }

})();