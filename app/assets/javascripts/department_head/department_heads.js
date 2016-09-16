$(function () {
/*  $('#departmentHeadTable').DataTable({
    dom: '<"row"<"#add_dep_block.col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"><"col-md-2"f>>',
    ajax: {
      url:    'department_heads.json',
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
      // Создать кнопку добавления нового руководителя
      AddButton('add_dep');

      // Изменить класс у формы поиска (не работает)
      ChangeSearchFilter();
    }
  });
  */
});