<?php

include_once 'functions.inc.php';
include_once 'PHPRtfLite.php';

if (!isset($argv[1]))
  exit;

// ===================================================== Данные полученные от модели ===================================

$par      = json_decode($argv[1], true);
$data     = $par['data'];             // Данные сервиса
$contacts = $par['contact_objects'];  // Объект контактов
$head     = $par['head'];             // Строка, содержащая начальника отдела ответственных

$main_contact   = getFio($contacts['first']['info']);
$first_contact  = $main_contact . ', отд. ' . $contacts['first']['dept'] . ' (основной);';
if ($contacts['second'])
  $second_contact = getFio($contacts['second']['info']) . ', отд. ' . $contacts['second']['dept'] . ' (замещающий);';
else
  $second_contact = 'Замещающий отсутствует';

// ===================================================== Инициализация страницы ========================================

PHPRtfLite::registerAutoloader();
$rtf = new PHPRtfLite(); //Основной класс
$rtf->setMargins(1.7, 0.8, 1, 1);

$font       = new PHPRtfLite_Font(12, 'Arial'); //Шрифт
$fontError  = new PHPRtfLite_Font(12, 'Arial', null, '#e2c818'); //Шрифт для выделения недочетов в футере
$fontBold   = new PHPRtfLite_Font(12, 'Arial'); //Жирный шрифт
$fontBold->setBold();

$normalFormat = new PHPRtfLite_ParFormat('justify'); //Обычный абзац
$normalFormat->setIndentFirstLine(1);

$firstListFormat = new PHPRtfLite_ParFormat('justify'); //Список первого уровня
$firstListFormat->setSpaceBefore(6);
$firstListFormat->setIndentFirstLine(-0.5);
$firstListFormat->setIndentLeft(1.5);

$secListFormat = new PHPRtfLite_ParFormat('justify'); //Список второго уровня
$secListFormat->setSpaceBefore(6);
$secListFormat->setIndentFirstLine(-0.5);
$secListFormat->setIndentLeft(2.5);

$pictureFormat = new PHPRtfLite_ParFormat(); //Логотип ***REMOVED*** в шапке
$pictureFormat->setIndentFirstLine(-1);

$tableFormat = new PHPRtfLite_ParFormat('justify'); //Таблица в шапке
$tableFormat->setIndentFirstLine(0);
$tableFormat->setSpaceAfter(8);

$headFormat = new PHPRtfLite_ParFormat('center'); //Заголовок

$section = $rtf->addSection();

// ===================================================== Шапка =========================================================

$image = $section->addImage("app/assets/images/act_header.png", $pictureFormat);
$image->setWidth(20.03);
$image->setHeight(2);

$section->writeText('', $font, $tableFormat);

$table = $section->addTable();
$rows = 5;
$table->addRows($rows, 0.7);
$table->addColumnsList(array(8.6, 9.3));

$fontHeader = new PHPRtfLite_Font(16, 'Arial');

$table->writeToCell(1, 2, "УТВЕРЖДАЮ", $fontBold);
$table->writeToCell(2, 2, "Начальник управления информатики", $font);
$table->writeToCell(3, 2, "и вычислительной техники", $font);
$table->writeToCell(4, 2, "________________ ***REMOVED***", $font);
$table->writeToCell(5, 2, "\"___\" ________________ 20___г.", $font);

# Название формуляра
$name_formular = 'сервис';
$full_1_name_formular = 'автоматизированного сервис';
$full_2_name_formular = 'автоматизированный сервис';

if ($data['formular_type'] == false) {
  $name_formular = 'сервер';

  $full_1_name_formular = $name_formular;
  $full_2_name_formular = $name_formular;
}

# Номер формуляра
$number_formular_a = '_______________';
$number_formular_f = '_______________';

if (!empty($data['number'])) {
  $number_formular_a = '***REMOVED***-А-' . $data['number'];
  $number_formular_f = '***REMOVED***-Ф-' . $data['number'];
}


$section->writeText("Акт № " . $number_formular_a, $fontHeader, $headFormat); //________________
$section->writeText("ввода в эксплуатацию " . $full_1_name_formular . "а <br>", $fontHeader, $headFormat);

// ===================================================== Тело ==========================================================

$section->writeText("Настоящим актом с момента его утверждения вводится в эксплуатацию " . $full_2_name_formular . " «" . $data['name'] . "», предназначенный для ", $font, $normalFormat);
$section->writeText("<указать для чего>", $fontError);
$section->writeText(". В отношении " . $name_formular . "а:", $font);

// Первый символ режима функционирования приводим к нижнему регистру
$ch = mb_substr($data['time_work'], 0, 1, 'UTF-8');
$ch = mb_convert_case($ch, MB_CASE_LOWER, 'UTF-8'); 

$data['time_work'] = mb_substr_replace($data['time_work'], $ch, 0, 1);

$section->writeText("1.	Установлен приоритет функционирования «" . $data['priority'] . "», режим гарантированной доступности - " .
  $data['time_work'] . ". Характеристики и параметры функционирования " . $name_formular . "а закреплены в «Паспорте-формуляре " .
  $full_1_name_formular. "а № " . $number_formular_f . "».", $font, $firstListFormat); //__________________

$section->writeText('2.	Проведены предпусковые испытания:', $font, $firstListFormat);
$section->writeText('&ndash;	проверка аппаратной части;', $font, $secListFormat);
$section->writeText('&ndash;	тестирование процедуры восстановления;', $font, $secListFormat);
$section->writeText('&ndash;	аудит безопасности.', $font, $secListFormat);

$section->writeText('3.	Выпущена и передана в работу документация:', $font, $firstListFormat);
$section->writeText('&ndash;	инструкция по восстановлению;', $font, $secListFormat);
$section->writeText('&ndash;	инструкция по отключению.', $font, $secListFormat);

$section->writeText('4.	Назначаются ответственные за функционирование и восстановление:', $font, $firstListFormat);
$section->writeText('&ndash;	' . $first_contact, $font, $secListFormat);
$section->writeText('&ndash;	' . $second_contact, $font, $secListFormat);

// ===================================================== Футер =========================================================

$section->writeText('', $font, $tableFormat);

$contacts['first'] = explode(',', $contact['first']);

$font = new PHPRtfLite_Font(11, 'Arial'); //Шрифт
$fontError = new PHPRtfLite_Font(11, 'Arial', null, '#e2c818'); //Шрифт для выделения недочетов в футере
$fontBold = new PHPRtfLite_Font(11, 'Arial'); //Жирный шрифт
$fontBold->setBold();

$table = $section->addTable();
$rows = 4;
$table->addRow();
$table->addRow(0.9);
$table->addRows($rows, 0.5);

$table->addColumnsList(array(6.13, 6.13, 6.13));

$fontHeader = new PHPRtfLite_Font(16, 'Arial');
for ($i = 1; $i <= 3; $i++) {
  $cell = $table->getCell(2, $i);
  $cell->setVerticalAlignment(bottom);
}

$table->writeToCell(1, 1, 'Ответственные за ' . $name_formular, $fontBold);

$table->writeToCell(2, 1, 'Начальник отдела ' . $data['dept'], $font);
if (empty($head))
  $table->writeToCell(3, 1, '________ Начальник не определен', $fontError);
else
  $table->writeToCell(3, 1, '________ ' . $head, $font);

$table->writeToCell(5, 1, 'Ответственный исполнитель', $font);
$table->writeToCell(6, 1, '________  ' . $main_contact, $font);

$table->writeToCell(1, 2, 'Ответственные за контроль работы ' . $name_formular . 'а:', $fontBold);
$table->writeToCell(2, 2, 'Начальник отдела 713', $font);
$table->writeToCell(3, 2, '________  ***REMOVED***', $font);
$table->writeToCell(5, 2, 'Операторская служба', $font);
$table->writeToCell(6, 2, '________  ***REMOVED***', $font);

$table->writeToCell(1, 3, 'Ответственные за инфраструктуру:', $fontBold);
$table->writeToCell(2, 3, 'Начальник отдела ***REMOVED***', $font);
$table->writeToCell(3, 3, '________  Ю. М. Ершов', $font);
$table->writeToCell(5, 3, 'Сопровождение ЦОД', $font);
$table->writeToCell(6, 3, '________  ***REMOVED***', $font);

// Имя файла генерируется в контроллере перед непосредственной отправкой файла
$rtf->sendRtf('Акт');
