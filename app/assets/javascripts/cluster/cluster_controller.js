(function() {
  'use strict';

  app
    .controller('ClusterIndexCtrl', ClusterIndexCtrl)     // Таблица серверов (кластеров)
    .controller('ClusterPreviewCtrl', ClusterPreviewCtrl) // Предпросмотр сервера
    .controller('ClusterEditCtrl', ClusterEditCtrl);      // Добавление/редактирование сервера

  ClusterIndexCtrl.$inject    = ['$controller', '$scope', '$rootScope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash', 'Error', 'Ability'];
  ClusterPreviewCtrl.$inject  = ['$scope', '$rootScope', 'Server', 'ServiceShareFunc', 'Error'];
  ClusterEditCtrl.$inject     = ['$scope', 'Flash', 'Server', 'Error'];

// =====================================================================================================================

  function ClusterIndexCtrl($controller, $scope, $rootScope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash, Error, Ability) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.deptOptions    = [ // Массив фильтра по отделам (данные берутся с сервера)
      { dept: 'Все отделы' },
      { dept: 'Без отделов' }
    ];
    self.typeOptions    = [ // Массив фильтра по типу сервера (данные берутся с сервера)
      {
        id:   0,
        name: 'Все типы'
      }
    ];
    self.selectedDeptOption   = self.deptOptions[0];
    self.selectedTypeOption   = self.typeOptions[0];
    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      .withDataProp('data')
      .withOption('ajax', {
        url:  '/clusters.json',
        data: {
          clusterTypes: true, // Флаг, необходимый, чтобы получить с сервера все типы серверов
          clusterDepts: true  // Флаге, необходимый, чтобы получить с сервера все отделы
        },
        error: function (response) {
          Error.response(response);
        }
      })
      .withOption('initComplete', initComplete)
      .withOption('createdRow', createdRow)
      .withDOM(
      '<"row"' +
        '<"col-sm-2 col-md-2 col-lg-2"' +
          '<"#clusters.new-record">>' +
        '<"col-sm-4 col-md-4 col-lg-4">' +
        '<"col-sm-2 col-md-2 col-lg-2"' +
          '<"cluster-dept-filter">>' +
        '<"col-sm-2 col-md-2 col-lg-2"' +
          '<"cluster-type-filter">>' +
        '<"col-sm-2 col-md-2 col-lg-2"f>>' +
      't<"row"' +
        '<"col-md-6"i>' +
        '<"col-md-6"p>>'
    );

    self.dtColumns      = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Серверы').withOption('className', 'col-lg-9'),
      DTColumnBuilder.newColumn('services').withTitle('Отделы').notSortable().withOption('className', 'col-lg-2 text-center'),
      DTColumnBuilder.newColumn(null).notSortable().withOption('className', 'text-center').renderWith(editRecord),
      DTColumnBuilder.newColumn(null).notSortable().withOption('className', 'text-center').renderWith(delRecord)
    ];

    var
      clusters      = {},     // Объекты комплектующих серверов (id => data)
      reloadPaging  = false;  // Флаг, указывающий, нужно ли сбрасывать нумерацию или оставлять пользователя на текущей странице

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      clusters[data.id] = data;
      return meta.row + 1;
    }

    function initComplete(settings, json) {
      var api = new $.fn.dataTable.Api(settings);

      Ability.init()
        .then(
          function (data) {
            // Записать в фабрику
            Ability.setRole(data.role);

            // Показать иконки управления только для определенных ролей
            api.column(3).visible(Ability.canView('admin_tools'));
            api.column(4).visible(Ability.canView('admin_tools'));
          },
          function (response, status) {
            Error.response(response, status);

            // Удалить все данные в случае ошибки проверки прав доступа
            api.rows().remove().draw();
          });

      // Заполнить список фильтра по типам оборудования
      if (json.node_roles) {
        self.typeOptions        = self.typeOptions.concat(json.node_roles);
        self.selectedTypeOption = self.typeOptions[0];
      }

      // Заполнить список фильтра по отделам
      if (json.depts) {
        self.deptOptions        = self.deptOptions.concat(json.depts);
        self.selectedDeptOption = self.deptOptions[0];
      }
    }

    function createdRow(row, data, dataIndex) {
      // Создание события просмотра данных о формуляре
      $(row).off().on('click', function (event) {
        if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
          return true;

        $scope.$apply(showClusterData(data));
      });

      // Компиляция строк
      $compile(angular.element(row))($scope);
    }

    // Показать данные кластера/сервера
    function showClusterData(row_data) {
      Server.Cluster.get({ id: row_data.id },
        // Success
        function (response) {
          var data = {
            response:     response,
            fromService:  null
          };

          // Отправить данные контроллеру ServerPartPreviewCtrl
          $scope.$broadcast('cluster:show', data);
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    }

    // Отрендерить ссылку на изменение сервера
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="clusterPage.showClusterModal(\'' + data.name + '\')" tooltip-placement="top" uib-tooltip="Редактировать"><i class="fa fa-pencil-square-o fa-1g pointer"></a>';
    }

    // Отрендерить ссылку на удаление сервера
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="clusterPage.destroyCluster(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

    // Выполнить запрос на сервер с учетом выбранных фильтров
    function newQuery() {
      self.dtInstance.changeData({
        url:  '/clusters.json',
        data: {
          deptFilter: self.selectedDeptOption.dept,
          typeFilter: self.selectedTypeOption.id
        }
      });
    }

    // Событие обновления таблицы после добавления/редактирования сервера
    $scope.$on('table:cluster:reload', function (event, data) {
      if (data.reload)
        self.dtInstance.reloadData(null, reloadPaging);
    });

    // Событие обновления фильтра и обновления таблицы (если это необходимо)
    // data.flag - флаг, определяющий, удалять, изменять или добавлять элементы в фильтра
    // add - добавить
    // delete - удалить
    // update - изменить. После изменения необходимо обновить таблицу для того, чтобы новое имя типа отобразилось в самое таблице.
    $rootScope.$on('table:cluster:filter:node_role', function (event, data) {
      // Удалить тип сервера из фильтра таблицы комплектующих
      if (data.flag == 'delete') {
        var obj = $.grep(self.typeOptions, function (elem) { return elem.id == data.id });
        self.typeOptions.splice($.inArray(obj[0], self.typeOptions), 1);
      }

      // Добавить созданный тип в фильтр таблицы комплектующих
      else if (data.flag == 'add')
        self.typeOptions.push(data.value);

      // Изменить имя типа
      else if (data.flag == 'update') {
        $.each(self.typeOptions, function (index, value) {
          if (data.value.id == value.id) {
            value.name = data.value.name;
            return false;
          }
        });
        self.dtInstance.reloadData(null, reloadPaging);
      }
    });

// =============================================== Публичные функции ===================================================

    // Выполнить запрос на сервер с учетом фильтра
    self.changeFilter = function () {
      newQuery();
    };

    // Открыть модальное окно для создания/редактирования сервера
    // name - имя сервера
    self.showClusterModal = function (name) {
      var data = {
        method:       '',   // Протокол отправки сообщения (POST, PATCH)
        node_roles:   null, // Все типы серверов
        servers:      null, // Всё оборудование
        value:        null  // Данные выбранной комплектующей
      };

      // Если запись редактируется
      if (name) {
        $http.get('/clusters/' + name + '/edit.json')
          .success(function (response) {
            data.method     = 'PUT';
            data.node_roles = angular.copy(response.node_roles);
            data.servers    = angular.copy(response.servers);
            data.value      = angular.copy(response.data);

            $scope.$broadcast('cluster:edit', data);
          })
          .error(function (response, status) {
            Error.response(response, status);
          });
      }
      else {
        $http.get('/clusters/new.json')
          .success(function (response) {
            data.method     = 'POST';
            data.node_roles = angular.copy(response.node_roles);
            data.servers    = angular.copy(response.servers);
            data.value      = angular.copy(response.data);

            $scope.$broadcast('cluster:edit', data);
          })
          .error(function (response, status) {
            Error.response(response, status);
          });
      }
    };

    // Удалить сервер
    self.destroyCluster = function (num) {
      var confirm_str = "Вы действительно хотите удалить сервер \"" + clusters[num].name + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.Cluster.delete({ id: num },
        // Success
        function (response) {
          Flash.notice(response.full_message);

          self.dtInstance.reloadData(null, reloadPaging);
        },
        // Error
        function (response) {
          Error.response(response);
        });
    };
  }

// =====================================================================================================================

  function ClusterPreviewCtrl($scope, $rootScope, Server, ServiceShareFunc, Error) {
    var self = this;

    self.previewModal   = false;  // Флаг, скрывающий модальное окно
    self.presenceCount  = 0;      // Количество оборудования, из которого состоит сервер
    self.fromService    = null;   // Показывает, вызвана ли функция из режима просмотра формуляра (наличие имени - флаг)

// =============================================== Инициализация =======================================================

    $scope.$on('cluster:show', function (event, json) {
      self.previewModal = true; // Показать модальное окно

      var data = json.response;                           // Данные, полученные с сервера

      self.name           = data.name;                    // Имя сервера
      self.details        = data.cluster_details;         // Состав сервера
      self.services       = data.services;                // Список сервисов, функционирующих на сервере
      self.depts          = data.depts;                   // Отделы, использующие сервер
      self.presenceCount  = data.cluster_details.length;  // Число оборудования, входящих в сервер
      self.fromService    = json.fromService;             // Показывает, вызвана ли функция из режима просмотра формуляра (наличие имени - флаг)

      // Установить флаги приоритетов для полученных сервисов
      $.each(self.services, function (index, value) {
        value.flag = ServiceShareFunc.priority(value);
      })
    });

// =============================================== Публичные функции ===================================================

    // Показать данные сервиса
    self.showService = function (id) {
      Server.Service.get({ id: id },
        // Success
        function (response) {
          // Отправить данные контроллеру ServicePreviewCtrl
          $rootScope.$broadcast('service:show', response);

          // Закрыть окно просмотрп сервера, если оно было открыто из окна просмотра сервиса
          if (self.fromService)
            self.previewModal = false;
        },
        // Error
        function (response, status) {
          Error.response(response, status);
        });
    };
  }

// =====================================================================================================================

  function ClusterEditCtrl($scope, Flash, Server, Error) {
    var self = this;

// =============================================== Инициализация =======================================================

    self.clusterModal   = false;  // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.config         = {
      title:  '',                 // Шапка модального окна
      method: ''                  // Метод отправки запрос (POST, PATCH)
    };
    self.value          = null;   // Данные о сервере (имя, состав и т.д.)
    self.presenceCount  = 0;      // Количество оборудования, из которого состоит сервер

    var
      id              = null,   // Id изменяемого кластера
      errors          = null,   // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
      value_template  = {       // Шаблон данных (вызывается при создании нового сервера)
        name: '',
        cluster_details_attributes: []
      };

    $scope.$on('cluster:edit', function (event, data) {
      self.clusterModal = true;

      self.servers        = angular.copy(data.servers);
      self.node_roles     = angular.copy(data.node_roles);
      self.config.method  = angular.copy(data.method);

      if (data.method == 'POST') {
        self.config.title   = 'Новый сервер/кластер';
        self.value          = value_template;
        self.presenceCount  = 0;
      }
      else {
        self.config.title   = data.value.name;
        self.value          = angular.copy(data.value);
        id                  = data.value.id;
        self.presenceCount  = self.value.cluster_details.length;

        // Переименовать объект cluster_details, так как на сервере необходимо другое имя
        self.value.cluster_details_attributes = self.value.cluster_details;
        // Удалить старый объект
        delete self.value.cluster_details;
      }
    });

// =============================================== Приватные функции ===================================================

    // array - объект, содержащий ошибки
    // flag - флаг, устанавливаемый в объект form (false - валидация не пройдена, true - пройдена)
    function setValidations(array, flag) {
      $.each(array, function (key, value) {
        $.each(value, function (index, message) {
          if (key != 'base')
            self.form['cluster[' + key + ']'].$setValidity(message, flag);
        });
      });
    }

    // Очистить модальное окно
    function clearForm() {
      self.value = angular.copy(value_template);
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }
    }

    // Действия в случае успешного создания/изменения контакта
    function successResponse(response) {
      self.clusterModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    // Действия в случае ошибки создания/изменения комплектующей
    function errorResponse(response) {
      Error.response(response);

      errors = response.data.object;
      setValidations(errors, false);
    }

// =============================================== Публичные функции ===================================================

    // Добавить оборудование в составе сервера
    self.addDetail = function () {
      self.value.cluster_details_attributes.push({
        server_id:    self.servers[0].id,
        node_role_id: self.node_roles[0].id
      });

      self.presenceCount ++;
    };

    // Удалить оборудование из состава сервера
    // detail - удаляемая деталь
    self.delDetail = function (detail) {
      if (detail.id)
        detail._destroy = 1;
      else
        self.value.cluster_details_attributes.splice($.inArray(detail, self.value.cluster_details_attributes), 1);

      self.presenceCount --;
    };

    // Добавить класс "has-error" к элементу форму
    self.errorClass = function (name) {
      return (self.form[name].$invalid) ? 'has-error': ''
    };

    // Добавить сообщение об ошибках валидации к элементу формы
    self.errorMessage = function (name) {
      var message = [];

      $.each(self.form[name].$error, function (key, value) {
        message.push(key);
      });

      return message.join(', ');
    };

    // Отправить данные формы на сервер
    self.readyClusterModal = function () {
      // Удалить все предыдущие ошибки валидаций, если таковые имеются
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }

      if (self.config.method == 'POST') {
        // Сохранить данные на сервере
        Server.Cluster.save({ cluster: self.value },
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('table:cluster:reload', { reload: true });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        Server.Cluster.update({ id: id }, { cluster: self.value},
          // Success
          function (response) {
            successResponse(response);

            // Послать флаг родительскому контроллеру на обновление таблицы
            $scope.$emit('table:cluster:reload', { reload: true });
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    // Закрыть модальное окно по кнопке "Отмена"
    self.closeClusterModal = function () {
      self.clusterModal = false;

      self.value.cluster_details_attributes = []; // Очищаем список оборудования
      clearForm();
    };
  }
})();