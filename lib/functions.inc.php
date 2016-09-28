<?php

// Получение сокращенного имени и фамилии в виде "И. О. Фамилия"
function getFio($fioFull)
{
  $fioArr = explode(' ', $fioFull);
  $fio    = mb_substr($fioArr[1], 0, 1, 'utf-8') . '. ' . mb_substr($fioArr[2], 0, 1, 'utf-8') . '. ' . $fioArr[0];

  return $fio;
}

//Многобайтовая замена строк
function mb_substr_replace($output, $replace, $posOpen, $posClose)
{
  return mb_substr($output, 0, $posOpen) . $replace . mb_substr($output, $posClose + 1);
}
