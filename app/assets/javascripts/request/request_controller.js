(function() {
  'use strict';

  app.controller('RequestCtrl', RequestCtrl)

  RequestCtrl.$inject   = ['$http', 'Flash', 'Error'];

  console.log('RequestCtrl');

  function RequestCtrl($http, Flash, Error) {
    this.$http = $http;
    this.Flash = Flash;
    this.Error = Error;

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
  // RequestCtrl.prototype.create = function() {
  //   if (this.validParam()) {

  //     this.$http.get('/request/create.json', {
  //       params: {
  //         service: this.service
  //       }
  //     }).then(
  //       (response) => {
  //         this.Flash.notice(response.data.full_message);
  //       },
  //       (response) => {
  //         this.Error.response(response, response.status);
  //         // this.Flash.alert('Необходимо заполнить поля для создания заявки');
  //       }
  //     );
  //   }
  // };

  // Проверить обязательные поля
  RequestCtrl.prototype.validParam = function(key) {

    if (!this.service.name || !this.service.priority || !this.service.os || !this.service.component_key ||
      !this.service.kernel_count || !this.service.frequency || !this.service.priority || !this.service.disk_space) {
      if (key) { this.Flash.alert('Необходимо заполнить поля для создания заявки'); }
  
      this.service.valid = false;
    } else {
      if (this.services_name.includes(this.service.name)) {
        this.nameUniq();
  
        this.service.valid = false;
      } else { this.service.valid = true; }
    }
  };

  // Проверить уникальность имени
  RequestCtrl.prototype.nameUniq = function() {
    if (this.services_name.includes(this.service.name)){
      this.Flash.alert('Текущее имя сервера уже существует');
    }
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
