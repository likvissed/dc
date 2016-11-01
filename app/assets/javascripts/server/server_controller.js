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

    self.statusOptions = [ // Массив фильтра по статусу сервера
      {
        value:  'all',
        string: 'Все статусы'
      },
      {
        value:  'atWork',
        string: 'В работе'
      },
      {
        value:  'test',
        string: 'Тест'
      },
      {
        value:  'inactive',
        string: 'Простой'
      }
    ];
    self.typeOptions    = [ // Массив фильтра по типа серверов (данные берутся с сервера)
      {
        id:   0,
        name: 'Все типы'
      }
    ];
    self.selectedStatusOption = self.statusOptions[0];
    self.selectedTypeOption   = self.typeOptions[0];
    self.previewModal   = false;  // Флаг, скрывающий модальное окно
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withDataProp('data')
      .withOption('ajax', {
        url:  '/servers.json',
        data: {
          serverTypes:  true,
          statusFilter: self.selectedStatusOption.value
        }
      })
      .withOption('initComplete', initComplete)
      .withOption('createdRow', createdRow)
      .withOption('rowCallback', rowCallback)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-2 col-lg-2"' +
            '<"#servers.new-record">>' +
          '<"col-sm-3 col-md-3 col-lg-3">' +
          '<"col-sm-3 col-md-3 col-lg-3"' +
            '<"server-type-filter">>' +
          '<"col-sm-2 col-md-2 col-lg-2"' +
            '<"server-status-filter">>' +
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

// =============================================== Сразу же включить режим предпросмотра ===============================

    var params = $location.absUrl().match(/servers\?id=(\d+)/);
    if (params)
      showServerData(params[1]);

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      self.servers[data.id] = data;
      return meta.row + 1;
    }

    function initComplete(settings, json) {
      if (json.server_types) {
        self.typeOptions        = self.typeOptions.concat(json.server_types);
        self.selectedTypeOption = self.typeOptions[0];
      }
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

        $scope.$apply(showServerData(data.id));
      });
    }

    // Показать данные сервера
    function showServerData(id) {
      Server.Server.get({id: id},
        // Success
        function (response) {
          // Отправить данные контроллеру ServerPreviewCtrl
          $scope.$broadcast('serverData', response);

          self.previewModal = true; // Показать модальное окно
        },
        // Error
        function (response) {
          Flash.alert("Ошибка. Код: " + response.status + " (" + response.statusText + "). Обратитесь к администратору.");
        });
    }

    // Отрендерить ссылку на удаление сервера
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="serverPage.destroyServer(' + data.id + ')" tooltip-placement="right" uib-tooltip="Удалить сервер"><i class="fa fa-trash-o fa-1g"></a>';
    }

    // Выполнить запрос на сервер с учетом выбранных фильтров
    function newQuery() {
      self.dtInstance.changeData({
        url:  '/servers.json',
        data: {
          statusFilter: self.selectedStatusOption.value,
          typeFilter:   self.selectedTypeOption.id
        }
      });
    }

// =============================================== Публичные функции ===================================================

    // Выполнить запрос на сервер с учетом фильтра
    self.changeFilter = function () {
      newQuery();
    };

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
      if (data.server_type)
        self.type         = data.server_type.name;
      if (data.clusters[0])
        self.cluster      = data.clusters[0].name;
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

    self.presenceCount  = {}; // Объект вида { Имя => Кол-во комплектующих }
    var lastIndex       = 0;  // Индекс последнего элемента формы. Используется для того, чтобы знать, какой индекс
                              // указывать для следующего элемента.

    // Получить текущее кол-во комплектующих для кжадого типа комплектующей
    function getDeatilsCount() {
      $.each(self.detailTypes, function (index, value) {
        self.presenceCount[value.name] = 0;

        if (self.data.real_server_details[value.name])
          $.each(self.data.real_server_details[value.name], function (index, in_value) {
            if (in_value.destroy == 0 || !in_value.destroy)
              self.presenceCount[value.name] ++;
          });

        if (self.presenceCount[value.name] > lastIndex)
          lastIndex = self.presenceCount[value.name];
      });
    }

// =============================================== Инициализация =======================================================

    self.init = function (id, name) {
      GetDataFromServer.ajax('servers', id, name)
        .then(function (data) {
          self.data         = data.server || null;  // Данные о сервере (состояние, тип, состав)
          self.serverTypes  = data.server_types;    // Все существующие типы серверов
          self.detailTypes  = data.detail_types;    // Все существующие типы запчастей с самими запчастями

          if (self.data.real_server_details)
            getDeatilsCount();
        });
    };

// =============================================== Публичные функции ===================================================

    // Изменить тип сервера
    self.changeType = function () {
      if (!self.data.server_type) {
        self.data = null;
        return false;
      }

      $http.get('/server_types/' + self.data.server_type.name + '/edit.json')
        .success(function(data, status, header, config) {
          self.data.real_server_details = data;  // Запчасти выбранного типа сервера (в БД template_server_details)

          // Внутри self.data.real_server_details массивы сгруппированны по типам комплектующих (диски, памят и т.д.)
          $.each(self.data.real_server_details, function (key, arr) {
            $.each(arr, function() {
              // Сбросить id для всех комплектующих шаблонного сервера
              // Это необходимо, так как изначально мы получаем данные от состава шаблонного сервера.
              // Далее эти данные запишутся в состав реального сервера (в другую таблица) и получат новый id.
              this.id = null;

              // Определение индекса последнего элемента. Необходимо, чтобы при добавлении элементов знать, какой индекс
              // им выставлять.
              if (this.index > lastIndex)
                lastIndex = this.index;
            });
          });

          getDeatilsCount();
        });
    };

    // Добавить комплектующую
    // index - индекс типа детали в массиве detailTypes
    self.addDetail = function (index) {
      var type = self.detailTypes[index];

      // Выйти, если тип детали не найден.
      if (!type)
        return false;

      lastIndex += 1;

      // Если массива с данным видом комплектующих не существует, то необходимо его создать
      if (!self.data.real_server_details[type.name])
        self.data.real_server_details[type.name] = [];

      self.data.real_server_details[type.name].push({
          server_part_id: type.server_parts[0],
          server_type_id: self.data.server_type.id,
          server_part:    type.server_parts[0],
          id:             null,
          count:          1,
          destroy:        0,
          index:          lastIndex
      });

      self.presenceCount[type.name] ++;
    };

    // Удалить комплектующую
    // typeName - имя комплектующей
    // detail - объект-деталь
    self.delDetail = function (typeName, detail) {
      if (detail.id)
        detail.destroy = 1;
      else {
        self.data.real_server_details[typeName].splice($.inArray(detail, self.data.real_server_details[typeName]), 1);
        if (detail.index == lastIndex)
          lastIndex -= 1;
      }

      self.presenceCount[typeName] --;
    }
  }
})();