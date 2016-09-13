app.directive('clusterForm', ['$http', function($http) {
   return function(scope, element, attrs){
    if (attrs.clusterForm == 0) {
      $http.get('/clusters/new.json')
        .success(function(data, status, header, config) {
          scope.server_parts  = data.servers;
          scope.node_parts    = data.node_roles;
          scope.details       = [{
            server_id:    scope.server_parts[0].id,
            server:       scope.server_parts[0],
            node_role_id: scope.node_parts[0].id,
            node_role:    scope.node_parts[0]
          }];
        });
    }
    else {
      scope.cluster = {
        name: $('#cluster_name').val()
      }
      $http.get('/clusters/' + attrs.clusterName + '/edit.json')
        .success(function(data, status, headers, config) {
          scope.details       = data.cluster_details;
          scope.server_parts  = data.servers;
          scope.node_parts    = data.node_roles;
        });
    }
  }
}]);

app.controller('ClusterCtrl', ['$scope', function($scope) {
  $scope.addClusterPart = function() {
    $scope.details.push({
      server_id:    $scope.server_parts[0].id,
      server:       $scope.server_parts[0],
      node_role_id: $scope.node_parts[0].id,
      node_role:    $scope.node_parts[0],
      destroy: 0
    });
  }

  $scope.delClusterPart = function(detail) {
    if (detail.id)
      detail.destroy = 1;
    else
      $scope.details.splice($.inArray(detail, $scope.details), 1)
  }
}]);

/* ============================================================================================= */

$(function() {
  var
    modal = $('#modal'),
    table = $('#clusterTable').DataTable({
      columns: [
        {
          data: 'index',
          defaultContent: 0
        },
        {
          data: 'name'
        },
        {
          data:       'del',
          orderable:  false,
          searchable: false,
          className:  'text-center'
        }
      ],
      ajax: {
        url:    'clusters.json',
        async:  false,
        type:   'get'
      },
      createdRow: function(row, data, dataIndex) {
        data.index = dataIndex + 1;
        $(row).find('td:first-child').text(data.index);
      },
      drawCallback: function () {
        showCluster();
      }
    });

  // Закрыть модальное окно
  modal.find('button[data-id="closeModal"]').on('click', function () {
    modal.modal('hide');
  });

  // Событие после закрытия окна
  modal.on('hidden.bs.modal', function () {
    //Удалить созданные строки таблицы
    modal.find('table[data-id="details"] tr').not('tr.hidden').remove();
  });
});

// Показать информацию о кластере
function showCluster() {
  $('#clusterTable > tbody > tr').off().on('click', function (event) {
    if (event.target.tagName == 'I' || $(event.target).hasClass('dataTables_empty'))
      return true;

    $.get('clusters/' + this.id + '.json', function(data) {
      var modal = $('#modal');

      modal.find('.modal-header .modal-title').text(data.name);

      // Заполнение поля "Состав"
      $.each(data.cluster_details, function () {
        modal.find('tr.hidden').clone().appendTo('table[data-id="details"]').removeClass('hidden')
          .find('td:first-child').text(this.server.name)
          .end().find('td:last-child').text(this.node_role.name);
      });

      // Ссылка на изменение данных о кластере
      modal.find('a[data-id="changeData"]').attr('href', '/clusters/' + data.name + '/edit');

      modal.modal('show');
    });
  })
}
