<?php

include_once 'functions.inc.php';
include_once 'lib/PHPRtfLite.php';

header('Content-Type: text/html; charset=utf-8');

if (!isset($argv[1]))
  exit;

// ===================================================== Данные полученные от модели ===================================

$par              = json_decode($argv[1], true);
$data             = $par['data'];             // Данные сервиса
$networks         = $par['networks'];         // Подключения к сети
$ports            = $par['ports'];            // Список открытых портов
$contacts         = $par['contact_objects'];  // Объекты контактов
$contact_strings  = $par['contact_strings'];  // Строки контактов для запись в таблицу
$storages         = $par['storages'];         // Объекты подключений к сети
$head             = $par['head'];             // Строка, содержащая начальника отдела ответственных
$antiviri         = $par['antiviri'];         // Если антивирусное средство выбрано, то здесь перевод значения, иначе пустая стока

// ===================================================== Инициализация страницы ========================================

PHPRtfLite::registerAutoloader();
$rtf = new PHPRtfLite(); //Основной класс
$rtf->setMargins(1.7, 1.4, 1, 1);

$font     = new PHPRtfLite_Font(11, 'Calibri'); //Шрифт
$fontBold = new PHPRtfLite_Font(11, 'Calibri'); //Жирный шрифт

$fontBold->setBold();

$section  = $rtf->addSection();
$cols     = 2; // Количество столбцов таблицы

// ===================================================== Шапка =========================================================

$parFormat  = new PHPRtfLite_ParFormat('center'); //Форматирование текста по центру
$table      = $section->addTable();
$rows       = 5;

$table->addRows($rows, 0.5);
$table->addColumnsList(array(7.6, 10.3));

$fontHeaderBold = new PHPRtfLite_Font(12, 'Calibri');
$fontHeaderBold->setBold();

$fontTableHeader      = new PHPRtfLite_Font(14, 'Calibri');
$fontTableHeaderBold  = new PHPRtfLite_Font(14, 'Calibri');
$fontTableHeaderBold->setBold();

$table->writeToCell(1, 2, '     УТВЕРЖДАЮ', $fontTableHeaderBold);
$table->writeToCell(2, 2, '     Начальник управления информатики', $fontTableHeader);
$table->writeToCell(3, 2, '     и вычислительной техники', $fontTableHeader);
$table->writeToCell(4, 2, '     ________________ ***REMOVED***', $fontTableHeader);
$table->writeToCell(5, 2, '     "___" ________________ 20___г.', $fontTableHeader);

# Название формуляра
$name_formular = 'сервис';
$add_text = '(ориентировочно по серверам)'; // Добавляется текст в строку "Требования к вычислительным ресурсам"
if ($data['formular_type'] == false) {
  $name_formular = 'сервер';
  $add_text = '';
}

$section->writeText('<br>ПАСПОРТ-ФОРМУЛЯР АВТОМАТИЗИРОВАННОГО ' . mb_strtoupper($name_formular) . 'А № ______________________<br>', $fontHeaderBold, $parFormat);

// ===================================================== Основная Таблица ==============================================

$table = $section->addTable();
$height       = 0.45; // Базовая высота ячейки
$baseNum      = 76;   // Статическое количество строк таблицы
$variableNum  = 2;    // Динамическое количество строк таблицы

// Считаем количество строк таблицы
//$network = explode(' ;^; ', $result['network']); // Получаем массив с подключениями к сети
if (count($networks) > 2)
  $variableNum = count($networks);

$rows         = $baseNum + (+$variableNum);

$mainBorder   = new PHPRtfLite_Border_Format(1); //Формат барьера
$secBorder    = new PHPRtfLite_Border_Format(1, '#000', 'dot');
$thirdBorder  = new PHPRtfLite_Border_Format(0);
$border       = new PHPRtfLite_Border($rtf, $mainBorder, $mainBorder, $mainBorder, $mainBorder);

$table->addRows($rows, $height);
$table->addColumnsList(array(7.6, 10.3));
$table->setBorderForCellRange($border, 1, 1, $rows, $cols); //Основная рамка таблицы


// =====================================================================================================================
// ===================================================== Статичная часть таблицы =======================================

//Объединение столбцов
$rowMerge = array(1, 3, 4, 8, 11, 12, 13, 14, 17, 24, 25, 26, 27, 28, 29, 30, 31, 32, 39, 40, 41, 50, 51);
for ($i = 0; $i < count($rowMerge); $i++) {
  $table->mergeCellRange($rowMerge[$i], 1, $rowMerge[$i], 2);
}

//Пунктир только снизу (Пример: строка 3)
$borderDotBot = new PHPRtfLite_Border($rtf, null, null, null, $secBorder);
$rowTopDot = array(3, 8, 13, 17, 24, 28, 30, 32, 41);
for ($i = 0; $i < count($rowTopDot); $i++) {
  $table->getCell($rowTopDot[$i], 1)->setBorder($borderDotBot);
}

//Пунктир сверху и справа, столбец первый (Пример: строка 9, столбец 1)
$borderDotTopRight = new PHPRtfLite_Border($rtf, null, $secBorder, $secBorder, null);
$rowTableDot = array(9, 10, 18, 19, 20, 21, 22, 23, 33, 34, 35, 36, 37, 38, 42, 43, 44, 45);
for ($i = 0; $i < count($rowTableDot); $i++) {
  $table->getCell($rowTableDot[$i], 1)->setBorder($borderDotTopRight);
}

//Пунктир сверху и слева, столбец второй (Пример: строка 9, столбец 2)
$borderDotTopLeft = new PHPRtfLite_Border($rtf, $secBorder, $secBorder, null, null);
//$rowFirstTableDot = array(9, 10, 17, 18, 19, 20, 21, 22, 32, 33, 34, 35, 36, 37, 40, 41, 42, 43);
for ($i = 0; $i < count($rowTableDot); $i++) {
  $table->getCell($rowTableDot[$i], 2)->setBorder($borderDotTopLeft);
}

//Пунктир только справа (строка 51, 53)
$borderDotRight = new PHPRtfLite_Border($rtf, null, null, $secBorder, null);
/*$borderDot = new PHPRtfLite_Border($rtf, null, null, $secBorder, null);
$table->getCell(51, 1)->setBorder($borderDot);
$table->getCell(53, 1)->setBorder($borderDot);*/

//Пустая строка между подтаблицами
$noBorderBetween = new PHPRtfLite_Border($rtf, $thirdBorder, null, $thirdBorder, null);
$borderNo = array(11, 26, 50);
for ($i = 0; $i < count($borderNo); $i++) {
  $table->getCell($borderNo[$i], 1)->setBorder($noBorderBetween);
}

//Конец страницы (линия только сверху)
$noBorderEnd = new PHPRtfLite_Border($rtf, $thirdBorder, null, $thirdBorder, $thirdBorder);
$table->getCell(39, 1)->setBorder($noBorderEnd);

//Изменение высоты ячейки + 1.5
$rowHeight = array(4);
for ($i = 0; $i < count($rowHeight); $i++) {
  $table->getRow($rowHeight[$i])->setHeight(1.5);
}

//Изменение высоты ячейки + 1.0
$rowHeight = array(25, 29, 31);
for ($i = 0; $i < count($rowHeight); $i++) {
  $table->getRow($rowHeight[$i])->setHeight(1);
}

//Закрашивание подзагаловков таблицы
$rowHeader = array(1, 12, 27, 40, 51);
for ($i = 0; $i < count($rowHeader); $i++) {
  $table->setBackgroundForCellRange('#000000', $rowHeader[$i], 1, $rowHeader[$i], 1);
  //$table->setBackgroundForCellRange('#9e9898', $rowHeader[$i], 1, $rowHeader[$i], 1);
}

//Отступ текста от края таблицы
for ($i = 1; $i <= $rows; $i++) {
  $table->getCell($i, 1)->setPaddingLeft(0.1);
  $table->getCell($i, 2)->setPaddingLeft(0.1);
}

//=============================================== Преобразование минут в "Часы-минуты"=================================

function get_time($value) {
  $hours = $value/60;

  if (is_int($hours)) {
    $minutes = 0;
  } else {
    $hours = intval($hours);
    $minutes = intval($value) - ($hours*60);
  }

  if ($hours == 0) {
    return $minutes . ' мин.';
  } else {
    return $hours . ' ч. ' . $minutes . ' мин.';
  }  
}

$data['max_time_rec'] = get_time($data['max_time_rec']);
$data['time_recovery'] = get_time($data['time_recovery']);
$data['time_after_failure'] = get_time($data['time_after_failure']);
$data['time_after_disaster'] = get_time($data['time_after_disaster']);

// var_dump($data['max_time_rec']);

// ===================================================== Основные данные================================================

$table->writeToCell(1, 1, 'Основные данные', $fontBold);
$table->writeToCell(2, 1, 'Наименование сервиса', $fontBold);
$table->writeToCell(2, 2, $data['name'], $font);
$table->writeToCell(3, 1, 'Краткое описание сервиса', $fontBold);
$table->writeToCell(4, 1, $data['descr'], $font);
$table->writeToCell(5, 1, 'Приоритет функционирования', $fontBold);
$table->writeToCell(5, 2, $data['priority'], $font);
$table->writeToCell(6, 1, 'Режим гарантированной доступности', $fontBold);
$table->writeToCell(6, 2, $data['time_work'], $font);
$table->writeToCell(7, 1, 'Максимальное время восстановления', $fontBold);
$table->writeToCell(7, 2, $data['max_time_rec'], $font);
$table->writeToCell(8, 1, 'Ответственные за исполнение сервиса', $fontBold);
$table->writeToCell(9, 1, 'Основной ответственный', $font);
$table->writeToCell(9, 2, $contact_strings['first'], $font);
$table->writeToCell(10, 1, 'Вторичный контакт', $font);
$table->writeToCell(10, 2, $contact_strings['second'], $font);

// ===================================================== Характеристики среды исполнения ===============================

$table->writeToCell(12, 1, 'Характеристики среды исполнения', $fontBold);
$table->writeToCell(13, 1, 'Среда исполнения', $fontBold);
$table->writeToCell(14, 1, $data['environment'], $font);
$table->writeToCell(15, 1, 'Операционная система', $fontBold);
$table->writeToCell(15, 2, $data['os'], $font);
$table->writeToCell(16, 1, 'Ключевой программный компонент', $fontBold);
$table->writeToCell(16, 2, $data['component_key'], $font);
$table->writeToCell(17, 1, 'Требования к вычислительным ресурсам ' . $add_text . '', $fontBold);
$table->writeToCell(18, 1, 'Количество ядер процессора', $font);
$table->writeToCell(18, 2, $data['kernel_count'], $font);
$table->writeToCell(19, 1, 'Тактовая частота процессора, ГГц', $font);
$table->writeToCell(19, 2, $data['frequency'], $font);
$table->writeToCell(20, 1, 'Объем оперативной памяти, Гб', $font);
$table->writeToCell(20, 2, $data['memory'], $font);
$table->writeToCell(21, 1, 'Объем дискового пространства, Гб', $font);
$table->writeToCell(21, 2, $data['disk_space'], $font);
$table->writeToCell(22, 1, 'Скорость обмена с жестким диском, IOPS', $font);
$table->writeToCell(22, 2, $data['hdd_speed'], $font);
$table->writeToCell(23, 1, 'Скорость сетевого соединения, Мбит/сек', $font);
$table->writeToCell(23, 2, $data['network_speed'], $font);
$table->writeToCell(24, 1, 'Дополнительные требования к среде исполнения', $fontBold);
$table->writeToCell(25, 1, $data['additional_require'], $font);

// ===================================================== Резервное копирование и восстановление ========================

$table->writeToCell(27, 1, 'Резервное копирование и восстановление', $fontBold);
$table->writeToCell(28, 1, 'Краткое описание процедуры резервного копирования', $fontBold);
$table->writeToCell(29, 1, $data['backup_manual'], $font);
$table->writeToCell(30, 1, 'Краткое описание процедуры восстановления данных', $fontBold);
$table->writeToCell(31, 1, $data['recovery_manual'], $font);
$table->writeToCell(32, 1, 'Параметры резервного копирования', $fontBold);
$table->writeToCell(33, 1, 'Оценка объемов 1 полной копии данных, Мб', $font);
$table->writeToCell(33, 2, $data['value_backup_data'], $font);
$table->writeToCell(34, 1, 'Срок хранения старейшей копии, дни', $font);
$table->writeToCell(34, 2, $data['storage_time'], $font);
$table->writeToCell(35, 1, 'Хранилище резервных копий', $font);
$table->writeToCell(35, 2, $data['store_copies'], $font);
$table->writeToCell(36, 1, 'Объем хранилища резервных копий, Мб', $font);
$table->writeToCell(36, 2, $data['backup_volume'], $font);
$table->writeToCell(37, 1, 'Окно резервного копирования', $font);
$table->writeToCell(37, 2, $data['backup_window'], $font);
$table->writeToCell(38, 1, 'Время восстановления данных', $font);
$table->writeToCell(38, 2, $data['time_recovery'], $font);

// ===================================================== Отказоустойчивость ============================================

$table->writeToCell(40, 1, 'Отказоустойчивость', $fontBold);
$table->writeToCell(41, 1, 'Обеспечение надежности', $fontBold);
$table->writeToCell(42, 1, 'Дублирование блоков питания', $font);
$table->writeToCell(42, 2, $data['duplicate_ps'], $font);
$table->writeToCell(43, 1, 'RAID-массив', $font);
$table->writeToCell(43, 2, $data['raid'], $font);
$table->writeToCell(44, 1, 'Агрегация сетевых портов', $font);
$table->writeToCell(44, 2, $data['bonding'], $font);
$table->writeToCell(45, 1, 'Другое', $font);
$table->writeToCell(45, 2, $data['other'], $font);
$table->writeToCell(46, 1, 'Обеспечение отказоустойчивости', $fontBold);
$table->writeToCell(46, 2, $data['resiliency'], $font);
$table->writeToCell(47, 1, 'Время восстановления после отказа', $fontBold);
$table->writeToCell(47, 2, $data['time_after_failure'], $font);
$table->writeToCell(48, 1, 'Обеспечение катастрофоустойчивости', $fontBold);
$table->writeToCell(48, 2, $data['disaster_rec'], $font);
$table->writeToCell(49, 1, 'Время возобновления после катастрофы', $fontBold);
$table->writeToCell(49, 2, $data['time_after_disaster'], $font);

// ===================================================== Изменяющаяся часть таблицы ====================================
// ===================================================== Подключение к сетям передачи данных ===========================

$table->writeToCell(51, 1, 'Подключение к сетям передачи и хранения данных', $fontBold);
$table->writeToCell(52, 1, 'Подключения к сети', $fontBold);

for ($i = 0; $i < $variableNum; $i++) {
  if (!empty($networks[$i]))
    $table->writeToCell(52 + $i, 2, $networks[$i]['segment'] . ', ' . $networks[$i]['vlan'] . ', ' . $networks[$i]['dns_name'], $font);
}

$endTable = array(
  'Подключение к СХД',
  'Защита информации и разграничение доступа',
  'Меры обеспечения информационной безопасности',
  'Антивирусные средства',
  'Межсетевое экранирование',
  'UAC/AppArmor/SELinux',
  'Сертифицированные СЗИ НСД',
  'Разграничение доступа',
  'Доступ в интернет',
  'Сетевые порты, доступные из ЛС',
  'Сетевые порты, доступные из Интернет',
  'Контроль функционирования сервиса',
  'Метод мониторинга доступности сервиса',
  'Мониторинг доступности сервиса',
  'Мониторинг работы аппаратных средств',
  'Мониторинг безопасности',
  'Имя в системе мониторинга',
  'Дополнительные данные'
);

//Заполнение таблицы текстом
$z = 0;
for ($k = 0; $k < 25; $k++) {
  if ($k === 0 ||
    $k === 3 ||
    $k === 4 ||
    $k === 9 ||
    $k === 16 ||
    $k === 17 ||
    $k === 18 ||
    $k === 19 ||
    $k === 20 ||
    $k === 21 ||
    $k === 23
  ) {
    $table->writeToCell(52 + $i + $k, 1, $endTable[$z], $fontBold);
    $z++;
    continue;
  }
  if ($k === 1 ||
    $k === 2 ||
    $k === 12 ||
    $k === 14 ||
    $k === 15 ||
    $k === 22 ||
    $k === 24 
  ) {
    continue;
  }
  $table->writeToCell(52 + $i + $k, 1, $endTable[$z], $font);
  $z++;
}

//Данные для заполнения изменяющейся части таблицы
//$localPorts = insertPorts($result['tcp_ports'], $result['udp_ports']);
//$inetPorts = insertPorts($result['internet_tcp'], $result['internet_udp']);

// Если нет открытых портов, доступных из ЛС
if (empty($ports['local']))
    $ports['local'] = 'Нет';
// Если нет открытых портов, доступных и сети "Интернет"
if (empty($ports['inet']))
    $ports['inet'] = 'Нет';

$arrSecColumn = array(
  $antiviri,
  $data['firewall'],
  $data['uac_app_selinux'],
  $data['szi'],
  $data['internet'],
  $ports['local'],
  $ports['inet'],
  $data['type_mon'],
  $data['service_mon'],
  $data['hardware_mon'],
  $data['security_mon'],
  $data['name_monitoring'],
  $data['additional_data']
);

//Оформление и заполнение таблицы
$z = 0; //Переменная для данных второй колонки таблицы
for ($k = 0; $k < (26 + $i + 1); $k++) {
  //Объединение столбцов
  if ($k === 1 + $i ||     //56
    $k === 2 + $i ||     //57
    $k === 3 + $i ||     //58
    $k === 8 + $i ||     //63
    $k === 14 + $i ||    //69
    $k === 15 + $i ||    //70
    $k === 21 + $i ||    //76
    $k === 22 + $i ||    //77
    $k === 23 + $i       //78   
  ) {
    $table->mergeCellRange(53 + $k, 1, 53 + $k, 2);
  }

  //Пунктир только снизу (Пример: строка 3)
  if ($k === 4 + $i ||
    $k === 9 + $i
  ) {
    $table->getCell(52 + $k, 1)->setBorder($borderDotBot);
  }

  //Пунктир сверху и справа, столбец первый (Пример: строка 9, столбец 1)
  if (($k > 0 && $k < $i) ||
    $k === 1 + $i ||
    $k === 5 + $i ||
    $k === 6 + $i ||
    $k === 7 + $i ||
    $k === 8 + $i ||
    $k === 10 + $i ||
    $k === 11 + $i ||
    $k === 12 + $i ||
    $k === 13 + $i ||
    $k === 14 + $i
  ) {
    $table->getCell(52 + $k, 1)->setBorder($borderDotTopRight);
  }

  //Пунктир сверху и слева, столбец второй (Пример: строка 9, столбец 2)
  if (($k > 0 && $k < $i) ||
    $k === 1 + $i ||
    $k === 5 + $i ||
    $k === 6 + $i ||
    $k === 7 + $i ||
    $k === 8 + $i ||
    $k === 10 + $i ||
    $k === 11 + $i ||
    $k === 12 + $i ||
    $k === 13 + $i ||
    $k === 14 + $i
  ) {
    $table->getCell(52 + $k, 2)->setBorder($borderDotTopLeft);
  }

  //Пунктир только справа (строка 51, 53)
  if ($k === 0 ||
    $k === $i
  ) {
    $table->getCell(52 + $k, 1)->setBorder($borderDotRight);
  }

  //Пустая строка между подтаблицами
  if ($k === 2 + $i ||
    $k === 15 + $i ||
    $k === 22 + $i
  ) {
    $table->getCell(52 + $k, 1)->setBorder($noBorderBetween);
  }

  //Закрашивание подзагаловков таблицы
  if ($k === 3 + $i ||
    $k === 16 + $i ||
    $k === 23 + $i
  ) {
    $table->setBackgroundForCellRange('#000000', 52 + $k, 1, 52 + $k, 1);
  }
  if ($k > 4 + $i &&
    $k != 9 + $i &&
    $k != 12 + $i &&
    $k != 14 + $i &&
    $k != 15 + $i &&
    $k != 16 + $i &&
    $k != 22 + $i &&
    $k < 25 + $i
  ) {
    
    if ($k == 23 + $i) {
      $table->writeToCell(52 + $k + 1, 1, $arrSecColumn[$z], $font);
      continue;
    }
    $table->writeToCell(52 + $k, 2, $arrSecColumn[$z], $font);
    $z++;
  }
}

//Изменение высоты ячейки + 1.5
$table->getRow(52 + 24 + $i)->setHeight(1.5);


//preg_match("/(.*) ;\^; (.*)/", $result['storage_system'], $storage);
$table->writeToCell(52 + $i, 2, $storages[0]['name'], $font);
$table->writeToCell(52 + $i + 1, 2, $storages[1]['name'], $font);

// ===================================================== Футер =========================================================

$fontFooter       = new PHPRtfLite_Font(12, 'Calibri'); //Шрифт для футера
$fontFooterError  = new PHPRtfLite_Font(11, 'Calibri', null, '#e2c818'); //Шрифт для выделения недочетов в футере
$fontFooterBold   = new PHPRtfLite_Font(12, 'Calibri');

$fontFooterBold->setBold();

$table  = $section->addTable();
$height = 0.5; // Базовая высота ячейки
$rows   = 6;

$table->addRows($rows, $height);
$table->addColumnsList(array(10.5, 7.4));
//$table->setBorderForCellRange($border, 1, 1, $rows, $cols); //Основная рамка таблицы

//Отступ текста от края таблицы
for ($i = 1; $i <= $rows; $i++) {
  $cell = $table->getCell($i, 1);
  $cell->setPaddingLeft(0.4);
  $cell->setVerticalAlignment('center');

  $cell = $table->getCell($i, 2);
  $cell->setPaddingLeft(0.4);
  $cell->setVerticalAlignment('center');
}

for ($i = 1; $i <= 2; $i++) {
  $table->getRow($i)->setHeight(0.8);
}

for ($i = 3; $i <= 6; $i++) {
  $table->getRow($i)->setHeight(1);
}

$table->writeToCell(1, 1, 'СОГЛАСОВАНО', $fontFooterBold);
$table->writeToCell(2, 1, 'Ответственные за инфраструктуру:', $fontFooter);
$table->writeToCell(3, 1, '____________ Ю.М. Ершов', $fontFooter);
$table->writeToCell(4, 1, '____________ ***REMOVED***', $fontFooter);
$table->writeToCell(5, 1, '____________ ***REMOVED***', $fontFooter);
$table->writeToCell(6, 1, '____________ ***REMOVED***', $fontFooter);

$table->writeToCell(2, 2, 'Ответственные за ' . $name_formular .':', $fontFooter);

if (empty($head))
  $table->writeToCell(3, 2, '____________ Начальник не определен', $fontFooterError);
else
  $table->writeToCell(3, 2, '____________ ' . $head, $fontFooter);

$table->writeToCell(4, 2, '____________ ' . getFio($contacts['first']['info']), $fontFooter);
$table->writeToCell(5, 2, '____________ ' . getFio($contacts['second']['info']), $fontFooter);

// Имя файла генерируется в контроллере перед непосредственной отправкой файла
$rtf->sendRtf('Формуляр');