(function() {
  app
    .service('Flash', ['$timeout', Flash])
    .factory('Server', Server);

  // Уведомления (успешные действия и ошибки) для пользователя
  function Flash($timeout) {
    var self = this;

    self.flash = {
      notice: '',
      alert:  ''
    };

    self.notice = function (message) {
      self.flash.alert  = null;
      self.flash.notice = message;

      $timeout(function () {
        self.flash.notice = null;
      }, 2000);
    };

    self.alert = function (message) {
      self.flash.notice = null;
      self.flash.alert  = message;
    };
  }

  function Server($resource) {
    return {
      Contact:        $resource('/contacts/:tn.json', {}, { update: { method: 'PATCH' } }),
      DepartmentHead: $resource('/department_heads/:tn.json', {}, { update: { method: 'PATCH' } })
    }
  }
})();