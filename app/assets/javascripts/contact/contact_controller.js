(function() {
  'use strict';

  app
    .controller('ContactCtrl', ['$http', 'DTOptionsBuilder', 'Server', 'Flash', '$timeout', ContactCtrl]);

  function ContactCtrl($http, DTOptionsBuilder, Server, Flash, $timeout) {
    var self = this;

// =============================================== Инициализация =======================================================

    self.dtOptions = DTOptionsBuilder.newOptions()
      .withDOM(
      '<"row"' +
        '<"col-sm-2"' +
          '<"#contacts.new-record">>' +
        '<"col-sm-8">' +
        '<"col-sm-2"f>>' +
      't<"row"' +
        '<"col-sm-12"p>>'
    );

    var
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

    self.contactModal = false;  // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.config       = {
      title:  '',               // Шапка модального окна
      method: ''                // Метод отправки запрос (POST, PATCH)
    };
    self.value        = angular.copy(value_template);
    self.contacts     = Server['Contact'].query(); // Получаем данные обо всех контактах

// =============================================== Приватные функции ===================================================

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

    // Получить индекс контакта в массиве
    function getContactIndex(num) {
      var contact_index = 0;

      $.each(self.contacts, function (index, contact) {
        if (num == contact.tn)
          contact_index = index;
      });

      return contact_index;
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
        Server['Contact'].save({contact: self.value},
          // SUCCESS
          function (response) {
            successResponse(response);

            self.contacts.push(response.contact);
          },
          // ERROR
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        // Запоминаем индекс изменяемого контакта
        var contact_index = getContactIndex(tn);

        Server['contact'].update({tn: tn}, self.value,
          // SUCCESS
          function (response) {
            successResponse(response);

            self.contacts[contact_index] = response.contact
          },
          // ERROR
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    // Удалить контакт
    self.destroyContact = function (num) {
      // Запоминаем индекс удаляемого контакта
      var contact_index = getContactIndex(num);

      Server['Contact'].delete({tn: num},
      function (response) {
        Flash.notice(response.full_message);

        self.contacts.splice(contact_index, 1);
      },
      function (response) {
        Flash.alert(response.data.full_message);
      });
    }
  }
})();