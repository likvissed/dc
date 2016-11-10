(function() {
  'use strict';

  app
    .controller('ClusterIndexCtrl', ClusterIndexCtrl)     // Таблица серверов (кластеров)
    .controller('ClusterPreviewCtrl', ClusterPreviewCtrl) // Предпросмотр сервера
    .controller('ClusterEditCtrl', ClusterEditCtrl);      // Добавление/редактирование сервера

  //ClusterIndexCtrl.$inject = [];
  ClusterPreviewCtrl.$inject = ['$scope'];
  //ClusterEditCtrl.$inject = [];

// =====================================================================================================================

  function ClusterIndexCtrl($controller, $scope, $rootScope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.dtInstance     = {};
    self.dtOptions      = DTOptionsBuilder
      .newOptions()
      //.withDataProp('data')
      .withOption('ajax', '/clusters.json')
      //.withOption('initComplete', initComplete)
      .withOption('createdRow', createdRow)
      .withDOM(
      '<"row"' +
        '<"col-sm-2 col-md-2 col-lg-2"' +
          '<"#clusters.new-record">>' +
        '<"col-sm-8 col-md-8 col-lg-8">' +
        '<"col-sm-2 col-md-2 col-lg-2"f>>' +
      't<"row"' +
        '<"col-md-12"p>>'
    );

    self.dtColumns      = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('name').withTitle('Серверы').withOption('className', 'col-lg-10'),
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
          // Отправить данные контроллеру ServerPartPreviewCtrl
          $scope.$broadcast('showClusterData', response);
        },
        // Error
        function (response) {
          Flash.alert("Ошибка. Код: " + response.status + " (" + response.statusText + "). Обратитесь к администратору.");
        });
    }

    // Отрендерить ссылку на изменение сервера
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="clusterPage.showClusterModal(\'' + data.name + '\')" tooltip-placement="top" uib-tooltip="Редактировать"><i class="fa fa-pencil-square-o fa-1g"></a>';
    }

    // Отрендерить ссылку на удаление сервера
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="clusterPage.destroyCluster(' + data.id + ')" tooltip-placement="top" uib-tooltip="Удалить"><i class="fa fa-trash-o fa-1g"></a>';
    }

    $scope.$on('reloadClusterData', function (event, data) {
      if (data.reload)
        self.dtInstance.reloadData(null, reloadPaging);
    });

// =============================================== Публичные функции ===================================================

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
        $http.get('/clusters/' + name + '/edit.json').success(function (response) {
          data.method     = 'PUT';
          data.node_roles = angular.copy(response.node_roles);
          data.servers    = angular.copy(response.servers);
          data.value      = angular.copy(response.data);

          $scope.$broadcast('editClusterData', data);
        });
      }
      else {
        $http.get('/clusters/new.json')
          .success(function (response) {
            data.method     = 'POST';
            data.node_roles = angular.copy(response.node_roles);
            data.servers    = angular.copy(response.servers);
            data.value      = angular.copy(response.data);

            $scope.$broadcast('editClusterData', data);
          })
          .error(function (response) {
            Flash.alert(response.full_message);
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
          Flash.alert(response.data.full_message);
        });
    }
  }

// =====================================================================================================================

  function ClusterPreviewCtrl($scope) {
    var self = this;

    self.previewModal   = false;  // Флаг, скрывающий модальное окно
    self.presenceCount  = 0;      // Количество оборудования, из которого состоит сервер

    $scope.$on('showClusterData', function (event, data) {
      self.previewModal = true; // Показать модальное окно

      self.name           = data.name;
      self.details        = data.cluster_details;
      self.presenceCount  = data.cluster_details.length;
    });
  }

// =====================================================================================================================

  function ClusterEditCtrl($scope, Flash, Server) {
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

    $scope.$on('editClusterData', function (event, data) {
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
            self.form['server_part[' + key + ']'].$setValidity(message, flag);
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
      // Ошибка на стороне сервера
      if (parseInt(response.status) >= 500) {
        self.clusterModal = false;
        Flash.alert("Ошибка. Код: " + response.status + " (" + response.statusText + "). Обратитесь к администратору.");
        return false;
      }
      // Нет доступа
      else if (parseInt(response.status) == 403) {
        Flash.alert(response.data.full_message);
        return false;
      }

      errors = response.data.object;
      setValidations(errors, false);

      Flash.alert(response.data.full_message);
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
            $scope.$emit('reloadClusterData', { reload: true });
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
            $scope.$emit('reloadClusterData', { reload: true });
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
      clearForm();
    };
  }
})();