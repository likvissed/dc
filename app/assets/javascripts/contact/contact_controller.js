(function() {
  'use strict';

  app
    .controller('ContactCtrl', ContactCtrl);

  ContactCtrl.$inject = ['$controller', '$scope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', 'Server', 'Flash'];

  function ContactCtrl($controller, $scope, $http, $compile, DTOptionsBuilder, DTColumnBuilder, Server, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    // Подключаем основные параметры таблицы
    $controller('DefaultDataTableCtrl', {});

    self.dtInstance   = {};
    self.dtOptions    = DTOptionsBuilder
      .newOptions()
      .withOption('ajax', '/contacts.json')
      .withOption('createdRow', createdRow)
      .withDOM(
        '<"row"' +
          '<"col-sm-2 col-md-3 col-lg-2"' +
            '<"#contacts.new-record">>' +
          '<"col-sm-8 col-md-6 col-lg-8">' +
          '<"col-sm-2 col-md-3 col-lg-2"f>>' +
        't<"row"' +
          '<"col-md-12"p>>'
      );

    self.dtColumns    = [
      DTColumnBuilder.newColumn(null).withTitle('#').renderWith(renderIndex),
      DTColumnBuilder.newColumn('info').withTitle('ФИО').withOption('className', 'col-sm-5'),
      DTColumnBuilder.newColumn('dept').withTitle('Отдел').withOption('className', 'col-sm-1 text-center'),
      DTColumnBuilder.newColumn('work_num').withTitle('Раб. тел.').withOption('className', 'col-sm-2 text-center'),
      DTColumnBuilder.newColumn('mobile_num').withTitle('Мобильный тел.').withOption('className', 'col-sm-3 text-center'),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center').renderWith(editRecord),
      DTColumnBuilder.newColumn(null).withTitle('').notSortable().withOption('className', 'text-center').renderWith(delRecord)
    ];
    self.contacts     = {};     // Объекты контактов (id => data)
    self.contactModal = false;  // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.config       = {
      title:  '',               // Шапка модального окна
      method: ''                // Метод отправки запрос (POST, PATCH)
    };
    self.value        = angular.copy(value_template);

    var
      reloadPaging    = false,  // Флаг, указывающий, нужно ли сбрасывать нумерацию или оставлять пользователя на текущей странице
      errors          = null,   // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
      tn              = null,   // Табельный номер редактируемого контакта
      value_template  = {       // Шаблон данных (вызывается при создании нового контакта)
        tn:         '',
        manually:   false,
        info:       '',
        dept:       '',
        work_num:   '',
        mobile_num: ''
      };

// =============================================== Приватные функции ===================================================

    // Показать номер строки
    function renderIndex(data, type, full, meta) {
      self.contacts[data.tn] = data; // Сохранить данные контакта (нужны для вывода пользователю информации об удаляемом элементе)
      return meta.row + 1;
    }

    // Компиляция строк
    function createdRow (row, data, dataIndex) {
      $compile(angular.element(row))($scope);
    }

    // array - объект, содержащий ошибки
    // flag - флаг, устанавливаемый в объект form (false - валидация не пройдена, true - пройдена)
    function setValidations(array, flag) {
      $.each(array, function (key, value) {
        $.each(value, function (index, message) {
          if (key != 'base')
            self.form['contact[' + key + ']'].$setValidity(message, flag);
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
      self.contactModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    // Действия в случае ошибки создания/изменения контакта
    function errorResponse(response) {
      // Ошибка на стороне сервера
      if (parseInt(response.status) >= 500) {
        self.contactModal = false;
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

    // Отрендерить ссылку на изменение контакта
    function editRecord(data, type, full, meta) {
      return '<a href="" class="default-color" disable-link=true ng-click="contactPage.showContactModal(' + data.tn + ')" tooltip-placement="right" uib-tooltip="Редактировать контакт"><i class="fa fa-pencil-square-o fa-1g"></a>';
    }

    // Отрендерить ссылку на удаление контакта
    function delRecord(data, type, full, meta) {
      return '<a href="" class="text-danger" disable-link=true ng-click="contactPage.destroyContact(' + data.tn + ')" tooltip-placement="right" uib-tooltip="Удалить контакт"><i class="fa fa-trash-o fa-1g"></a>';
    }

// =============================================== Публичные функции ===================================================

    // Открыть модальное окно
    // action - событие, на который идет запрос (new, edit)
    self.showContactModal = function (num) {
      self.contactModal = true;
      tn                = num;

      // Если запись редактируется
      if (tn) {
        $http.get('/contacts/' + tn + '/edit.json').success(function (success) {
          self.config.method  = 'PUT';
          self.value          = angular.copy(success); //Заполнить поля данными, полученными с сервера
          self.config.title   = success.info;
        });
      }
      else {
        self.config.method  = 'POST';
        self.value          = angular.copy(value_template);
        self.config.title   = 'Новый контакт';
      }
    };

    // Закрыть модальное окно по кнопке "Отмена"
    self.closeContactModal = function () {
      self.contactModal = false;
      clearForm();
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
    self.readyContactModal = function () {
      // Удалить все предыдущие ошибки валидаций, если таковые имеются
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }

      if (self.config.method == 'POST') {
        // Сохранить данные на сервере
        Server.Contact.save({contact: self.value},
          // Success
          function (response) {
            successResponse(response);

            self.dtInstance.reloadData(null, reloadPaging);
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        Server.Contact.update({tn: tn}, self.value,
          // Success
          function (response) {
            successResponse(response);

            self.dtInstance.reloadData(null, reloadPaging);
          },
          // Error
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    // Удалить контакт
    self.destroyContact = function (num) {
      var  confirm_str = "Вы действительно хотите удалить контакт \"" + self.contacts[num].info + "\"?";

      if (!confirm(confirm_str))
        return false;

      Server.Contact.delete({tn: num},
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
})();