$(function () {
  var table = $('#departmentHeadTable').DataTable({
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
      $('#add_dep_form').appendTo('#add_dep_block');

      // Изменить класс у формы поиска (не работает)
      $('.dataTables_filter input').removeClass('input-sm');
    }
  });

  // Закрыть модальное окно и перезагрузить таблицу в случае успешного создать руководителя
  $.fn.modal_success = function () {
    this.modal('hide');

    table.ajax.reload(null, false);
  };

});