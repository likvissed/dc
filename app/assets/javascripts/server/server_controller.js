(function () {
  'use strict';

  app
    .controller('ServerIndexCtrl', ServerIndexCtrl)
    .controller('ServerPreviewCtrl', ServerPreviewCtrl)
    .controller('ServerEditCtrl', ServerEditCtrl);

  ServerIndexCtrl.$inject   = ['$controller', '$scope', '$location', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash'];
  ServerPreviewCtrl.$inject = ['$scope'];
  ServerEditCtrl.$inject    = ['$http', 'GetDataFromServer'];

  function ServerIndexCtrl($controller, $scope, $location, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.previewModal   = false; // Флаг, скрывающий модальное окно
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      //.withOption('ajax', {
      //  url:  '/servers.json',
      //  data: { filter: self.selectedOption.value }
      //})
      .withOption('ajax', '/servers.json')
      .withOption('createdRow', createdRow)
      .withOption('rowCallback', rowCallback)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-2 col-lg-2"' +
            '<"#servers.new-record">>' +
          '<"col-sm-8 col-md-8 col-lg-8">' +
          '<"col-sm-2 col-md-2 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-12"p>>'
      );
    self.servers    = {}; // Объекты серверов (id => data)
    self.dtColumns  = [
      DTColumnBuilder.newColumn(null).withTitle('#').withOption('className', 'col-sm-1').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Имя'),
      DTColumnBuilder.newColumn('server_type.name').withTitle('Тип').withOption('className', 'col-sm-2'),
      DTColumnBuilder.newColumn('status').withTitle('Статус').withOption('className', 'col-sm-2'),
      DTColumnBuilder.newColumn('location').withTitle('Расположение').withOption('className', 'col-sm-1'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center col-sm-1').renderWith(delRecord)
    ];

    var reloadPaging = false;

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      self.servers[data.id] = data;
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

        $scope.$apply(showServerData(data));
      });
    }

    // Показать данные сервера
    function showServerData(row_data) {
      Server.Server.get({id: row_data.id},
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('serverData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response) {
          Flash.alert();
        });
    }

    // Отрендерить ссылку на удаление сервера
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverPage.destroyServer(' + data.id + ')" tooltip-placement="right" uib-tooltip="Удалить сервер"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    // Удалить сервис
    self.destroyServer = function (num) {
      var confirm_str = "Вы действительно хотите удалить сервер \"" + self.servers[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.Server.delete({id: num},
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

  function ServerPreviewCtrl($scope) {
    var self = this;

    $scope.$on('serverData', function (event, data) {
      self.name           = data.name;
      self.status         = data.status;
      self.location       = data.location;
      self.type           = data.server_type.name;
      if (data.clusters[0])
        self.cluster        = data.clusters[0].name;
      self.inventory_num  = data.inventory_num;
      self.serial_num     = data.serial_num;

      self.details = [];
      $.each(data.real_server_details, function (index, value) {
        self.details.push({
          name:   value.server_part.name,
          count:  value.count
        });
      });
    });
  }

// ================================================ Редактирование сервера =============================================

  function ServerEditCtrl($http, GetDataFromServer) {
    var self = this;

    var presence_count = 0; // Количество комплектцющих. Если = 1, не даст удалить последнюю комплектующую

    // Посчитать количество комплектующих сервера
    function getDeatilsCount() {
      $.each(self.value.real_server_details, function (index, value) {
        if (value.destroy == 0 || !value.destroy)
          presence_count ++;
      });
    }

// =============================================== Инициализация =======================================================
    self.init = function (id, name) {
      GetDataFromServer.ajax('servers', id, name)
        .then(function (data) {
          self.value  = data.server;  // Данные о сервере (состояние, тип, состав)
          self.types  = data.types;   // Все существующие типы
          self.parts  = data.parts;   // Все существующие комплектующие серверов

          if (self.value)
            getDeatilsCount();
        });
    };

    // Изменить тип сервера
    self.changeType = function () {
      $http.get('/server_types/' + self.value.server_type.name + '/edit.json')
        .success(function(data, status, header, config) {
          self.value.real_server_details = data.server_details;
          $.each(self.value.real_server_details, function () {
            // Сбросить id для комплектующих шаблонного сервера
            // Это необходимо, так как изначально мы получаем данные от состава шаблонного сервера.
            // Далее эти данные запишутся в состав реального сервера (другая таблица)
            this.id = null;
          });
          self.parts = data.server_parts;

          getDeatilsCount();
        });
    };

    // Добавить комплектующую
    self.addServPart = function () {
      self.value.real_server_details.push({
        server_part_id: self.parts[0].id,
        server_part: self.parts[0],
        count: 1,
        destroy: 0
      });

      presence_count ++;
    };

    // Удалить комплектующую
    self.delServPart = function (detail) {
      // Проверить текущее количество комплектующих
      if (presence_count == 1) {
        alert("Состав сервера не может быть пустым");
        return false;
      }

      presence_count --;

      if (detail.id)
        detail.destroy = 1;
      else
        self.value.real_server_details.splice($.inArray(detail, self.value.real_server_details), 1)
    }
  }
})();