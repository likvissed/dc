(function () {
  'use strict';

  app
    .controller('DepartmentHeadCtrl', ['$http', 'DTOptionsBuilder', 'DepartmentHead', 'Flash', DepartmentHeadCtrl]);

  function DepartmentHeadCtrl($http, DTOptionsBuilder, DepartmentHead, Flash) {
    var self = this;

// =============================================== Инициализация =======================================================

    self.dtOptions = DTOptionsBuilder.newOptions()
      .withDOM(
      '<"row"' +
        '<"col-sm-2"' +
          '<"#department_heads.new-record">>' +
        '<"col-sm-8">' +
        '<"col-sm-2"f>>' +
      't<"row"' +
        '<"col-sm-12"p>>'
    );

    var
      errors          = null,   // Массив, содержащий объекты ошибок (имя поля => описание ошибки)
      tn              = null,   // Табельный номер редактируемого контакта
      value_template  = {       // Шаблон данных (вызывается при создании нового контакта)
        tn: ''
      };

    self.headModal    = false;  // Флаг состояния модального окна (false - скрыто, true - открыто)
    self.config       = {
      title:  '',               // Шапка модального окна
      method: ''                // Метод отправки запрос (POST, PATCH)
    };
    self.value        = angular.copy(value_template);
    self.heads        = DepartmentHead.query(); // Получаем данные обо всех контактах

// =============================================== Приватные функции ===================================================

    // array - объект, содержащий ошибки
    // flag - флаг, устанавливаемый в объект form (false - валидация не пройдена, true - пройдена)
    function setValidations(array, flag) {
      $.each(array, function (key, value) {
        $.each(value, function (index, message) {
          if (key != 'base')
            self.form['department_head[' + key + ']'].$setValidity(message, flag);
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
      self.headModal = false;
      clearForm();

      Flash.notice(response.full_message);
    }

    // Действия в случае ошибки создания/изменения контакта
    function errorResponse(response) {
      // Ошибка на стороне сервера
      if (parseInt(response.status) >= 500) {
        self.headModal = false;
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
    function getHeadIndex(num) {
      var head_index = 0;

      $.each(self.heads, function (index, head) {
        if (num == head.tn)
          head_index = index;
      });

      return head_index;
    }

  // =============================================== Публичные функции ===================================================

    // Открыть модальное окно
    // action - событие, на который идет запрос (new, edit)
    self.showHeadModal = function (num) {
      self.headModal  = true;
      tn              = num;

      // Если запись редактируется
      if (tn) {
        $http.get('/department_heads/' + tn + '/edit.json').success(function (success) {
          self.config.method  = 'PUT';
          self.value          = angular.copy(success); //Заполнить поля данными, полученными с сервера
          self.config.title   = success.info;
        });
      }
      else {
        self.config.method  = 'POST';
        self.value          = angular.copy(value_template);
        self.config.title   = 'Новый руководитель';
      }
    };

    // Закрыть модальное окно по кнопке "Отмена"
    self.closeHeadModal = function () {
      self.headModal = false;
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
    self.readyHeadModal = function () {
      // Удалить все предыдущие ошибки валидаций, если таковые имеются
      if (errors) {
        setValidations(errors, true);
        errors = null;
      }

      if (self.config.method == 'POST') {
        // Сохранить данные на сервере
        DepartmentHead.save({department_head: self.value},
          // SUCCESS
          function (response) {
            successResponse(response);

            self.heads.push(response.department_head);
          },
          // ERROR
          function (response) {
            errorResponse(response);
          }
        );
      }
      else {
        // Запоминаем индекс изменяемого контакта
        var head_index = getHeadIndex(tn);

        DepartmentHead.update({tn: tn}, self.value,
          // SUCCESS
          function (response) {
            successResponse(response);

            self.heads[head_index] = response.department_head
          },
          // ERROR
          function (response) {
            errorResponse(response);
          }
        );
      }
    };

    // Удалить руководителя
    self.destroyHead = function (num) {
      // Запоминаем индекс удаляемого контакта
      var head_index = getHeadIndex(num);

      DepartmentHead.delete({tn: num},
        function (response) {
          Flash.notice(response.full_message);

          self.heads.splice(head_index, 1);
        },
        function (response) {
          Flash.alert(response.full_message);
        });
    }
  }

})();