<?php

include_once 'functions.inc.php';
include_once 'PHPRtfLite.php';

if (!isset($argv[1]))
  exit;
  
$par      = json_decode($argv[1], true);
$data     = $par['data'];
$contacts = $par['contacts'];

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

//============================================================= Шапка ================================================

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

$section->writeText("Акт № " . $data['number'], $fontHeader, $headFormat); //________________
$section->writeText("ввода в эксплуатацию автоматизированного сервиса<br>", $fontHeader, $headFormat);

//============================================================= Тело =================================================

$section->writeText("Настоящим актом с момента его утверждения вводится в эксплуатацию автоматизированный сервис «" . $data['name'] . "», предназначенный для ", $font, $normalFormat);
$section->writeText("<указать для чего>", $fontError);
$section->writeText(". В отношении сервиса:", $font);

// Первый символ режима функционирования приводим к нижнему регистру
$ch = mb_substr($data['time_work'], 0, 1, 'UTF-8');
$ch = mb_convert_case($ch, MB_CASE_LOWER, 'UTF-8'); 

$data['time_work'] = mb_substr_replace($data['time_work'], $ch, 0, 1);

$section->writeText("1.	Установлен приоритет функционирования «" . $data['priority'] . "», режим гарантированной доступности - " .
  $data['time_work'] . ". Характеристики и параметры функционирования сервиса закреплены в «Паспорте-формуляре " .
  "автоматизированного сервиса № " . $data['number'] . "».", $font, $firstListFormat); //__________________

$section->writeText('2.	Проведены предпусковые испытания:', $font, $firstListFormat);
$section->writeText('&ndash;	проверка аппаратной части;', $font, $secListFormat);
$section->writeText('&ndash;	тестирование процедуры восстановления;', $font, $secListFormat);
$section->writeText('&ndash;	аудит безопасности.', $font, $secListFormat);

$section->writeText('3.	Выпущена и передана в работу документация:', $font, $firstListFormat);
$section->writeText('&ndash;	инструкция по восстановлению;', $font, $secListFormat);
$section->writeText('&ndash;	инструкция по отключению.', $font, $secListFormat);

$section->writeText('4.	Назначаются ответственные за функционирование и восстановление:', $font, $firstListFormat);
$section->writeText('&ndash;	' . $contacts['first'], $font, $secListFormat);
$section->writeText('&ndash;	' . $contacts['second'], $font, $secListFormat);

//============================================================= Футер ================================================

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

$table->writeToCell(1, 1, 'Ответственные за сервис', $fontBold);
if ($errorChief == 0) {
  preg_match('/^([а-яА-ЯЁёa-zA-Z0-9_]+) ([а-яА-ЯЁёa-zA-Z0-9_])[а-яА-ЯЁёa-zA-Z0-9_]+ ([а-яА-ЯЁёa-zA-Z0-9_])[а-яА-ЯЁёa-zA-Z0-9_]+$/u', $deptChief['info'], $match);
  $deptChief['info'] = $match[2] . '. ' . $match[3] . '. ' . $match[1];

  $table->writeToCell(2, 1, 'Начальник отдела ' . $dept, $font);
  $table->writeToCell(3, 1, '________  ' . $deptChief['info'], $font);
} else {
  $table->writeToCell(2, 1, 'Начальник отдела XXX', $fontError);
  $table->writeToCell(3, 1, '________ Начальник не определен', $fontError);
}

$table->writeToCell(5, 1, 'Ответственный исполнитель', $font);
$table->writeToCell(6, 1, '________  ' . $contact[0][0], $font);

$table->writeToCell(1, 2, 'Ответственные за контроль работы сервиса:', $fontBold);
$table->writeToCell(2, 2, 'Начальник отдела 713', $font);
$table->writeToCell(3, 2, '________  ***REMOVED***', $font);
$table->writeToCell(5, 2, 'Операторская служба', $font);
$table->writeToCell(6, 2, '________  ***REMOVED***', $font);

$table->writeToCell(1, 3, 'Ответственные за инфраструктуру:', $fontBold);
$table->writeToCell(2, 3, 'Начальник отдела ***REMOVED***', $font);
$table->writeToCell(3, 3, '________  Ю. М. Ершов', $font);
$table->writeToCell(5, 3, 'Сопровождение ЦОД', $font);
$table->writeToCell(6, 3, '________  Д. А. Бородавкин', $font);

$rtf->sendRtf('Акт');