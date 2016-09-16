(function() {
  'use strict';

  app
    .factory('DepartmentHead', ['$resource', DepartmentHead]);

  function DepartmentHead($resource) {
    return $resource('/department_heads/:tn.json', {}, {
      update: { method: 'PATCH' }
    });
  }

})();