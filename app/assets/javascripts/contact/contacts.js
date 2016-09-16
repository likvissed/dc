//app.controller("contactCtrl", ["$scope", function($scope) {
//  $scope.manually = ($("#contact_manually").attr("data-manually") == 'true');
//  console.log($scope.manually);
//}]);

$(function() {
  'use strict';

  /*$('#contactTable').DataTable({
    dom: '<"row"<"#add_contact_block.col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"f>>',
    ajax: {
      url:    'contacts.json',
      async:  false,
      type:   'get'
    },
    columns: [
      {
        data: 'index',
        defaultContent: 0
      },
      {
        data: 'info'
      },
      {
        data: 'dept'
      },
      {
        data: 'work_num',
        orderable:  false
      },
      {
        data: 'mobile_num',
        orderable:  false
      },
      {
        data:       'edit',
        orderable:  false,
        searchable: false,
        className:  'text-center'
      },
      {
        data:       'del',
        orderable:  false,
        searchable: false,
        className:  'text-center'
      }
    ],
    createdRow: function(row, data, dataIndex) {
      data.index = dataIndex + 1;
      $(row).find('td:first-child').text(data.index);
    },
    initComplete: function (settings, json) {
      // Создать кнопку добавления нового контакта
      AddButton('add_contact');

      // Изменить класс у формы поиска
      ChangeSearchFilter();
    }
  });
  */

});
