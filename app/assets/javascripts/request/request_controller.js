(function() {
  'use strict';

  app.controller('RequestCtrl', RequestCtrl)

  RequestCtrl.$inject   = ['$http', 'Flash', 'Error', '$window'];

  function RequestCtrl($http, Flash, Error, $window) {
    this.$http = $http;
    this.Flash = Flash;
    this.Error = Error;
    this.$window = $window

    this.loadNewService();
  }

  RequestCtrl.prototype.loadNewService = function() {
    this.$http.get('/request/new').then(
      (response) => {
        this.service = response.data.service;
        this.service.valid = false;
        this.system_requirement = this.addSelectInput(response.data.system_requirement);
        this.services_name = response.data.services_name;
        this.current_user = response.data.current_user;
        // this.count_users = response.data.count_users;  

        this.service.select_priority = 10;
        this.assignPriopity();

      },
      (response) => {
        this.Error.response(response, response.status);
      }
    );
  };

  // Добавить вариант ввода ос вручную
  RequestCtrl.prototype.addSelectInput = function(system_requirement) {
    let new_system_requirement = system_requirement;
    let selected = {id: null, name_os: 'Выберите операционную систему'};
    let selected_manually = {id: -1, name_os: 'Ввести вручную...'};

    new_system_requirement.unshift(selected_manually);
    new_system_requirement.unshift(selected);

    this.service.select_os = new_system_requirement[0].id;

    return new_system_requirement;
  };

  // Заполнить поля исходя из выьранной ОС
  RequestCtrl.prototype.loadRequirement = function() {  
    // Если выбрана ос не вручную
    if (this.service.select_os != -1) {
      let select_os = this.system_requirement.find((el) => {
        return this.service.select_os == el.id;
      });

      this.service.os = select_os.name_os;
      this.service.kernel_count = select_os.kernel_count;
      this.service.disk_space = select_os.disk_space;
      this.service.memory = select_os.memory;
      this.service.frequency = select_os.frequency;
    } else {
      this.service.os = '';
    }
  };

  // Назначить приоритет функционирования
  RequestCtrl.prototype.assignPriopity = function() {
    this.service.priority = this.service.select_priority;
  };

  // Отправить данные для создания заявки
  RequestCtrl.prototype.create = function() {
      this.$http.get('/request/create.json', {
        params: {
          service: this.service
        }
      }).then(
        (response) => {
          this.Flash.notice(response.data.full_message);
          this.$window.location.href = `/request/successful?case_id=${response.data.case_id}`;
        },
        (response) => {
          this.Flash.alert(response.data.full_message);
        }
      );
  };

  // Кнопка "Отмена" для заявки
  RequestCtrl.prototype.cancel = function() {
    if (this.current_user == null){
      return '/users/sign_in';
    } else {
      return '/';
    }
  };

})();
